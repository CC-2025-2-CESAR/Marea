from django.db import models


class TermoDicionario(models.Model):
    termo = models.CharField('Termo', max_length=120, unique=True)
    definicao = models.TextField('Definição')
    categoria = models.CharField('Categoria', max_length=80, blank=True)
    exemplo = models.TextField('Exemplo de uso', blank=True)
    ativo = models.BooleanField('Ativo', default=True)
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        ordering = ['termo']
        verbose_name = 'Termo do dicionário'
        verbose_name_plural = 'Termos do dicionário'

    def __str__(self):
        return self.termo
