"""Views de consultas e próximos compromissos.

Function-based com `@api_view` — sem Generic Views, ViewSets ou Django Forms
(regra da disciplina). Só pacientes autenticadas conseguem ler suas próprias
consultas; médicas e admins recebem lista vazia (visão delas é o Admin do Django).
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from usuarios.models import Medica, Paciente, PerfilUsuario

from .models import Consulta, Especialidade, EventoTratamento
from .serializers import (
    ConsultaSerializer,
    EspecialidadePublicaSerializer,
    EventoTratamentoSerializer,
    serializar_membro_equipe,
)


def _obter_paciente(request):
    """Devolve a Paciente associada ao usuário autenticado, ou None."""
    try:
        return request.user.perfil.paciente
    except (AttributeError, Paciente.DoesNotExist):
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_consultas(request):
    """Lista todas as consultas da paciente autenticada, ordenadas por data."""
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response(
            {'detail': 'Apenas pacientes podem listar consultas.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    consultas = (
        Consulta.objects.filter(paciente=paciente)
        .select_related('medica__perfil__usuario', 'especialidade')
    )
    serializer = ConsultaSerializer(consultas, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_proximas_consultas(request):
    """Lista até 3 consultas agendadas nos próximos 7 dias.

    Usado pelo banner da página inicial. Devolve lista vazia se o usuário
    não for paciente (em vez de 404), para o banner simplesmente sumir.
    """
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response([])
    agora = timezone.now()
    limite = agora + timedelta(days=7)
    proximas = (
        Consulta.objects.filter(
            paciente=paciente,
            data_horario__gte=agora,
            data_horario__lte=limite,
            status=Consulta.STATUS_AGENDADA,
        )
        .select_related('medica__perfil__usuario', 'especialidade')[:3]
    )
    serializer = ConsultaSerializer(proximas, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_especialidades(request):
    """Lista as especialidades ativas com as médicas relacionadas.

    Conteúdo de referência público (como o dicionário): dispensa login.
    """
    especialidades = Especialidade.objects.filter(ativo=True).prefetch_related(
        'medicas__perfil__usuario'
    )
    serializer = EspecialidadePublicaSerializer(especialidades, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def detalhar_especialidade(request, pk):
    """Detalha uma especialidade ativa, com as médicas relacionadas.

    Conteúdo público (como a listagem). 404 se não existir ou estiver inativa.
    """
    try:
        especialidade = (
            Especialidade.objects.filter(ativo=True)
            .prefetch_related('medicas__perfil__usuario')
            .get(pk=pk)
        )
    except Especialidade.DoesNotExist:
        return Response(
            {'detail': 'Especialidade não encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = EspecialidadePublicaSerializer(especialidade)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_equipe_medica(request):
    """Lista a equipe médica da clínica (conteúdo público).

    Traz as médicas cadastradas com perfil de médica, com os dados públicos
    (nome, especialidade, CRM, RQE, apresentação) e as especialidades ativas a
    que cada uma está vinculada. Conteúdo institucional: dispensa login.
    """
    medicas = (
        Medica.objects.filter(
            perfil__tipo_usuario=PerfilUsuario.TIPO_MEDICA
        )
        .select_related('perfil__usuario')
        .prefetch_related('especialidades')
        .order_by('perfil__nome_completo', 'perfil__usuario__username')
    )
    return Response([serializar_membro_equipe(medica) for medica in medicas])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_eventos(request):
    """Lista os eventos do tratamento da paciente autenticada (PROJ-15).

    Escopo por dono: a paciente só enxerga os próprios eventos.
    """
    paciente = _obter_paciente(request)
    if paciente is None:
        return Response(
            {'detail': 'Apenas pacientes podem listar eventos.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    eventos = EventoTratamento.objects.filter(paciente=paciente)
    serializer = EventoTratamentoSerializer(eventos, many=True)
    return Response(serializer.data)
