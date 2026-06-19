from rest_framework import serializers

from .models import Consulta, Especialidade, EventoTratamento


def nome_da_medica(medica):
    """Nome de exibição da médica: nome completo do perfil ou o username."""
    return medica.perfil.nome_completo or medica.perfil.usuario.username


def serializar_medica_publica(medica):
    """Dados públicos de uma médica para o catálogo (perfil da equipe).

    Conteúdo institucional, sem nada sensível: nome, especialidade, registros
    profissionais (CRM/RQE) e a apresentação.
    """
    return {
        'id': medica.id,
        'nome': nome_da_medica(medica),
        'especialidade': medica.especialidade,
        'crm': medica.crm,
        'rqe': medica.rqe,
        'bio': medica.bio,
    }


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
        return [serializar_medica_publica(medica) for medica in obj.medicas.all()]


def serializar_membro_equipe(medica):
    """Dados públicos de uma médica na página da equipe, com as especialidades.

    Estende `serializar_medica_publica` com a lista de especialidades ativas a
    que a médica está vinculada — para a página agrupar/exibir áreas de atuação.
    """
    dados = serializar_medica_publica(medica)
    dados['especialidades'] = [
        {'id': esp.id, 'nome': esp.nome}
        for esp in medica.especialidades.all()
        if esp.ativo
    ]
    return dados


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


class EventoTratamentoSerializer(serializers.ModelSerializer):
    """Leitura dos eventos do calendário da paciente (PROJ-15)."""

    tipo_label = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = EventoTratamento
        fields = (
            'id',
            'titulo',
            'descricao',
            'data_horario',
            'tipo',
            'tipo_label',
        )
