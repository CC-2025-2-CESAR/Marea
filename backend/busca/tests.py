"""Testes da busca global (PROJ-25).

A busca atravessa quatro fontes públicas (dicionário, tratamentos, orientações
e especialidades) e devolve uma lista de resultados, cada um marcado com o seu
`tipo`. Como o conteúdo é público, o endpoint é `AllowAny` — os testes não se
autenticam. O token de busca é ASCII de propósito: o `icontains` é sensível a
acento (como nas demais listagens), então buscar por acento foge ao escopo.
"""

from django.test import TestCase
from rest_framework.test import APIClient

from consultas.models import Especialidade
from dicionario.models import TermoDicionario
from tratamentos.models import OrientacaoTratamento, Tratamento


class BuscaGlobalAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Quatro itens que casam com o token comum "fertil", em fontes
        # diferentes (no nome, na descrição, no título ou no conteúdo).
        self.termo = TermoDicionario.objects.create(
            termo='Fertilidade',
            definicao='Capacidade de engravidar.',
        )
        self.tratamento = Tratamento.objects.create(
            nome='Tratamento de fertilidade',
            descricao='Conjunto de cuidados para ajudar a engravidar.',
        )
        self.orientacao = OrientacaoTratamento.objects.create(
            titulo='Dicas de fertilidade',
            conteudo='Hábitos que favorecem a saúde reprodutiva.',
        )
        self.especialidade = Especialidade.objects.create(
            nome='Saúde reprodutiva',
            descricao='Cuida da fertilidade do casal.',
        )
        # Conteúdo inativo nunca deve aparecer, mesmo casando com o token.
        TermoDicionario.objects.create(
            termo='Fertilidade inativa',
            definicao='não deve aparecer',
            ativo=False,
        )

    def test_busca_vazia_retorna_lista_vazia(self):
        resp = self.client.get('/api/busca/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])

    def test_busca_curta_retorna_lista_vazia(self):
        # Uma letra só está abaixo do mínimo: não consulta nada.
        resp = self.client.get('/api/busca/', {'q': 'f'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])

    def test_busca_sem_autenticacao_funciona(self):
        # Sem token de sessão: ainda assim 200 (conteúdo público).
        resp = self.client.get('/api/busca/', {'q': 'fertil'})
        self.assertEqual(resp.status_code, 200)

    def test_busca_atravessa_os_quatro_tipos(self):
        resp = self.client.get('/api/busca/', {'q': 'fertil'})
        self.assertEqual(resp.status_code, 200)
        tipos = sorted(item['tipo'] for item in resp.data)
        self.assertEqual(
            tipos, ['especialidade', 'orientacao', 'termo', 'tratamento']
        )

    def test_item_tem_o_formato_esperado(self):
        resp = self.client.get('/api/busca/', {'q': 'fertil'})
        termo = next(i for i in resp.data if i['tipo'] == 'termo')
        self.assertEqual(
            set(termo.keys()),
            {'tipo', 'tipo_label', 'id', 'titulo', 'descricao', 'url'},
        )
        self.assertEqual(termo['tipo_label'], 'Dicionário')
        self.assertEqual(termo['titulo'], 'Fertilidade')

    def test_url_do_termo_aponta_para_o_dicionario(self):
        resp = self.client.get('/api/busca/', {'q': 'fertil'})
        termo = next(i for i in resp.data if i['tipo'] == 'termo')
        self.assertTrue(termo['url'].startswith('/dicionario?busca='))

    def test_conteudo_inativo_nao_aparece(self):
        resp = self.client.get('/api/busca/', {'q': 'fertil'})
        titulos = [item['titulo'] for item in resp.data]
        self.assertIn('Fertilidade', titulos)
        self.assertNotIn('Fertilidade inativa', titulos)

    def test_busca_sem_resultados_retorna_lista_vazia(self):
        resp = self.client.get('/api/busca/', {'q': 'zzzznaoexiste'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])
