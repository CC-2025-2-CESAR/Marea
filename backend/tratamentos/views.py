from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import OrientacaoTratamento, Tratamento
from .serializers import OrientacaoTratamentoSerializer, TratamentoSerializer


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
