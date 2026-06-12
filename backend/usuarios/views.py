"""Views de autenticação e perfil da Amare.

Todas as views são function-based com `@api_view` — sem Generic Views,
ViewSets ou Django Forms (regra da disciplina).
"""

from django.contrib.auth import authenticate, get_user_model
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

from .models import Paciente
from .permissions import IsPaciente
from .serializers import PerfilPacienteSerializer, UsuarioBasicoSerializer

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
