"""Testes das APIs de especialidades (PROJ-24) e eventos (PROJ-15)."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from usuarios.models import Medica, Paciente, PerfilUsuario

from .models import Especialidade, EventoTratamento


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
        self.medica = Medica.objects.create(
            perfil=perfil,
            crm='CRM/PE 12345',
            rqe='12206',
            especialidade='Reprodução Assistida',
            bio='Apresentação da médica.',
        )

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
        self.inativa = Especialidade.objects.create(
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

    def test_medica_expoe_crm_rqe_especialidade_e_bio(self):
        resp = self.client.get('/api/especialidades/')
        reproducao = next(
            e for e in resp.data if e['nome'] == 'Reprodução humana'
        )
        medica = reproducao['medicas'][0]
        self.assertEqual(medica['crm'], 'CRM/PE 12345')
        self.assertEqual(medica['rqe'], '12206')
        self.assertEqual(medica['especialidade'], 'Reprodução Assistida')
        self.assertEqual(medica['bio'], 'Apresentação da médica.')

    def test_especialidade_sem_medicas_tem_lista_vazia(self):
        resp = self.client.get('/api/especialidades/')
        psicologia = next(e for e in resp.data if e['nome'] == 'Psicologia')
        self.assertEqual(psicologia['medicas'], [])

    def test_lista_vazia_quando_nao_ha_especialidades(self):
        Especialidade.objects.all().delete()
        resp = self.client.get('/api/especialidades/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)

    def test_detalha_especialidade_ativa(self):
        resp = self.client.get(f'/api/especialidades/{self.reproducao.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['nome'], 'Reprodução humana')
        self.assertEqual(len(resp.data['medicas']), 1)
        self.assertEqual(resp.data['medicas'][0]['nome'], 'Dra. Helena Costa')

    def test_detalhe_publico_sem_autenticacao(self):
        resp = self.client.get(f'/api/especialidades/{self.reproducao.id}/')
        self.assertEqual(resp.status_code, 200)

    def test_detalhe_especialidade_inativa_404(self):
        resp = self.client.get(f'/api/especialidades/{self.inativa.id}/')
        self.assertEqual(resp.status_code, 404)

    def test_detalhe_especialidade_inexistente_404(self):
        resp = self.client.get('/api/especialidades/99999/')
        self.assertEqual(resp.status_code, 404)


class EquipeMedicaAPITests(TestCase):
    """API pública da equipe médica (/api/equipe-medica/)."""

    def setUp(self):
        self.client = APIClient()
        User = get_user_model()

        usuario = User.objects.create_user(username='dra_equipe', password='x')
        perfil = PerfilUsuario.objects.create(
            usuario=usuario,
            tipo_usuario=PerfilUsuario.TIPO_MEDICA,
            nome_completo='Dra. Equipe Amare',
        )
        self.medica = Medica.objects.create(
            perfil=perfil,
            crm='CRM/PE 99999',
            rqe='4321',
            especialidade='Reprodução Assistida',
            bio='Apresentação.',
        )
        self.reproducao = Especialidade.objects.create(
            nome='Reprodução humana', descricao='...'
        )
        self.reproducao.medicas.add(self.medica)

    def test_lista_publica_sem_autenticacao(self):
        resp = self.client.get('/api/equipe-medica/')
        self.assertEqual(resp.status_code, 200)

    def test_traz_dados_publicos_e_especialidades(self):
        resp = self.client.get('/api/equipe-medica/')
        self.assertEqual(len(resp.data), 1)
        membro = resp.data[0]
        self.assertEqual(membro['nome'], 'Dra. Equipe Amare')
        self.assertEqual(membro['crm'], 'CRM/PE 99999')
        self.assertEqual(membro['rqe'], '4321')
        self.assertEqual(membro['especialidade'], 'Reprodução Assistida')
        nomes = {e['nome'] for e in membro['especialidades']}
        self.assertIn('Reprodução humana', nomes)

    def test_nao_inclui_pacientes(self):
        User = get_user_model()
        usuario = User.objects.create_user(username='paciente_x', password='x')
        perfil = PerfilUsuario.objects.create(
            usuario=usuario,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Paciente X',
        )
        Paciente.objects.create(perfil=perfil)
        resp = self.client.get('/api/equipe-medica/')
        nomes = {m['nome'] for m in resp.data}
        self.assertNotIn('Paciente X', nomes)

    def test_lista_vazia_quando_nao_ha_medicas(self):
        Medica.objects.all().delete()
        resp = self.client.get('/api/equipe-medica/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)


class EventosAPITests(TestCase):
    """Eventos do calendário, com escopo por dono (PROJ-15)."""

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

        EventoTratamento.objects.create(
            paciente=self.paciente1,
            titulo='Exame da Renata',
            data_horario=timezone.now(),
            tipo=EventoTratamento.TIPO_EXAME,
        )
        EventoTratamento.objects.create(
            paciente=self.paciente2,
            titulo='Exame da Amanda',
            data_horario=timezone.now(),
            tipo=EventoTratamento.TIPO_EXAME,
        )

    def test_exige_autenticacao(self):
        resp = self.client.get('/api/eventos/')
        self.assertIn(resp.status_code, (401, 403))

    def test_paciente_ve_apenas_os_proprios_eventos(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get('/api/eventos/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['titulo'], 'Exame da Renata')

    def test_evento_traz_tipo_label(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get('/api/eventos/')
        self.assertEqual(resp.data[0]['tipo'], 'exame')
        self.assertEqual(resp.data[0]['tipo_label'], 'Exame')
