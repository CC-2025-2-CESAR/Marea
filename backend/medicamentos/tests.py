"""Testes da API de medicamentos da paciente.

Cobre o detalhe owner-only (a paciente só vê os próprios; 404 para os de
outra paciente, inativos ou inexistentes), o acesso negado a quem não é
paciente e o cálculo do status do dia (tomado / atrasado / pendente).
"""

from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Medica, Paciente, PerfilUsuario

from .models import Medicamento


class MedicamentosAPITests(TestCase):
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

        self.medicamento = Medicamento.objects.create(
            paciente=self.paciente1,
            nome='Gonadotrofina',
            dose='225 UI',
            horario=time(20, 0),
            instrucoes='Aplicação subcutânea no fim do dia.',
            armazenamento='Manter refrigerada entre 2°C e 8°C.',
        )
        self.medicamento_outra = Medicamento.objects.create(
            paciente=self.paciente2,
            nome='Progesterona',
            dose='200mg',
        )
        self.medicamento_inativo = Medicamento.objects.create(
            paciente=self.paciente1,
            nome='Medicamento suspenso',
            ativo=False,
        )

    # ----- detalhe (owner-only) -----

    def test_detalhe_exige_autenticacao(self):
        resp = self.client.get(f'/api/medicamentos/{self.medicamento.id}/')
        self.assertIn(resp.status_code, (401, 403))

    def test_paciente_ve_o_proprio_medicamento(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get(f'/api/medicamentos/{self.medicamento.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['nome'], 'Gonadotrofina')
        self.assertEqual(
            resp.data['armazenamento'], 'Manter refrigerada entre 2°C e 8°C.'
        )
        # O detalhe traz o status do dia e o rótulo prontos para exibição.
        self.assertIn('status_dia', resp.data)
        self.assertIn('status_dia_label', resp.data)

    def test_paciente_nao_ve_medicamento_de_outra(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get(
            f'/api/medicamentos/{self.medicamento_outra.id}/'
        )
        self.assertEqual(resp.status_code, 404)

    def test_medicamento_inativo_retorna_404(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get(
            f'/api/medicamentos/{self.medicamento_inativo.id}/'
        )
        self.assertEqual(resp.status_code, 404)

    def test_medicamento_inexistente_retorna_404(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get('/api/medicamentos/99999/')
        self.assertEqual(resp.status_code, 404)

    def test_medica_nao_acessa_detalhe(self):
        self.client.force_authenticate(user=self.medica_user)
        resp = self.client.get(f'/api/medicamentos/{self.medicamento.id}/')
        self.assertEqual(resp.status_code, 404)

    # ----- status do dia -----

    def test_status_pendente_quando_horario_no_futuro(self):
        med = Medicamento(
            paciente=self.paciente1, nome='X', horario=time(20, 0)
        )
        self.assertEqual(
            med.status_do_dia(agora=time(8, 0)), Medicamento.STATUS_PENDENTE
        )

    def test_status_atrasado_quando_horario_ja_passou(self):
        med = Medicamento(
            paciente=self.paciente1, nome='X', horario=time(8, 0)
        )
        self.assertEqual(
            med.status_do_dia(agora=time(20, 0)), Medicamento.STATUS_ATRASADO
        )

    def test_status_pendente_sem_horario_fixo(self):
        med = Medicamento(paciente=self.paciente1, nome='X', horario=None)
        self.assertEqual(
            med.status_do_dia(agora=time(20, 0)), Medicamento.STATUS_PENDENTE
        )

    def test_status_tomado_quando_marcado_hoje(self):
        med = Medicamento.objects.create(
            paciente=self.paciente1, nome='X', horario=time(8, 0)
        )
        med.marcar_tomado(True)
        # Mesmo já tendo passado o horário, conta como tomado.
        self.assertEqual(
            med.status_do_dia(agora=time(20, 0)), Medicamento.STATUS_TOMADO
        )

    def test_marcacao_de_ontem_nao_conta_como_tomado(self):
        med = Medicamento.objects.create(
            paciente=self.paciente1,
            nome='X',
            horario=time(8, 0),
            tomado_hoje=True,
            data_ultima_marcacao=date.today() - timedelta(days=1),
        )
        # Reset implícito: ontem não vale para hoje.
        self.assertFalse(med.esta_tomado_hoje())
        self.assertEqual(
            med.status_do_dia(agora=time(20, 0)), Medicamento.STATUS_ATRASADO
        )
