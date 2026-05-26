"""Views do checklist de medicamentos da paciente.

Function-based com `@api_view` — sem Generic Views, ViewSets ou Django Forms
(regra da disciplina). Apenas pacientes autenticadas conseguem ler e
atualizar; outros usuários recebem lista vazia ou 403.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from usuarios.models import Paciente

from .models import Medicamento
from .serializers import MedicamentoSerializer


def _obter_paciente(request):
    try:
        return request.user.perfil.paciente
    except (AttributeError, Paciente.DoesNotExist):
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_medicamentos(request):
    """Lista medicamentos ativos da paciente autenticada, ordenados por horário."""
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response([])
    medicamentos = Medicamento.objects.filter(paciente=paciente, ativo=True)
    serializer = MedicamentoSerializer(medicamentos, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def alternar_tomada(request, pk):
    """Marca ou desmarca um medicamento como tomado hoje.

    Body opcional `{ "tomado": true|false }` para set explícito.
    Sem body, alterna o estado atual (toggle).
    """
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response(
            {'detail': 'Apenas pacientes podem marcar medicamentos.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        medicamento = Medicamento.objects.get(
            pk=pk, paciente=paciente, ativo=True,
        )
    except Medicamento.DoesNotExist:
        return Response(
            {'detail': 'Medicamento não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if 'tomado' in request.data:
        novo_estado = bool(request.data['tomado'])
    else:
        novo_estado = not medicamento.esta_tomado_hoje()

    medicamento.marcar_tomado(novo_estado)
    serializer = MedicamentoSerializer(medicamento)
    return Response(serializer.data)
