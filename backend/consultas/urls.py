from django.urls import path

from .views import listar_consultas, listar_proximas_consultas


app_name = 'consultas'

urlpatterns = [
    path('', listar_consultas, name='consultas-listar'),
    path('proximas/', listar_proximas_consultas, name='consultas-proximas'),
]
