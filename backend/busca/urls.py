"""URL da busca global (montada em /api/busca/)."""

from django.urls import path

from .views import busca_global


app_name = 'busca'

urlpatterns = [
    path('', busca_global, name='busca-global'),
]
