"""Testes da API pública de tratamentos e orientações."""

from django.test import TestCase
from rest_framework.test import APIClient

from .models import EtapaTratamento, OrientacaoTratamento, Tratamento


class TratamentosAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.fiv = Tratamento.objects.create(
            nome='Fertilização in vitro (FIV)',
            descricao='Une óvulo e espermatozoide em laboratório.',
            indicacao='Indicada em casos variados de infertilidade.',
            ordem=1,
        )
        EtapaTratamento.objects.create(
            tratamento=self.fiv, titulo='Estimulação ovariana', ordem=1
        )
        EtapaTratamento.objects.create(
            tratamento=self.fiv, titulo='Transferência embrionária', ordem=2
        )
        # Tratamento inativo não deve aparecer na listagem pública.
        Tratamento.objects.create(
            nome='Tratamento inativo', descricao='...', ativo=False
        )

    def test_lista_tratamentos_ativos_com_etapas(self):
        resp = self.client.get('/api/tratamentos/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        item = resp.data[0]
        self.assertEqual(item['nome'], 'Fertilização in vitro (FIV)')
        self.assertEqual(len(item['etapas']), 2)
        self.assertEqual(item['etapas'][0]['titulo'], 'Estimulação ovariana')

    def test_lista_publica_sem_autenticacao(self):
        # Sem token: ainda assim 200 (conteúdo de referência é público).
        resp = self.client.get('/api/tratamentos/')
        self.assertEqual(resp.status_code, 200)

    def test_busca_filtra_por_texto(self):
        resp = self.client.get('/api/tratamentos/', {'busca': 'vitro'})
        self.assertEqual(len(resp.data), 1)
        vazio = self.client.get('/api/tratamentos/', {'busca': 'zzzznada'})
        self.assertEqual(len(vazio.data), 0)

    def test_detalhe_tratamento(self):
        resp = self.client.get(f'/api/tratamentos/{self.fiv.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['nome'], 'Fertilização in vitro (FIV)')
        self.assertEqual(len(resp.data['etapas']), 2)

    def test_detalhe_inexistente_404(self):
        resp = self.client.get('/api/tratamentos/9999/')
        self.assertEqual(resp.status_code, 404)


class OrientacoesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.fiv = Tratamento.objects.create(
            nome='FIV', descricao='...', ordem=1
        )
        self.etapa = EtapaTratamento.objects.create(
            tratamento=self.fiv, titulo='Coleta de óvulos', ordem=1
        )
        OrientacaoTratamento.objects.create(
            titulo='Como se preparar para a coleta',
            conteudo='Siga o jejum conforme a orientação da equipe.',
            categoria='Procedimentos',
            tratamento=self.fiv,
            etapa=self.etapa,
        )
        OrientacaoTratamento.objects.create(
            titulo='Lidando com a ansiedade da espera',
            conteudo='Respire fundo e busque apoio quando precisar.',
            categoria='Apoio emocional',
        )
        OrientacaoTratamento.objects.create(
            titulo='Orientação inativa',
            conteudo='...',
            categoria='Procedimentos',
            ativo=False,
        )

    def test_lista_orientacoes_ativas(self):
        resp = self.client.get('/api/orientacoes/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)

    def test_filtra_por_categoria(self):
        resp = self.client.get(
            '/api/orientacoes/', {'categoria': 'Apoio emocional'}
        )
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(
            resp.data[0]['titulo'], 'Lidando com a ansiedade da espera'
        )

    def test_inclui_nomes_relacionados(self):
        resp = self.client.get('/api/orientacoes/', {'categoria': 'Procedimentos'})
        self.assertEqual(len(resp.data), 1)
        item = resp.data[0]
        self.assertEqual(item['tratamento_nome'], 'FIV')
        self.assertEqual(item['etapa_titulo'], 'Coleta de óvulos')

    def test_lista_vazia_quando_nao_ha_orientacoes(self):
        OrientacaoTratamento.objects.all().delete()
        resp = self.client.get('/api/orientacoes/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)
