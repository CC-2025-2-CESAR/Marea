"""URL pública da equipe médica (montada em /api/equipe-medica/).

As médicas moram no app `usuarios`, mas a listagem pública para a paciente
(perfis da equipe) é conteúdo institucional do mesmo grupo das especialidades,
por isso a view vive no app `consultas`.
"""

from django.urls import path

from .views import listar_equipe_medica


app_name = 'equipe-medica'

urlpatterns = [
    path('', listar_equipe_medica, name='equipe-medica-listar'),
]
