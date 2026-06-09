from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Paciente, PerfilUsuario

from .models import RegistroCiclo


class CicloAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        User = get_user_model()

        user = User.objects.create_user(
            username='paciente',
            password='123456'
        )

        perfil = PerfilUsuario.objects.create(
            usuario=user,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Paciente Teste',
        )

        self.paciente = Paciente.objects.create(
            perfil=perfil
        )

        self.user = user

    def test_exige_autenticacao(self):
        response = self.client.get('/api/ciclo/')
        self.assertIn(response.status_code, [401, 403])

    def test_listar_registros(self):
        self.client.force_authenticate(user=self.user)

        RegistroCiclo.objects.create(
            paciente=self.paciente,
            data=date.today(),
            etapa_ciclo='Menstruação',
            observacoes='Teste',
        )

        response = self.client.get('/api/ciclo/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_criar_registro(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            '/api/ciclo/',
            {
                'data': '2026-06-01',
                'etapa_ciclo': 'Menstruação',
                'observacoes': 'Novo registro',
            },
            format='json'
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            RegistroCiclo.objects.count(),
            1
        )

    def test_atualizar_registro(self):
        self.client.force_authenticate(user=self.user)

        registro = RegistroCiclo.objects.create(
            paciente=self.paciente,
            data=date.today(),
            etapa_ciclo='Menstruação',
            observacoes='Original',
        )

        response = self.client.patch(
            f'/api/ciclo/{registro.id}/',
            {
                'observacoes': 'Atualizado'
            },
            format='json'
        )

        self.assertEqual(response.status_code, 200)

        registro.refresh_from_db()

        self.assertEqual(
            registro.observacoes,
            'Atualizado'
        )

    def test_previsao_ciclo(self):
        self.client.force_authenticate(user=self.user)

        RegistroCiclo.objects.create(
            paciente=self.paciente,
            data=date.today(),
            etapa_ciclo='Menstruação',
        )

        response = self.client.get(
            '/api/ciclo/previsao/'
        )

        self.assertEqual(response.status_code, 200)

        self.assertIn(
            'fase_atual',
            response.data
        )

        self.assertIn(
            'proxima_menstruacao',
            response.data
        )