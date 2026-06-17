"""Testes de privacidade/LGPD na interface.

Cobrem o ponto sensivel da LGPD: cada titular acessa e solicita apenas sobre os
PROPRIOS dados (escopo por dono), e o acesso anonimo e negado. Usam
`force_authenticate` para nao depender do fluxo de login (nem do throttle dele).
"""

from datetime import date

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ciclo.models import RegistroCiclo
from usuarios.models import Medica, Paciente, PerfilUsuario

from .models import SolicitacaoPrivacidade


def _usuario(username, tipo, email=''):
    """Cria User + PerfilUsuario do tipo pedido; devolve (user, perfil)."""
    user = User.objects.create_user(
        username=username, password='senha-forte-123', email=email
    )
    perfil = PerfilUsuario.objects.create(
        usuario=user, tipo_usuario=tipo, nome_completo=username.title()
    )
    return user, perfil


class MeusDadosTests(APITestCase):
    URL = '/api/privacidade/meus-dados/'

    def test_anonimo_nao_acessa(self):
        resposta = self.client.get(self.URL)
        self.assertIn(resposta.status_code, (401, 403))

    def test_paciente_ve_os_proprios_dados_com_resumo(self):
        user, perfil = _usuario(
            'ana', PerfilUsuario.TIPO_PACIENTE, 'ana@exemplo.com'
        )
        paciente = Paciente.objects.create(perfil=perfil)
        RegistroCiclo.objects.create(paciente=paciente, data=date(2026, 1, 2))
        RegistroCiclo.objects.create(paciente=paciente, data=date(2026, 2, 1))

        self.client.force_authenticate(user=user)
        resposta = self.client.get(self.URL)

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['conta']['usuario'], 'ana')
        self.assertEqual(resposta.data['conta']['email'], 'ana@exemplo.com')
        self.assertIsNotNone(resposta.data['perfil'])
        self.assertEqual(resposta.data['perfil']['tipo_usuario'], 'paciente')
        self.assertIsNotNone(resposta.data['paciente'])
        ciclo = next(
            item
            for item in resposta.data['resumo_registros']
            if item['area'] == 'Ciclo menstrual'
        )
        self.assertEqual(ciclo['quantidade'], 2)

    def test_export_e_escopo_do_dono(self):
        ana, perfil_ana = _usuario(
            'ana', PerfilUsuario.TIPO_PACIENTE, 'ana@exemplo.com'
        )
        Paciente.objects.create(perfil=perfil_ana)
        _bia, perfil_bia = _usuario(
            'bia', PerfilUsuario.TIPO_PACIENTE, 'bia@exemplo.com'
        )
        Paciente.objects.create(perfil=perfil_bia)

        self.client.force_authenticate(user=ana)
        resposta = self.client.get(self.URL)

        self.assertEqual(resposta.data['conta']['usuario'], 'ana')
        self.assertNotEqual(resposta.data['conta']['email'], 'bia@exemplo.com')

    def test_medica_sem_dados_de_paciente(self):
        user, perfil = _usuario('dra', PerfilUsuario.TIPO_MEDICA)
        Medica.objects.create(perfil=perfil)

        self.client.force_authenticate(user=user)
        resposta = self.client.get(self.URL)

        self.assertEqual(resposta.status_code, 200)
        self.assertIsNone(resposta.data['paciente'])
        self.assertEqual(resposta.data['resumo_registros'], [])


class SolicitacoesTests(APITestCase):
    URL = '/api/privacidade/solicitacoes/'

    def test_anonimo_nao_lista_nem_cria(self):
        self.assertIn(self.client.get(self.URL).status_code, (401, 403))
        self.assertIn(
            self.client.post(
                self.URL, {'tipo': 'correcao', 'mensagem': 'x'}
            ).status_code,
            (401, 403),
        )

    def test_criar_solicitacao(self):
        user, _ = _usuario('ana', PerfilUsuario.TIPO_PACIENTE)
        self.client.force_authenticate(user=user)

        resposta = self.client.post(
            self.URL,
            {'tipo': 'correcao', 'mensagem': 'Meu telefone esta errado.'},
        )

        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(resposta.data['status'], 'pendente')
        self.assertEqual(resposta.data['tipo'], 'correcao')
        solicitacao = SolicitacaoPrivacidade.objects.get(usuario=user)
        self.assertEqual(solicitacao.mensagem, 'Meu telefone esta errado.')

    def test_mensagem_em_branco_falha(self):
        user, _ = _usuario('ana', PerfilUsuario.TIPO_PACIENTE)
        self.client.force_authenticate(user=user)
        resposta = self.client.post(
            self.URL, {'tipo': 'exclusao', 'mensagem': '   '}
        )
        self.assertEqual(resposta.status_code, 400)

    def test_tipo_invalido_falha(self):
        user, _ = _usuario('ana', PerfilUsuario.TIPO_PACIENTE)
        self.client.force_authenticate(user=user)
        resposta = self.client.post(
            self.URL, {'tipo': 'qualquer', 'mensagem': 'oi'}
        )
        self.assertEqual(resposta.status_code, 400)

    def test_status_e_resposta_sao_read_only_na_criacao(self):
        user, _ = _usuario('ana', PerfilUsuario.TIPO_PACIENTE)
        self.client.force_authenticate(user=user)

        resposta = self.client.post(
            self.URL,
            {
                'tipo': 'exclusao',
                'mensagem': 'Quero apagar minha conta.',
                'status': 'concluida',
                'resposta': 'ja resolvido',
            },
        )

        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(resposta.data['status'], 'pendente')
        self.assertEqual(resposta.data['resposta'], '')

    def test_lista_so_as_proprias(self):
        ana, _ = _usuario('ana', PerfilUsuario.TIPO_PACIENTE)
        bia, _ = _usuario('bia', PerfilUsuario.TIPO_PACIENTE)
        SolicitacaoPrivacidade.objects.create(
            usuario=ana, tipo='correcao', mensagem='da ana'
        )
        SolicitacaoPrivacidade.objects.create(
            usuario=bia, tipo='correcao', mensagem='da bia'
        )

        self.client.force_authenticate(user=ana)
        resposta = self.client.get(self.URL)

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(len(resposta.data), 1)
        self.assertEqual(resposta.data[0]['mensagem'], 'da ana')
