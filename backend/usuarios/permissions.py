"""Permissões por papel (tipo_usuario) da Amare.

O controle de acesso fica no backend — o frontend nunca é a única barreira.
Cada classe lê o papel a partir de `request.user.perfil.tipo_usuario`.

Uso nas views (function-based):

    from rest_framework.decorators import permission_classes
    from .permissions import IsPaciente

    @api_view(['GET'])
    @permission_classes([IsPaciente])
    def minha_view(request):
        ...
"""

from rest_framework.permissions import BasePermission

from .models import PerfilUsuario


def papel_do_usuario(usuario):
    """Devolve o tipo_usuario do perfil, ou None se não houver perfil."""
    perfil = getattr(usuario, 'perfil', None)
    return getattr(perfil, 'tipo_usuario', None)


class IsPaciente(BasePermission):
    """Libera apenas usuárias com perfil de paciente."""

    message = 'Esta área é exclusiva de pacientes.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and papel_do_usuario(request.user) == PerfilUsuario.TIPO_PACIENTE
        )


class IsMedica(BasePermission):
    """Libera apenas usuárias com perfil de médica."""

    message = 'Esta área é exclusiva da equipe médica.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and papel_do_usuario(request.user) == PerfilUsuario.TIPO_MEDICA
        )


class IsMedicaOuAdmin(BasePermission):
    """Libera médicas e administradoras (inclui superusuária do Django).

    Útil para a futura área administrativa, em que a médica tem poderes de
    administradora sobre as pacientes vinculadas.
    """

    message = 'Esta área é exclusiva da equipe médica.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return papel_do_usuario(request.user) in (
            PerfilUsuario.TIPO_MEDICA,
            PerfilUsuario.TIPO_ADMIN,
        )


def eh_admin(usuario):
    """True para superusuária do Django ou perfil de administradora da clínica."""
    return bool(
        usuario
        and usuario.is_authenticated
        and (
            usuario.is_superuser
            or papel_do_usuario(usuario) == PerfilUsuario.TIPO_ADMIN
        )
    )


def medica_do_usuario(usuario):
    """Devolve a Medica vinculada ao usuário autenticado, ou None."""
    perfil = getattr(usuario, 'perfil', None)
    return getattr(perfil, 'medica', None)


# Status do acesso de uma médica a uma paciente — vira o selo da interface.
PAPEL_ACESSO_ADMIN = 'admin'
PAPEL_ACESSO_RESPONSAVEL = 'responsavel'
PAPEL_ACESSO_ASSUMIDO = 'assumido'
PAPEL_ACESSO_VISUALIZACAO = 'visualizacao'

# Papéis que autorizam ESCRITA sobre os dados da paciente.
PAPEIS_COM_ESCRITA = frozenset(
    {PAPEL_ACESSO_ADMIN, PAPEL_ACESSO_RESPONSAVEL, PAPEL_ACESSO_ASSUMIDO}
)


def papel_no_cuidado(usuario, paciente):
    """Classifica a relação do usuário com a paciente.

    - ``admin``: administração da clínica;
    - ``responsavel``: é a médica responsável principal;
    - ``assumido``: assumiu o atendimento (vínculo de equipe ativo);
    - ``visualizacao``: enxerga a paciente, mas não pode editá-la.
    """
    if eh_admin(usuario):
        return PAPEL_ACESSO_ADMIN
    medica = medica_do_usuario(usuario)
    if medica is None:
        return PAPEL_ACESSO_VISUALIZACAO
    if paciente.medica_responsavel_id == medica.id:
        return PAPEL_ACESSO_RESPONSAVEL
    if paciente.equipe_cuidado.filter(medica=medica, ativa=True).exists():
        return PAPEL_ACESSO_ASSUMIDO
    return PAPEL_ACESSO_VISUALIZACAO


def pode_editar_paciente(usuario, paciente):
    """Barreira de ESCRITA: só admin, responsável ou vínculo ativo editam.

    Ver é amplo (toda médica enxerga as pacientes da clínica); editar exige um
    vínculo real — ser a responsável principal ou ter assumido o atendimento.
    """
    return papel_no_cuidado(usuario, paciente) in PAPEIS_COM_ESCRITA


class IsAdminClinica(BasePermission):
    """Libera apenas administradoras da clínica (inclui superusuária)."""

    message = 'Esta área é exclusiva da administração da clínica.'

    def has_permission(self, request, view):
        return eh_admin(request.user)
