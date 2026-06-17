"""URLs do painel administrativo (montadas em /api/admin/)."""

from django.urls import path

from .views import listar_logs, termo_detalhe, termos, visao_geral

app_name = 'administracao'

urlpatterns = [
    path('visao-geral/', visao_geral, name='visao-geral'),
    path('logs/', listar_logs, name='logs'),
    path('termos/', termos, name='termos'),
    path('termos/<int:pk>/', termo_detalhe, name='termo-detalhe'),
]
