"""Modelo de medicamentos prescritos para a paciente.

Cada paciente tem zero ou mais medicamentos ativos. O campo `tomado_hoje`
guarda apenas o estado do dia atual; combinado com `data_ultima_marcacao`,
permite que o serializer faça reset implícito quando a paciente abre a
checklist em um novo dia (sem precisar de cron diário no servidor).
"""

from datetime import date

from django.db import models

from usuarios.models import Paciente


class Medicamento(models.Model):
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='medicamentos',
        verbose_name='Paciente',
    )
    nome = models.CharField('Nome', max_length=120)
    dose = models.CharField('Dose', max_length=80, blank=True)
    horario = models.TimeField('Horário', null=True, blank=True)
    instrucoes = models.TextField('Instruções', blank=True)
    tomado_hoje = models.BooleanField('Tomado hoje', default=False)
    data_ultima_marcacao = models.DateField(
        'Data da última marcação', null=True, blank=True,
    )
    ativo = models.BooleanField('Ativo', default=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['horario', 'nome']
        verbose_name = 'Medicamento'
        verbose_name_plural = 'Medicamentos'

    def __str__(self):
        return f'{self.nome} ({self.paciente})'

    def esta_tomado_hoje(self):
        """Só conta como tomado se a marcação foi feita HOJE.

        Reset implícito: se a paciente marcou ontem, abrir a checklist hoje
        retorna False sem precisar de cron diário.
        """
        return bool(
            self.tomado_hoje and self.data_ultima_marcacao == date.today()
        )

    def marcar_tomado(self, tomado):
        """Atualiza o estado e a data da última marcação."""
        self.tomado_hoje = bool(tomado)
        self.data_ultima_marcacao = date.today()
        self.save(
            update_fields=['tomado_hoje', 'data_ultima_marcacao', 'atualizado_em']
        )
