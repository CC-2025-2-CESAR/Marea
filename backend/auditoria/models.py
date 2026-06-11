"""Trilha de auditoria das ações sensíveis sobre dados de pacientes.

Toda escrita (ou visualização sensível) feita por uma médica/administradora
sobre uma paciente que não é a sua responsável gera um registro aqui — é
exigência de LGPD e do controle de acesso por papéis. O log é só de acréscimo:
a aplicação nunca o edita, e ele sobrevive à exclusão do usuário ou da paciente
(`on_delete=SET_NULL`), preservando o histórico de quem acessou o quê e por quê.

Apenas o modelo nesta fatia; o registro efetivo dos eventos é ligado às views da
área da médica numa fatia seguinte.
"""

from django.conf import settings
from django.db import models

from usuarios.models import Paciente


class LogAtividade(models.Model):
    """Um evento de auditoria: quem fez o quê, sobre qual entidade e por quê."""

    ACAO_ASSUMIR_ATENDIMENTO = 'assumir_atendimento'
    ACAO_VISUALIZAR_PACIENTE = 'visualizar_paciente'
    ACAO_EDITAR_PACIENTE = 'editar_paciente'
    ACAO_CRIAR_CONSULTA = 'criar_consulta'
    ACAO_CRIAR_MEDICAMENTO = 'criar_medicamento'
    ACOES = [
        (ACAO_ASSUMIR_ATENDIMENTO, 'Assumiu o atendimento'),
        (ACAO_VISUALIZAR_PACIENTE, 'Visualizou a paciente'),
        (ACAO_EDITAR_PACIENTE, 'Editou a paciente'),
        (ACAO_CRIAR_CONSULTA, 'Criou uma consulta'),
        (ACAO_CRIAR_MEDICAMENTO, 'Cadastrou um medicamento'),
    ]

    ENTIDADE_PACIENTE = 'paciente'
    ENTIDADE_CONSULTA = 'consulta'
    ENTIDADE_MEDICAMENTO = 'medicamento'
    ENTIDADE_EQUIPE = 'equipe_cuidado'
    ENTIDADES = [
        (ENTIDADE_PACIENTE, 'Paciente'),
        (ENTIDADE_CONSULTA, 'Consulta'),
        (ENTIDADE_MEDICAMENTO, 'Medicamento'),
        (ENTIDADE_EQUIPE, 'Equipe de cuidado'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='logs_atividade',
        null=True,
        verbose_name='Usuário',
    )
    acao = models.CharField('Ação', max_length=40, choices=ACOES)
    entidade = models.CharField(
        'Entidade', max_length=30, choices=ENTIDADES, blank=True
    )
    entidade_id = models.PositiveIntegerField(
        'ID da entidade', null=True, blank=True
    )
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.SET_NULL,
        related_name='logs_atividade',
        null=True,
        blank=True,
        verbose_name='Paciente',
    )
    motivo = models.TextField('Motivo', blank=True)
    data_hora = models.DateTimeField('Data e hora', auto_now_add=True)

    class Meta:
        # Tiebreak por -id deixa a ordem estável mesmo com timestamps iguais.
        ordering = ['-data_hora', '-id']
        verbose_name = 'Log de atividade'
        verbose_name_plural = 'Logs de atividade'

    def __str__(self):
        usuario = self.usuario.username if self.usuario else 'usuário removido'
        return f'{usuario} — {self.get_acao_display()}'
