"""URL pública de especialidades (montada em /api/especialidades/).

A `Especialidade` mora no app `consultas` (é usada nas consultas), mas a
listagem pública para a paciente tem URL própria, mais clara.
"""

from django.urls import path

from .views import listar_especialidades


app_name = 'especialidades'

urlpatterns = [
    path('', listar_especialidades, name='especialidades-listar'),
]
