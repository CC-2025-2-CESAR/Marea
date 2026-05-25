"""URLs da app usuarios."""

from django.urls import path

from .views import login_view, me_view, perfil_view, refresh_view

urlpatterns = [
    path('auth/login/', login_view, name='auth-login'),
    path('auth/refresh/', refresh_view, name='auth-refresh'),
    path('auth/me/', me_view, name='auth-me'),
    path('perfil/', perfil_view, name='perfil-detalhe'),
]
