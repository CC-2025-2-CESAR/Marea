"""Testes de controle de acesso por papel da app usuarios."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, APITestCase

from .models import (
    ConviteAcesso,
    EquipeCuidadoPaciente,
    Medica,
    Paciente,
    PerfilUsuario,
)
from .permissions import (
    IsAdminClinica,
    eh_admin,
    papel_no_cuidado,
    pode_editar_paciente,
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


class PerfilPermissaoTests(APITestCase):
    """Garante que /api/perfil/ é exclusivo de pacientes."""

    def setUp(self):
        User = get_user_model()

        self.paciente_user = User.objects.create_user(
            'paciente_x', password='senha-de-teste'
        )
        perfil_paciente = PerfilUsuario.objects.create(
            usuario=self.paciente_user,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Paciente X',
        )
        Paciente.objects.create(perfil=perfil_paciente)

        self.medica_user = User.objects.create_user(
            'medica_x', password='senha-de-teste'
        )
        perfil_medica = PerfilUsuario.objects.create(
            usuario=self.medica_user,
            tipo_usuario=PerfilUsuario.TIPO_MEDICA,
            nome_completo='Dra. X',
        )
        Medica.objects.create(perfil=perfil_medica)

    def test_paciente_acessa_o_proprio_perfil(self):
        self.client.force_authenticate(self.paciente_user)
        resposta = self.client.get('/api/perfil/')
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['tipo_usuario'], 'paciente')

    def test_medica_e_bloqueada_no_perfil_da_paciente(self):
        self.client.force_authenticate(self.medica_user)
        resposta = self.client.get('/api/perfil/')
        self.assertEqual(resposta.status_code, 403)

    def test_anonimo_recebe_401(self):
        resposta = self.client.get('/api/perfil/')
        self.assertEqual(resposta.status_code, 401)

    def test_medica_nao_vira_paciente_ao_acessar_perfil(self):
        """A view antiga criava um Paciente para qualquer usuário. Agora não."""
        self.client.force_authenticate(self.medica_user)
        self.client.get('/api/perfil/')
        self.assertFalse(
            Paciente.objects.filter(perfil__usuario=self.medica_user).exists()
        )


class EquipeCuidadoPacienteModelTests(TestCase):
    """Regras do vínculo de equipe: ativo por padrão e único por par."""

    def setUp(self):
        self.medica = _criar_medica('med_eq')
        self.outra = _criar_medica('med_eq2')
        self.paciente = _criar_paciente('pac_eq')

    def test_cria_vinculo_ativo_por_padrao(self):
        vinculo = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente,
            medica=self.medica,
            papel=EquipeCuidadoPaciente.PAPEL_SUBSTITUTA,
        )
        self.assertTrue(vinculo.ativa)
        self.assertEqual(vinculo.papel, 'substituta')

    def test_um_unico_vinculo_ativo_por_par(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                EquipeCuidadoPaciente.objects.create(
                    paciente=self.paciente, medica=self.medica
                )

    def test_permite_novo_vinculo_apos_encerrar(self):
        antigo = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica, ativa=False
        )
        novo = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica, ativa=True
        )
        self.assertNotEqual(antigo.id, novo.id)

    def test_vinculos_de_medicas_diferentes_coexistem(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.medica
        )
        vinculo2 = EquipeCuidadoPaciente.objects.create(
            paciente=self.paciente, medica=self.outra
        )
        self.assertTrue(vinculo2.ativa)


class RBACPermissoesTests(TestCase):
    """Helpers de permissão: quem é admin e quem pode editar cada paciente."""

    def setUp(self):
        self.m1 = _criar_medica('rbac_m1')
        self.m2 = _criar_medica('rbac_m2')
        self.pac = _criar_paciente('rbac_pac', medica=self.m1)
        self.admin = User.objects.create_user(
            'rbac_admin', password='x', is_superuser=True
        )
        PerfilUsuario.objects.create(
            usuario=self.admin,
            tipo_usuario=PerfilUsuario.TIPO_ADMIN,
            nome_completo='Admin RBAC',
        )

    def test_eh_admin(self):
        self.assertTrue(eh_admin(self.admin))
        self.assertFalse(eh_admin(self.m1.perfil.usuario))
        self.assertFalse(eh_admin(self.pac.perfil.usuario))
        self.assertFalse(eh_admin(AnonymousUser()))

    def test_pode_editar_responsavel_e_admin(self):
        self.assertTrue(pode_editar_paciente(self.m1.perfil.usuario, self.pac))
        self.assertTrue(pode_editar_paciente(self.admin, self.pac))

    def test_nao_pode_editar_paciente_de_outra(self):
        self.assertFalse(
            pode_editar_paciente(self.m2.perfil.usuario, self.pac)
        )
        self.assertEqual(
            papel_no_cuidado(self.m2.perfil.usuario, self.pac),
            'visualizacao',
        )

    def test_vinculo_ativo_da_escrita(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.pac, medica=self.m2, ativa=True
        )
        self.assertTrue(pode_editar_paciente(self.m2.perfil.usuario, self.pac))
        self.assertEqual(
            papel_no_cuidado(self.m2.perfil.usuario, self.pac), 'assumido'
        )

    def test_vinculo_inativo_nao_da_escrita(self):
        EquipeCuidadoPaciente.objects.create(
            paciente=self.pac, medica=self.m2, ativa=False
        )
        self.assertFalse(
            pode_editar_paciente(self.m2.perfil.usuario, self.pac)
        )

    def test_is_admin_clinica_permission(self):
        factory = APIRequestFactory()
        req = factory.get('/')
        req.user = self.admin
        self.assertTrue(IsAdminClinica().has_permission(req, None))
        req.user = self.m1.perfil.usuario
        self.assertFalse(IsAdminClinica().has_permission(req, None))
        req.user = AnonymousUser()
        self.assertFalse(IsAdminClinica().has_permission(req, None))


class LoginViewTests(APITestCase):
    """Login aceita username OU e-mail, sem regredir o login por username."""

    URL = '/api/auth/login/'
    SENHA = 'senha-forte-123'

    def setUp(self):
        # Zera o histórico do throttle entre os métodos: LoginThrottle limita a
        # 10/min por IP e o cache acumularia ao longo da classe de testes.
        cache.clear()
        self.usuario = User.objects.create_user(
            username='renata',
            email='Renata@Amare.test',
            password=self.SENHA,
        )
        PerfilUsuario.objects.create(
            usuario=self.usuario,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Renata Teste',
        )

    def test_login_por_username_continua_funcionando(self):
        resposta = self.client.post(
            self.URL, {'username': 'renata', 'password': self.SENHA}
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertIn('access', resposta.data)
        self.assertIn('refresh', resposta.data)
        self.assertEqual(resposta.data['usuario']['username'], 'renata')
        self.assertEqual(resposta.data['usuario']['tipo_usuario'], 'paciente')

    def test_login_por_email_funciona(self):
        resposta = self.client.post(
            self.URL,
            {'username': 'Renata@Amare.test', 'password': self.SENHA},
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['usuario']['username'], 'renata')

    def test_login_por_email_e_case_insensitive(self):
        resposta = self.client.post(
            self.URL,
            {'username': 'renata@amare.test', 'password': self.SENHA},
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['usuario']['username'], 'renata')

    def test_senha_errada_por_email_retorna_401(self):
        resposta = self.client.post(
            self.URL,
            {'username': 'renata@amare.test', 'password': 'errada'},
        )
        self.assertEqual(resposta.status_code, 401)

    def test_senha_errada_por_username_retorna_401(self):
        resposta = self.client.post(
            self.URL, {'username': 'renata', 'password': 'errada'}
        )
        self.assertEqual(resposta.status_code, 401)

    def test_email_inexistente_retorna_401(self):
        resposta = self.client.post(
            self.URL,
            {'username': 'ninguem@amare.test', 'password': self.SENHA},
        )
        self.assertEqual(resposta.status_code, 401)

    def test_campos_vazios_retornam_400(self):
        resposta = self.client.post(self.URL, {'username': 'renata'})
        self.assertEqual(resposta.status_code, 400)

    def test_email_duplicado_nao_autentica(self):
        """E-mail repetido (o User não força unicidade): recusa em vez de logar
        a conta errada — o username segue sendo o caminho sem ambiguidade."""
        User.objects.create_user(
            username='renata2',
            email='Renata@Amare.test',
            password=self.SENHA,
        )
        resposta = self.client.post(
            self.URL,
            {'username': 'Renata@Amare.test', 'password': self.SENHA},
        )
        self.assertEqual(resposta.status_code, 401)

    def test_username_funciona_mesmo_com_email_duplicado(self):
        """Mesmo com e-mail ambíguo, cada conta entra pelo próprio username."""
        User.objects.create_user(
            username='renata2',
            email='Renata@Amare.test',
            password=self.SENHA,
        )
        resposta = self.client.post(
            self.URL, {'username': 'renata2', 'password': self.SENHA}
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['usuario']['username'], 'renata2')


class CriarPacienteViewTests(APITestCase):
    """A clínica cadastra a paciente e recebe o link de primeiro acesso."""

    URL = '/api/clinica/pacientes/'

    def setUp(self):
        self.medica = _criar_medica('dra_cadastro')
        self.admin = User.objects.create_user(
            'admin_cadastro', password='x', is_superuser=True
        )
        PerfilUsuario.objects.create(
            usuario=self.admin,
            tipo_usuario=PerfilUsuario.TIPO_ADMIN,
            nome_completo='Admin Cadastro',
        )

    def test_medica_cadastra_paciente_e_recebe_link(self):
        self.client.force_authenticate(self.medica.perfil.usuario)
        resposta = self.client.post(
            self.URL,
            {'nome_completo': 'Maria Souza', 'email': 'maria@amare.test'},
        )
        self.assertEqual(resposta.status_code, 201)
        convite = resposta.data['convite']
        self.assertIn('/ativar/', convite['link'])
        self.assertTrue(convite['token'])
        self.assertIn(convite['token'], convite['link'])
        # Conta criada, inativa e sem senha utilizável.
        usuario = User.objects.get(email='maria@amare.test')
        self.assertFalse(usuario.is_active)
        self.assertFalse(usuario.has_usable_password())
        # Perfil de paciente + Paciente com a médica como responsável.
        self.assertEqual(usuario.perfil.tipo_usuario, 'paciente')
        self.assertEqual(
            usuario.perfil.paciente.medica_responsavel_id, self.medica.id
        )
        # Um convite pendente para essa conta.
        self.assertTrue(
            ConviteAcesso.objects.filter(
                usuario=usuario, status=ConviteAcesso.STATUS_PENDENTE
            ).exists()
        )

    def test_admin_cadastra_sem_medica_responsavel(self):
        self.client.force_authenticate(self.admin)
        resposta = self.client.post(
            self.URL,
            {'nome_completo': 'Sem Medica', 'email': 'sem@amare.test'},
        )
        self.assertEqual(resposta.status_code, 201)
        usuario = User.objects.get(email='sem@amare.test')
        self.assertIsNone(usuario.perfil.paciente.medica_responsavel)

    def test_admin_pode_indicar_medica_responsavel(self):
        self.client.force_authenticate(self.admin)
        resposta = self.client.post(
            self.URL,
            {
                'nome_completo': 'Com Medica',
                'email': 'com@amare.test',
                'medica_responsavel_id': self.medica.id,
            },
        )
        self.assertEqual(resposta.status_code, 201)
        usuario = User.objects.get(email='com@amare.test')
        self.assertEqual(
            usuario.perfil.paciente.medica_responsavel_id, self.medica.id
        )

    def test_email_duplicado_recusado(self):
        User.objects.create_user(
            'existente', email='dup@amare.test', password='x'
        )
        self.client.force_authenticate(self.medica.perfil.usuario)
        resposta = self.client.post(
            self.URL,
            {'nome_completo': 'Outra', 'email': 'DUP@amare.test'},
        )
        self.assertEqual(resposta.status_code, 400)
        self.assertIn('email', resposta.data)

    def test_email_obrigatorio(self):
        self.client.force_authenticate(self.medica.perfil.usuario)
        resposta = self.client.post(self.URL, {'nome_completo': 'Sem Email'})
        self.assertEqual(resposta.status_code, 400)

    def test_medica_responsavel_inexistente_recusada(self):
        self.client.force_authenticate(self.admin)
        resposta = self.client.post(
            self.URL,
            {
                'nome_completo': 'X',
                'email': 'x@amare.test',
                'medica_responsavel_id': 99999,
            },
        )
        self.assertEqual(resposta.status_code, 400)

    def test_paciente_nao_pode_cadastrar(self):
        paciente = _criar_paciente('pac_sem_poder')
        self.client.force_authenticate(paciente.perfil.usuario)
        resposta = self.client.post(
            self.URL,
            {'nome_completo': 'Nope', 'email': 'nope@amare.test'},
        )
        self.assertEqual(resposta.status_code, 403)
        self.assertFalse(User.objects.filter(email='nope@amare.test').exists())

    def test_anonimo_recebe_401(self):
        resposta = self.client.post(
            self.URL,
            {'nome_completo': 'Anon', 'email': 'anon@amare.test'},
        )
        self.assertEqual(resposta.status_code, 401)


class ConviteAcessoFluxoTests(APITestCase):
    """Validar o convite e definir a senha no primeiro acesso."""

    SENHA_FORTE = 'Girassol#2024'

    def setUp(self):
        # O teste de login pós-ativação passa pelo LoginThrottle (10/min por IP).
        cache.clear()
        self.usuario = User.objects.create_user(
            username='nova_paciente',
            email='nova@amare.test',
            is_active=False,
        )
        perfil = PerfilUsuario.objects.create(
            usuario=self.usuario,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Nova Paciente',
        )
        Paciente.objects.create(perfil=perfil)
        self.convite = ConviteAcesso.objects.create(usuario=self.usuario)

    def _url_detalhe(self, token=None):
        return f'/api/convite/{token or self.convite.token}/'

    def _url_definir(self, token=None):
        return f'/api/convite/{token or self.convite.token}/definir-senha/'

    # GET /api/convite/<token>/
    def test_detalhar_convite_valido(self):
        resposta = self.client.get(self._url_detalhe())
        self.assertEqual(resposta.status_code, 200)
        self.assertTrue(resposta.data['valido'])
        self.assertEqual(resposta.data['status'], 'pendente')
        self.assertEqual(resposta.data['nome'], 'Nova Paciente')
        self.assertEqual(resposta.data['email'], 'nova@amare.test')

    def test_detalhar_convite_inexistente_404(self):
        resposta = self.client.get(self._url_detalhe('token-falso'))
        self.assertEqual(resposta.status_code, 404)

    def test_detalhar_convite_expirado(self):
        self.convite.expira_em = timezone.now() - timedelta(hours=1)
        self.convite.save(update_fields=['expira_em'])
        resposta = self.client.get(self._url_detalhe())
        self.assertEqual(resposta.status_code, 200)
        self.assertFalse(resposta.data['valido'])
        self.assertEqual(resposta.data['status'], 'expirado')

    def test_detalhar_convite_usado(self):
        self.convite.marcar_usado()
        resposta = self.client.get(self._url_detalhe())
        self.assertEqual(resposta.status_code, 200)
        self.assertFalse(resposta.data['valido'])
        self.assertEqual(resposta.data['status'], 'usado')

    # POST /api/convite/<token>/definir-senha/
    def test_definir_senha_ativa_conta_e_autentica(self):
        resposta = self.client.post(
            self._url_definir(), {'password': self.SENHA_FORTE}
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertIn('access', resposta.data)
        self.assertIn('refresh', resposta.data)
        self.assertEqual(resposta.data['usuario']['username'], 'nova_paciente')
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.is_active)
        self.assertTrue(self.usuario.check_password(self.SENHA_FORTE))
        self.convite.refresh_from_db()
        self.assertEqual(self.convite.status, ConviteAcesso.STATUS_USADO)
        self.assertIsNotNone(self.convite.usado_em)

    def test_definir_senha_queima_o_token(self):
        self.client.post(self._url_definir(), {'password': self.SENHA_FORTE})
        resposta = self.client.post(
            self._url_definir(), {'password': 'OutraSenha#2024'}
        )
        self.assertEqual(resposta.status_code, 400)

    def test_definir_senha_convite_expirado_recusado(self):
        self.convite.expira_em = timezone.now() - timedelta(hours=1)
        self.convite.save(update_fields=['expira_em'])
        resposta = self.client.post(
            self._url_definir(), {'password': self.SENHA_FORTE}
        )
        self.assertEqual(resposta.status_code, 400)
        self.usuario.refresh_from_db()
        self.assertFalse(self.usuario.is_active)

    def test_definir_senha_fraca_recusada(self):
        resposta = self.client.post(self._url_definir(), {'password': '123'})
        self.assertEqual(resposta.status_code, 400)
        self.usuario.refresh_from_db()
        self.assertFalse(self.usuario.is_active)
        self.convite.refresh_from_db()
        self.assertEqual(self.convite.status, ConviteAcesso.STATUS_PENDENTE)

    def test_definir_senha_convite_inexistente_404(self):
        resposta = self.client.post(
            self._url_definir('token-falso'), {'password': self.SENHA_FORTE}
        )
        self.assertEqual(resposta.status_code, 404)

    def test_login_por_email_apos_ativacao(self):
        """Fecha o ciclo: depois de definir a senha, a paciente entra (7a)."""
        self.client.post(self._url_definir(), {'password': self.SENHA_FORTE})
        resposta = self.client.post(
            '/api/auth/login/',
            {'username': 'nova@amare.test', 'password': self.SENHA_FORTE},
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['usuario']['username'], 'nova_paciente')


class ReenviarConviteViewTests(APITestCase):
    """A clínica gera um novo link de primeiro acesso para uma conta inativa."""

    def setUp(self):
        self.medica = _criar_medica('dra_reenvio')
        self.usuario = User.objects.create_user(
            username='paciente_reenvio',
            email='reenvio@amare.test',
            is_active=False,
        )
        perfil = PerfilUsuario.objects.create(
            usuario=self.usuario,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo='Paciente Reenvio',
        )
        Paciente.objects.create(perfil=perfil)
        self.convite = ConviteAcesso.objects.create(usuario=self.usuario)

    def _url(self, pid=None):
        return f'/api/clinica/pacientes/{pid or self.usuario.id}/reenviar-convite/'

    def test_medica_reenvia_gera_novo_link_e_expira_anterior(self):
        self.client.force_authenticate(self.medica.perfil.usuario)
        resposta = self.client.post(self._url())
        self.assertEqual(resposta.status_code, 201)
        novo = resposta.data['convite']
        self.assertIn('/ativar/', novo['link'])
        self.assertNotEqual(novo['token'], self.convite.token)
        # O novo convite vale; o anterior foi encerrado.
        self.assertTrue(
            ConviteAcesso.objects.get(token=novo['token']).pode_ser_usado()
        )
        self.convite.refresh_from_db()
        self.assertFalse(self.convite.pode_ser_usado())

    def test_reenviar_paciente_ja_ativa_recusado(self):
        self.usuario.is_active = True
        self.usuario.save(update_fields=['is_active'])
        self.client.force_authenticate(self.medica.perfil.usuario)
        resposta = self.client.post(self._url())
        self.assertEqual(resposta.status_code, 400)

    def test_reenviar_paciente_inexistente_404(self):
        self.client.force_authenticate(self.medica.perfil.usuario)
        resposta = self.client.post(self._url(999999))
        self.assertEqual(resposta.status_code, 404)

    def test_reenviar_para_nao_paciente_404(self):
        # A conta da médica não é paciente: reenviar não se aplica a ela.
        self.client.force_authenticate(self.medica.perfil.usuario)
        resposta = self.client.post(self._url(self.medica.perfil.usuario_id))
        self.assertEqual(resposta.status_code, 404)

    def test_paciente_nao_pode_reenviar(self):
        outra = _criar_paciente('pac_sem_reenvio')
        self.client.force_authenticate(outra.perfil.usuario)
        resposta = self.client.post(self._url())
        self.assertEqual(resposta.status_code, 403)

    def test_anonimo_recebe_401(self):
        resposta = self.client.post(self._url())
        self.assertEqual(resposta.status_code, 401)
