"""Privacidade e LGPD na interface (function-based, regra da disciplina).

Da a usuaria autenticada (titular dos dados) o acesso aos proprios dados na
Amare e um canal para pedir correcao ou exclusao. Tudo e escopo do
`request.user`: ninguem ve nem solicita sobre dados de outra pessoa. A
barreira e o backend; o frontend so apresenta o que estes endpoints liberam.
"""

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SolicitacaoPrivacidade
from .serializers import SolicitacaoPrivacidadeSerializer


def _iso(valor):
    """Data/hora em ISO 8601, ou None quando o campo esta vazio."""
    return valor.isoformat() if valor else None


def _resumo_registros(paciente):
    """Quantos registros a paciente tem em cada area (transparencia).

    Conta pelos acessores reversos da Paciente; nao expoe o conteudo aqui (a
    paciente ja ve cada area na propria pagina), so a existencia e o volume.
    """
    return [
        {
            'area': 'Ciclo menstrual',
            'rota': '/ciclo',
            'quantidade': paciente.registros_ciclo.count(),
        },
        {
            'area': 'Sintomas',
            'rota': '/sintomas',
            'quantidade': paciente.registros_sintomas.count(),
        },
        {
            'area': 'Consultas',
            'rota': '/calendario',
            'quantidade': paciente.consultas.count(),
        },
        {
            'area': 'Eventos do tratamento',
            'rota': '/calendario',
            'quantidade': paciente.eventos.count(),
        },
        {
            'area': 'Medicamentos',
            'rota': '/medicamentos',
            'quantidade': paciente.medicamentos.count(),
        },
    ]


def _dados_do_usuario(usuario):
    """Monta o retrato consolidado dos dados pessoais do usuario."""
    perfil = getattr(usuario, 'perfil', None)
    dados = {
        'conta': {
            'usuario': usuario.username,
            'email': usuario.email,
            'membro_desde': _iso(usuario.date_joined),
            'ultimo_acesso': _iso(usuario.last_login),
        },
        'perfil': None,
        'paciente': None,
        'resumo_registros': [],
        'gerado_em': _iso(timezone.now()),
    }

    if perfil is not None:
        dados['perfil'] = {
            'nome_completo': perfil.nome_completo,
            'tipo_usuario': perfil.tipo_usuario,
            'tipo_usuario_display': perfil.get_tipo_usuario_display(),
            'telefone': perfil.telefone,
            'criado_em': _iso(perfil.criado_em),
            'atualizado_em': _iso(perfil.atualizado_em),
        }

    paciente = getattr(perfil, 'paciente', None) if perfil is not None else None
    if paciente is not None:
        responsavel = paciente.medica_responsavel
        dados['paciente'] = {
            'data_nascimento': _iso(paciente.data_nascimento),
            'tipo_sanguineo': paciente.tipo_sanguineo,
            'tipo_sanguineo_display': paciente.get_tipo_sanguineo_display(),
            'medicamentos_em_uso': paciente.medicamentos_em_uso,
            'observacoes_medicas': paciente.observacoes_medicas,
            'medica_responsavel': (
                str(responsavel.perfil) if responsavel else None
            ),
        }
        dados['resumo_registros'] = _resumo_registros(paciente)

    return dados


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meus_dados(request):
    """Acesso/portabilidade (LGPD): tudo o que a Amare guarda sobre voce."""
    return Response(_dados_do_usuario(request.user))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def solicitacoes(request):
    """GET: minhas solicitacoes. POST: abrir uma nova (correcao/exclusao)."""
    if request.method == 'GET':
        fila = SolicitacaoPrivacidade.objects.filter(usuario=request.user)
        return Response(SolicitacaoPrivacidadeSerializer(fila, many=True).data)

    entrada = SolicitacaoPrivacidadeSerializer(data=request.data)
    entrada.is_valid(raise_exception=True)
    entrada.save(usuario=request.user)
    return Response(entrada.data, status=201)
