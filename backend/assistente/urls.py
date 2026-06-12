"""URL do Assistente Amare (montada em /api/assistente/)."""

from django.urls import path

from .views import assistente


app_name = 'assistente'

urlpatterns = [
    path('', assistente, name='assistente'),
]
