from rest_framework import serializers

from .models import TermoDicionario


class TermoDicionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermoDicionario
        fields = ('id', 'termo', 'definicao', 'categoria', 'exemplo')
