from rest_framework import serializers

from .models import EtapaTratamento, OrientacaoTratamento, Tratamento


def _serializar_termos(termos):
    """Resume os termos do dicionário relacionados para os chips da tela."""
    return [{'id': termo.id, 'termo': termo.termo} for termo in termos]


class EtapaTratamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapaTratamento
        fields = ('id', 'titulo', 'descricao', 'ordem')


class TratamentoSerializer(serializers.ModelSerializer):
    etapas = EtapaTratamentoSerializer(many=True, read_only=True)
    termos_relacionados = serializers.SerializerMethodField()

    class Meta:
        model = Tratamento
        fields = (
            'id',
            'nome',
            'descricao',
            'indicacao',
            'etapas',
            'termos_relacionados',
        )

    def get_termos_relacionados(self, obj):
        return _serializar_termos(obj.termos_relacionados.all())


class OrientacaoTratamentoSerializer(serializers.ModelSerializer):
    """Leitura: resolve os nomes do tratamento e da etapa para a tela."""

    tratamento_nome = serializers.SerializerMethodField()
    etapa_titulo = serializers.SerializerMethodField()
    termos_relacionados = serializers.SerializerMethodField()

    class Meta:
        model = OrientacaoTratamento
        fields = (
            'id',
            'titulo',
            'conteudo',
            'categoria',
            'tratamento',
            'tratamento_nome',
            'etapa',
            'etapa_titulo',
            'termos_relacionados',
        )

    def get_tratamento_nome(self, obj):
        return obj.tratamento.nome if obj.tratamento else ''

    def get_etapa_titulo(self, obj):
        return obj.etapa.titulo if obj.etapa else ''

    def get_termos_relacionados(self, obj):
        return _serializar_termos(obj.termos_relacionados.all())
