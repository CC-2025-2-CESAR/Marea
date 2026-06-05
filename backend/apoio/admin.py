from django.contrib import admin

from .models import ConteudoApoio


@admin.register(ConteudoApoio)
class ConteudoApoioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'publicado', 'ordem', 'atualizado_em')
    list_filter = ('publicado', 'categoria')
    search_fields = ('titulo', 'texto', 'categoria')
    ordering = ('ordem', 'titulo')
    readonly_fields = ('criado_em', 'atualizado_em')
