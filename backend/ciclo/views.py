from datetime import date, timedelta

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from usuarios.models import Paciente
from usuarios.permissions import IsPaciente

from .models import RegistroCiclo
from .serializers import RegistroCicloSerializer


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


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
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
    
    if request.method == 'DELETE':
        registro.delete()
        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

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

    registros = list(
        RegistroCiclo.objects
        .filter(
            paciente=paciente,
            etapa_ciclo='Menstruação',
        )
        .order_by('data')
    )

    if len(registros) == 0:
        return Response({
            'detail': 'É necessário pelo menos 1 registro de menstruação para gerar previsões.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(registros) == 1:
        ciclo_medio = 28
    else:
        duracoes = []

        for i in range(1, len(registros)):
            diferenca = (
                registros[i].data -
                registros[i - 1].data
            ).days

            duracoes.append(diferenca)

        ciclo_medio = round(
            sum(duracoes) / len(duracoes)
        )

    ultima_menstruacao = registros[-1].data

    hoje = date.today()

    dias_passados = (
        hoje - ultima_menstruacao
    ).days

    if dias_passados < 5:
        fase_atual = 'Menstruação'
        dias_restantes_fase = 5 - dias_passados

    elif dias_passados < 14:
        fase_atual = 'Fase Folicular'
        dias_restantes_fase = 14 - dias_passados

    elif dias_passados < 15:
        fase_atual = 'Ovulação'
        dias_restantes_fase = 15 - dias_passados

    elif dias_passados < ciclo_medio:
        fase_atual = 'Fase Lútea'
        dias_restantes_fase = ciclo_medio - dias_passados

    else:
        fase_atual = 'Novo ciclo esperado'
        dias_restantes_fase = 0

    proxima_menstruacao = (
        ultima_menstruacao +
        timedelta(days=ciclo_medio)
    )

    ovulacao_prevista = (
        proxima_menstruacao -
        timedelta(days=14)
    )

    janela_fertil_inicio = (
        ovulacao_prevista -
        timedelta(days=5)
    )

    janela_fertil_fim = (
        ovulacao_prevista +
        timedelta(days=1)
    )

    previsao = {
        'fase_atual': fase_atual,
        'dias_restantes_fase': dias_restantes_fase,
        'ciclo_medio_dias': ciclo_medio,
        'ultima_menstruacao': ultima_menstruacao,
        'fim_menstruacao': (
            ultima_menstruacao +
            timedelta(days=5)
        ),
        'ovulacao_prevista': ovulacao_prevista,
        'janela_fertil_inicio': janela_fertil_inicio,
        'janela_fertil_fim': janela_fertil_fim,
        'proxima_menstruacao': proxima_menstruacao,
    }

    return Response(previsao)