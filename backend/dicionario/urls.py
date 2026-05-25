from django.urls import path

from .views import detalhar_termo, listar_termos


app_name = 'dicionario'

urlpatterns = [
    path('termos/', listar_termos, name='termos-listar'),
    path('termos/<int:pk>/', detalhar_termo, name='termos-detalhar'),
]
