"""Modelos de tratamentos, etapas e orientações da Amare.

Conteúdo de referência gerido pelo Django Admin e lido de forma pública pela
paciente (não é dado pessoal). Um `Tratamento` reúne várias `EtapaTratamento`
em ordem; as `OrientacaoTratamento` explicam, em linguagem simples, o que fazer
em cada momento, podendo (ou não) apontar para um tratamento e uma etapa.
"""

from django.db import models


class Tratamento(models.Model):
    """Um tratamento oferecido pela clínica (ex.: Fertilização in vitro)."""

    nome = models.CharField('Nome', max_length=120, unique=True)
    descricao = models.TextField('Descrição simples')
    indicacao = models.TextField('Indicação geral', blank=True)
    termos_relacionados = models.ManyToManyField(
        'dicionario.TermoDicionario',
        related_name='tratamentos',
        blank=True,
        verbose_name='Termos do dicionário relacionados',
    )
    ativo = models.BooleanField('Ativo', default=True)
    ordem = models.PositiveIntegerField('Ordem de exibição', default=0)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['ordem', 'nome']
        verbose_name = 'Tratamento'
        verbose_name_plural = 'Tratamentos'

    def __str__(self):
        return self.nome


class EtapaTratamento(models.Model):
    """Uma etapa de um tratamento, exibida na ordem definida."""

    tratamento = models.ForeignKey(
        Tratamento,
        on_delete=models.CASCADE,
        related_name='etapas',
        verbose_name='Tratamento',
    )
    titulo = models.CharField('Título', max_length=120)
    descricao = models.TextField('Descrição', blank=True)
    ordem = models.PositiveIntegerField('Ordem', default=0)

    class Meta:
        ordering = ['ordem', 'id']
        verbose_name = 'Etapa do tratamento'
        verbose_name_plural = 'Etapas do tratamento'

    def __str__(self):
        return f'{self.tratamento.nome} — {self.titulo}'


class OrientacaoTratamento(models.Model):
    """Orientação em linguagem simples, opcionalmente ligada a um tratamento."""

    titulo = models.CharField('Título', max_length=160)
    conteudo = models.TextField('Conteúdo')
    categoria = models.CharField('Categoria', max_length=80, blank=True)
    tratamento = models.ForeignKey(
        Tratamento,
        on_delete=models.SET_NULL,
        related_name='orientacoes',
        null=True,
        blank=True,
        verbose_name='Tratamento relacionado',
    )
    etapa = models.ForeignKey(
        EtapaTratamento,
        on_delete=models.SET_NULL,
        related_name='orientacoes',
        null=True,
        blank=True,
        verbose_name='Etapa relacionada',
    )
    termos_relacionados = models.ManyToManyField(
        'dicionario.TermoDicionario',
        related_name='orientacoes',
        blank=True,
        verbose_name='Termos do dicionário relacionados',
    )
    ativo = models.BooleanField('Ativo', default=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['categoria', 'titulo']
        verbose_name = 'Orientação do tratamento'
        verbose_name_plural = 'Orientações do tratamento'

    def __str__(self):
        return self.titulo
