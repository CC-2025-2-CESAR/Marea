"""Testes da API de registro de sintomas (PROJ-21) — escrita pela paciente.

Cobre o escopo por dono (a paciente só vê/cria os próprios), o acesso negado a
quem não é paciente e a validação da intensidade.
"""

from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Medica, Paciente, PerfilUsuario

from .models import RegistroSintoma


class SintomasAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()

        u1 = User.objects.create_user(username='renata', password='x')
        p1 = PerfilUsuario.objects.create(
            usuario=u1,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Renata',
        )
        self.paciente1 = Paciente.objects.create(perfil=p1)
        self.u1 = u1

        u2 = User.objects.create_user(username='amanda', password='x')
        p2 = PerfilUsuario.objects.create(
            usuario=u2,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Amanda',
        )
        self.paciente2 = Paciente.objects.create(perfil=p2)

        # Uma médica, para testar acesso negado à área da paciente.
        um = User.objects.create_user(username='dra', password='x')
        pm = PerfilUsuario.objects.create(
            usuario=um,
            tipo_usuario=PerfilUsuario.TIPO_MEDICA,
            nome_completo='Dra. Helena',
        )
        Medica.objects.create(perfil=pm)
        self.medica_user = um

        RegistroSintoma.objects.create(
            paciente=self.paciente1,
            data=date(2026, 6, 1),
            tipo='Inchaço',
            descricao='Leve inchaço no fim do dia.',
            intensidade=2,
        )
        RegistroSintoma.objects.create(
            paciente=self.paciente2,
            data=date(2026, 6, 2),
            tipo='Cólica',
            descricao='Cólica leve.',
            intensidade=3,
        )

    def test_exige_autenticacao(self):
        resp = self.client.get('/api/sintomas/')
        self.assertIn(resp.status_code, (401, 403))

    def test_paciente_ve_apenas_os_proprios(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get('/api/sintomas/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['tipo'], 'Inchaço')

    def test_medica_nao_acessa(self):
        self.client.force_authenticate(user=self.medica_user)
        resp = self.client.get('/api/sintomas/')
        self.assertEqual(resp.status_code, 403)

    def test_paciente_cria_registro(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.post(
            '/api/sintomas/',
            {
                'data': '2026-06-05',
                'tipo': 'Dor de cabeça',
                'descricao': 'Dor leve à tarde.',
                'intensidade': 1,
            },
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(
            RegistroSintoma.objects.filter(paciente=self.paciente1).count(), 2
        )
        novo = RegistroSintoma.objects.get(tipo='Dor de cabeça')
        self.assertEqual(novo.paciente, self.paciente1)

    def test_criacao_ignora_paciente_do_payload(self):
        # Mesmo enviando outra paciente no corpo, o registro fica com a logada.
        self.client.force_authenticate(user=self.u1)
        resp = self.client.post(
            '/api/sintomas/',
            {
                'data': '2026-06-05',
                'tipo': 'Teste de escopo',
                'descricao': 'x',
                'paciente': self.paciente2.id,
            },
        )
        self.assertEqual(resp.status_code, 201)
        novo = RegistroSintoma.objects.get(tipo='Teste de escopo')
        self.assertEqual(novo.paciente, self.paciente1)

    def test_intensidade_invalida_rejeitada(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.post(
            '/api/sintomas/',
            {
                'data': '2026-06-05',
                'tipo': 'X',
                'descricao': 'y',
                'intensidade': 9,
            },
        )
        self.assertEqual(resp.status_code, 400)

    def test_intensidade_opcional(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.post(
            '/api/sintomas/',
            {
                'data': '2026-06-05',
                'tipo': 'Sem intensidade',
                'descricao': 'y',
            },
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIsNone(resp.data['intensidade'])
