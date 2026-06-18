"""Testes da API pública de conteúdos de apoio emocional (PROJ-22)."""

from django.test import TestCase
from rest_framework.test import APIClient

from .models import ConteudoApoio


class ApoioAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        ConteudoApoio.objects.create(
            titulo='Respire', texto='Um dia de cada vez.',
            categoria='Ansiedade', ordem=1,
        )
        ConteudoApoio.objects.create(
            titulo='A espera', texto='É natural oscilar.',
            categoria='Espera', ordem=2,
        )
        # Não publicado: não deve aparecer na listagem.
        ConteudoApoio.objects.create(
            titulo='Rascunho', texto='...', categoria='Ansiedade',
            publicado=False, ordem=3,
        )

    def test_lista_apenas_publicados(self):
        resp = self.client.get('/api/apoio/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        self.assertEqual({c['titulo'] for c in resp.data}, {'Respire', 'A espera'})

    def test_publico_sem_autenticacao(self):
        resp = self.client.get('/api/apoio/')
        self.assertEqual(resp.status_code, 200)

    def test_filtra_por_categoria(self):
        resp = self.client.get('/api/apoio/', {'categoria': 'Espera'})
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['titulo'], 'A espera')

    def test_lista_vazia(self):
        ConteudoApoio.objects.all().delete()
        resp = self.client.get('/api/apoio/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)


class ApoioDetalheAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.publicado = ConteudoApoio.objects.create(
            titulo='Respire', texto='Um dia de cada vez.',
            categoria='Ansiedade', ordem=1,
        )
        self.rascunho = ConteudoApoio.objects.create(
            titulo='Rascunho', texto='...', categoria='Ansiedade',
            publicado=False, ordem=2,
        )

    def test_detalha_conteudo_publicado(self):
        resp = self.client.get(f'/api/apoio/{self.publicado.pk}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['titulo'], 'Respire')
        self.assertEqual(resp.data['texto'], 'Um dia de cada vez.')
        self.assertEqual(resp.data['categoria'], 'Ansiedade')

    def test_detalhe_publico_sem_autenticacao(self):
        resp = self.client.get(f'/api/apoio/{self.publicado.pk}/')
        self.assertEqual(resp.status_code, 200)

    def test_rascunho_nao_e_detalhado(self):
        resp = self.client.get(f'/api/apoio/{self.rascunho.pk}/')
        self.assertEqual(resp.status_code, 404)

    def test_inexistente_retorna_404(self):
        resp = self.client.get('/api/apoio/9999/')
        self.assertEqual(resp.status_code, 404)
