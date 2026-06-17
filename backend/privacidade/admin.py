from django.contrib import admin

from .models import SolicitacaoPrivacidade


@admin.register(SolicitacaoPrivacidade)
class SolicitacaoPrivacidadeAdmin(admin.ModelAdmin):
    """A clinica acompanha e processa os pedidos por aqui.

    Os campos enviados pelo titular sao somente-leitura; a clinica mexe apenas
    no status e na resposta, preservando o conteudo original do pedido.
    """

    list_display = ('usuario', 'tipo', 'status', 'criada_em', 'atualizada_em')
    list_filter = ('tipo', 'status')
    search_fields = ('usuario__username', 'usuario__email', 'mensagem')
    readonly_fields = (
        'usuario',
        'tipo',
        'mensagem',
        'criada_em',
        'atualizada_em',
    )
