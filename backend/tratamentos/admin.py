from django.contrib import admin

from .models import EtapaTratamento, OrientacaoTratamento, Tratamento


class EtapaTratamentoInline(admin.TabularInline):
    model = EtapaTratamento
    extra = 1
    fields = ('ordem', 'titulo', 'descricao')
    ordering = ('ordem', 'id')


@admin.register(Tratamento)
class TratamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ordem', 'ativo', 'atualizado_em')
    list_filter = ('ativo',)
    search_fields = ('nome', 'descricao', 'indicacao')
    ordering = ('ordem', 'nome')
    readonly_fields = ('criado_em', 'atualizado_em')
    inlines = [EtapaTratamentoInline]


@admin.register(OrientacaoTratamento)
class OrientacaoTratamentoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'tratamento', 'ativo', 'atualizado_em')
    list_filter = ('ativo', 'categoria')
    search_fields = ('titulo', 'conteudo', 'categoria')
    ordering = ('categoria', 'titulo')
    readonly_fields = ('criado_em', 'atualizado_em')
