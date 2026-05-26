from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('usuarios.urls')),
    path('api/dicionario/', include('dicionario.urls')),
    path('api/consultas/', include('consultas.urls')),
]
