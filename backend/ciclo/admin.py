from django.contrib import admin

from .models import RegistroCiclo


@admin.register(RegistroCiclo)
class RegistroCicloAdmin(admin.ModelAdmin):
    list_display = (
        'paciente',
        'data',
        'etapa_ciclo',
        'criado_em',
    )

    list_filter = (
        'etapa_ciclo',
    )

    search_fields = (
        'observacoes',
        'paciente__perfil__nome_completo',
        'paciente__perfil__usuario__username',
    )

    date_hierarchy = 'data'

    readonly_fields = (
        'criado_em',
    )