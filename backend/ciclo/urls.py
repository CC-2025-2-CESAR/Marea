from django.urls import path

from .views import (
    listar_criar_ciclo,
    detalhar_atualizar_ciclo,
    previsao_ciclo,
)

app_name = 'ciclo'

urlpatterns = [
    path('', listar_criar_ciclo, name='ciclo-listar-criar'),

    path(
    'previsao/',
    previsao_ciclo,
    name='ciclo-previsao',
    ),
    
    path(
        '<int:registro_id>/',
        detalhar_atualizar_ciclo,
        name='ciclo-detalhar-atualizar',
    ),
]
