from django.contrib import admin
from django.urls import include, path, re_path

from .views import servir_spa

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('usuarios.urls')),
    path('api/medica/', include('area_medica.urls')),
    path('api/dicionario/', include('dicionario.urls')),
    path('api/consultas/', include('consultas.urls')),
    path('api/medicamentos/', include('medicamentos.urls')),
    # Catch-all do SPA: entrega o index.html do React para qualquer rota que
    # NÃO seja da API, do admin ou de estáticos. Permite o roteamento no
    # cliente (React Router) ao acessar/recarregar /perfil, /login, etc.
    # Precisa ser o ÚLTIMO padrão. Em produção, os arquivos reais do build já
    # são servidos pelo WhiteNoise antes de a requisição chegar até aqui.
    re_path(r'^(?!api/|admin/|static/).*$', servir_spa),
]
