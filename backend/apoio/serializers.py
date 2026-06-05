from rest_framework import serializers

from .models import ConteudoApoio


class ConteudoApoioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConteudoApoio
        fields = ('id', 'titulo', 'texto', 'categoria')
