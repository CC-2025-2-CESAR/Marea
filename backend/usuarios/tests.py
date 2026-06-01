"""Testes de controle de acesso por papel da app usuarios."""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Medica, Paciente, PerfilUsuario


class PerfilPermissaoTests(APITestCase):
    """Garante que /api/perfil/ é exclusivo de pacientes."""

    def setUp(self):
        User = get_user_model()

        self.paciente_user = User.objects.create_user(
            'paciente_x', password='senha-de-teste'
        )
        perfil_paciente = PerfilUsuario.objects.create(
            usuario=self.paciente_user,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Paciente X',
        )
        Paciente.objects.create(perfil=perfil_paciente)

        self.medica_user = User.objects.create_user(
            'medica_x', password='senha-de-teste'
        )
        perfil_medica = PerfilUsuario.objects.create(
            usuario=self.medica_user,
            tipo_usuario=PerfilUsuario.TIPO_MEDICA,
            nome_completo='Dra. X',
        )
        Medica.objects.create(perfil=perfil_medica)

    def test_paciente_acessa_o_proprio_perfil(self):
        self.client.force_authenticate(self.paciente_user)
        resposta = self.client.get('/api/perfil/')
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['tipo_usuario'], 'paciente')

    def test_medica_e_bloqueada_no_perfil_da_paciente(self):
        self.client.force_authenticate(self.medica_user)
        resposta = self.client.get('/api/perfil/')
        self.assertEqual(resposta.status_code, 403)

    def test_anonimo_recebe_401(self):
        resposta = self.client.get('/api/perfil/')
        self.assertEqual(resposta.status_code, 401)

    def test_medica_nao_vira_paciente_ao_acessar_perfil(self):
        """A view antiga criava um Paciente para qualquer usuário. Agora não."""
        self.client.force_authenticate(self.medica_user)
        self.client.get('/api/perfil/')
        self.assertFalse(
            Paciente.objects.filter(perfil__usuario=self.medica_user).exists()
        )
