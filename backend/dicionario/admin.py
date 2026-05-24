from django.contrib import admin

from .models import TermoDicionario


@admin.register(TermoDicionario)
class TermoDicionarioAdmin(admin.ModelAdmin):
    list_display = ('termo', 'categoria', 'ativo', 'atualizado_em')
    list_filter = ('ativo', 'categoria')
    search_fields = ('termo', 'definicao', 'categoria')
    ordering = ('termo',)
    readonly_fields = ('criado_em', 'atualizado_em')
    fieldsets = (
        (None, {
            'fields': ('termo', 'definicao', 'categoria', 'exemplo', 'ativo'),
        }),
        ('Datas', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',),
        }),
    )
