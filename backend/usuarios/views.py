"""Views de autenticação e perfil da Amare.

Todas as views são function-based com `@api_view` — sem Generic Views,
ViewSets ou Django Forms (regra da disciplina).
"""

from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ConviteAcesso, Medica, Paciente, PerfilUsuario
from .permissions import IsMedicaOuAdmin, IsPaciente, medica_do_usuario
from .serializers import (
    CriarPacienteSerializer,
    DefinirSenhaSerializer,
    PerfilPacienteSerializer,
    UsuarioBasicoSerializer,
)

User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    """Limita tentativas de login por IP, mitigando ataques de força bruta.

    O rate e o escopo ficam embutidos na própria classe (não dependem de
    DEFAULT_THROTTLE_RATES no settings).
    """

    scope = 'login'
    rate = '10/min'


def _gerar_tokens(usuario):
    """Gera o par access + refresh para um usuário autenticado."""
    refresh = RefreshToken.for_user(usuario)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _autenticar(request, identificador, password):
    """Autentica aceitando username OU e-mail no mesmo campo.

    O caminho por username vem sempre primeiro, então quem entra com
    username segue exatamente como antes — o e-mail é só um fallback. Se a
    autenticação por username falhar e o valor parecer um e-mail, procura a
    conta dona daquele e-mail (case-insensitive) e autentica pelo username
    real dela.

    O User padrão do Django não força e-mail único; se houver mais de uma
    conta com o mesmo e-mail, não dá para escolher com segurança, então
    tratamos como inválido em vez de logar na conta errada.
    """
    usuario = authenticate(request, username=identificador, password=password)
    if usuario is not None:
        return usuario

    if '@' not in identificador:
        return None

    contas = list(User.objects.filter(email__iexact=identificador)[:2])
    if len(contas) != 1:
        return None

    return authenticate(
        request, username=contas[0].username, password=password
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    """Autentica por username OU e-mail + senha e devolve tokens JWT."""
    identificador = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not identificador or not password:
        return Response(
            {'detail': 'Informe usuário ou e-mail e senha.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = _autenticar(request, identificador, password)
    if usuario is None:
        return Response(
            {'detail': 'Usuário ou senha inválidos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    tokens = _gerar_tokens(usuario)
    return Response(
        {
            **tokens,
            'usuario': UsuarioBasicoSerializer(usuario).data,
        }
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    """Recebe um refresh token válido e devolve um novo access."""
    token = request.data.get('refresh', '')
    if not token:
        return Response(
            {'detail': 'Refresh token ausente.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        refresh = RefreshToken(token)
    except TokenError:
        return Response(
            {'detail': 'Refresh token inválido ou expirado.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response({'access': str(refresh.access_token)})


@api_view(['GET'])
def me_view(request):
    """Retorna dados básicos do usuário autenticado."""
    return Response(UsuarioBasicoSerializer(request.user).data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsPaciente])
def perfil_view(request):
    """Lê ou atualiza o perfil da paciente autenticada.

    Restrito a pacientes (IsPaciente): médicas e administradoras têm a
    própria área e não passam por aqui. Antes, esta view criava um
    Paciente para qualquer usuário autenticado — o que misturava papéis.
    """
    perfil = request.user.perfil
    Paciente.objects.get_or_create(perfil=perfil)

    if request.method == 'GET':
        serializer = PerfilPacienteSerializer(perfil)
        return Response(serializer.data)

    # PATCH
    serializer = PerfilPacienteSerializer(perfil, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# --- Convite de primeiro acesso (PROJ-7) -----------------------------------
# A clínica cria a paciente; a paciente assume o acesso pelo link de convite.


def _gerar_username(nome, email):
    """Gera um username único e legível a partir do nome (ou do e-mail)."""
    base = slugify(nome) or slugify(email.split('@')[0]) or 'paciente'
    base = base[:140]
    candidato = base
    sufixo = 2
    while User.objects.filter(username=candidato).exists():
        candidato = f'{base}-{sufixo}'
        sufixo += 1
    return candidato


def _resolver_medica_responsavel(request, dados):
    """Decide qual médica fica responsável pela nova paciente.

    Se o pedido indicar `medica_responsavel_id`, usa essa (já validada). Senão,
    quando quem cadastra é uma médica, ela mesma vira a responsável. A
    administração pode cadastrar sem indicar médica (define depois).
    """
    medica_id = dados.get('medica_responsavel_id')
    if medica_id:
        return Medica.objects.filter(pk=medica_id).first()
    return medica_do_usuario(request.user)


def _dados_convite(request, convite):
    """Monta o payload do convite, com o link de primeiro acesso pra exibir."""
    return {
        'token': convite.token,
        'link': request.build_absolute_uri(f'/ativar/{convite.token}'),
        'expira_em': convite.expira_em,
        'status': convite.status,
    }


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def criar_paciente(request):
    """Cadastra uma nova paciente e devolve o link de primeiro acesso.

    A conta nasce inativa e sem senha utilizável: a paciente só passa a existir
    de fato quando usa o link de convite e define a própria senha. Quem cadastra
    é a médica (que vira responsável) ou a administração.
    """
    serializer = CriarPacienteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    dados = serializer.validated_data

    medica_responsavel = _resolver_medica_responsavel(request, dados)

    with transaction.atomic():
        # Sem senha => create_user marca a senha como inutilizável; com
        # is_active=False ninguém entra até o convite ser usado.
        usuario = User.objects.create_user(
            username=_gerar_username(dados['nome_completo'], dados['email']),
            email=dados['email'],
            is_active=False,
        )
        perfil = PerfilUsuario.objects.create(
            usuario=usuario,
            tipo_usuario=PerfilUsuario.TIPO_PACIENTE,
            nome_completo=dados['nome_completo'],
            telefone=dados.get('telefone', ''),
        )
        Paciente.objects.create(
            perfil=perfil,
            data_nascimento=dados.get('data_nascimento'),
            medica_responsavel=medica_responsavel,
        )
        convite = ConviteAcesso.objects.create(
            usuario=usuario,
            criado_por=request.user,
        )

    return Response(
        {
            'paciente': {
                'id': usuario.id,
                'nome_completo': perfil.nome_completo,
                'email': usuario.email,
                'username': usuario.username,
            },
            'convite': _dados_convite(request, convite),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def detalhar_convite(request, token):
    """Informa se um convite é válido e quem ele convida (tela de ativação)."""
    convite = (
        ConviteAcesso.objects.filter(token=token)
        .select_related('usuario__perfil')
        .first()
    )
    if convite is None:
        return Response(
            {'detail': 'Convite não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if convite.status == ConviteAcesso.STATUS_USADO:
        situacao = 'usado'
    elif convite.expirado:
        situacao = 'expirado'
    else:
        situacao = 'pendente'

    perfil = getattr(convite.usuario, 'perfil', None)
    return Response(
        {
            'valido': convite.pode_ser_usado(),
            'status': situacao,
            'nome': getattr(perfil, 'nome_completo', '')
            or convite.usuario.username,
            'email': convite.usuario.email,
        }
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def definir_senha_convite(request, token):
    """Troca um convite válido pela senha da paciente e já a autentica."""
    convite = (
        ConviteAcesso.objects.filter(token=token)
        .select_related('usuario')
        .first()
    )
    if convite is None:
        return Response(
            {'detail': 'Convite não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not convite.pode_ser_usado():
        return Response(
            {
                'detail': (
                    'Este convite não é mais válido. '
                    'Solicite um novo à clínica.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = DefinirSenhaSerializer(
        data=request.data, context={'usuario': convite.usuario}
    )
    serializer.is_valid(raise_exception=True)

    with transaction.atomic():
        usuario = convite.usuario
        usuario.set_password(serializer.validated_data['password'])
        usuario.is_active = True
        usuario.save(update_fields=['password', 'is_active'])
        convite.marcar_usado()

    tokens = _gerar_tokens(usuario)
    return Response(
        {
            **tokens,
            'usuario': UsuarioBasicoSerializer(usuario).data,
        }
    )
