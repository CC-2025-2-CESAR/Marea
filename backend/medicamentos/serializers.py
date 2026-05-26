from rest_framework import serializers

from .models import Medicamento


class MedicamentoSerializer(serializers.ModelSerializer):
    """Serializer de leitura. O campo `tomado` é computado a partir do
    estado do dia atual — se a última marcação não foi hoje, retorna False
    mesmo que `tomado_hoje` esteja True no banco (reset implícito).
    """

    tomado = serializers.SerializerMethodField()

    class Meta:
        model = Medicamento
        fields = ('id', 'nome', 'dose', 'horario', 'instrucoes', 'tomado')

    def get_tomado(self, obj):
        return obj.esta_tomado_hoje()
