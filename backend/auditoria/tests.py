"""Testes do modelo de auditoria (LogAtividade).

Foco no que o log promete: data automática, ordenação estável e — o ponto de
LGPD — sobreviver à exclusão do usuário ou da paciente sem perder o histórico.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase

from usuarios.models import Paciente, PerfilUsuario

from .models import LogAtividade

User = get_user_model()


def _criar_paciente(username):
    user = User.objects.create_user(username=username, password='x')
    perfil = PerfilUsuario.objects.create(
        usuario=user,
        tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
        nome_completo=username,
    )
    return Paciente.objects.create(perfil=perfil)


class LogAtividadeModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('med_log', password='x')
        self.paciente = _criar_paciente('pac_log')

    def test_registra_acao_com_data_automatica(self):
        log = LogAtividade.objects.create(
            usuario=self.user,
            acao=LogAtividade.ACAO_ASSUMIR_ATENDIMENTO,
            entidade=LogAtividade.ENTIDADE_PACIENTE,
            entidade_id=self.paciente.id,
            paciente=self.paciente,
            motivo='Cobertura de plantão.',
        )
        self.assertIsNotNone(log.data_hora)
        self.assertEqual(log.motivo, 'Cobertura de plantão.')

    def test_log_sobrevive_a_exclusao_do_usuario(self):
        log = LogAtividade.objects.create(
            usuario=self.user,
            acao=LogAtividade.ACAO_EDITAR_PACIENTE,
            paciente=self.paciente,
        )
        self.user.delete()
        log.refresh_from_db()
        self.assertIsNone(log.usuario)
        # a paciente permanece; o histórico não some
        self.assertEqual(log.paciente_id, self.paciente.id)

    def test_log_sobrevive_a_exclusao_da_paciente(self):
        log = LogAtividade.objects.create(
            usuario=self.user,
            acao=LogAtividade.ACAO_VISUALIZAR_PACIENTE,
            paciente=self.paciente,
            entidade=LogAtividade.ENTIDADE_PACIENTE,
            entidade_id=self.paciente.id,
        )
        self.paciente.delete()
        log.refresh_from_db()
        self.assertIsNone(log.paciente)

    def test_ordenacao_mais_recente_primeiro(self):
        antigo = LogAtividade.objects.create(
            usuario=self.user, acao=LogAtividade.ACAO_VISUALIZAR_PACIENTE
        )
        recente = LogAtividade.objects.create(
            usuario=self.user, acao=LogAtividade.ACAO_EDITAR_PACIENTE
        )
        ids = list(LogAtividade.objects.values_list('id', flat=True))
        self.assertEqual(ids[0], recente.id)
        self.assertEqual(ids[-1], antigo.id)
