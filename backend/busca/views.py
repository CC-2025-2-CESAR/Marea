"""Busca global da Amare (PROJ-25).

Um único endpoint que procura, de uma vez, em todo o conteúdo público de
referência da paciente — dicionário, tratamentos, orientações e
especialidades — e devolve uma lista de resultados, cada um marcado com o seu
`tipo`. A `SearchBar` do cabeçalho consome este endpoint.

View function-based com `@api_view` (regra da disciplina). Como as listagens de
origem, é `AllowAny`: o conteúdo é público e nada aqui é dado pessoal.
"""

from urllib.parse import quote

from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from consultas.models import Especialidade
from dicionario.models import TermoDicionario
from tratamentos.models import OrientacaoTratamento, Tratamento

# Tamanho mínimo da busca: abaixo disso não vale a pena consultar (evitaria
# devolver praticamente todo o conteúdo a cada tecla digitada).
MIN_BUSCA = 2

# Limite de resultados por tipo, para manter a resposta enxuta.
LIMITE_POR_TIPO = 20

# Comprimento máximo do trecho de descrição mostrado em cada resultado.
TAMANHO_TRECHO = 160


def _trecho(texto):
    """Reduz um texto a um trecho curto para a prévia do resultado."""
    texto = (texto or '').strip()
    if len(texto) <= TAMANHO_TRECHO:
        return texto
    return texto[:TAMANHO_TRECHO].rstrip() + '…'


@api_view(['GET'])
@permission_classes([AllowAny])
def busca_global(request):
    """Busca unificada em dicionário, tratamentos, orientações e especialidades.

    Parâmetro: `?q=<termo>`. Devolve uma lista de resultados; cada item traz
    `tipo`, `tipo_label`, `id`, `titulo`, `descricao` (trecho) e `url`
    (deep-link para a página de origem no frontend). Busca vazia ou mais curta
    que `MIN_BUSCA` devolve lista vazia.
    """
    termo = request.query_params.get('q', '').strip()
    if len(termo) < MIN_BUSCA:
        return Response([])

    resultados = []

    termos = TermoDicionario.objects.filter(ativo=True).filter(
        Q(termo__icontains=termo)
        | Q(definicao__icontains=termo)
        | Q(categoria__icontains=termo)
    )[:LIMITE_POR_TIPO]
    for item in termos:
        resultados.append(
            {
                'tipo': 'termo',
                'tipo_label': 'Dicionário',
                'id': item.id,
                'titulo': item.termo,
                'descricao': _trecho(item.definicao),
                # O Dicionário abre já filtrado por este termo (deep-link).
                'url': f'/dicionario?busca={quote(item.termo)}',
            }
        )

    tratamentos = Tratamento.objects.filter(ativo=True).filter(
        Q(nome__icontains=termo)
        | Q(descricao__icontains=termo)
        | Q(indicacao__icontains=termo)
    )[:LIMITE_POR_TIPO]
    for item in tratamentos:
        resultados.append(
            {
                'tipo': 'tratamento',
                'tipo_label': 'Tratamento',
                'id': item.id,
                'titulo': item.nome,
                'descricao': _trecho(item.descricao),
                'url': '/tratamentos',
            }
        )

    orientacoes = OrientacaoTratamento.objects.filter(ativo=True).filter(
        Q(titulo__icontains=termo) | Q(conteudo__icontains=termo)
    )[:LIMITE_POR_TIPO]
    for item in orientacoes:
        resultados.append(
            {
                'tipo': 'orientacao',
                'tipo_label': 'Orientação',
                'id': item.id,
                'titulo': item.titulo,
                'descricao': _trecho(item.conteudo),
                'url': '/orientacoes',
            }
        )

    especialidades = Especialidade.objects.filter(ativo=True).filter(
        Q(nome__icontains=termo) | Q(descricao__icontains=termo)
    )[:LIMITE_POR_TIPO]
    for item in especialidades:
        resultados.append(
            {
                'tipo': 'especialidade',
                'tipo_label': 'Especialidade',
                'id': item.id,
                'titulo': item.nome,
                'descricao': _trecho(item.descricao),
                'url': '/especialidades',
            }
        )

    return Response(resultados)
