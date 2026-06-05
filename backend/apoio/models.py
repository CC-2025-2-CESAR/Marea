"""Conteúdos de apoio emocional da Amare.

Conteúdo de referência gerido pelo Django Admin e lido de forma pública pela
paciente (não é dado pessoal). A tela exibe um aviso de que o conteúdo **não
substitui acompanhamento profissional** (PROJ-22).
"""

from django.db import models


class ConteudoApoio(models.Model):
    """Uma mensagem/orientação de apoio emocional para a paciente."""

    titulo = models.CharField('Título', max_length=160)
    texto = models.TextField('Texto')
    categoria = models.CharField('Categoria', max_length=80, blank=True)
    publicado = models.BooleanField('Publicado', default=True)
    ordem = models.PositiveIntegerField('Ordem de exibição', default=0)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['ordem', 'titulo']
        verbose_name = 'Conteúdo de apoio'
        verbose_name_plural = 'Conteúdos de apoio'

    def __str__(self):
        return self.titulo
