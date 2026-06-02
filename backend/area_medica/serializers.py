"""Serializers da área da médica.

Leitura: resumo e detalhe da paciente (reaproveitando os serializers de
consultas e medicamentos). Escrita: criação de consulta e medicamento — a
paciente e a médica são definidas pela view, nunca pelo corpo da requisição.
"""

from rest_framework import serializers

from consultas.models import Consulta
from consultas.serializers import ConsultaSerializer
from medicamentos.models import Medicamento
from medicamentos.serializers import MedicamentoSerializer
from usuarios.models import Paciente


class PacienteResumoSerializer(serializers.ModelSerializer):
    """Resumo de uma paciente para a lista da médica."""

    nome_completo = serializers.SerializerMethodField()
    telefone = serializers.CharField(source='perfil.telefone', read_only=True)
    total_consultas = serializers.SerializerMethodField()
    total_medicamentos = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = (
            'id',
            'nome_completo',
            'telefone',
            'tipo_sanguineo',
            'total_consultas',
            'total_medicamentos',
        )

    def get_nome_completo(self, obj):
        return obj.perfil.nome_completo or obj.perfil.usuario.username

    def get_total_consultas(self, obj):
        return obj.consultas.count()

    def get_total_medicamentos(self, obj):
        return obj.medicamentos.filter(ativo=True).count()


class PacienteDetalheSerializer(serializers.ModelSerializer):
    """Detalhe completo de uma paciente para a médica acompanhar."""

    nome_completo = serializers.SerializerMethodField()
    telefone = serializers.CharField(source='perfil.telefone', read_only=True)
    email = serializers.CharField(source='perfil.usuario.email', read_only=True)
    consultas = serializers.SerializerMethodField()
    medicamentos = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = (
            'id',
            'nome_completo',
            'telefone',
            'email',
            'data_nascimento',
            'tipo_sanguineo',
            'medicamentos_em_uso',
            'observacoes_medicas',
            'consultas',
            'medicamentos',
        )

    def get_nome_completo(self, obj):
        return obj.perfil.nome_completo or obj.perfil.usuario.username

    def get_consultas(self, obj):
        consultas = obj.consultas.select_related(
            'medica__perfil__usuario', 'especialidade'
        )
        return ConsultaSerializer(consultas, many=True).data

    def get_medicamentos(self, obj):
        medicamentos = obj.medicamentos.filter(ativo=True)
        return MedicamentoSerializer(medicamentos, many=True).data


class ConsultaCriarSerializer(serializers.ModelSerializer):
    """Criação de consulta pela médica. A paciente e a médica vêm da view."""

    class Meta:
        model = Consulta
        fields = (
            'id',
            'data_horario',
            'especialidade',
            'local',
            'observacoes',
            'status',
        )


class MedicamentoCriarSerializer(serializers.ModelSerializer):
    """Criação de medicamento pela médica. A paciente vem da view."""

    class Meta:
        model = Medicamento
        fields = ('id', 'nome', 'dose', 'horario', 'instrucoes')

    def validate_nome(self, valor):
        if not valor.strip():
            raise serializers.ValidationError('Informe o nome do medicamento.')
        return valor
