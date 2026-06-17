"""URLs da app usuarios."""

from django.urls import path

from .views import (
    criar_paciente,
    definir_senha_convite,
    detalhar_convite,
    login_view,
    me_view,
    perfil_view,
    recuperar_senha,
    redefinir_senha,
    refresh_view,
    reenviar_convite,
)

urlpatterns = [
    path('auth/login/', login_view, name='auth-login'),
    path('auth/refresh/', refresh_view, name='auth-refresh'),
    path('auth/me/', me_view, name='auth-me'),
    # Recuperação de senha (PROJ-7): pedir o link por e-mail e redefinir.
    path('auth/recuperar/', recuperar_senha, name='auth-recuperar'),
    path('auth/redefinir/<str:token>/', redefinir_senha, name='auth-redefinir'),
    path('perfil/', perfil_view, name='perfil-detalhe'),
    # Convite de primeiro acesso (PROJ-7): a clínica cria a paciente, a
    # paciente assume o acesso pelo link de ativação.
    path('clinica/pacientes/', criar_paciente, name='clinica-paciente-criar'),
    path(
        'clinica/pacientes/<int:paciente_id>/reenviar-convite/',
        reenviar_convite,
        name='clinica-convite-reenviar',
    ),
    path('convite/<str:token>/', detalhar_convite, name='convite-detalhe'),
    path(
        'convite/<str:token>/definir-senha/',
        definir_senha_convite,
        name='convite-definir-senha',
    ),
]
