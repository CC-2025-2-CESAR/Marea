from rest_framework import serializers

from .models import AcaoAssistente, RespostaAssistente


class AcaoAssistenteSerializer(serializers.ModelSerializer):
    """Atalho oferecido por uma resposta (rótulo + rota do app)."""

    class Meta:
        model = AcaoAssistente
        fields = ('rotulo', 'rota')


class SugestaoSerializer(serializers.ModelSerializer):
    """Chip de sugestão mostrado na abertura do assistente."""

    class Meta:
        model = RespostaAssistente
        fields = ('intencao', 'pergunta_exemplo', 'categoria')


class PerguntaSerializer(serializers.Serializer):
    """Entrada do POST: a pergunta digitada (ou o texto de um chip)."""

    pergunta = serializers.CharField(max_length=500)

    def validate_pergunta(self, valor):
        if not valor.strip():
            raise serializers.ValidationError('Escreva a sua pergunta.')
        return valor
