from django.contrib import admin

from .models import RegistroSintoma


@admin.register(RegistroSintoma)
class RegistroSintomaAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'data', 'tipo', 'intensidade', 'criado_em')
    list_filter = ('tipo',)
    search_fields = (
        'tipo',
        'descricao',
        'paciente__perfil__nome_completo',
        'paciente__perfil__usuario__username',
    )
    date_hierarchy = 'data'
    readonly_fields = ('criado_em',)
