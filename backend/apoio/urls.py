"""URL pública dos conteúdos de apoio emocional (montada em /api/apoio/)."""

from django.urls import path

from .views import listar_conteudos_apoio


app_name = 'apoio'

urlpatterns = [
    path('', listar_conteudos_apoio, name='apoio-listar'),
]
