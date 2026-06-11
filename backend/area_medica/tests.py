"""Testes da área da médica: política de acesso por papel.

A regra mudou em relação ao escopo antigo (cada médica via só as suas): agora
toda médica **vê** as pacientes da clínica, mas só **edita** as suas ou as que
assumiu. Os testes cobrem acesso permitido E negado — o ponto sensível de LGPD —
além do status de permissão exposto para a interface.
"""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from consultas.models import Consulta
from medicamentos.models import Medicamento
from usuarios.models import (
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


class AreaMedicaTests(APITestCase):
    def setUp(self):
        self.m1 = _criar_medica('med1')
        self.m2 = _criar_medica('med2')
        self.pac_a = _criar_paciente('pac_a', medica=self.m1)
        self.pac_b = _criar_paciente('pac_b', medica=self.m2)
        adm = User.objects.create_user(
            username='adm', password='x', is_superuser=True, is_staff=True
        )
        PerfilUsuario.objects.create(
            usuario=adm,
            tipo_usuario=PerfilUsuario.TIPO_ADMIN,
            nome_completo='Admin',
        )
        self.adm = adm

    # --- leitura: toda médica vê todas as pacientes da clínica ---

    def test_medica_lista_todas_as_pacientes_da_clinica(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get('/api/medica/pacientes/')
        self.assertEqual(resp.status_code, 200)
        ids = [p['id'] for p in resp.data]
        self.assertIn(self.pac_a.id, ids)
        self.assertIn(self.pac_b.id, ids)

    def test_medica_acessa_detalhe_da_sua_paciente(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get(f'/api/medica/pacientes/{self.pac_a.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['id'], self.pac_a.id)

    def test_medica_ve_detalhe_de_paciente_de_outra(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get(f'/api/medica/pacientes/{self.pac_b.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['id'], self.pac_b.id)

    def test_admin_ve_todas_as_pacientes(self):
        self.client.force_authenticate(self.adm)
        resp = self.client.get('/api/medica/pacientes/')
        self.assertEqual(resp.status_code, 200)
        ids = [p['id'] for p in resp.data]
        self.assertIn(self.pac_a.id, ids)
        self.assertIn(self.pac_b.id, ids)

    # --- escrita: só responsável, quem assumiu, ou admin ---

    def test_medica_cria_consulta_para_sua_paciente(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_a.id}/consultas/',
            {'data_horario': '2026-07-01T10:00:00Z', 'local': 'Clínica'},
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        consulta = Consulta.objects.get(id=resp.data['id'])
        self.assertEqual(consulta.paciente_id, self.pac_a.id)
        self.assertEqual(consulta.medica_id, self.m1.id)

    def test_medica_nao_cria_consulta_para_paciente_de_outra(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/consultas/',
            {'data_horario': '2026-07-01T10:00:00Z'},
            format='json',
        )
        self.assertEqual(resp.status_code, 403)
        self.assertFalse(Consulta.objects.filter(paciente=self.pac_b).exists())

    def test_medica_cria_medicamento_para_sua_paciente(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_a.id}/medicamentos/',
            {'nome': 'Progesterona', 'dose': '200mg'},
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(
            Medicamento.objects.filter(
                paciente=self.pac_a, nome='Progesterona'
            ).exists()
        )

    def test_medica_nao_cria_medicamento_para_paciente_de_outra(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/medicamentos/',
            {'nome': 'Progesterona', 'dose': '200mg'},
            format='json',
        )
        self.assertEqual(resp.status_code, 403)
        self.assertFalse(
            Medicamento.objects.filter(paciente=self.pac_b).exists()
        )

    # --- escrita após assumir o atendimento (vínculo de equipe ativo) ---

    def test_medica_que_assumiu_o_atendimento_pode_escrever(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.pac_b,
            medica=self.m1,
            papel=EquipeCuidadoPaciente.PAPEL_SUBSTITUTA,
            ativa=True,
        )
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/consultas/',
            {'data_horario': '2026-07-01T10:00:00Z', 'local': 'Clínica'},
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Consulta.objects.filter(paciente=self.pac_b).exists())

    def test_vinculo_inativo_nao_da_escrita(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.pac_b,
            medica=self.m1,
            papel=EquipeCuidadoPaciente.PAPEL_SUBSTITUTA,
            ativa=False,
        )
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/medicamentos/',
            {'nome': 'Progesterona'},
            format='json',
        )
        self.assertEqual(resp.status_code, 403)
        self.assertFalse(
            Medicamento.objects.filter(paciente=self.pac_b).exists()
        )

    # --- status de permissão exposto para a interface ---

    def test_detalhe_marca_responsavel_para_a_propria(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get(f'/api/medica/pacientes/{self.pac_a.id}/')
        self.assertEqual(resp.data['permissao']['papel'], 'responsavel')
        self.assertTrue(resp.data['permissao']['pode_editar'])

    def test_detalhe_marca_visualizacao_para_paciente_de_outra(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get(f'/api/medica/pacientes/{self.pac_b.id}/')
        self.assertEqual(resp.data['permissao']['papel'], 'visualizacao')
        self.assertFalse(resp.data['permissao']['pode_editar'])

    def test_detalhe_marca_assumido_apos_vinculo_ativo(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.pac_b, medica=self.m1, ativa=True
        )
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get(f'/api/medica/pacientes/{self.pac_b.id}/')
        self.assertEqual(resp.data['permissao']['papel'], 'assumido')
        self.assertTrue(resp.data['permissao']['pode_editar'])

    def test_lista_traz_pode_editar_por_paciente(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get('/api/medica/pacientes/')
        por_id = {p['id']: p['permissao'] for p in resp.data}
        self.assertTrue(por_id[self.pac_a.id]['pode_editar'])
        self.assertFalse(por_id[self.pac_b.id]['pode_editar'])

    # --- acesso negado ---

    def test_paciente_e_bloqueada(self):
        self.client.force_authenticate(self.pac_a.perfil.usuario)
        self.assertEqual(
            self.client.get('/api/medica/pacientes/').status_code, 403
        )
        self.assertEqual(
            self.client.get(
                f'/api/medica/pacientes/{self.pac_a.id}/'
            ).status_code,
            403,
        )

    def test_anonimo_e_bloqueado(self):
        self.assertEqual(
            self.client.get('/api/medica/pacientes/').status_code, 401
        )
