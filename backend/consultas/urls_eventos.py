"""URL dos eventos do tratamento da paciente (montada em /api/eventos/).

Os eventos moram no app `consultas` (são exibidos no calendário, junto das
consultas), mas têm URL própria, mais clara para a paciente.
"""

from django.urls import path

from .views import listar_eventos


app_name = 'eventos'

urlpatterns = [
    path('', listar_eventos, name='eventos-listar'),
]
