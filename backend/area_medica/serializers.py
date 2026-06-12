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
from usuarios.permissions import (
    PAPEIS_COM_ESCRITA,
    PAPEL_ACESSO_ADMIN,
    PAPEL_ACESSO_ASSUMIDO,
    PAPEL_ACESSO_RESPONSAVEL,
    PAPEL_ACESSO_VISUALIZACAO,
    papel_no_cuidado,
)

# Texto do selo de acesso mostrado na interface da médica.
ROTULO_PERMISSAO = {
    PAPEL_ACESSO_ADMIN: 'Administração',
    PAPEL_ACESSO_RESPONSAVEL: 'Responsável: você',
    PAPEL_ACESSO_ASSUMIDO: 'Atendimento assumido',
    PAPEL_ACESSO_VISUALIZACAO: 'Visualização apenas',
}


def permissao_da_paciente(context, paciente):
    """Status de acesso de quem faz o request a esta paciente (para a UI)."""
    request = context.get('request')
    usuario = getattr(request, 'user', None)
    papel = papel_no_cuidado(usuario, paciente)
    return {
        'papel': papel,
        'pode_editar': papel in PAPEIS_COM_ESCRITA,
        'rotulo': ROTULO_PERMISSAO[papel],
    }


class PacienteResumoSerializer(serializers.ModelSerializer):
    """Resumo de uma paciente para a lista da médica."""

    nome_completo = serializers.SerializerMethodField()
    telefone = serializers.CharField(source='perfil.telefone', read_only=True)
    total_consultas = serializers.SerializerMethodField()
    total_medicamentos = serializers.SerializerMethodField()
    permissao = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = (
            'id',
            'nome_completo',
            'telefone',
            'tipo_sanguineo',
            'total_consultas',
            'total_medicamentos',
            'permissao',
        )

    def get_nome_completo(self, obj):
        return obj.perfil.nome_completo or obj.perfil.usuario.username

    def get_total_consultas(self, obj):
        return obj.consultas.count()

    def get_total_medicamentos(self, obj):
        return obj.medicamentos.filter(ativo=True).count()

    def get_permissao(self, obj):
        return permissao_da_paciente(self.context, obj)


class PacienteDetalheSerializer(serializers.ModelSerializer):
    """Detalhe completo de uma paciente para a médica acompanhar."""

    nome_completo = serializers.SerializerMethodField()
    telefone = serializers.CharField(source='perfil.telefone', read_only=True)
    email = serializers.CharField(source='perfil.usuario.email', read_only=True)
    consultas = serializers.SerializerMethodField()
    medicamentos = serializers.SerializerMethodField()
    permissao = serializers.SerializerMethodField()

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
            'permissao',
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

    def get_permissao(self, obj):
        return permissao_da_paciente(self.context, obj)


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


# Motivos para uma médica assumir o atendimento de uma paciente de outra.
MOTIVO_COBERTURA = 'cobertura_agenda'
MOTIVO_PLANTAO = 'plantao'
MOTIVO_COMPARTILHADA = 'consulta_compartilhada'
MOTIVO_EMERGENCIAL = 'retorno_emergencial'
MOTIVO_OUTRO = 'outro'
MOTIVOS_ASSUMIR = [
    (MOTIVO_COBERTURA, 'Cobertura de agenda'),
    (MOTIVO_PLANTAO, 'Plantão'),
    (MOTIVO_COMPARTILHADA, 'Consulta compartilhada'),
    (MOTIVO_EMERGENCIAL, 'Retorno emergencial'),
    (MOTIVO_OUTRO, 'Outro'),
]
# Motivo de colaboração contínua → vínculo de colaboradora (não de substituta).
MOTIVOS_COLABORACAO = frozenset({MOTIVO_COMPARTILHADA})


class AssumirAtendimentoSerializer(serializers.Serializer):
    """Valida o motivo de uma médica assumir o atendimento de uma paciente.

    `observacao` é livre e passa a ser obrigatória quando o motivo é "Outro" —
    para a trilha de auditoria nunca registrar um "outro" sem explicação.
    """

    motivo = serializers.ChoiceField(choices=MOTIVOS_ASSUMIR)
    observacao = serializers.CharField(
        required=False, allow_blank=True, max_length=500
    )

    def validate(self, dados):
        observacao = (dados.get('observacao') or '').strip()
        if dados['motivo'] == MOTIVO_OUTRO and not observacao:
            raise serializers.ValidationError(
                {'observacao': 'Descreva o motivo quando escolher "Outro".'}
            )
        dados['observacao'] = observacao
        return dados
