from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import TermoDicionario
from .serializers import TermoDicionarioSerializer


@api_view(['GET'])
def listar_termos(request):
    """Lista os termos ativos, com filtro opcional pelo parâmetro `busca`."""
    busca = request.query_params.get('busca', '').strip()
    queryset = TermoDicionario.objects.filter(ativo=True)
    if busca:
        queryset = queryset.filter(
            Q(termo__icontains=busca)
            | Q(definicao__icontains=busca)
            | Q(categoria__icontains=busca)
        )
    serializer = TermoDicionarioSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def detalhar_termo(request, pk):
    """Retorna os detalhes de um termo ativo. 404 se não existir."""
    try:
        termo = TermoDicionario.objects.get(pk=pk, ativo=True)
    except TermoDicionario.DoesNotExist:
        return Response(
            {'detail': 'Termo não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = TermoDicionarioSerializer(termo)
    return Response(serializer.data)
