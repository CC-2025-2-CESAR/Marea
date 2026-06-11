"""Testes de controle de acesso por papel da app usuarios."""

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import (
    EquipeCuidadoPaciente,
    Medica,
    Paciente,
    PerfilUsuario,
)

User = get_user_model()


def _criar_medica(username):
    user = User.objects.create_user(username=username, password='x')
    perfil = PerfilUsuario.objects.create(
        usuario=user,
        tipo_usuario=PerfilUsuario.TIPO_MEDICA,
        nome_completo=username,
    )
    return Medica.objects.create(perfil=perfil)


def _criar_paciente(username, medica=None):
    user = User.objects.create_user(username=username, password='x')
    perfil = PerfilUsuario.objects.create(
        usuario=user,
        tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
        nome_completo=username,
    )
    return Paciente.objects.create(perfil=perfil, medica_responsavel=medica)


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


class EquipeCuidadoPacienteModelTests(TestCase):
    """Regras do vínculo de equipe: ativo por padrão e único por par."""

    def setUp(self):
        self.medica = _criar_medica('med_eq')
        self.outra = _criar_medica('med_eq2')
        self.paciente = _criar_paciente('pac_eq')

    def test_cria_vinculo_ativo_por_padrao(self):
        vinculo = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente,
            medica=self.medica,
            papel=EquipeCuidadoPaciente.PAPEL_SUBSTITUTA,
        )
        self.assertTrue(vinculo.ativa)
        self.assertEqual(vinculo.papel, 'substituta')

    def test_um_unico_vinculo_ativo_por_par(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                EquipeCuidadoPaciente.objects.create(
                    paciente=self.paciente, medica=self.medica
                )

    def test_permite_novo_vinculo_apos_encerrar(self):
        antigo = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica, ativa=False
        )
        novo = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica, ativa=True
        )
        self.assertNotEqual(antigo.id, novo.id)

    def test_vinculos_de_medicas_diferentes_coexistem(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica
        )
        vinculo2 = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.outra
        )
        self.assertTrue(vinculo2.ativa)
