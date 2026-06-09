from rest_framework import serializers

from .models import RegistroCiclo


class RegistroCicloSerializer(serializers.ModelSerializer):
    """Serializa um registro do ciclo. `paciente` nunca vem do payload — é
    sempre a paciente autenticada (definida na view)."""

    etapa_display = serializers.CharField(
        source='get_etapa_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = RegistroCiclo
        fields = (
            'id',
            'data',
            'etapa',
            'etapa_display',
            'observacoes',
            'status',
            'status_display',
            'criado_em',
            'atualizado_em',
        )
        read_only_fields = (
            'id',
            'etapa_display',
            'status_display',
            'criado_em',
            'atualizado_em',
        )
