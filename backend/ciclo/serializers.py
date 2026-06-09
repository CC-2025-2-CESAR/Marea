from datetime import date

from rest_framework import serializers

from .models import RegistroCiclo


class RegistroCicloSerializer(serializers.ModelSerializer):
    dias_restantes_fase = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = RegistroCiclo
        fields = (
            'id',
            'data',
            'etapa_ciclo',
            'observacoes',
            'dias_restantes_fase',
            'status',
            'criado_em',
        )
        read_only_fields = (
            'id',
            'dias_restantes_fase',
            'status',
            'criado_em',
        )

    def get_dias_restantes_fase(self, obj):
        dias_passados = (date.today() - obj.data).days

        if obj.etapa_ciclo == 'Menstruação':
            return max(5 - dias_passados, 0)

        if obj.etapa_ciclo == 'Fase Folicular':
            return max(13 - dias_passados, 0)

        if obj.etapa_ciclo == 'Ovulação':
            return max(1 - dias_passados, 0)

        if obj.etapa_ciclo == 'Fase Lútea':
            return max(14 - dias_passados, 0)

        return 0

    def get_status(self, obj):
        dias = self.get_dias_restantes_fase(obj)

        if dias > 0:
            return (
                f'Faltam {dias} dias para acabar '
                f'a fase {obj.etapa_ciclo}'
            )

        return f'{obj.etapa_ciclo} encerrada'