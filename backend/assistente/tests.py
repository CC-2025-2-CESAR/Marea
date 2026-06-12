"""Testes do Assistente Amare: classificação guiada e, sobretudo, segurança.

O assistente nunca diagnostica nem orienta mudança de medicação. Os testes
cobrem o casamento por palavra-chave (ignorando acento e maiúsculas), o
encaminhamento à clínica em temas sensíveis — que vence até uma resposta
cadastrada — e o bloqueio de acesso anônimo.
"""

from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework.test import APITestCase

from usuarios.models import PerfilUsuario

from .models import RespostaAssistente
from .views import RESPOSTA_SEM_MATCH, RESPOSTA_SENSIVEL

URL = '/api/assistente/'

User = get_user_model()


class AssistenteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('pac_bot', password='x')
        PerfilUsuario.objects.create(
            usuario=self.user,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Paciente Bot',
        )
        self.client.force_authenticate(self.user)

    def _resposta(self, intencao, palavras, **kw):
        return RespostaAssistente.objects.create(
            intencao=intencao,
            pergunta_exemplo=kw.get('pergunta_exemplo', intencao),
            palavras_chave=palavras,
            resposta=kw.get('resposta', 'Conteudo de referencia.'),
            categoria=kw.get('categoria', 'Geral'),
            fonte_rotulo=kw.get('fonte_rotulo', ''),
            fonte_rota=kw.get('fonte_rota', ''),
            sensivel=kw.get('sensivel', False),
            prioridade=kw.get('prioridade', 0),
            ativo=kw.get('ativo', True),
        )

    # --- sugestões (chips) ---

    def test_get_lista_sugestoes_ativas(self):
        self._resposta(
            'consultas', 'consulta agenda', pergunta_exemplo='Minhas consultas?'
        )
        self._resposta('inativa', 'qualquer', ativo=False)
        resp = self.client.get(URL)
        self.assertEqual(resp.status_code, 200)
        intencoes = [s['intencao'] for s in resp.data['sugestoes']]
        self.assertIn('consultas', intencoes)
        self.assertNotIn('inativa', intencoes)
        self.assertTrue(resp.data['disclaimer'])

    # --- classificação ---

    def test_pergunta_casa_intencao_com_fonte_e_acoes(self):
        resposta = self._resposta(
            'medicamentos',
            'medicamento remedio horario',
            resposta='Seus medicamentos ficam na pagina de Medicamentos.',
            fonte_rotulo='Medicamentos',
            fonte_rota='/medicamentos',
        )
        resposta.acoes.create(rotulo='Ver medicamentos', rota='/medicamentos')
        resp = self.client.post(
            URL, {'pergunta': 'Onde vejo meus medicamentos?'}, format='json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['intencao'], 'medicamentos')
        self.assertTrue(resp.data['encontrou'])
        self.assertEqual(resp.data['fonte']['rota'], '/medicamentos')
        self.assertEqual(resp.data['acoes'][0]['rota'], '/medicamentos')
        self.assertTrue(resp.data['disclaimer'])

    def test_casa_ignorando_acentos_e_maiusculas(self):
        self._resposta('ciclo', 'ciclo menstruacao ovulacao')
        resp = self.client.post(
            URL,
            {'pergunta': 'Como acompanho meu CICLO de MENSTRUAÇÃO?'},
            format='json',
        )
        self.assertEqual(resp.data['intencao'], 'ciclo')

    def test_prioridade_desempata(self):
        self._resposta('generica', 'apoio', prioridade=1)
        self._resposta('especifica', 'apoio', prioridade=9)
        resp = self.client.post(URL, {'pergunta': 'preciso de apoio'}, format='json')
        self.assertEqual(resp.data['intencao'], 'especifica')

    def test_sem_match_devolve_resposta_segura(self):
        self._resposta('consultas', 'consulta agenda')
        resp = self.client.post(
            URL, {'pergunta': 'qual a capital da Franca?'}, format='json'
        )
        self.assertFalse(resp.data['encontrou'])
        self.assertIsNone(resp.data['intencao'])
        self.assertEqual(resp.data['resposta'], RESPOSTA_SEM_MATCH)

    def test_resposta_inativa_nao_casa(self):
        self._resposta('secreta', 'abracadabra', ativo=False)
        resp = self.client.post(URL, {'pergunta': 'abracadabra'}, format='json')
        self.assertFalse(resp.data['encontrou'])

    # --- segurança: nunca diagnostica nem mexe em dose ---

    def test_tema_sensivel_vence_resposta_cadastrada(self):
        # Mesmo com uma resposta de medicamentos cadastrada, o guardrail vence.
        self._resposta(
            'medicamentos',
            'medicamento remedio dose progesterona',
            resposta='NAO DEVERIA APARECER',
        )
        resp = self.client.post(
            URL,
            {'pergunta': 'Posso parar de tomar a progesterona?'},
            format='json',
        )
        self.assertTrue(resp.data['sensivel'])
        self.assertFalse(resp.data['encontrou'])
        self.assertEqual(resp.data['resposta'], RESPOSTA_SENSIVEL)
        self.assertNotIn('NAO DEVERIA APARECER', resp.data['resposta'])

    def test_sintoma_de_alarme_encaminha_para_clinica(self):
        resp = self.client.post(
            URL, {'pergunta': 'Estou com sangramento intenso'}, format='json'
        )
        self.assertTrue(resp.data['sensivel'])
        self.assertEqual(resp.data['resposta'], RESPOSTA_SENSIVEL)

    def test_mudanca_de_dose_encaminha_para_clinica(self):
        resp = self.client.post(
            URL, {'pergunta': 'Devo aumentar a dose do remedio?'}, format='json'
        )
        self.assertTrue(resp.data['sensivel'])
        self.assertFalse(resp.data['encontrou'])

    # --- validação e acesso ---

    def test_pergunta_vazia_falha(self):
        resp = self.client.post(URL, {'pergunta': '   '}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_anonimo_bloqueado(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(URL).status_code, 401)
        self.assertEqual(
            self.client.post(URL, {'pergunta': 'oi'}, format='json').status_code,
            401,
        )

    # --- seed ---

    def test_fixture_seed_e_valida(self):
        call_command('loaddata', 'respostas_iniciais', verbosity=0)
        self.assertTrue(
            RespostaAssistente.objects.filter(intencao='consultas').exists()
        )
        # A resposta sobre FIV oferece dois atalhos (tratamentos e dicionário).
        fiv = RespostaAssistente.objects.get(intencao='sobre_fiv')
        self.assertEqual(fiv.acoes.count(), 2)
        # Nenhuma resposta semeada deve orientar mudança de dose.
        for resposta in RespostaAssistente.objects.all():
            self.assertNotIn('aumente a dose', resposta.resposta.lower())
            self.assertNotIn('pare de tomar', resposta.resposta.lower())
