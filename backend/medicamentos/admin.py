from django.contrib import admin

from .models import Medicamento


@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = (
        'paciente',
        'nome',
        'dose',
        'horario',
        'tomado_hoje',
        'ativo',
    )
    list_filter = ('ativo', 'tomado_hoje')
    search_fields = (
        'paciente__perfil__nome_completo',
        'paciente__perfil__usuario__username',
        'nome',
        'instrucoes',
    )
    readonly_fields = ('criado_em', 'atualizado_em', 'data_ultima_marcacao')
    fieldsets = (
        (None, {
            'fields': (
                'paciente',
                'nome',
                'dose',
                'horario',
                'instrucoes',
                'ativo',
            ),
        }),
        ('Estado de hoje', {
            'fields': ('tomado_hoje', 'data_ultima_marcacao'),
        }),
        ('Datas', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',),
        }),
    )
