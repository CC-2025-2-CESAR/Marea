from django.urls import path

from .views import alternar_tomada, listar_medicamentos


app_name = 'medicamentos'

urlpatterns = [
    path('', listar_medicamentos, name='medicamentos-listar'),
    path('<int:pk>/toma/', alternar_tomada, name='medicamentos-toma'),
]
