"""Modelos de perfil e papéis de usuário da Amare.

A autenticação continua com o `User` padrão do Django. O `PerfilUsuario`
guarda dados que são comuns a todos os papéis (paciente, médica e admin).
Os modelos `Paciente` e `Medica` carregam os campos específicos de cada papel.

A criação dos perfis é feita explicitamente pelo Django Admin ou pelo
management command `criar_usuarios_teste` — não há `post_save` automático.
"""

import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


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
    # Vínculo explícito Médica↔Paciente (não derivado de consultas). Define qual
    # médica é responsável por esta paciente e, portanto, pode acompanhá-la e
    # criar registros (consultas, medicamentos) para ela na área da médica.
    medica_responsavel = models.ForeignKey(
        'Medica',
        on_delete=models.SET_NULL,
        related_name='pacientes',
        null=True,
        blank=True,
        verbose_name='Médica responsável',
    )

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


class EquipeCuidadoPaciente(models.Model):
    """Vínculo de cuidado entre uma médica e uma paciente, além da responsável.

    A responsável principal continua sendo `Paciente.medica_responsavel`. Este
    modelo registra os vínculos adicionais — uma médica que colabora no
    acompanhamento ou que assumiu o atendimento em cobertura/plantão. Há, no
    máximo, um vínculo `ativa=True` por par (paciente, médica); vínculos
    encerrados permanecem como linhas `ativa=False`, preservando o histórico.
    """

    PAPEL_RESPONSAVEL = 'responsavel'
    PAPEL_COLABORADORA = 'colaboradora'
    PAPEL_SUBSTITUTA = 'substituta'
    PAPEIS = [
        (PAPEL_RESPONSAVEL, 'Responsável'),
        (PAPEL_COLABORADORA, 'Colaboradora'),
        (PAPEL_SUBSTITUTA, 'Substituta'),
    ]

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='equipe_cuidado',
        verbose_name='Paciente',
    )
    medica = models.ForeignKey(
        Medica,
        on_delete=models.CASCADE,
        related_name='vinculos_cuidado',
        verbose_name='Médica',
    )
    papel = models.CharField(
        'Papel no cuidado',
        max_length=20,
        choices=PAPEIS,
        default=PAPEL_COLABORADORA,
    )
    ativa = models.BooleanField('Vínculo ativo', default=True)
    criada_em = models.DateTimeField('Criada em', auto_now_add=True)

    class Meta:
        ordering = ['-criada_em', '-id']
        verbose_name = 'Vínculo de equipe de cuidado'
        verbose_name_plural = 'Equipe de cuidado das pacientes'
        constraints = [
            # No máximo um vínculo ativo por par médica↔paciente; o histórico
            # encerrado (ativa=False) pode ter quantas linhas precisar.
            models.UniqueConstraint(
                fields=['paciente', 'medica'],
                condition=models.Q(ativa=True),
                name='vinculo_cuidado_ativo_unico',
            )
        ]

    def __str__(self):
        return f'{self.medica} — {self.get_papel_display()} de {self.paciente}'


# Validade padrão de um convite de primeiro acesso (PROJ-7): 48 horas.
JANELA_VALIDADE_CONVITE = timedelta(hours=48)


def gerar_token_convite():
    """Gera um token aleatório e difícil de adivinhar para o link de convite."""
    return secrets.token_urlsafe(48)


def prazo_padrao_convite():
    """Quando um convite recém-criado expira: agora + 48h."""
    return timezone.now() + JANELA_VALIDADE_CONVITE


class ConviteAcesso(models.Model):
    """Convite de primeiro acesso de uma paciente.

    A clínica (médica responsável ou administração) cria a conta da paciente já
    inativa e sem senha utilizável; este convite carrega um token único, válido
    por 48h, que a paciente troca pela própria senha no primeiro acesso.
    Enquanto o token não é usado (nem expira), a conta não tem senha — ninguém
    entra por ela. O token é de uso único: ao definir a senha ele é "queimado".
    """

    STATUS_PENDENTE = 'pendente'
    STATUS_USADO = 'usado'
    STATUS_CHOICES = [
        (STATUS_PENDENTE, 'Pendente'),
        (STATUS_USADO, 'Usado'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='convites_acesso',
        verbose_name='Usuário convidado',
    )
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='convites_criados',
        null=True,
        blank=True,
        verbose_name='Criado por',
    )
    token = models.CharField(
        'Token',
        max_length=128,
        unique=True,
        default=gerar_token_convite,
        editable=False,
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDENTE,
    )
    expira_em = models.DateTimeField('Expira em', default=prazo_padrao_convite)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    usado_em = models.DateTimeField('Usado em', null=True, blank=True)

    class Meta:
        ordering = ['-criado_em', '-id']
        verbose_name = 'Convite de acesso'
        verbose_name_plural = 'Convites de acesso'

    def __str__(self):
        return f'Convite de {self.usuario} ({self.get_status_display()})'

    @property
    def expirado(self):
        """True quando já passou da validade."""
        return timezone.now() >= self.expira_em

    def pode_ser_usado(self):
        """Só um convite pendente e dentro da validade pode virar senha."""
        return self.status == self.STATUS_PENDENTE and not self.expirado

    def marcar_usado(self):
        """Queima o token: o mesmo convite não é usado duas vezes."""
        self.status = self.STATUS_USADO
        self.usado_em = timezone.now()
        self.save(update_fields=['status', 'usado_em'])


# Validade padrão de um link de recuperação de senha (PROJ-7): 2 horas. Mais
# curta que a do convite — um pedido de redefinição é pontual e sensível.
JANELA_VALIDADE_RECUPERACAO = timedelta(hours=2)


def gerar_token_recuperacao():
    """Token aleatório e difícil de adivinhar para o link de redefinição."""
    return secrets.token_urlsafe(48)


def prazo_padrao_recuperacao():
    """Quando um pedido de recuperação recém-criado expira: agora + 2h."""
    return timezone.now() + JANELA_VALIDADE_RECUPERACAO


class RecuperacaoSenha(models.Model):
    """Pedido de redefinição de senha (autoatendimento).

    Diferente do convite (primeiro acesso de uma conta nova), aqui a conta já
    existe e está ativa: a pessoa esqueceu a senha. O token é único, de uso
    único e válido por 2h, e o link viaja por **e-mail** (fora da tela) — assim
    ninguém redefine a senha de outra pessoa só sabendo o e-mail dela. Ao
    redefinir, o token é "queimado".
    """

    STATUS_PENDENTE = 'pendente'
    STATUS_USADO = 'usado'
    STATUS_CHOICES = [
        (STATUS_PENDENTE, 'Pendente'),
        (STATUS_USADO, 'Usado'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recuperacoes_senha',
        verbose_name='Usuário',
    )
    token = models.CharField(
        'Token',
        max_length=128,
        unique=True,
        default=gerar_token_recuperacao,
        editable=False,
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDENTE,
    )
    expira_em = models.DateTimeField(
        'Expira em', default=prazo_padrao_recuperacao
    )
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    usado_em = models.DateTimeField('Usado em', null=True, blank=True)

    class Meta:
        ordering = ['-criado_em', '-id']
        verbose_name = 'Recuperação de senha'
        verbose_name_plural = 'Recuperações de senha'

    def __str__(self):
        return f'Recuperação de {self.usuario} ({self.get_status_display()})'

    @property
    def expirado(self):
        """True quando já passou da validade."""
        return timezone.now() >= self.expira_em

    def pode_ser_usado(self):
        """Só um pedido pendente e dentro da validade redefine a senha."""
        return self.status == self.STATUS_PENDENTE and not self.expirado

    def marcar_usado(self):
        """Queima o token: o mesmo link não redefine a senha duas vezes."""
        self.status = self.STATUS_USADO
        self.usado_em = timezone.now()
        self.save(update_fields=['status', 'usado_em'])
