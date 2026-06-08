from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from usuarios.models import Paciente
from usuarios.permissions import IsPaciente

from .models import RegistroCiclo
from .serializers import RegistroCicloSerializer

from datetime import date, timedelta


def _obter_paciente(request):
    try:
        return request.user.perfil.paciente
    except (AttributeError, Paciente.DoesNotExist):
        return None


@api_view(['GET', 'POST'])
@permission_classes([IsPaciente])
def listar_criar_ciclo(request):
    paciente = _obter_paciente(request)

    if paciente is None:
        return Response(
            {'detail': 'Paciente não encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'POST':
        serializer = RegistroCicloSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(paciente=paciente)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    registros = RegistroCiclo.objects.filter(
        paciente=paciente
    )

    serializer = RegistroCicloSerializer(
        registros,
        many=True
    )

    return Response(serializer.data)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsPaciente])
def detalhar_atualizar_ciclo(request, registro_id):
    paciente = _obter_paciente(request)

    if paciente is None:
        return Response(
            {'detail': 'Paciente não encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        registro = RegistroCiclo.objects.get(
            id=registro_id,
            paciente=paciente,
        )
    except RegistroCiclo.DoesNotExist:
        return Response(
            {'detail': 'Registro não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        serializer = RegistroCicloSerializer(registro)
        return Response(serializer.data)

    parcial = request.method == 'PATCH'

    serializer = RegistroCicloSerializer(
        registro,
        data=request.data,
        partial=parcial,
    )

    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsPaciente])
def previsao_ciclo(request):
    paciente = _obter_paciente(request)

    if paciente is None:
        return Response(
            {'detail': 'Paciente não encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    registro = (
        RegistroCiclo.objects
        .filter(
            paciente=paciente,
            etapa_ciclo='Menstruação',
        )
        .order_by('-data')
        .first()
    )

    if registro is None:
        return Response({
            'detail': (
                'Ainda não há dados suficientes '
                'para gerar previsões.'
            )
        })

    hoje = date.today()

    dias_passados = (hoje - registro.data).days

    if dias_passados < 5:
        fase_atual = 'Menstruação'
        dias_restantes_fase = 5 - dias_passados

    elif dias_passados < 14:
        fase_atual = 'Fase Folicular'
        dias_restantes_fase = 14 - dias_passados

    elif dias_passados < 15:
        fase_atual = 'Ovulação'
        dias_restantes_fase = 15 - dias_passados

    elif dias_passados < 28:
        fase_atual = 'Fase Lútea'
        dias_restantes_fase = 28 - dias_passados

    else:
        fase_atual = 'Novo ciclo esperado'
        dias_restantes_fase = 0

    previsao = {
        'fase_atual': fase_atual,
        'dias_restantes_fase': dias_restantes_fase,
        'fim_menstruacao': (
            registro.data + timedelta(days=5)
        ),
        'ovulacao_prevista': (
            registro.data + timedelta(days=14)
        ),
        'inicio_fase_lutea': (
            registro.data + timedelta(days=15)
        ),
        'proxima_menstruacao': (
            registro.data + timedelta(days=28)
        ),
    }

    return Response(previsao)