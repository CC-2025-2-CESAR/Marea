"""
Views de nível do projeto (não atreladas a um app específico).

`servir_spa` entrega o index.html do build do React para qualquer rota que não
seja da API nem do admin, permitindo o roteamento no cliente (React Router).
Em produção, os arquivos reais do build (JS/CSS/imagens) já são servidos pelo
WhiteNoise na raiz; esta view cobre apenas as rotas de cliente, devolvendo
sempre o index.html.
"""

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound


def servir_spa(request):
    """Entrega o index.html do build do frontend (SPA React)."""
    indice = settings.FRONTEND_DIST / 'index.html'

    if not indice.is_file():
        # Sem build local (cenário de desenvolvimento): o frontend roda no Vite
        # na porta 5173. Esta resposta só aparece se alguém abrir a raiz do
        # backend (porta 8000) sem ter gerado o build.
        return HttpResponseNotFound(
            'Build do frontend não encontrado. Em desenvolvimento, rode o '
            'frontend com o Vite: "npm run dev" em /frontend (porta 5173).'
        )

    with open(indice, 'rb') as arquivo:
        conteudo = arquivo.read()

    resposta = HttpResponse(conteudo, content_type='text/html')
    # O index.html referencia assets com hash no nome; ele próprio não deve ser
    # cacheado de forma agressiva, para que novas versões apareçam na hora.
    resposta['Cache-Control'] = 'no-cache'
    return resposta
