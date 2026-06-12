"""Testes da área da médica: política de acesso por papel.

A regra mudou em relação ao escopo antigo (cada médica via só as suas): agora
toda médica **vê** as pacientes da clínica, mas só **edita** as suas ou as que
assumiu. Os testes cobrem acesso permitido E negado — o ponto sensível de LGPD —
além do status de permissão exposto para a interface.
"""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from auditoria.models import LogAtividade
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

    # --- assumir atendimento: cria vínculo + grava log + libera escrita ---

    def test_medica_assume_atendimento_de_paciente_de_outra(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'plantao'},
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['permissao']['papel'], 'assumido')
        self.assertTrue(resp.data['permissao']['pode_editar'])
        self.assertTrue(
            EquipeCuidadoPaciente.objects.filter(
                paciente=self.pac_b, medica=self.m1, ativa=True
            ).exists()
        )
        self.assertTrue(
            LogAtividade.objects.filter(
                usuario=self.m1.perfil.usuario,
                acao=LogAtividade.ACAO_ASSUMIR_ATENDIMENTO,
                paciente=self.pac_b,
            ).exists()
        )

    def test_assumir_grava_motivo_no_log(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'outro', 'observacao': 'Paciente passou mal na recepção'},
            format='json',
        )
        log = LogAtividade.objects.get(
            acao=LogAtividade.ACAO_ASSUMIR_ATENDIMENTO, paciente=self.pac_b
        )
        self.assertIn('Paciente passou mal na recepção', log.motivo)

    def test_assumir_depois_permite_escrever(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'cobertura_agenda'},
            format='json',
        )
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/medicamentos/',
            {'nome': 'Estradiol', 'dose': '2mg'},
            format='json',
        )
        self.assertEqual(resp.status_code, 201)

    def test_assumir_e_idempotente(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        url = f'/api/medica/pacientes/{self.pac_b.id}/assumir/'
        self.client.post(url, {'motivo': 'plantao'}, format='json')
        resp = self.client.post(url, {'motivo': 'plantao'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['vinculo']['ja_estava_ativo'])
        self.assertEqual(
            EquipeCuidadoPaciente.objects.filter(
                paciente=self.pac_b, medica=self.m1, ativa=True
            ).count(),
            1,
        )

    def test_assumir_compartilhada_marca_colaboradora(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'consulta_compartilhada'},
            format='json',
        )
        vinculo = EquipeCuidadoPaciente.objects.get(
            paciente=self.pac_b, medica=self.m1, ativa=True
        )
        self.assertEqual(
            vinculo.papel, EquipeCuidadoPaciente.PAPEL_COLABORADORA
        )

    # --- assumir atendimento: validação e acesso negado ---

    def test_assumir_outro_sem_observacao_falha(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'outro'},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(
            EquipeCuidadoPaciente.objects.filter(
                paciente=self.pac_b, medica=self.m1
            ).exists()
        )

    def test_assumir_motivo_invalido_falha(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'porque_sim'},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)

    def test_responsavel_nao_precisa_assumir(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_a.id}/assumir/',
            {'motivo': 'plantao'},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(
            EquipeCuidadoPaciente.objects.filter(paciente=self.pac_a).exists()
        )

    def test_admin_nao_assume_pois_ja_edita(self):
        self.client.force_authenticate(self.adm)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_a.id}/assumir/',
            {'motivo': 'plantao'},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)

    def test_paciente_nao_pode_assumir(self):
        self.client.force_authenticate(self.pac_a.perfil.usuario)
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'plantao'},
            format='json',
        )
        self.assertEqual(resp.status_code, 403)

    def test_anonimo_nao_pode_assumir(self):
        resp = self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/assumir/',
            {'motivo': 'plantao'},
            format='json',
        )
        self.assertEqual(resp.status_code, 401)

    def test_assumir_paciente_inexistente_404(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        resp = self.client.post(
            '/api/medica/pacientes/99999/assumir/',
            {'motivo': 'plantao'},
            format='json',
        )
        self.assertEqual(resp.status_code, 404)

    # --- trilha de auditoria: visualização e edição sensíveis ---

    def test_ver_paciente_de_outra_gera_log(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        self.client.get(f'/api/medica/pacientes/{self.pac_b.id}/')
        self.assertTrue(
            LogAtividade.objects.filter(
                usuario=self.m1.perfil.usuario,
                acao=LogAtividade.ACAO_VISUALIZAR_PACIENTE,
                paciente=self.pac_b,
            ).exists()
        )

    def test_ver_propria_paciente_nao_gera_log(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        self.client.get(f'/api/medica/pacientes/{self.pac_a.id}/')
        self.assertFalse(
            LogAtividade.objects.filter(
                acao=LogAtividade.ACAO_VISUALIZAR_PACIENTE,
                paciente=self.pac_a,
            ).exists()
        )

    def test_edicao_apos_assumir_gera_log(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.pac_b, medica=self.m1, ativa=True
        )
        self.client.force_authenticate(self.m1.perfil.usuario)
        self.client.post(
            f'/api/medica/pacientes/{self.pac_b.id}/consultas/',
            {'data_horario': '2026-07-01T10:00:00Z', 'local': 'Clínica'},
            format='json',
        )
        self.assertTrue(
            LogAtividade.objects.filter(
                usuario=self.m1.perfil.usuario,
                acao=LogAtividade.ACAO_CRIAR_CONSULTA,
                paciente=self.pac_b,
            ).exists()
        )

    def test_edicao_da_responsavel_nao_gera_log(self):
        self.client.force_authenticate(self.m1.perfil.usuario)
        self.client.post(
            f'/api/medica/pacientes/{self.pac_a.id}/medicamentos/',
            {'nome': 'Progesterona', 'dose': '200mg'},
            format='json',
        )
        self.assertFalse(
            LogAtividade.objects.filter(
                acao=LogAtividade.ACAO_CRIAR_MEDICAMENTO,
                paciente=self.pac_a,
            ).exists()
        )
