"""URLs da área da médica (montadas em /api/medica/)."""

from django.urls import path

from .views import (
    assumir_atendimento,
    criar_consulta,
    criar_medicamento,
    detalhe_paciente,
    listar_pacientes,
)

urlpatterns = [
    path('pacientes/', listar_pacientes, name='medica-pacientes'),
    path(
        'pacientes/<int:paciente_id>/',
        detalhe_paciente,
        name='medica-paciente-detalhe',
    ),
    path(
        'pacientes/<int:paciente_id>/consultas/',
        criar_consulta,
        name='medica-paciente-consulta-criar',
    ),
    path(
        'pacientes/<int:paciente_id>/medicamentos/',
        criar_medicamento,
        name='medica-paciente-medicamento-criar',
    ),
    path(
        'pacientes/<int:paciente_id>/assumir/',
        assumir_atendimento,
        name='medica-paciente-assumir',
    ),
]
