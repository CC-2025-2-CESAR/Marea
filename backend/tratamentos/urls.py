"""URLs de tratamentos e orientações (montadas em /api/)."""

from django.urls import path

from .views import (
    detalhar_tratamento,
    listar_jornada,
    listar_orientacoes,
    listar_tratamentos,
)


app_name = 'tratamentos'

urlpatterns = [
    path('tratamentos/', listar_tratamentos, name='tratamentos-listar'),
    path(
        'tratamentos/<int:pk>/',
        detalhar_tratamento,
        name='tratamentos-detalhar',
    ),
    path('orientacoes/', listar_orientacoes, name='orientacoes-listar'),
    path('jornada/', listar_jornada, name='jornada-listar'),
]
