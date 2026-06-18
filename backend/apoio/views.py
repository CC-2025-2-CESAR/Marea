"""Views dos conteúdos de apoio emocional (PROJ-22).

Function-based com `@api_view` (regra da disciplina). Conteúdo de referência
público (como o dicionário): dispensa login. A página exibe um aviso de que o
conteúdo não substitui acompanhamento profissional.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.shortcuts import get_object_or_404

from .models import ConteudoApoio
from .serializers import ConteudoApoioSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_conteudos_apoio(request):
    """Lista os conteúdos de apoio publicados; filtro opcional `categoria`."""
    categoria = request.query_params.get('categoria', '').strip()
    queryset = ConteudoApoio.objects.filter(publicado=True)
    if categoria:
        queryset = queryset.filter(categoria__iexact=categoria)
    serializer = ConteudoApoioSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def obter_conteudo_apoio(request, pk):
    """Detalha um conteúdo de apoio publicado (404 se não existir/rascunho)."""
    conteudo = get_object_or_404(ConteudoApoio, pk=pk, publicado=True)
    serializer = ConteudoApoioSerializer(conteudo)
    return Response(serializer.data)
