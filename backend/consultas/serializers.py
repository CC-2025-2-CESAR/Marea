from rest_framework import serializers

from .models import Consulta, Especialidade


class EspecialidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidade
        fields = ('id', 'nome', 'descricao')


class EspecialidadePublicaSerializer(serializers.ModelSerializer):
    """Listagem pública de especialidades, com as médicas relacionadas."""

    medicas = serializers.SerializerMethodField()

    class Meta:
        model = Especialidade
        fields = ('id', 'nome', 'descricao', 'medicas')

    def get_medicas(self, obj):
        return [
            {
                'id': medica.id,
                'nome': medica.perfil.nome_completo
                or medica.perfil.usuario.username,
            }
            for medica in obj.medicas.all()
        ]


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
