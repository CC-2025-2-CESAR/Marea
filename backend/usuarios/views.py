"""Views de autenticação e perfil da Amare.

Todas as views são function-based com `@api_view` — sem Generic Views,
ViewSets ou Django Forms (regra da disciplina).
"""

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Paciente, PerfilUsuario
from .serializers import PerfilPacienteSerializer, UsuarioBasicoSerializer


def _gerar_tokens(usuario):
    """Gera o par access + refresh para um usuário autenticado."""
    refresh = RefreshToken.for_user(usuario)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Autentica por username + senha e devolve tokens JWT."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'detail': 'Informe usuário e senha.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = authenticate(request, username=username, password=password)
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
def perfil_view(request):
    """Lê ou atualiza o perfil do usuário autenticado.

    Hoje só pacientes têm fluxo de edição no frontend; médicas e admins
    veem a tela mas seus dados são gerenciados pelo Django Admin.
    """
    perfil, _ = PerfilUsuario.objects.get_or_create(usuario=request.user)
    Paciente.objects.get_or_create(perfil=perfil)

    if request.method == 'GET':
        serializer = PerfilPacienteSerializer(perfil)
        return Response(serializer.data)

    # PATCH
    serializer = PerfilPacienteSerializer(perfil, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
