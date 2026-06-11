"""Views da área da médica.

Function-based com `@api_view` (regra da disciplina — sem Generic Views,
ViewSets ou Django Forms).

Política de acesso (aplicada no backend, nunca confiando no frontend):
- **Leitura:** toda médica (e a administração) enxerga as pacientes da clínica.
- **Escrita:** só a médica responsável, quem assumiu o atendimento (vínculo de
  equipe ativo) ou a administração — verificada por `pode_editar_paciente`.

Ver todas não é poder editar todas: a barreira de escrita é separada da de
visualização.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from usuarios.models import Paciente
from usuarios.permissions import (
    IsMedicaOuAdmin,
    eh_admin,
    medica_do_usuario,
    pode_editar_paciente,
)

from .serializers import (
    ConsultaCriarSerializer,
    MedicamentoCriarSerializer,
    PacienteDetalheSerializer,
    PacienteResumoSerializer,
)


def _pacientes_visiveis(request):
    """Pacientes que o usuário pode VER: todas as da clínica.

    Uma médica sem cadastro de Medica (perfil incompleto) não enxerga nada.
    """
    if eh_admin(request.user):
        return Paciente.objects.all()
    if medica_do_usuario(request.user) is None:
        return Paciente.objects.none()
    return Paciente.objects.all()


def _obter_paciente(request, paciente_id):
    """Paciente visível pelo usuário (escopo de leitura), ou None."""
    return _pacientes_visiveis(request).filter(pk=paciente_id).first()


_NAO_ENCONTRADA = {'detail': 'Paciente não encontrada.'}
_SEM_PERMISSAO_ESCRITA = {
    'detail': (
        'Você pode visualizar esta paciente, mas não editá-la. '
        'Assuma o atendimento para registrar alterações.'
    )
}


@api_view(['GET'])
@permission_classes([IsMedicaOuAdmin])
def listar_pacientes(request):
    """Lista as pacientes da clínica, com o status de acesso de quem pede."""
    pacientes = _pacientes_visiveis(request).select_related('perfil__usuario')
    serializer = PacienteResumoSerializer(
        pacientes, many=True, context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsMedicaOuAdmin])
def detalhe_paciente(request, paciente_id):
    """Detalhe de uma paciente: dados, consultas e medicamentos."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)
    serializer = PacienteDetalheSerializer(
        paciente, context={'request': request}
    )
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def criar_consulta(request, paciente_id):
    """Agenda uma consulta. Exige vínculo de escrita com a paciente."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)
    if not pode_editar_paciente(request.user, paciente):
        return Response(
            _SEM_PERMISSAO_ESCRITA, status=status.HTTP_403_FORBIDDEN
        )

    serializer = ConsultaCriarSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(paciente=paciente, medica=medica_do_usuario(request.user))
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def criar_medicamento(request, paciente_id):
    """Cadastra um medicamento. Exige vínculo de escrita com a paciente."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)
    if not pode_editar_paciente(request.user, paciente):
        return Response(
            _SEM_PERMISSAO_ESCRITA, status=status.HTTP_403_FORBIDDEN
        )

    serializer = MedicamentoCriarSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(paciente=paciente)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
