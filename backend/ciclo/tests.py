"""Testes da API de ciclo menstrual (PROJ-5 registro, PROJ-6 previsões).

Cobre o escopo por dono (a paciente só vê/cria/edita/exclui os próprios), o
acesso negado a quem não é paciente, e o cálculo das previsões a partir dos
inícios de menstruação (incluindo a falta de dados e o fato de ignorar outras
etapas).
"""

from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Medica, Paciente, PerfilUsuario

from .models import RegistroCiclo


class CicloAPITests(TestCase):
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

        # Uma médica, para testar o acesso negado à área da paciente.
        um = User.objects.create_user(username='dra', password='x')
        pm = PerfilUsuario.objects.create(
            usuario=um,
            tipo_usuario=PerfilUsuario.TIPO_MEDICA,
            nome_completo='Dra. Helena',
        )
        Medica.objects.create(perfil=pm)
        self.medica_user = um

        # paciente1 começa com 1 início de menstruação (insuficiente p/ prever).
        RegistroCiclo.objects.create(
            paciente=self.paciente1,
            data=date(2026, 5, 1),
            etapa=RegistroCiclo.ETAPA_MENSTRUACAO,
            observacoes='Início do período.',
        )
        RegistroCiclo.objects.create(
            paciente=self.paciente2,
            data=date(2026, 5, 3),
            etapa=RegistroCiclo.ETAPA_OVULACAO,
            observacoes='Registro de outra paciente.',
        )

    def test_exige_autenticacao(self):
        resp = self.client.get('/api/ciclo/registros/')
        self.assertIn(resp.status_code, (401, 403))

    def test_paciente_ve_apenas_os_proprios(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get('/api/ciclo/registros/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['etapa'], RegistroCiclo.ETAPA_MENSTRUACAO)
        self.assertEqual(resp.data[0]['etapa_display'], 'Menstruação')

    def test_medica_nao_acessa(self):
        self.client.force_authenticate(user=self.medica_user)
        resp = self.client.get('/api/ciclo/registros/')
        self.assertEqual(resp.status_code, 403)

    def test_paciente_cria_registro(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.post(
            '/api/ciclo/registros/',
            {
                'data': '2026-06-01',
                'etapa': RegistroCiclo.ETAPA_MENSTRUACAO,
                'observacoes': 'Novo ciclo.',
                'status': RegistroCiclo.STATUS_REGISTRADO,
            },
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(
            RegistroCiclo.objects.filter(paciente=self.paciente1).count(), 2
        )

    def test_criacao_ignora_paciente_do_payload(self):
        # Mesmo enviando outra paciente no corpo, o registro fica com a logada.
        self.client.force_authenticate(user=self.u1)
        resp = self.client.post(
            '/api/ciclo/registros/',
            {
                'data': '2026-06-01',
                'etapa': RegistroCiclo.ETAPA_FOLICULAR,
                'observacoes': 'escopo',
                'paciente': self.paciente2.id,
            },
        )
        self.assertEqual(resp.status_code, 201)
        novo = RegistroCiclo.objects.get(observacoes='escopo')
        self.assertEqual(novo.paciente, self.paciente1)

    def test_etapa_invalida_rejeitada(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.post(
            '/api/ciclo/registros/',
            {'data': '2026-06-01', 'etapa': 'inexistente'},
        )
        self.assertEqual(resp.status_code, 400)

    def test_paciente_atualiza_registro(self):
        self.client.force_authenticate(user=self.u1)
        registro = RegistroCiclo.objects.get(paciente=self.paciente1)
        resp = self.client.patch(
            f'/api/ciclo/registros/{registro.id}/',
            {'observacoes': 'Atualizado.', 'status': RegistroCiclo.STATUS_CONCLUIDO},
        )
        self.assertEqual(resp.status_code, 200)
        registro.refresh_from_db()
        self.assertEqual(registro.observacoes, 'Atualizado.')
        self.assertEqual(registro.status, RegistroCiclo.STATUS_CONCLUIDO)

    def test_paciente_exclui_registro(self):
        self.client.force_authenticate(user=self.u1)
        registro = RegistroCiclo.objects.get(paciente=self.paciente1)
        resp = self.client.delete(f'/api/ciclo/registros/{registro.id}/')
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(RegistroCiclo.objects.filter(id=registro.id).exists())

    def test_nao_acessa_registro_de_outra(self):
        self.client.force_authenticate(user=self.u1)
        alheio = RegistroCiclo.objects.get(paciente=self.paciente2)
        self.assertEqual(
            self.client.get(f'/api/ciclo/registros/{alheio.id}/').status_code,
            404,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/ciclo/registros/{alheio.id}/', {'observacoes': 'x'}
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.delete(
                f'/api/ciclo/registros/{alheio.id}/'
            ).status_code,
            404,
        )

    def test_previsao_sem_dados_suficientes(self):
        # paciente1 tem só 1 início de menstruação.
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get('/api/ciclo/previsoes/')
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data['tem_dados'])
        self.assertIn('aviso', resp.data)

    def test_previsao_com_dois_inicios(self):
        self.client.force_authenticate(user=self.u1)
        RegistroCiclo.objects.create(
            paciente=self.paciente1,
            data=date(2026, 5, 29),  # 28 dias após 2026-05-01
            etapa=RegistroCiclo.ETAPA_MENSTRUACAO,
        )
        resp = self.client.get('/api/ciclo/previsoes/')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['tem_dados'])
        self.assertEqual(resp.data['ciclo_medio_dias'], 28)
        # próxima = 2026-05-29 + 28 dias = 2026-06-26
        self.assertEqual(resp.data['proxima_menstruacao'], '2026-06-26')
        self.assertIn('janela_fertil_inicio', resp.data)

    def test_previsao_ignora_outras_etapas(self):
        # Etapas não-menstruação não contam como início de ciclo.
        self.client.force_authenticate(user=self.u1)
        RegistroCiclo.objects.create(
            paciente=self.paciente1,
            data=date(2026, 5, 10),
            etapa=RegistroCiclo.ETAPA_OVULACAO,
        )
        RegistroCiclo.objects.create(
            paciente=self.paciente1,
            data=date(2026, 5, 20),
            etapa=RegistroCiclo.ETAPA_LUTEA,
        )
        resp = self.client.get('/api/ciclo/previsoes/')
        # Ainda só 1 menstruação => insuficiente.
        self.assertFalse(resp.data['tem_dados'])
