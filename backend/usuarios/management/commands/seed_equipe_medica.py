"""Cadastra a equipe médica real da Clínica Amare como conteúdo institucional.

Diferente de `criar_usuarios_teste` (contas e casos fictícios de demonstração),
aqui entram as médicas REAIS da clínica — informação pública (nome, especialidade
e registros profissionais CRM/RQE) usada na página de equipe e nas especialidades.

As contas servem apenas como conteúdo: são criadas **inativas e sem senha
utilizável**, então ninguém entra por elas. A conta de teste da médica
(`medica_teste` / "Dra. Helena Costa"), usada pelos testes E2E, NÃO é tocada.

Uso:
    py manage.py seed_equipe_medica

Idempotente: pode rodar mais de uma vez sem duplicar registros.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from consultas.models import Especialidade
from usuarios.models import Medica, PerfilUsuario


# Especialidades reais da clínica (clinicaamare.com). "Reprodução humana"
# reusa, por nome, a especialidade já criada pelo seed de demonstração — o
# get_or_create por nome evita duplicar a linha.
ESPECIALIDADES = [
    {
        'nome': 'Reprodução humana',
        'descricao': (
            'Acompanhamento da fertilidade e tratamentos de reprodução '
            'assistida, do planejamento ao acompanhamento de cada etapa.'
        ),
    },
    {
        'nome': 'Ginecologia',
        'descricao': (
            'Cuidado integral da saúde da mulher em todas as fases da vida, '
            'com prevenção, diagnóstico e acompanhamento.'
        ),
    },
    {
        'nome': 'Cirurgia Ginecológica',
        'descricao': (
            'Procedimentos cirúrgicos ginecológicos, com foco em técnicas '
            'minimamente invasivas (videolaparoscopia e histeroscopia).'
        ),
    },
]

# Equipe médica real da Clínica Amare. `especialidades` lista os nomes das
# Especialidades (acima) às quais a médica é vinculada na página pública.
EQUIPE = [
    {
        'username': 'adriana_notaro',
        'nome_completo': 'Adriana Leal Griz Notaro',
        'especialidade': 'Reprodução Assistida',
        'crm': 'CRM/PE 17733',
        'rqe': '12206',
        'bio': (
            'Médica especialista em Reprodução Assistida, dedicada ao '
            'acompanhamento da fertilidade e aos tratamentos de reprodução '
            'humana na Clínica Amare.'
        ),
        'especialidades': ['Reprodução humana'],
    },
    {
        'username': 'ana_serafim',
        'nome_completo': 'Ana Caroline Paz Serafim',
        'especialidade': 'Videocirurgia Ginecológica',
        'crm': 'CRM/PE 17536',
        'rqe': '1194',
        'bio': (
            'Médica especialista em Videocirurgia Ginecológica, com atuação '
            'em cirurgia ginecológica minimamente invasiva na Clínica Amare.'
        ),
        'especialidades': ['Cirurgia Ginecológica', 'Ginecologia'],
    },
    {
        'username': 'mariana_nunes',
        'nome_completo': 'Mariana Corrêa Nunes',
        'especialidade': 'Reprodução Assistida',
        'crm': 'CRM/PE 17365',
        'rqe': '12331',
        'bio': (
            'Médica especialista em Reprodução Assistida, dedicada ao cuidado '
            'da fertilidade e aos tratamentos de reprodução humana na Clínica '
            'Amare.'
        ),
        'especialidades': ['Reprodução humana'],
    },
]


class Command(BaseCommand):
    help = (
        'Cadastra a equipe médica real da clínica (conteúdo público, contas '
        'inativas) e suas especialidades. Idempotente; não toca a medica_teste.'
    )

    def handle(self, *args, **options):
        especialidades = self._criar_especialidades()
        for dados in EQUIPE:
            self._criar_medica(dados, especialidades)

        self.stdout.write('')
        nomes = ', '.join(m['nome_completo'] for m in EQUIPE)
        self.stdout.write(self.style.SUCCESS('Equipe médica cadastrada.'))
        self.stdout.write(f'  Médicas: {nomes}.')
        self.stdout.write('')

    def _criar_especialidades(self):
        """Garante as especialidades reais; devolve um índice {nome: objeto}."""
        indice = {}
        for dados in ESPECIALIDADES:
            especialidade, _ = Especialidade.objects.get_or_create(
                nome=dados['nome']
            )
            especialidade.descricao = dados['descricao']
            especialidade.ativo = True
            especialidade.save()
            indice[especialidade.nome] = especialidade
        return indice

    def _criar_medica(self, dados, especialidades):
        usuario = self._conta_conteudo(dados['username'])
        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=usuario)
        perfil.tipo_usuario = PerfilUsuario.TIPO_MEDICA
        perfil.nome_completo = dados['nome_completo']
        perfil.save()

        medica, _ = Medica.objects.get_or_create(perfil=perfil)
        medica.crm = dados['crm']
        medica.rqe = dados['rqe']
        medica.especialidade = dados['especialidade']
        medica.bio = dados['bio']
        medica.save()

        vinculos = [
            especialidades[nome]
            for nome in dados['especialidades']
            if nome in especialidades
        ]
        medica.especialidades.set(vinculos)

    def _conta_conteudo(self, username):
        """Conta de conteúdo: inativa e sem senha utilizável (não loga).

        Na criação, marca a senha como inutilizável; em re-execuções preserva o
        que houver (sem reabrir acesso). Mantém a conta inativa nos dois casos.
        """
        User = get_user_model()
        usuario, criado = User.objects.get_or_create(username=username)
        if criado:
            usuario.set_unusable_password()
        usuario.is_active = False
        usuario.save()
        return usuario
