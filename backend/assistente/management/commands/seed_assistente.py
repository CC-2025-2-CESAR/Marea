"""Popula as respostas guiadas do Assistente Amare (conteúdo de referência).

Por que um comando, e não `loaddata`: o conteúdo do assistente é editável pela
clínica no Django Admin. Recarregar uma fixture a cada deploy sobrescreveria
essas edições; e, como a produção já foi semeada com as respostas iniciais, um
`loaddata` guardado por "tabela vazia" também nunca entregaria as intenções
novas. Este comando resolve os dois casos: faz `get_or_create` por `intencao`,
então **só cria o que falta** — preserva o que a clínica ajustou e acrescenta as
intenções ainda ausentes. As ações (atalhos) são criadas apenas quando a
resposta é nova.

Uso:
    py manage.py seed_assistente

Idempotente: pode rodar a cada inicialização sem duplicar nem sobrescrever.

Segurança: nenhuma resposta aqui diagnostica ou orienta mudança de dose — temas
sensíveis (sangramento, dor forte, parar/ajustar medicação, emergência...) são
interceptados antes pela própria view e encaminhados à equipe da clínica.
"""

from django.core.management.base import BaseCommand

from assistente.models import RespostaAssistente


# Telefone de contato (fictício; a clínica ajusta no painel). Mantido igual ao
# usado pela view em temas sensíveis, para a paciente ver sempre o mesmo número.
TELEFONE_CLINICA = '(81) 3000-0000'

# Catálogo curado de respostas. Cada `palavras_chave` é quebrada em PALAVRAS
# isoladas pela view (vírgula/espaço viram separador) e casada por substring sem
# acento — então use tokens curtos e específicos, evitando palavras genéricas
# ("o", "que", "e") que casariam com quase tudo.
RESPOSTAS = [
    {
        'intencao': 'consultas',
        'pergunta_exemplo': 'Como vejo minhas próximas consultas?',
        'palavras_chave': 'consulta, consultas, agenda, agendada, marcada, '
        'proxima, horario, calendario',
        'resposta': (
            'Suas consultas ficam no calendário da Amare, com data, horário e '
            'local. Toque em um dia para ver o que está marcado naquela data.'
        ),
        'categoria': 'Agenda',
        'fonte_rotulo': 'Calendário',
        'fonte_rota': '/calendario',
        'prioridade': 10,
        'acoes': [('Ver calendário', '/calendario')],
    },
    {
        'intencao': 'medicamentos',
        'pergunta_exemplo': 'Onde acompanho meus medicamentos?',
        'palavras_chave': 'medicamento, medicamentos, remedio, remedios, dose, '
        'horario, tomar, instrucao',
        'resposta': (
            'Na página de Medicamentos você acompanha o que tomar, a dose, o '
            'horário e as instruções de cada um, e marca como tomado quando '
            'usar. Importante: nunca ajuste a dose por conta própria — quem '
            'orienta mudanças é a sua equipe.'
        ),
        'categoria': 'Medicação',
        'fonte_rotulo': 'Medicamentos',
        'fonte_rota': '/medicamentos',
        'prioridade': 10,
        'acoes': [('Ver medicamentos', '/medicamentos')],
    },
    {
        'intencao': 'agenda_hoje',
        'pergunta_exemplo': 'O que eu tenho hoje?',
        'palavras_chave': 'hoje, agora, diario',
        'resposta': (
            'No início e no calendário você vê o que está marcado para hoje — '
            'as consultas e as medicações do dia. Toque no dia de hoje no '
            'calendário para ver os detalhes.'
        ),
        'categoria': 'Agenda',
        'fonte_rotulo': 'Calendário',
        'fonte_rota': '/calendario',
        'prioridade': 12,
        'acoes': [
            ('Ver calendário', '/calendario'),
            ('Ver medicamentos', '/medicamentos'),
        ],
    },
    {
        'intencao': 'preparo_coleta',
        'pergunta_exemplo': 'Como me preparo para a coleta de óvulos?',
        'palavras_chave': 'coleta, ovulos, puncao, captacao, preparar, '
        'preparo, jejum',
        'resposta': (
            'Para a coleta de óvulos, a equipe costuma pedir um período de '
            'jejum por causa da sedação. Use roupas confortáveis, chegue com '
            'antecedência e leve um acompanhante. Siga sempre as instruções '
            'específicas da sua equipe.'
        ),
        'categoria': 'Procedimentos',
        'fonte_rotulo': 'Orientações',
        'fonte_rota': '/orientacoes',
        'prioridade': 5,
        'acoes': [('Ver orientações', '/orientacoes')],
    },
    {
        'intencao': 'pos_transferencia',
        'pergunta_exemplo': 'O que fazer depois da transferência embrionária?',
        'palavras_chave': 'transferencia, embriao, embrionaria, depois, apos, '
        'cuidados, repouso',
        'resposta': (
            'Depois da transferência embrionária você pode retomar a rotina '
            'normalmente, evitando apenas esforços muito intensos. Mantenha as '
            'medicações conforme a prescrição e, em caso de dúvida ou '
            'desconforto, fale com a equipe.'
        ),
        'categoria': 'Pós-procedimento',
        'fonte_rotulo': 'Orientações',
        'fonte_rota': '/orientacoes',
        'prioridade': 5,
        'acoes': [('Ver orientações', '/orientacoes')],
    },
    {
        'intencao': 'ansiedade',
        'pergunta_exemplo': 'Estou ansiosa esperando o resultado.',
        'palavras_chave': 'ansiedade, ansiosa, medo, angustia, nervosa, '
        'espera, resultado, emocional, apoio',
        'resposta': (
            'A espera pelo resultado pode ser delicada. Mantenha atividades '
            'que te fazem bem, apoie-se em pessoas de confiança e lembre que '
            'sentir ansiedade é natural. A Amare tem conteúdos e apoio '
            'emocional para te acompanhar nesse período.'
        ),
        'categoria': 'Apoio emocional',
        'fonte_rotulo': 'Apoio emocional',
        'fonte_rota': '/apoio',
        'prioridade': 8,
        'acoes': [('Apoio emocional', '/apoio')],
    },
    {
        'intencao': 'registrar_sintoma',
        'pergunta_exemplo': 'Como registro um sintoma?',
        'palavras_chave': 'sintoma, sintomas, anotar, enjoo, inchaco, sentindo',
        'resposta': (
            'Você pode registrar como está se sentindo na página de Sintomas — '
            'anote o tipo, uma descrição curta e a intensidade. Isso ajuda a '
            'equipe a acompanhar a sua evolução.'
        ),
        'categoria': 'Acompanhamento',
        'fonte_rotulo': 'Sintomas',
        'fonte_rota': '/sintomas',
        'prioridade': 6,
        'acoes': [('Registrar sintoma', '/sintomas')],
    },
    {
        'intencao': 'ciclo',
        'pergunta_exemplo': 'Como acompanho meu ciclo?',
        'palavras_chave': 'ciclo, menstruacao, menstrual, periodo, fertil, '
        'ovulacao',
        'resposta': (
            'Na página de Ciclo você registra as fases do seu ciclo e vê '
            'estimativas baseadas nos seus próprios registros. As previsões '
            'são uma estimativa e não substituem a orientação da equipe.'
        ),
        'categoria': 'Acompanhamento',
        'fonte_rotulo': 'Ciclo',
        'fonte_rota': '/ciclo',
        'prioridade': 6,
        'acoes': [('Acompanhar ciclo', '/ciclo')],
    },
    {
        'intencao': 'meus_registros',
        'pergunta_exemplo': 'Onde vejo meus registros?',
        'palavras_chave': 'registros, registro, historico, anotacoes, anotei, '
        'registrei',
        'resposta': (
            'Seus registros ficam reunidos no seu Perfil, em "Meus registros" '
            '— ali você revê os sintomas e o ciclo que anotou. Também dá para '
            'acompanhar cada um direto nas páginas de Sintomas e de Ciclo.'
        ),
        'categoria': 'Acompanhamento',
        'fonte_rotulo': 'Meu perfil',
        'fonte_rota': '/perfil',
        'prioridade': 7,
        'acoes': [
            ('Meus sintomas', '/sintomas'),
            ('Meu ciclo', '/ciclo'),
        ],
    },
    {
        'intencao': 'sobre_fiv',
        'pergunta_exemplo': 'O que é a FIV?',
        'palavras_chave': 'fiv, fertilizacao, vitro, reproducao, funciona',
        'resposta': (
            'A fertilização in vitro (FIV) é um tratamento de reprodução '
            'assistida feito em etapas, do estímulo à transferência do '
            'embrião. Você encontra a explicação de cada etapa em Tratamentos '
            'e o significado dos termos no Dicionário.'
        ),
        'categoria': 'Sobre o tratamento',
        'fonte_rotulo': 'Tratamentos',
        'fonte_rota': '/tratamentos',
        'prioridade': 7,
        'acoes': [
            ('Ver tratamentos', '/tratamentos'),
            ('Abrir dicionário', '/dicionario'),
        ],
    },
    {
        'intencao': 'tratamentos',
        'pergunta_exemplo': 'Quais tratamentos a Amare oferece?',
        'palavras_chave': 'tratamento, tratamentos, procedimento, '
        'procedimentos, oferece, opcoes, inseminacao, diu',
        'resposta': (
            'A Amare oferece acompanhamento em ginecologia, cirurgia '
            'ginecológica e reprodução humana — incluindo procedimentos como '
            'inseminação e fertilização in vitro. Cada etapa é explicada na '
            'página de Tratamentos.'
        ),
        'categoria': 'Sobre o tratamento',
        'fonte_rotulo': 'Tratamentos',
        'fonte_rota': '/tratamentos',
        'prioridade': 6,
        'acoes': [('Ver tratamentos', '/tratamentos')],
    },
    {
        'intencao': 'equipe_medica',
        'pergunta_exemplo': 'Quais médicas atendem na Amare?',
        'palavras_chave': 'equipe, medicas, profissionais, especialista, '
        'doutora, atende, atendem, ginecologista',
        'resposta': (
            'A Amare tem uma equipe de médicas especialistas em saúde da '
            'mulher e reprodução humana. Você vê o perfil de cada uma, com '
            'especialidade e registros profissionais, na página Equipe médica.'
        ),
        'categoria': 'A clínica',
        'fonte_rotulo': 'Equipe médica',
        'fonte_rota': '/equipe-medica',
        'prioridade': 7,
        'acoes': [('Ver equipe médica', '/equipe-medica')],
    },
    {
        'intencao': 'dicionario',
        'pergunta_exemplo': 'O que significa esse termo?',
        'palavras_chave': 'significa, significado, termo, termos, sigla, '
        'glossario, dicionario',
        'resposta': (
            'No Dicionário você encontra, em linguagem simples, o significado '
            'dos termos e siglas que aparecem no seu acompanhamento. É só '
            'buscar pela palavra que ficou em dúvida.'
        ),
        'categoria': 'A clínica',
        'fonte_rotulo': 'Dicionário',
        'fonte_rota': '/dicionario',
        'prioridade': 5,
        'acoes': [('Abrir dicionário', '/dicionario')],
    },
    {
        'intencao': 'privacidade',
        'pergunta_exemplo': 'Como a Amare cuida dos meus dados?',
        'palavras_chave': 'privacidade, dados, lgpd, excluir, exclusao, '
        'apagar, consentimento',
        'resposta': (
            'Você controla seus dados na Amare: em "Meus dados" dá para ver e '
            'baixar suas informações e pedir alteração ou remoção. A página de '
            'Privacidade explica quais dados usamos e por quê.'
        ),
        'categoria': 'A clínica',
        'fonte_rotulo': 'Meus dados',
        'fonte_rota': '/meus-dados',
        'prioridade': 5,
        'acoes': [
            ('Meus dados', '/meus-dados'),
            ('Política de privacidade', '/privacidade'),
        ],
    },
    {
        'intencao': 'contato',
        'pergunta_exemplo': 'Quero falar com a clínica.',
        'palavras_chave': 'contato, falar, telefone, ligar, clinica, '
        'atendimento, secretaria, recepcao',
        'resposta': (
            'Para falar com a Clínica Amare, ligue para '
            f'{TELEFONE_CLINICA}, de segunda a sexta, das 8h às 18h. Em caso '
            'de emergência, procure atendimento médico imediato.'
        ),
        'categoria': 'A clínica',
        'fonte_rotulo': '',
        'fonte_rota': '',
        'prioridade': 9,
        'acoes': [],
    },
]


class Command(BaseCommand):
    help = (
        'Popula as respostas do Assistente Amare (conteúdo guiado). '
        'Idempotente: cria apenas o que falta e preserva edições da clínica.'
    )

    def handle(self, *args, **options):
        criadas = 0
        for definicao in RESPOSTAS:
            if self._criar_resposta(definicao):
                criadas += 1

        total = RespostaAssistente.objects.count()
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Assistente Amare: {criadas} resposta(s) nova(s); '
                f'{total} no total.'
            )
        )
        self.stdout.write('')

    def _criar_resposta(self, definicao):
        """Garante a resposta da intenção; cria as ações só se for nova.

        Retorna True quando a resposta foi criada agora (False se já existia,
        caso em que nada é sobrescrito — respeita o que a clínica editou).
        """
        resposta, criada = RespostaAssistente.objects.get_or_create(
            intencao=definicao['intencao'],
            defaults={
                'pergunta_exemplo': definicao['pergunta_exemplo'],
                'palavras_chave': definicao['palavras_chave'],
                'resposta': definicao['resposta'],
                'categoria': definicao['categoria'],
                'fonte_rotulo': definicao['fonte_rotulo'],
                'fonte_rota': definicao['fonte_rota'],
                'prioridade': definicao['prioridade'],
                'ativo': True,
            },
        )
        if not criada:
            return False

        for ordem, (rotulo, rota) in enumerate(definicao['acoes']):
            resposta.acoes.create(rotulo=rotulo, rota=rota, ordem=ordem)
        return True
