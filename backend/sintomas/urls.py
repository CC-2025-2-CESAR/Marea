"""URL do registro de sintomas da paciente (montada em /api/sintomas/)."""

from django.urls import path

from .views import listar_criar_sintomas


app_name = 'sintomas'

urlpatterns = [
    path('', listar_criar_sintomas, name='sintomas-listar-criar'),
]
