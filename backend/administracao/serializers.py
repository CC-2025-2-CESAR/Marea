"""Serializers do painel administrativo (PR8).

Escrita do conteúdo do dicionário (CRUD da administração) e leitura da trilha
de auditoria. Os endpoints de origem (dicionário público, área da médica)
seguem intocados; aqui é a visão da administração.
"""

from rest_framework import serializers

from auditoria.models import LogAtividade
from dicionario.models import TermoDicionario


class TermoAdminSerializer(serializers.ModelSerializer):
    """CRUD de um termo do dicionário pela administração.

    Diferente do serializer público, expõe `ativo` e os carimbos de data, para
    a administração publicar/despublicar e auditar. A unicidade de `termo` é
    garantida pelo modelo (o ModelSerializer aplica o validador, ignorando o
    próprio registro na edição).
    """

    class Meta:
        model = TermoDicionario
        fields = (
            'id',
            'termo',
            'definicao',
            'categoria',
            'exemplo',
            'artigos_relacionados',
            'ativo',
            'criado_em',
            'atualizado_em',
        )
        read_only_fields = ('id', 'criado_em', 'atualizado_em')

    def validate_termo(self, valor):
        valor = (valor or '').strip()
        if not valor:
            raise serializers.ValidationError('Informe o termo.')
        return valor

    def validate_definicao(self, valor):
        valor = (valor or '').strip()
        if not valor:
            raise serializers.ValidationError('Informe a definição.')
        return valor


class LogAtividadeSerializer(serializers.ModelSerializer):
    """Leitura de um evento da trilha de auditoria, com rótulos prontos."""

    usuario_nome = serializers.SerializerMethodField()
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)
    entidade_display = serializers.CharField(
        source='get_entidade_display', read_only=True
    )
    paciente_nome = serializers.SerializerMethodField()

    class Meta:
        model = LogAtividade
        fields = (
            'id',
            'usuario_nome',
            'acao',
            'acao_display',
            'entidade',
            'entidade_display',
            'entidade_id',
            'paciente_nome',
            'motivo',
            'data_hora',
        )

    def get_usuario_nome(self, obj):
        return obj.usuario.username if obj.usuario else 'usuário removido'

    def get_paciente_nome(self, obj):
        if not obj.paciente_id:
            return ''
        perfil = getattr(obj.paciente, 'perfil', None)
        if perfil is None:
            return ''
        return perfil.nome_completo or perfil.usuario.username
