from django.contrib import admin

from .models import (
    EtapaJornada,
    EtapaTratamento,
    OrientacaoTratamento,
    Tratamento,
)


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
    filter_horizontal = ('termos_relacionados',)
    inlines = [EtapaTratamentoInline]


@admin.register(OrientacaoTratamento)
class OrientacaoTratamentoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'tratamento', 'ativo', 'atualizado_em')
    list_filter = ('ativo', 'categoria')
    search_fields = ('titulo', 'conteudo', 'categoria')
    ordering = ('categoria', 'titulo')
    readonly_fields = ('criado_em', 'atualizado_em')
    filter_horizontal = ('termos_relacionados',)


@admin.register(EtapaJornada)
class EtapaJornadaAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'etapa', 'status', 'atualizado_em')
    list_filter = ('status',)
    search_fields = (
        'paciente__perfil__nome_completo',
        'paciente__perfil__usuario__username',
        'etapa__titulo',
    )
    readonly_fields = ('atualizado_em',)
