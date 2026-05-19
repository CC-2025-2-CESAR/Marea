from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
    # As rotas da API ficarão sob o prefixo 'api/' (ex.: path('api/', include('...'))).
]
