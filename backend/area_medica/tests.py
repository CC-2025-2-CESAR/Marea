"""Testes da área da médica: escopo por objeto e poderes de escrita.

Cobrem acesso permitido E negado, que é o ponto sensível de LGPD: a médica só
pode enxergar/alterar as pacientes vinculadas a ela; pacientes são barradas.
"""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from consultas.models import Consulta
from medicamentos.models import Medicamento
from usuarios.models import Medica, Paciente, PerfilUsuario

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

    # --- leitura com escopo ---

    def test_medica_lista_apenas_suas_pacientes(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get('/api/medica/pacientes/')
        self.assertEqual(resp.status_code, 200)
        ids = [p['id'] for p in resp.data]
        self.assertIn(self.pac_a.id, ids)
        self.assertNotIn(self.pac_b.id, ids)

    def test_medica_acessa_detalhe_da_sua_paciente(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get(f'/api/medica/pacientes/{self.pac_a.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['id'], self.pac_a.id)

    def test_medica_nao_acessa_paciente_de_outra(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.get(f'/api/medica/pacientes/{self.pac_b.id}/')
        self.assertEqual(resp.status_code, 404)

    def test_admin_ve_todas_as_pacientes(self):
        self.client.force_authenticate(self.adm)
        resp = self.client.get('/api/medica/pacientes/')
        self.assertEqual(resp.status_code, 200)
        ids = [p['id'] for p in resp.data]
        self.assertIn(self.pac_a.id, ids)
        self.assertIn(self.pac_b.id, ids)

    # --- escrita com escopo ---

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
        self.assertEqual(resp.status_code, 404)
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
