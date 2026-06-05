"""Registro de sintomas e observações da paciente (PROJ-21).

Diferente do restante do conteúdo (gerido pela clínica), este é **escrito pela
própria paciente**. É dado pessoal de saúde: cada paciente só acessa os próprios
registros (escopo por dono, garantido no backend).
"""

from django.db import models

from usuarios.models import Paciente


class RegistroSintoma(models.Model):
    """Um sintoma ou observação registrado pela paciente em uma data."""

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='registros_sintomas',
        verbose_name='Paciente',
    )
    data = models.DateField('Data')
    tipo = models.CharField('Tipo', max_length=80)
    descricao = models.TextField('Descrição')
    intensidade = models.PositiveSmallIntegerField(
        'Intensidade',
        null=True,
        blank=True,
        help_text='Opcional, de 1 (leve) a 5 (intensa).',
    )
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)

    class Meta:
        ordering = ['-data', '-criado_em']
        verbose_name = 'Registro de sintoma'
        verbose_name_plural = 'Registros de sintomas'

    def __str__(self):
        return f'{self.paciente} — {self.tipo} ({self.data:%d/%m/%Y})'
