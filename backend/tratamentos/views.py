from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from usuarios.models import Paciente

from .models import EtapaJornada, OrientacaoTratamento, Tratamento
from .serializers import (
    EtapaJornadaSerializer,
    OrientacaoTratamentoSerializer,
    TratamentoSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_tratamentos(request):
    """Lista os tratamentos ativos (com as etapas); filtro opcional `busca`.

    Conteúdo público de referência: dispensa login, como o dicionário.
    """
    busca = request.query_params.get('busca', '').strip()
    queryset = Tratamento.objects.filter(ativo=True).prefetch_related(
        'etapas', 'termos_relacionados'
    )
    if busca:
        queryset = queryset.filter(
            Q(nome__icontains=busca)
            | Q(descricao__icontains=busca)
            | Q(indicacao__icontains=busca)
        )
    serializer = TratamentoSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def detalhar_tratamento(request, pk):
    """Detalha um tratamento ativo (com etapas). 404 se não existir."""
    try:
        tratamento = Tratamento.objects.prefetch_related(
            'etapas', 'termos_relacionados'
        ).get(pk=pk, ativo=True)
    except Tratamento.DoesNotExist:
        return Response(
            {'detail': 'Tratamento não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = TratamentoSerializer(tratamento)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_orientacoes(request):
    """Lista orientações ativas; filtros opcionais `categoria` e `busca`."""
    categoria = request.query_params.get('categoria', '').strip()
    busca = request.query_params.get('busca', '').strip()
    queryset = (
        OrientacaoTratamento.objects.filter(ativo=True)
        .select_related('tratamento', 'etapa')
        .prefetch_related('termos_relacionados')
    )
    if categoria:
        queryset = queryset.filter(categoria__iexact=categoria)
    if busca:
        queryset = queryset.filter(
            Q(titulo__icontains=busca) | Q(conteudo__icontains=busca)
        )
    serializer = OrientacaoTratamentoSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def detalhar_orientacao(request, pk):
    """Detalha uma orientação ativa, com os termos do dicionário relacionados.

    Conteúdo público (como a listagem). 404 se não existir ou estiver inativa.
    """
    try:
        orientacao = (
            OrientacaoTratamento.objects.select_related('tratamento', 'etapa')
            .prefetch_related('termos_relacionados')
            .get(pk=pk, ativo=True)
        )
    except OrientacaoTratamento.DoesNotExist:
        return Response(
            {'detail': 'Orientação não encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = OrientacaoTratamentoSerializer(orientacao)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_jornada(request):
    """Linha do tempo da paciente: suas etapas em ordem (PROJ-17).

    Escopo por dono: a paciente só enxerga a própria jornada. A etapa atual vem
    com status 'atual' para a tela destacar.
    """
    try:
        paciente = request.user.perfil.paciente
    except (AttributeError, Paciente.DoesNotExist):
        return Response(
            {'detail': 'Apenas pacientes têm linha do tempo.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    jornada = (
        EtapaJornada.objects.filter(paciente=paciente)
        .select_related('etapa__tratamento')
        .order_by('etapa__ordem', 'etapa__id')
    )
    serializer = EtapaJornadaSerializer(jornada, many=True)
    return Response(serializer.data)
