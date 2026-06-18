"""Serializers de privacidade (LGPD)."""

from rest_framework import serializers

from .models import SolicitacaoPrivacidade


class SolicitacaoPrivacidadeSerializer(serializers.ModelSerializer):
    """Leitura e abertura de uma solicitacao do titular.

    Na escrita, a titular informa apenas `tipo` e `mensagem`; `status` e
    `resposta` sao definidos pela clinica e ficam somente-leitura aqui.
    """

    tipo_display = serializers.CharField(
        source='get_tipo_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = SolicitacaoPrivacidade
        fields = [
            'id',
            'tipo',
            'tipo_display',
            'mensagem',
            'status',
            'status_display',
            'resposta',
            'criada_em',
            'atualizada_em',
        ]
        read_only_fields = [
            'id',
            'status',
            'resposta',
            'criada_em',
            'atualizada_em',
        ]

    def validate_mensagem(self, valor):
        valor = (valor or '').strip()
        if not valor:
            raise serializers.ValidationError('Descreva a sua solicitacao.')
        return valor
