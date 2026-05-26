from rest_framework import serializers

from .models import Consulta, Especialidade


class EspecialidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidade
        fields = ('id', 'nome', 'descricao')


class ConsultaSerializer(serializers.ModelSerializer):
    """Serializer leitura: traz nomes resolvidos para a paciente ler na tela."""

    especialidade_nome = serializers.SerializerMethodField()
    medica_nome = serializers.SerializerMethodField()
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Consulta
        fields = (
            'id',
            'data_horario',
            'local',
            'observacoes',
            'status',
            'status_label',
            'especialidade',
            'especialidade_nome',
            'medica',
            'medica_nome',
        )

    def get_especialidade_nome(self, obj):
        return obj.especialidade.nome if obj.especialidade else ''

    def get_medica_nome(self, obj):
        if not obj.medica:
            return ''
        perfil = obj.medica.perfil
        return perfil.nome_completo or perfil.usuario.username
