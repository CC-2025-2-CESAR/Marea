"""Registros de administração para os perfis de usuário da Amare."""

from django.contrib import admin

from .models import (
    ConviteAcesso,
    EquipeCuidadoPaciente,
    Medica,
    Paciente,
    PerfilUsuario,
    RecuperacaoSenha,
)


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
    list_display = ('perfil', 'crm', 'rqe', 'especialidade')
    search_fields = (
        'perfil__usuario__username',
        'perfil__nome_completo',
        'crm',
        'rqe',
        'especialidade',
    )


@admin.register(EquipeCuidadoPaciente)
class EquipeCuidadoPacienteAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'medica', 'papel', 'ativa', 'criada_em')
    list_filter = ('papel', 'ativa')
    search_fields = (
        'paciente__perfil__nome_completo',
        'medica__perfil__nome_completo',
    )
    autocomplete_fields = ('paciente', 'medica')
    readonly_fields = ('criada_em',)
    date_hierarchy = 'criada_em'


@admin.register(ConviteAcesso)
class ConviteAcessoAdmin(admin.ModelAdmin):
    list_display = (
        'usuario',
        'status',
        'criado_por',
        'criado_em',
        'expira_em',
        'usado_em',
    )
    list_filter = ('status',)
    search_fields = ('usuario__username', 'usuario__email', 'token')
    autocomplete_fields = ('usuario', 'criado_por')
    readonly_fields = ('token', 'criado_em', 'usado_em')
    date_hierarchy = 'criado_em'


@admin.register(RecuperacaoSenha)
class RecuperacaoSenhaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'status', 'criado_em', 'expira_em', 'usado_em')
    list_filter = ('status',)
    search_fields = ('usuario__username', 'usuario__email', 'token')
    autocomplete_fields = ('usuario',)
    readonly_fields = ('token', 'criado_em', 'usado_em')
    date_hierarchy = 'criado_em'
