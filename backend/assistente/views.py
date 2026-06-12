"""Views do Assistente Amare (function-based, regra da disciplina).

O assistente é guiado e seguro: classifica a pergunta por palavra-chave sobre as
respostas cadastradas e devolve conteúdo curado, com fonte e atalhos para as
páginas da Amare. Nunca diagnostica nem ajusta doses; diante de um tema sensível
(sangramento, dor forte, febre, mudar ou parar medicação...) encaminha para a
equipe da clínica, antes de qualquer tentativa de resposta. Sem serviço externo.
"""

import unicodedata

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import RespostaAssistente
from .serializers import (
    AcaoAssistenteSerializer,
    PerguntaSerializer,
    SugestaoSerializer,
)

# Aviso fixo em toda resposta — deixa claro o papel do assistente.
DISCLAIMER = (
    'O Assistente Amare ajuda com informações gerais da Amare e não substitui a '
    'orientação da sua equipe médica. Ele não faz diagnósticos nem ajusta doses '
    'de medicação.'
)

# Contato para temas sensíveis (fictício — a clínica ajusta no painel).
CONTATO_CLINICA = (
    'Fale com a Clínica Amare pelo (81) 3000-0000, de segunda a sexta, das 8h '
    'às 18h. Em caso de emergência, procure atendimento médico imediato.'
)

# Encaminhamento seguro para qualquer tema sensível.
RESPOSTA_SENSIVEL = (
    'Esse assunto é importante e precisa da avaliação de alguém da equipe. Não '
    'posso orientar sobre sintomas, diagnósticos ou mudanças na medicação. '
    + CONTATO_CLINICA
)

# Quando nada casa.
RESPOSTA_SEM_MATCH = (
    'Ainda não sei responder isso por aqui. Você pode reformular a pergunta, '
    'escolher uma das sugestões ou falar com a clínica.'
)

# Substrings (sem acento) que disparam o encaminhamento seguro antes de qualquer
# tentativa de resposta. Foco em urgência e em mudança de medicação.
TERMOS_SENSIVEIS = (
    'parar de tomar',
    'parar a medicacao',
    'parar o remedio',
    'parar o medicamento',
    'suspender',
    'aumentar a dose',
    'diminuir a dose',
    'dobrar a dose',
    'mudar a dose',
    'trocar a medicacao',
    'trocar o remedio',
    'sangramento',
    'sangrando',
    'dor forte',
    'dor intensa',
    'muita dor',
    'febre',
    'desmai',
    'emergencia',
    'urgente',
    'aborto',
    'perdi o bebe',
)


def _normalizar(texto):
    """Minúsculas e sem acento, para casar palavras de forma robusta."""
    nfkd = unicodedata.normalize('NFKD', (texto or '').lower())
    return ''.join(c for c in nfkd if not unicodedata.combining(c))


def _e_sensivel(pergunta_norm):
    return any(termo in pergunta_norm for termo in TERMOS_SENSIVEIS)


def _classificar(pergunta_norm):
    """Resposta ativa com mais palavras-chave presentes na pergunta, ou None.

    A queryset vem ordenada por -prioridade, então, em empate de pontuação, a
    primeira encontrada (de maior prioridade) prevalece.
    """
    melhor = None
    melhor_score = 0
    for resposta in RespostaAssistente.objects.filter(ativo=True):
        termos = [
            _normalizar(t)
            for t in resposta.palavras_chave.replace(',', ' ').split()
        ]
        score = sum(1 for t in termos if t and t in pergunta_norm)
        if score > melhor_score:
            melhor, melhor_score = resposta, score
    return melhor


def _envelope(resposta, *, intencao=None, sensivel=False, fonte=None, acoes=None):
    return {
        'intencao': intencao,
        'encontrou': intencao is not None,
        'resposta': resposta,
        'sensivel': sensivel,
        'fonte': fonte,
        'acoes': acoes or [],
        'disclaimer': DISCLAIMER,
    }


def _resposta_curada(resposta):
    fonte = None
    if resposta.fonte_rotulo or resposta.fonte_rota:
        fonte = {'rotulo': resposta.fonte_rotulo, 'rota': resposta.fonte_rota}
    texto = resposta.resposta
    if resposta.sensivel:
        texto = f'{texto}\n\n{CONTATO_CLINICA}'
    return _envelope(
        texto,
        intencao=resposta.intencao,
        sensivel=resposta.sensivel,
        fonte=fonte,
        acoes=AcaoAssistenteSerializer(resposta.acoes.all(), many=True).data,
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def assistente(request):
    """GET: perguntas sugeridas (chips). POST: responde a uma pergunta."""
    if request.method == 'GET':
        sugestoes = RespostaAssistente.objects.filter(ativo=True)
        return Response(
            {
                'disclaimer': DISCLAIMER,
                'sugestoes': SugestaoSerializer(sugestoes, many=True).data,
            }
        )

    entrada = PerguntaSerializer(data=request.data)
    entrada.is_valid(raise_exception=True)
    pergunta_norm = _normalizar(entrada.validated_data['pergunta'])

    if _e_sensivel(pergunta_norm):
        return Response(_envelope(RESPOSTA_SENSIVEL, sensivel=True))

    resposta = _classificar(pergunta_norm)
    if resposta is not None:
        return Response(_resposta_curada(resposta))

    return Response(_envelope(RESPOSTA_SEM_MATCH))
