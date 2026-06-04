"""Testes da API pública de especialidades (PROJ-24)."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Medica, PerfilUsuario

from .models import Especialidade


class EspecialidadesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Uma médica para vincular a uma especialidade.
        User = get_user_model()
        usuario = User.objects.create_user(username='dra_helena', password='x')
        perfil = PerfilUsuario.objects.create(
            usuario=usuario,
            tipo_usuario=PerfilUsuario.TIPO_MEDICA,
            nome_completo='Dra. Helena Costa',
        )
        self.medica = Medica.objects.create(perfil=perfil)

        self.reproducao = Especialidade.objects.create(
            nome='Reprodução humana',
            descricao='Acompanhamento de fertilidade.',
        )
        self.reproducao.medicas.add(self.medica)

        # Especialidade ativa sem médicas relacionadas.
        Especialidade.objects.create(
            nome='Psicologia', descricao='Apoio emocional.'
        )

        # Especialidade inativa não deve aparecer na listagem pública.
        Especialidade.objects.create(
            nome='Especialidade inativa', descricao='...', ativo=False
        )

    def test_lista_especialidades_ativas(self):
        resp = self.client.get('/api/especialidades/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        nomes = {e['nome'] for e in resp.data}
        self.assertIn('Reprodução humana', nomes)
        self.assertIn('Psicologia', nomes)
        self.assertNotIn('Especialidade inativa', nomes)

    def test_lista_publica_sem_autenticacao(self):
        resp = self.client.get('/api/especialidades/')
        self.assertEqual(resp.status_code, 200)

    def test_inclui_medicas_relacionadas(self):
        resp = self.client.get('/api/especialidades/')
        reproducao = next(
            e for e in resp.data if e['nome'] == 'Reprodução humana'
        )
        self.assertEqual(len(reproducao['medicas']), 1)
        self.assertEqual(reproducao['medicas'][0]['nome'], 'Dra. Helena Costa')

    def test_especialidade_sem_medicas_tem_lista_vazia(self):
        resp = self.client.get('/api/especialidades/')
        psicologia = next(e for e in resp.data if e['nome'] == 'Psicologia')
        self.assertEqual(psicologia['medicas'], [])

    def test_lista_vazia_quando_nao_ha_especialidades(self):
        Especialidade.objects.all().delete()
        resp = self.client.get('/api/especialidades/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)
