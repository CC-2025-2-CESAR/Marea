"""Painel administrativo da clínica (PR8).

Endpoints exclusivos da administração (`IsAdminClinica`), function-based: visão
geral com contagens, leitura da trilha de auditoria e CRUD do conteúdo do
dicionário. O frontend vive em `/gestao` (a rota `/admin` pertence ao Django
admin e ao catch-all do SPA).

Os demais tipos de conteúdo (tratamentos, orientações, especialidades, apoio)
seguem exatamente o mesmo padrão deste CRUD e entram em fatias seguintes.
"""

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from auditoria.models import LogAtividade
from dicionario.models import TermoDicionario
from usuarios.models import ConviteAcesso, Medica, Paciente
from usuarios.permissions import IsAdminClinica

from .serializers import LogAtividadeSerializer, TermoAdminSerializer

# Quantos eventos de auditoria a tela lista por vez (os mais recentes).
LIMITE_LOGS = 100


@api_view(['GET'])
@permission_classes([IsAdminClinica])
def visao_geral(request):
    """Contagens para o painel inicial da administração."""
    return Response(
        {
            'pacientes': Paciente.objects.count(),
            'medicas': Medica.objects.count(),
            'convites_pendentes': ConviteAcesso.objects.filter(
                status=ConviteAcesso.STATUS_PENDENTE
            ).count(),
            'termos': TermoDicionario.objects.count(),
            'termos_inativos': TermoDicionario.objects.filter(ativo=False).count(),
            'logs': LogAtividade.objects.count(),
        }
    )


@api_view(['GET'])
@permission_classes([IsAdminClinica])
def listar_logs(request):
    """Lista os eventos mais recentes da trilha de auditoria."""
    logs = LogAtividade.objects.select_related(
        'usuario', 'paciente__perfil__usuario'
    )[:LIMITE_LOGS]
    return Response(LogAtividadeSerializer(logs, many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminClinica])
def termos(request):
    """Lista (todos, inclusive inativos) ou cria um termo do dicionário."""
    if request.method == 'POST':
        serializer = TermoAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    busca = request.query_params.get('busca', '').strip()
    queryset = TermoDicionario.objects.all()
    if busca:
        queryset = queryset.filter(
            Q(termo__icontains=busca)
            | Q(definicao__icontains=busca)
            | Q(categoria__icontains=busca)
        )
    return Response(TermoAdminSerializer(queryset, many=True).data)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdminClinica])
def termo_detalhe(request, pk):
    """Detalha, edita ou remove um termo do dicionário."""
    try:
        termo = TermoDicionario.objects.get(pk=pk)
    except TermoDicionario.DoesNotExist:
        return Response(
            {'detail': 'Termo não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        termo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method in ('PUT', 'PATCH'):
        serializer = TermoAdminSerializer(
            termo, data=request.data, partial=(request.method == 'PATCH')
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    return Response(TermoAdminSerializer(termo).data)
