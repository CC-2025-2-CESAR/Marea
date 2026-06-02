"""Registros de administração para os perfis de usuário da Amare."""

from django.contrib import admin

from .models import Medica, Paciente, PerfilUsuario


class PacienteInline(admin.StackedInline):
    model = Paciente
    can_delete = False
    extra = 0
    verbose_name_plural = 'Dados de paciente'


class MedicaInline(admin.StackedInline):
    model = Medica
    can_delete = False
    extra = 0
    verbose_name_plural = 'Dados de médica'


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'nome_completo', 'tipo_usuario', 'telefone')
    list_filter = ('tipo_usuario',)
    search_fields = (
        'usuario__username',
        'usuario__email',
        'nome_completo',
        'telefone',
    )
    ordering = ('nome_completo', 'usuario__username')
    inlines = [PacienteInline, MedicaInline]


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('perfil', 'data_nascimento', 'tipo_sanguineo', 'medica_responsavel')
    search_fields = ('perfil__usuario__username', 'perfil__nome_completo')
    list_filter = ('tipo_sanguineo', 'medica_responsavel')
    autocomplete_fields = ('medica_responsavel',)


@admin.register(Medica)
class MedicaAdmin(admin.ModelAdmin):
    list_display = ('perfil', 'crm', 'especialidade')
    search_fields = (
        'perfil__usuario__username',
        'perfil__nome_completo',
        'crm',
        'especialidade',
    )
