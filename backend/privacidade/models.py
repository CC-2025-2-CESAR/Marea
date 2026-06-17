"""Solicitacoes de privacidade (LGPD) feitas pelo titular dos dados.

A propria usuaria autenticada pede a CORRECAO de um dado ou a EXCLUSAO/
anonimizacao da conta; a clinica processa e atualiza o status (e pode
responder). Registrar o pedido — em vez de apagar na hora — respeita a
retencao de prontuario e deixa a trilha do atendimento a solicitacao, uma
exigencia de transparencia da LGPD. A exclusao efetiva continua sendo uma
decisao humana da clinica, ponderando as obrigacoes legais de guarda.
"""

from django.conf import settings
from django.db import models


class SolicitacaoPrivacidade(models.Model):
    """Pedido de um titular sobre os proprios dados (correcao ou exclusao)."""

    TIPO_CORRECAO = 'correcao'
    TIPO_EXCLUSAO = 'exclusao'
    TIPO_CHOICES = [
        (TIPO_CORRECAO, 'Correcao de dados'),
        (TIPO_EXCLUSAO, 'Exclusao / anonimizacao'),
    ]

    STATUS_PENDENTE = 'pendente'
    STATUS_EM_ANDAMENTO = 'em_andamento'
    STATUS_CONCLUIDA = 'concluida'
    STATUS_RECUSADA = 'recusada'
    STATUS_CHOICES = [
        (STATUS_PENDENTE, 'Pendente'),
        (STATUS_EM_ANDAMENTO, 'Em andamento'),
        (STATUS_CONCLUIDA, 'Concluida'),
        (STATUS_RECUSADA, 'Recusada'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solicitacoes_privacidade',
        verbose_name='Titular',
    )
    tipo = models.CharField('Tipo', max_length=20, choices=TIPO_CHOICES)
    mensagem = models.TextField(
        'Mensagem',
        help_text='O que deve ser corrigido, ou o motivo do pedido de exclusao.',
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDENTE,
    )
    resposta = models.TextField('Resposta da clinica', blank=True)
    criada_em = models.DateTimeField('Criada em', auto_now_add=True)
    atualizada_em = models.DateTimeField('Atualizada em', auto_now=True)

    class Meta:
        ordering = ['-criada_em', '-id']
        verbose_name = 'Solicitacao de privacidade'
        verbose_name_plural = 'Solicitacoes de privacidade'

    def __str__(self):
        return (
            f'{self.get_tipo_display()} de {self.usuario} '
            f'({self.get_status_display()})'
        )
