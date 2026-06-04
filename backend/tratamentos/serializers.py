from rest_framework import serializers

from .models import EtapaTratamento, OrientacaoTratamento, Tratamento


class EtapaTratamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapaTratamento
        fields = ('id', 'titulo', 'descricao', 'ordem')


class TratamentoSerializer(serializers.ModelSerializer):
    etapas = EtapaTratamentoSerializer(many=True, read_only=True)

    class Meta:
        model = Tratamento
        fields = ('id', 'nome', 'descricao', 'indicacao', 'etapas')


class OrientacaoTratamentoSerializer(serializers.ModelSerializer):
    """Leitura: resolve os nomes do tratamento e da etapa para a tela."""

    tratamento_nome = serializers.SerializerMethodField()
    etapa_titulo = serializers.SerializerMethodField()

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
        )

    def get_tratamento_nome(self, obj):
        return obj.tratamento.nome if obj.tratamento else ''

    def get_etapa_titulo(self, obj):
        return obj.etapa.titulo if obj.etapa else ''
