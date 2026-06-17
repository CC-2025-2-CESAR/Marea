"""Testes do painel administrativo (PR8).

Cobre o controle de acesso (só administração entra — os testes de acesso NEGADO
para paciente, médica e anônimo são obrigatórios), o CRUD do dicionário, a
leitura dos logs e a visão geral.
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from auditoria.models import LogAtividade
from dicionario.models import TermoDicionario
from usuarios.models import PerfilUsuario


def _usuario(username, tipo, **extra):
    usuario = User.objects.create_user(
        username=username,
        password='Senha#2024',
        email=f'{username}@amare.test',
        **extra,
    )
    PerfilUsuario.objects.update_or_create(
        usuario=usuario,
        defaults={'tipo_usuario': tipo, 'nome_completo': username.title()},
    )
    return usuario


class PainelAdminAcessoTests(APITestCase):
    """Só a administração (perfil admin ou superusuária) acessa o painel."""

    def setUp(self):
        self.paciente = _usuario('paciente_x', PerfilUsuario.TIPO_PACIENTE)
        self.medica = _usuario('medica_x', PerfilUsuario.TIPO_MEDICA)
        self.admin = _usuario('admin_x', PerfilUsuario.TIPO_ADMIN)
        self.super = User.objects.create_superuser(
            'super_x', 'super_x@amare.test', 'Senha#2024'
        )

    def test_anonimo_e_barrado(self):
        for url in ('/api/admin/visao-geral/', '/api/admin/logs/', '/api/admin/termos/'):
            resp = self.client.get(url)
            self.assertIn(
                resp.status_code,
                (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
                url,
            )

    def test_paciente_e_barrada(self):
        self.client.force_authenticate(self.paciente)
        resp = self.client.get('/api/admin/visao-geral/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_medica_e_barrada(self):
        self.client.force_authenticate(self.medica)
        resp = self.client.get('/api/admin/termos/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_paciente_nao_cria_termo(self):
        self.client.force_authenticate(self.paciente)
        resp = self.client.post(
            '/api/admin/termos/', {'termo': 'Hack', 'definicao': 'x'}
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(TermoDicionario.objects.filter(termo='Hack').exists())

    def test_admin_entra(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.get('/api/admin/visao-geral/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_superusuaria_entra(self):
        self.client.force_authenticate(self.super)
        resp = self.client.get('/api/admin/visao-geral/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class PainelAdminConteudoTests(APITestCase):
    """CRUD do dicionário, logs e visão geral pela administração."""

    def setUp(self):
        self.admin = _usuario('admin_y', PerfilUsuario.TIPO_ADMIN)
        self.client.force_authenticate(self.admin)
        self.termo = TermoDicionario.objects.create(
            termo='Folículo', definicao='Estrutura do ovário.'
        )

    def test_lista_inclui_inativos(self):
        TermoDicionario.objects.create(
            termo='Termo Oculto', definicao='...', ativo=False
        )
        resp = self.client.get('/api/admin/termos/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        termos = [t['termo'] for t in resp.data]
        self.assertIn('Folículo', termos)
        self.assertIn('Termo Oculto', termos)

    def test_cria_termo(self):
        resp = self.client.post(
            '/api/admin/termos/',
            {'termo': 'Blastocisto', 'definicao': 'Embrião em estágio inicial.'},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TermoDicionario.objects.filter(termo='Blastocisto').exists())

    def test_cria_termo_em_branco_falha(self):
        resp = self.client.post('/api/admin/termos/', {'termo': '  ', 'definicao': 'x'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cria_termo_duplicado_falha(self):
        resp = self.client.post(
            '/api/admin/termos/', {'termo': 'Folículo', 'definicao': 'outra'}
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_edita_termo(self):
        resp = self.client.patch(
            f'/api/admin/termos/{self.termo.id}/', {'definicao': 'Nova definição.'}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.termo.refresh_from_db()
        self.assertEqual(self.termo.definicao, 'Nova definição.')

    def test_despublica_termo(self):
        resp = self.client.patch(
            f'/api/admin/termos/{self.termo.id}/', {'ativo': False}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.termo.refresh_from_db()
        self.assertFalse(self.termo.ativo)

    def test_exclui_termo(self):
        resp = self.client.delete(f'/api/admin/termos/{self.termo.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TermoDicionario.objects.filter(pk=self.termo.id).exists())

    def test_detalhe_inexistente_404(self):
        resp = self.client.get('/api/admin/termos/99999/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_visao_geral_conta_termos(self):
        resp = self.client.get('/api/admin/visao-geral/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        for chave in (
            'pacientes',
            'medicas',
            'convites_pendentes',
            'termos',
            'logs',
        ):
            self.assertIn(chave, resp.data)
        self.assertEqual(resp.data['termos'], TermoDicionario.objects.count())

    def test_logs_lista_eventos(self):
        LogAtividade.objects.create(
            usuario=self.admin, acao=LogAtividade.ACAO_VISUALIZAR_PACIENTE
        )
        resp = self.client.get('/api/admin/logs/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['acao'], LogAtividade.ACAO_VISUALIZAR_PACIENTE)
        self.assertEqual(resp.data[0]['acao_display'], 'Visualizou a paciente')
