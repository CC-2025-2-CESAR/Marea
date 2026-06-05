"""Modelos de consultas e especialidades da Amare.

A paciente que faz login tem várias consultas ao longo do tratamento.
Cada consulta opcionalmente referencia uma médica e uma especialidade.
"""

from django.db import models

from usuarios.models import Medica, Paciente


class Especialidade(models.Model):
    """Especialidade médica utilizada nas consultas (ex: Reprodução humana)."""

    nome = models.CharField('Nome', max_length=120, unique=True)
    descricao = models.TextField('Descrição', blank=True)
    # Médicas que atuam nesta especialidade (PROJ-24). Vínculo explícito,
    # gerido pelo Django Admin ou pelo seed, exibido na página da paciente.
    medicas = models.ManyToManyField(
        Medica,
        related_name='especialidades',
        blank=True,
        verbose_name='Médicas relacionadas',
    )
    ativo = models.BooleanField('Ativo', default=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['nome']
        verbose_name = 'Especialidade'
        verbose_name_plural = 'Especialidades'

    def __str__(self):
        return self.nome


class Consulta(models.Model):
    """Consulta agendada para uma paciente.

    O status guia tanto a tela da paciente (agrupamento próximas/realizadas/canceladas)
    quanto a coluna do admin.
    """

    STATUS_AGENDADA = 'agendada'
    STATUS_REALIZADA = 'realizada'
    STATUS_CANCELADA = 'cancelada'
    STATUS_REMARCADA = 'remarcada'

    STATUS_CHOICES = [
        (STATUS_AGENDADA, 'Agendada'),
        (STATUS_REALIZADA, 'Realizada'),
        (STATUS_CANCELADA, 'Cancelada'),
        (STATUS_REMARCADA, 'Remarcada'),
    ]

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='consultas',
        verbose_name='Paciente',
    )
    medica = models.ForeignKey(
        Medica,
        on_delete=models.SET_NULL,
        related_name='consultas',
        null=True,
        blank=True,
        verbose_name='Médica',
    )
    especialidade = models.ForeignKey(
        Especialidade,
        on_delete=models.SET_NULL,
        related_name='consultas',
        null=True,
        blank=True,
        verbose_name='Especialidade',
    )
    data_horario = models.DateTimeField('Data e horário')
    local = models.CharField('Local', max_length=180, blank=True)
    observacoes = models.TextField('Observações', blank=True)
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_AGENDADA,
    )
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['data_horario']
        verbose_name = 'Consulta'
        verbose_name_plural = 'Consultas'

    def __str__(self):
        return f'{self.paciente} - {self.data_horario:%d/%m/%Y %H:%M}'


class EventoTratamento(models.Model):
    """Evento do tratamento da paciente exibido no calendário (PROJ-15).

    Diferente de `Consulta` (que tem médica, especialidade e status), um evento
    é um marco simples — exame, procedimento, lembrete — pertencente a uma
    paciente. A paciente só enxerga os próprios eventos (escopo por dono).
    """

    TIPO_EXAME = 'exame'
    TIPO_PROCEDIMENTO = 'procedimento'
    TIPO_MEDICACAO = 'medicacao'
    TIPO_LEMBRETE = 'lembrete'
    TIPO_OUTRO = 'outro'

    TIPO_CHOICES = [
        (TIPO_EXAME, 'Exame'),
        (TIPO_PROCEDIMENTO, 'Procedimento'),
        (TIPO_MEDICACAO, 'Medicação'),
        (TIPO_LEMBRETE, 'Lembrete'),
        (TIPO_OUTRO, 'Outro'),
    ]

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='eventos',
        verbose_name='Paciente',
    )
    titulo = models.CharField('Título', max_length=160)
    descricao = models.TextField('Descrição', blank=True)
    data_horario = models.DateTimeField('Data e horário')
    tipo = models.CharField(
        'Tipo', max_length=20, choices=TIPO_CHOICES, default=TIPO_OUTRO
    )
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['data_horario']
        verbose_name = 'Evento do tratamento'
        verbose_name_plural = 'Eventos do tratamento'

    def __str__(self):
        return f'{self.titulo} ({self.data_horario:%d/%m/%Y %H:%M})'
