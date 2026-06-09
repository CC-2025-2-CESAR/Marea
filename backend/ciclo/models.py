"""Ciclo menstrual da paciente (PROJ-5 e PROJ-6, épico PROJ-10).

Escrito pela própria paciente — dado pessoal de saúde. Cada paciente só acessa
os próprios registros (escopo por dono, garantido no backend). As previsões
(PROJ-6) são calculadas a partir dos registros de início de menstruação e são
apenas estimativas; nunca substituem orientação médica.
"""

from django.db import models

from usuarios.models import Paciente


class RegistroCiclo(models.Model):
    """Um registro do ciclo menstrual feito pela paciente em uma data.

    A etapa "menstruação" marca o primeiro dia do período e é a referência
    usada para estimar o próximo ciclo (ver `ciclo.views.previsoes`).
    """

    ETAPA_MENSTRUACAO = 'menstruacao'
    ETAPA_FOLICULAR = 'folicular'
    ETAPA_OVULACAO = 'ovulacao'
    ETAPA_LUTEA = 'lutea'
    ETAPAS = [
        (ETAPA_MENSTRUACAO, 'Menstruação'),
        (ETAPA_FOLICULAR, 'Fase folicular'),
        (ETAPA_OVULACAO, 'Ovulação'),
        (ETAPA_LUTEA, 'Fase lútea'),
    ]

    STATUS_REGISTRADO = 'registrado'
    STATUS_EM_ANDAMENTO = 'em_andamento'
    STATUS_CONCLUIDO = 'concluido'
    STATUS = [
        (STATUS_REGISTRADO, 'Registrado'),
        (STATUS_EM_ANDAMENTO, 'Em andamento'),
        (STATUS_CONCLUIDO, 'Concluído'),
    ]

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='registros_ciclo',
        verbose_name='Paciente',
    )
    data = models.DateField('Data')
    etapa = models.CharField(
        'Etapa do ciclo',
        max_length=20,
        choices=ETAPAS,
        default=ETAPA_MENSTRUACAO,
        help_text='Use "Menstruação" para marcar o primeiro dia do período.',
    )
    observacoes = models.TextField('Observações', blank=True)
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS,
        default=STATUS_REGISTRADO,
    )
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['-data', '-criado_em']
        verbose_name = 'Registro de ciclo'
        verbose_name_plural = 'Registros de ciclo'

    def __str__(self):
        return (
            f'{self.paciente} — {self.get_etapa_display()} '
            f'({self.data:%d/%m/%Y})'
        )
