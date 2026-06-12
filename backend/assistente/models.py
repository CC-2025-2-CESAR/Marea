"""Modelos do Assistente Amare: respostas guiadas sobre o conteúdo da Amare.

O assistente nunca diagnostica nem ajusta doses — apenas devolve conteúdo de
referência já curado (editável no Django Admin pela clínica) e encaminha para a
equipe em temas sensíveis. Não há serviço externo: a classificação é por
palavra-chave sobre as respostas cadastradas aqui.
"""

from django.db import models


class RespostaAssistente(models.Model):
    """Uma resposta curada do assistente, acionada por palavras-chave."""

    intencao = models.CharField('Intenção', max_length=60, unique=True)
    pergunta_exemplo = models.CharField('Pergunta de exemplo', max_length=160)
    palavras_chave = models.TextField(
        'Palavras-chave',
        help_text=(
            'Separadas por vírgula ou espaço; usadas para casar a pergunta '
            '(sem distinção de acento ou maiúsculas).'
        ),
    )
    resposta = models.TextField('Resposta')
    categoria = models.CharField('Categoria', max_length=60, blank=True)
    fonte_rotulo = models.CharField('Rótulo da fonte', max_length=120, blank=True)
    fonte_rota = models.CharField('Rota da fonte', max_length=120, blank=True)
    sensivel = models.BooleanField(
        'Tema sensível',
        default=False,
        help_text='Se marcada, a resposta reforça o encaminhamento à clínica.',
    )
    prioridade = models.PositiveIntegerField(
        'Prioridade', default=0, help_text='Desempata quando mais de uma casa.'
    )
    ativo = models.BooleanField('Ativa', default=True)
    criado_em = models.DateTimeField('Criada em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizada em', auto_now=True)

    class Meta:
        ordering = ['-prioridade', 'categoria', 'pergunta_exemplo']
        verbose_name = 'Resposta do assistente'
        verbose_name_plural = 'Respostas do assistente'

    def __str__(self):
        return self.pergunta_exemplo


class AcaoAssistente(models.Model):
    """Um atalho (CTA) que a resposta oferece — leva a uma rota do app."""

    resposta = models.ForeignKey(
        RespostaAssistente,
        on_delete=models.CASCADE,
        related_name='acoes',
        verbose_name='Resposta',
    )
    rotulo = models.CharField('Rótulo', max_length=80)
    rota = models.CharField('Rota no app', max_length=120)
    ordem = models.PositiveIntegerField('Ordem', default=0)

    class Meta:
        ordering = ['ordem', 'id']
        verbose_name = 'Ação do assistente'
        verbose_name_plural = 'Ações do assistente'

    def __str__(self):
        return f'{self.rotulo} -> {self.rota}'
