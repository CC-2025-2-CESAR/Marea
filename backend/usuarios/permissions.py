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
