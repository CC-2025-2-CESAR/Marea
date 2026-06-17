"""URLs de privacidade/LGPD (montadas em /api/privacidade/)."""

from django.urls import path

from .views import meus_dados, solicitacoes


app_name = 'privacidade'

urlpatterns = [
    path('meus-dados/', meus_dados, name='meus-dados'),
    path('solicitacoes/', solicitacoes, name='solicitacoes'),
]
