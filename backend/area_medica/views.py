"""Views da área da médica.

Function-based com `@api_view` (regra da disciplina — sem Generic Views,
ViewSets ou Django Forms).

Política de acesso (aplicada no backend, nunca confiando no frontend):
- **Leitura:** toda médica (e a administração) enxerga as pacientes da clínica.
- **Escrita:** só a médica responsável, quem assumiu o atendimento (vínculo de
  equipe ativo) ou a administração — verificada por `papel_no_cuidado`.

Ver todas não é poder editar todas: a barreira de escrita é separada da de
visualização. Acessos sensíveis — ver/editar a paciente de outra médica e
assumir o atendimento — ficam registrados na trilha de auditoria
(`LogAtividade`), exigência de LGPD e do controle por papéis.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from auditoria.models import LogAtividade
from usuarios.models import EquipeCuidadoPaciente, Paciente
from usuarios.permissions import (
    IsMedicaOuAdmin,
    PAPEIS_COM_ESCRITA,
    PAPEL_ACESSO_ASSUMIDO,
    PAPEL_ACESSO_VISUALIZACAO,
    eh_admin,
    medica_do_usuario,
    papel_no_cuidado,
)

from .serializers import (
    AssumirAtendimentoSerializer,
    ConsultaCriarSerializer,
    MOTIVOS_ASSUMIR,
    MOTIVOS_COLABORACAO,
    MedicamentoCriarSerializer,
    PacienteDetalheSerializer,
    PacienteResumoSerializer,
    permissao_da_paciente,
)


def _pacientes_visiveis(request):
    """Pacientes que o usuário pode VER: todas as da clínica.

    Uma médica sem cadastro de Medica (perfil incompleto) não enxerga nada.
    """
    if eh_admin(request.user):
        return Paciente.objects.all()
    if medica_do_usuario(request.user) is None:
        return Paciente.objects.none()
    return Paciente.objects.all()


def _obter_paciente(request, paciente_id):
    """Paciente visível pelo usuário (escopo de leitura), ou None."""
    return _pacientes_visiveis(request).filter(pk=paciente_id).first()


def _registrar_log(request, acao, *, entidade='', entidade_id=None,
                   paciente=None, motivo=''):
    """Acrescenta um evento à trilha de auditoria (nunca edita nem apaga)."""
    LogAtividade.objects.create(
        usuario=request.user,
        acao=acao,
        entidade=entidade,
        entidade_id=entidade_id,
        paciente=paciente,
        motivo=motivo,
    )


_NAO_ENCONTRADA = {'detail': 'Paciente não encontrada.'}
_SEM_PERMISSAO_ESCRITA = {
    'detail': (
        'Você pode visualizar esta paciente, mas não editá-la. '
        'Assuma o atendimento para registrar alterações.'
    )
}


@api_view(['GET'])
@permission_classes([IsMedicaOuAdmin])
def listar_pacientes(request):
    """Lista as pacientes da clínica, com o status de acesso de quem pede."""
    pacientes = _pacientes_visiveis(request).select_related('perfil__usuario')
    serializer = PacienteResumoSerializer(
        pacientes, many=True, context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsMedicaOuAdmin])
def detalhe_paciente(request, paciente_id):
    """Detalhe de uma paciente: dados, consultas e medicamentos.

    Ver a paciente de outra médica (visualização ou atendimento assumido) é
    acesso sensível e fica registrado na trilha; ver a própria, não.
    """
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)
    if papel_no_cuidado(request.user, paciente) in (
        PAPEL_ACESSO_VISUALIZACAO,
        PAPEL_ACESSO_ASSUMIDO,
    ):
        _registrar_log(
            request,
            LogAtividade.ACAO_VISUALIZAR_PACIENTE,
            entidade=LogAtividade.ENTIDADE_PACIENTE,
            entidade_id=paciente.id,
            paciente=paciente,
        )
    serializer = PacienteDetalheSerializer(
        paciente, context={'request': request}
    )
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def criar_consulta(request, paciente_id):
    """Agenda uma consulta. Exige vínculo de escrita com a paciente."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)
    papel = papel_no_cuidado(request.user, paciente)
    if papel not in PAPEIS_COM_ESCRITA:
        return Response(
            _SEM_PERMISSAO_ESCRITA, status=status.HTTP_403_FORBIDDEN
        )

    serializer = ConsultaCriarSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(paciente=paciente, medica=medica_do_usuario(request.user))
    if papel == PAPEL_ACESSO_ASSUMIDO:
        _registrar_log(
            request,
            LogAtividade.ACAO_CRIAR_CONSULTA,
            entidade=LogAtividade.ENTIDADE_CONSULTA,
            entidade_id=serializer.data.get('id'),
            paciente=paciente,
        )
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def criar_medicamento(request, paciente_id):
    """Cadastra um medicamento. Exige vínculo de escrita com a paciente."""
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)
    papel = papel_no_cuidado(request.user, paciente)
    if papel not in PAPEIS_COM_ESCRITA:
        return Response(
            _SEM_PERMISSAO_ESCRITA, status=status.HTTP_403_FORBIDDEN
        )

    serializer = MedicamentoCriarSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(paciente=paciente)
    if papel == PAPEL_ACESSO_ASSUMIDO:
        _registrar_log(
            request,
            LogAtividade.ACAO_CRIAR_MEDICAMENTO,
            entidade=LogAtividade.ENTIDADE_MEDICAMENTO,
            entidade_id=serializer.data.get('id'),
            paciente=paciente,
        )
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsMedicaOuAdmin])
def assumir_atendimento(request, paciente_id):
    """Assume o atendimento de uma paciente de outra médica (motivo + log).

    Cria (ou reaproveita) um vínculo de equipe ativo, liberando a escrita, e
    registra a ação na trilha de auditoria. A administração já edita todas as
    pacientes e a responsável já tem acesso — para elas, assumir não se aplica.
    """
    paciente = _obter_paciente(request, paciente_id)
    if paciente is None:
        return Response(_NAO_ENCONTRADA, status=status.HTTP_404_NOT_FOUND)

    medica = medica_do_usuario(request.user)
    if medica is None:
        return Response(
            {'detail': 'A administração já edita as pacientes; não há o que assumir.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if paciente.medica_responsavel_id == medica.id:
        return Response(
            {'detail': 'Você já é a médica responsável por esta paciente.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = AssumirAtendimentoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    motivo = serializer.validated_data['motivo']
    observacao = serializer.validated_data['observacao']

    papel_vinculo = (
        EquipeCuidadoPaciente.PAPEL_COLABORADORA
        if motivo in MOTIVOS_COLABORACAO
        else EquipeCuidadoPaciente.PAPEL_SUBSTITUTA
    )
    vinculo, criado = EquipeCuidadoPaciente.objects.get_or_create(
        paciente=paciente,
        medica=medica,
        ativa=True,
        defaults={'papel': papel_vinculo},
    )

    motivo_texto = dict(MOTIVOS_ASSUMIR)[motivo]
    if observacao:
        motivo_texto = f'{motivo_texto}: {observacao}'
    _registrar_log(
        request,
        LogAtividade.ACAO_ASSUMIR_ATENDIMENTO,
        entidade=LogAtividade.ENTIDADE_EQUIPE,
        entidade_id=vinculo.id,
        paciente=paciente,
        motivo=motivo_texto,
    )

    return Response(
        {
            'detail': 'Atendimento assumido. Você já pode registrar alterações.',
            'permissao': permissao_da_paciente({'request': request}, paciente),
            'vinculo': {
                'id': vinculo.id,
                'papel': vinculo.papel,
                'ja_estava_ativo': not criado,
            },
        },
        status=status.HTTP_201_CREATED if criado else status.HTTP_200_OK,
    )
