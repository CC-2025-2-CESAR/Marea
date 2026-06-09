"""Views do ciclo menstrual da paciente (PROJ-5 registro, PROJ-6 previsões).

Function-based com `@api_view` (regra da disciplina). A paciente escreve e lê
os próprios registros (escopo por dono — nunca expõe outra paciente). As
previsões são estimativas calculadas a partir dos inícios de menstruação e
trazem sempre o aviso de que não substituem orientação médica.
"""

from datetime import timedelta

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from usuarios.models import Paciente
from usuarios.permissions import IsPaciente

from .models import RegistroCiclo
from .serializers import RegistroCicloSerializer

AVISO_PREVISAO = (
    'Estimativa baseada nos seus registros. Não substitui a orientação da '
    'equipe médica.'
)

_PACIENTE_NAO_ENCONTRADA = {'detail': 'Paciente não encontrada.'}
_REGISTRO_NAO_ENCONTRADO = {'detail': 'Registro não encontrado.'}


def _obter_paciente(request):
    """Devolve a Paciente associada ao usuário autenticado, ou None."""
    try:
        return request.user.perfil.paciente
    except (AttributeError, Paciente.DoesNotExist):
        return None


@api_view(['GET', 'POST'])
@permission_classes([IsPaciente])
def listar_criar_registros(request):
    """Lista (GET) ou cria (POST) registros de ciclo da paciente logada."""
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response(
            _PACIENTE_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'POST':
        serializer = RegistroCicloSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(paciente=paciente)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    registros = RegistroCiclo.objects.filter(paciente=paciente)
    serializer = RegistroCicloSerializer(registros, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsPaciente])
def detalhe_registro(request, registro_id):
    """Lê, atualiza ou exclui um registro — só o da própria paciente."""
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response(
            _PACIENTE_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND
        )

    registro = RegistroCiclo.objects.filter(
        paciente=paciente, pk=registro_id
    ).first()
    if registro is None:
        return Response(
            _REGISTRO_NAO_ENCONTRADO, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'DELETE':
        registro.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == 'PATCH':
        serializer = RegistroCicloSerializer(
            registro, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    serializer = RegistroCicloSerializer(registro)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsPaciente])
def previsoes(request):
    """Previsão simples do ciclo (PROJ-6) a partir dos inícios de menstruação.

    Usa apenas registros com etapa "menstruação" como início de ciclo. Com
    menos de dois inícios não há base para estimar e devolve `tem_dados=False`.
    A estimativa é informativa e não substitui orientação médica.
    """
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response(
            _PACIENTE_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND
        )

    inicios = list(
        RegistroCiclo.objects.filter(
            paciente=paciente, etapa=RegistroCiclo.ETAPA_MENSTRUACAO
        )
        .order_by('data')
        .values_list('data', flat=True)
    )

    if len(inicios) < 2:
        return Response(
            {
                'tem_dados': False,
                'mensagem': (
                    'Ainda não há registros suficientes de menstruação para '
                    'gerar previsões. Registre pelo menos dois inícios de '
                    'menstruação.'
                ),
                'aviso': AVISO_PREVISAO,
            }
        )

    intervalos = [
        (inicios[i + 1] - inicios[i]).days for i in range(len(inicios) - 1)
    ]
    ciclo_medio = round(sum(intervalos) / len(intervalos))
    ultima = inicios[-1]
    proxima = ultima + timedelta(days=ciclo_medio)
    ovulacao = proxima - timedelta(days=14)
    fertil_inicio = ovulacao - timedelta(days=4)
    fertil_fim = ovulacao + timedelta(days=1)

    return Response(
        {
            'tem_dados': True,
            'ciclo_medio_dias': ciclo_medio,
            'proxima_menstruacao': proxima.isoformat(),
            'ovulacao_estimada': ovulacao.isoformat(),
            'janela_fertil_inicio': fertil_inicio.isoformat(),
            'janela_fertil_fim': fertil_fim.isoformat(),
            'aviso': AVISO_PREVISAO,
        }
    )
