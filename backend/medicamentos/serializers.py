from rest_framework import serializers

from .models import Medicamento


class MedicamentoSerializer(serializers.ModelSerializer):
    """Serializer de leitura. O campo `tomado` é computado a partir do
    estado do dia atual — se a última marcação não foi hoje, retorna False
    mesmo que `tomado_hoje` esteja True no banco (reset implícito).

    `status_dia` resume a situação do dia (tomado / atrasado / pendente) e
    `status_dia_label` traz o rótulo pronto para exibição.
    """

    tomado = serializers.SerializerMethodField()
    status_dia = serializers.SerializerMethodField()
    status_dia_label = serializers.SerializerMethodField()

    class Meta:
        model = Medicamento
        fields = (
            'id',
            'nome',
            'dose',
            'horario',
            'instrucoes',
            'armazenamento',
            'tomado',
            'status_dia',
            'status_dia_label',
        )

    def get_tomado(self, obj):
        return obj.esta_tomado_hoje()

    def get_status_dia(self, obj):
        return obj.status_do_dia()

    def get_status_dia_label(self, obj):
        return Medicamento.STATUS_DIA_LABELS.get(obj.status_do_dia(), '')
