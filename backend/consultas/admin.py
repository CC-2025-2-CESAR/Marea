from django.contrib import admin

from .models import Consulta, Especialidade, EventoTratamento


@admin.register(Especialidade)
class EspecialidadeAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ativo', 'atualizado_em')
    list_filter = ('ativo',)
    search_fields = ('nome',)
    filter_horizontal = ('medicas',)
    readonly_fields = ('criado_em', 'atualizado_em')


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'data_horario', 'medica', 'especialidade', 'status')
    list_filter = ('status', 'especialidade')
    search_fields = (
        'paciente__perfil__nome_completo',
        'paciente__perfil__usuario__username',
        'medica__perfil__nome_completo',
        'observacoes',
    )
    date_hierarchy = 'data_horario'
    readonly_fields = ('criado_em', 'atualizado_em')
    fieldsets = (
        (None, {
            'fields': (
                'paciente',
                'medica',
                'especialidade',
                'data_horario',
                'status',
                'local',
                'observacoes',
            ),
        }),
        ('Datas', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',),
        }),
    )


@admin.register(EventoTratamento)
class EventoTratamentoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'paciente', 'tipo', 'data_horario')
    list_filter = ('tipo',)
    search_fields = (
        'titulo',
        'descricao',
        'paciente__perfil__nome_completo',
        'paciente__perfil__usuario__username',
    )
    date_hierarchy = 'data_horario'
    readonly_fields = ('criado_em', 'atualizado_em')
