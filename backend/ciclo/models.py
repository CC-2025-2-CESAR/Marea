from django.db import models

from usuarios.models import Paciente


class RegistroCiclo(models.Model):

    ETAPAS_CICLO = [
        ('Menstruação', 'Menstruação'),
        ('Fase Folicular', 'Fase Folicular'),
        ('Ovulação', 'Ovulação'),
        ('Fase Lútea', 'Fase Lútea'),
    ]

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='registros_ciclo',
        verbose_name='Paciente',
    )

    data = models.DateField('Data')

    etapa_ciclo = models.CharField(
        'Etapa do ciclo',
        max_length=20,
        choices=ETAPAS_CICLO,
    )

    observacoes = models.TextField(
        'Observações',
        blank=True,
    )

    criado_em = models.DateTimeField(
        'Criado em',
        auto_now_add=True,
    )

    class Meta:
        ordering = ['-data', '-criado_em']
        verbose_name = 'Registro de ciclo'
        verbose_name_plural = 'Registros de ciclo'

    def __str__(self):
        return (
            f'{self.paciente} - '
            f'{self.etapa_ciclo} '
            f'({self.data:%d/%m/%Y})'
        )