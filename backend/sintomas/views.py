"""Views do registro de sintomas da paciente (PROJ-21).

Function-based com `@api_view` (regra da disciplina). Diferente do conteúdo de
referência, aqui a paciente **escreve** (POST) e **lê** (GET) os próprios
registros. Escopo por dono: nunca expõe registros de outra paciente.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from usuarios.models import Paciente
from usuarios.permissions import IsPaciente

from .models import RegistroSintoma
from .serializers import RegistroSintomaSerializer


def _obter_paciente(request):
    """Devolve a Paciente associada ao usuário autenticado, ou None."""
    try:
        return request.user.perfil.paciente
    except (AttributeError, Paciente.DoesNotExist):
        return None


@api_view(['GET', 'POST'])
@permission_classes([IsPaciente])
def listar_criar_sintomas(request):
    """Lista (GET) ou cria (POST) registros de sintomas da paciente logada."""
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response(
            {'detail': 'Paciente não encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'POST':
        serializer = RegistroSintomaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(paciente=paciente)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    registros = RegistroSintoma.objects.filter(paciente=paciente)
    serializer = RegistroSintomaSerializer(registros, many=True)
    return Response(serializer.data)
