"""Modelos de perfil e papéis de usuário da Amare.

A autenticação continua com o `User` padrão do Django. O `PerfilUsuario`
guarda dados que são comuns a todos os papéis (paciente, médica e admin).
Os modelos `Paciente` e `Medica` carregam os campos específicos de cada papel.

A criação dos perfis é feita explicitamente pelo Django Admin ou pelo
management command `criar_usuarios_teste` — não há `post_save` automático.
"""

from django.conf import settings
from django.db import models


class PerfilUsuario(models.Model):
    """Dados comuns a qualquer usuário da plataforma."""

    TIPO_PACIENTE = 'paciente'
    TIPO_MEDICA = 'medica'
    TIPO_ADMIN = 'admin'

    TIPO_CHOICES = [
        (TIPO_PACIENTE, 'Paciente'),
        (TIPO_MEDICA, 'Médica'),
        (TIPO_ADMIN, 'Administradora'),
    ]

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil',
        verbose_name='Usuário',
    )
    tipo_usuario = models.CharField(
        'Tipo de usuário',
        max_length=20,
        choices=TIPO_CHOICES,
        default=TIPO_PACIENTE,
    )
    nome_completo = models.CharField('Nome completo', max_length=180, blank=True)
    telefone = models.CharField('Telefone', max_length=30, blank=True)
    foto_url = models.URLField('Foto (URL)', blank=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['nome_completo', 'usuario__username']
        verbose_name = 'Perfil de usuário'
        verbose_name_plural = 'Perfis de usuários'

    def __str__(self):
        return self.nome_completo or self.usuario.username


class Paciente(models.Model):
    """Dados clínicos básicos de uma paciente."""

    SANGUE_DESCONHECIDO = 'desconhecido'

    TIPO_SANGUINEO_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
        (SANGUE_DESCONHECIDO, 'Desconhecido'),
    ]

    perfil = models.OneToOneField(
        PerfilUsuario,
        on_delete=models.CASCADE,
        related_name='paciente',
        verbose_name='Perfil',
    )
    data_nascimento = models.DateField('Data de nascimento', null=True, blank=True)
    tipo_sanguineo = models.CharField(
        'Tipo sanguíneo',
        max_length=15,
        choices=TIPO_SANGUINEO_CHOICES,
        default=SANGUE_DESCONHECIDO,
    )
    medicamentos_em_uso = models.TextField('Medicamentos em uso', blank=True)
    observacoes_medicas = models.TextField('Observações médicas', blank=True)

    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'

    def __str__(self):
        return str(self.perfil)


class Medica(models.Model):
    """Dados profissionais de uma médica cadastrada."""

    perfil = models.OneToOneField(
        PerfilUsuario,
        on_delete=models.CASCADE,
        related_name='medica',
        verbose_name='Perfil',
    )
    crm = models.CharField('CRM', max_length=30, blank=True)
    especialidade = models.CharField('Especialidade', max_length=120, blank=True)

    class Meta:
        verbose_name = 'Médica'
        verbose_name_plural = 'Médicas'

    def __str__(self):
        return str(self.perfil)
