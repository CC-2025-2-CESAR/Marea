"""Views da área da médica.

Function-based com `@api_view` (regra da disciplina — sem Generic Views,
ViewSets ou Django Forms).

Segurança por objeto: a médica só enxerga e altera as pacientes vinculadas a
ela (`Paciente.medica_responsavel`). Administradoras enxergam todas. Pacientes
são barradas pela permissão `IsMedicaOuAdmin`. O escopo é sempre aplicado no
backend — nunca confiando no frontend.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from usuarios.models import Paciente, PerfilUsuario
from usuarios.permissions import IsMedicaOuAdmin, papel_do_usuario

from .serializers import (
    ConsultaCriarSerializer,
    MedicamentoCriarSerializer,
    PacienteDetalheSerializer,
    PacienteResumoSerializer,
)


def _medica_do_usuario(usuario):
    """Devolve a Medica do usuário autenticado, ou None."""
    perfil = getattr(usuario, 'perfil', None)
    return getattr(perfil, 'medica', None)


def _eh_admin(usuario):
    return bool(
        usuario.is_superuser
        or papel_do_usuario(usuario) == PerfilUsuario.TIPO_ADMIN
    )


def _pacientes_visiveis(request):
    """Pacientes que o usuário pode acessar: admin vê todas; médica, só as suas."""
    if _eh_admin(request.user):
        return Paciente.objects.all()
    medica = _medica_do_usuario(request.user)
    if medica is None:
        return Paciente.objects.none()
    return Paciente.objects.filter(medica_responsavel=medica)


def _obter_paciente(request, paciente_id):
    """Paciente acessível pelo usuário (escopo por objeto), ou None."""
    return _pacientes_visiveis(request).filter(pk=paciente_id).first()


_NAO_ENCONTRADA = {
    'detail': 'Paciente não encontrada ou não vinculada a você.'
}


@api_view(['GET'])
@permission_classes([IsMedicaOuAdmin])
def listar_pacientes(request):
    """Lista as pacientes vinculadas à médica (ou todas, se admin)."""
    pacientes = _pacientes_visiveis(request).select_related('perfil__usuario')
    serializer = PacienteResumoSerializer(pacientes, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsMedicaOuAdmin])
def detalhe_paciente(request, paciente_id):
    """Detalhe de uma paciente: dados, consultas e medicamentos."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)
    serializer = PacienteDetalheSerializer(paciente)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def criar_consulta(request, paciente_id):
    """Agenda uma consulta para a paciente. A médica é a autenticada."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)

    serializer = ConsultaCriarSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(paciente=paciente, medica=_medica_do_usuario(request.user))
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def criar_medicamento(request, paciente_id):
    """Cadastra um medicamento para a paciente."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)

    serializer = MedicamentoCriarSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(paciente=paciente)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
