"""URLs do ciclo menstrual (montadas em /api/ciclo/)."""

from django.urls import path

from .views import detalhe_registro, listar_criar_registros, previsoes

app_name = 'ciclo'

urlpatterns = [
    path('registros/', listar_criar_registros, name='ciclo-registros'),
    path(
        'registros/<int:registro_id>/',
        detalhe_registro,
        name='ciclo-registro-detalhe',
    ),
    path('previsoes/', previsoes, name='ciclo-previsoes'),
]
