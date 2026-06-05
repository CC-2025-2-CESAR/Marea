from rest_framework import serializers

from .models import RegistroSintoma


class RegistroSintomaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroSintoma
        fields = ('id', 'data', 'tipo', 'descricao', 'intensidade', 'criado_em')
        read_only_fields = ('id', 'criado_em')

    def validate_intensidade(self, valor):
        if valor is not None and not (1 <= valor <= 5):
            raise serializers.ValidationError(
                'A intensidade deve ficar entre 1 e 5.'
            )
        return valor
