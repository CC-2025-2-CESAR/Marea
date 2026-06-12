from django.contrib import admin

from .models import AcaoAssistente, RespostaAssistente


class AcaoAssistenteInline(admin.TabularInline):
    model = AcaoAssistente
    extra = 1


@admin.register(RespostaAssistente)
class RespostaAssistenteAdmin(admin.ModelAdmin):
    list_display = (
        'pergunta_exemplo',
        'intencao',
        'categoria',
        'sensivel',
        'ativo',
        'prioridade',
    )
    list_filter = ('categoria', 'sensivel', 'ativo')
    search_fields = (
        'intencao',
        'pergunta_exemplo',
        'palavras_chave',
        'resposta',
    )
    inlines = [AcaoAssistenteInline]
