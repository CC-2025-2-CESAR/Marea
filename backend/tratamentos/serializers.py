from rest_framework import serializers

from .models import (
    EtapaJornada,
    EtapaTratamento,
    OrientacaoTratamento,
    Tratamento,
)


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


class EtapaJornadaSerializer(serializers.ModelSerializer):
    """Leitura da linha do tempo: resolve os dados da etapa para a tela."""

    etapa_titulo = serializers.SerializerMethodField()
    etapa_descricao = serializers.SerializerMethodField()
    etapa_ordem = serializers.SerializerMethodField()
    tratamento_nome = serializers.SerializerMethodField()
    dias_para_proxima = serializers.SerializerMethodField()
    status_label = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = EtapaJornada
        fields = (
            'id',
            'status',
            'status_label',
            'observacao',
            'etapa',
            'etapa_titulo',
            'etapa_descricao',
            'etapa_ordem',
            'tratamento_nome',
            'dias_para_proxima',
        )

    def get_etapa_titulo(self, obj):
        return obj.etapa.titulo

    def get_etapa_descricao(self, obj):
        return obj.etapa.descricao

    def get_etapa_ordem(self, obj):
        return obj.etapa.ordem

    def get_tratamento_nome(self, obj):
        return obj.etapa.tratamento.nome

    def get_dias_para_proxima(self, obj):
        """Estimativa de dias até a próxima etapa (= duração desta etapa).

        Pode ser `None` quando a clínica ainda não definiu a estimativa. A tela
        só mostra esse número na etapa atual, sempre com o aviso de que é
        estimativa.
        """
        return obj.etapa.duracao_estimada_dias
