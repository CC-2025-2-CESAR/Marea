"""Cria os dados fictícios de demonstração da Amare para uso local e em demos.

Cria as contas de teste — duas pacientes baseadas nas personas do projeto
(Renata Cegonha e Amanda Coelho), uma médica e uma administradora —, o vínculo
Médica↔Paciente e o conteúdo clínico de cada paciente (especialidades,
consultas e medicamentos). Assim a área da médica já abre com casos reais de
acompanhamento.

Uso:
    py manage.py criar_usuarios_teste

Idempotente: pode ser executado mais de uma vez sem duplicar registros. Senha
padrão para todas as contas: `amare123`.

Nunca use estes dados em produção real — são fictícios, apenas para
desenvolvimento e demonstração.
"""

from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from consultas.models import Consulta, Especialidade
from medicamentos.models import Medicamento
from usuarios.models import Medica, Paciente, PerfilUsuario


SENHA_PADRAO = 'amare123'

# Conta de paciente genérica usada antes das personas. É removida no seed para
# que a área da médica passe a refletir apenas as pacientes de demonstração.
USUARIO_LEGADO = 'paciente_teste'

ESPECIALIDADES = [
    {
        'nome': 'Reprodução humana',
        'descricao': 'Acompanhamento de fertilidade e tratamentos de reprodução assistida.',
    },
    {
        'nome': 'Endocrinologia',
        'descricao': 'Avaliação hormonal e função da tireoide.',
    },
    {
        'nome': 'Psicologia',
        'descricao': 'Apoio emocional durante o tratamento.',
    },
]

# Pacientes baseadas nas personas do projeto. O login é o primeiro nome de cada
# uma. Cada paciente já vem com vínculo à médica responsável, consultas (com
# datas relativas a hoje, para sempre haver casos passados e futuros) e
# medicamentos coerentes com a sua história.
PACIENTES = [
    {
        'username': 'renata',
        'email': 'renata@amare.test',
        'nome_completo': 'Renata Cegonha',
        'telefone': '(81) 99777-3030',
        'data_nascimento': '1994-02-20',
        'tipo_sanguineo': 'A+',
        'medicamentos_em_uso': 'Ácido fólico, gonadotrofina e vitamina B12.',
        'observacoes_medicas': (
            'Fertilização in vitro com doação de sêmen (produção independente). '
            'Prefere comunicação clara e frequente sobre cada etapa. '
            'Vegetariana: atenção a ferritina e vitamina B12.'
        ),
        'consultas': [
            {
                'especialidade': 'Reprodução humana',
                'com_medica': True,
                'dias': -13,
                'hora': (15, 0),
                'local': 'Clínica Amare - Sala 3',
                'status': Consulta.STATUS_REALIZADA,
                'observacoes': 'Planejamento do ciclo de FIV e escolha do doador no banco de sêmen.',
            },
            {
                'especialidade': 'Reprodução humana',
                'com_medica': True,
                'dias': 13,
                'hora': (9, 30),
                'local': 'Clínica Amare - Sala 3',
                'status': Consulta.STATUS_AGENDADA,
                'observacoes': 'Ultrassom de acompanhamento folicular durante o estímulo ovariano.',
            },
            {
                'especialidade': 'Endocrinologia',
                'com_medica': False,
                'dias': 20,
                'hora': (11, 0),
                'local': 'Clínica Amare - Sala 1',
                'status': Consulta.STATUS_AGENDADA,
                'observacoes': 'Avaliação de exames hormonais e do perfil nutricional vegetariano.',
            },
        ],
        'medicamentos': [
            {
                'nome': 'Ácido fólico',
                'dose': '1 comprimido 5mg',
                'hora': (8, 0),
                'instrucoes': 'Tomar após o café da manhã, com água.',
            },
            {
                'nome': 'Gonadotrofina',
                'dose': 'Conforme prescrição',
                'hora': (20, 0),
                'instrucoes': 'Aplicação subcutânea no fim do dia, sempre no mesmo horário.',
            },
            {
                'nome': 'Vitamina B12',
                'dose': '1 comprimido',
                'hora': (8, 0),
                'instrucoes': 'Importante para dietas vegetarianas. Tomar junto com o ácido fólico.',
            },
        ],
    },
    {
        'username': 'amanda',
        'email': 'amanda@amare.test',
        'nome_completo': 'Amanda Coelho',
        'telefone': '(81) 99666-2020',
        'data_nascimento': '1986-03-10',
        'tipo_sanguineo': 'O-',
        'medicamentos_em_uso': 'Progesterona, ácido fólico e aspirina infantil (AAS).',
        'observacoes_medicas': (
            'Histórico de três abortos espontâneos. Acompanhamento emocional '
            'recomendado. Reforçar as instruções de medicação de forma visual e '
            'com lembretes; explicar cada etapa em linguagem simples.'
        ),
        'consultas': [
            {
                'especialidade': 'Reprodução humana',
                'com_medica': True,
                'dias': -15,
                'hora': (10, 0),
                'local': 'Clínica Amare - Sala 3',
                'status': Consulta.STATUS_REALIZADA,
                'observacoes': 'Revisão do histórico gestacional e plano de suporte da fase lútea.',
            },
            {
                'especialidade': 'Psicologia',
                'com_medica': False,
                'dias': 8,
                'hora': (14, 0),
                'local': 'Online (videochamada)',
                'status': Consulta.STATUS_AGENDADA,
                'observacoes': 'Acompanhamento psicológico para reduzir a ansiedade durante o tratamento.',
            },
            {
                'especialidade': 'Endocrinologia',
                'com_medica': False,
                'dias': 23,
                'hora': (8, 30),
                'local': 'Clínica Amare - Sala 1',
                'status': Consulta.STATUS_AGENDADA,
                'observacoes': 'Avaliação hormonal e da tireoide antes da próxima transferência.',
            },
        ],
        'medicamentos': [
            {
                'nome': 'Progesterona',
                'dose': '1 cápsula 200mg',
                'hora': (8, 0),
                'instrucoes': 'Via vaginal, sempre no mesmo horário da manhã. Apoia a fase de implantação.',
            },
            {
                'nome': 'Ácido fólico',
                'dose': '1 comprimido 5mg',
                'hora': (8, 0),
                'instrucoes': 'Tomar junto com a progesterona, após o café da manhã.',
            },
            {
                'nome': 'Aspirina infantil (AAS)',
                'dose': '1 comprimido 100mg',
                'hora': (12, 0),
                'instrucoes': 'Tomar após o almoço, conforme orientação da médica.',
            },
        ],
    },
]

MEDICA = {
    'username': 'medica_teste',
    'email': 'medica@amare.test',
    'nome_completo': 'Dra. Helena Costa',
    'telefone': '(81) 98888-1111',
    'crm': 'CRM/PE 12345',
    'especialidade': 'Reprodução humana',
}

ADMIN = {
    'username': 'admin_teste',
    'email': 'admin@amare.test',
    'nome_completo': 'Administradora Amare',
}


class Command(BaseCommand):
    help = (
        'Cria os dados fictícios de demonstração (pacientes-persona, médica, '
        'administradora, especialidades, consultas e medicamentos). Idempotente.'
    )

    def handle(self, *args, **options):
        self._remover_legado()
        self._criar_especialidades()
        medica = self._criar_medica()
        self._criar_admin()
        for dados in PACIENTES:
            self._criar_paciente(dados, medica)

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Dados de demonstração prontos.'))
        nomes = ', '.join(p['username'] for p in PACIENTES)
        self.stdout.write(
            f'  Pacientes: {nomes}. Médica: {MEDICA["username"]}. '
            f'Admin: {ADMIN["username"]}.'
        )
        self.stdout.write(
            f'  Senha padrão para todas as contas: {SENHA_PADRAO} '
            '(apenas para desenvolvimento e demonstração).'
        )
        self.stdout.write('')

    # --- contas e perfis ---

    def _conta(self, username, email, set_superuser=False):
        User = get_user_model()
        usuario, criado = User.objects.get_or_create(
            username=username,
            defaults={'email': email},
        )
        if criado:
            usuario.set_password(SENHA_PADRAO)
        usuario.email = email
        if set_superuser:
            usuario.is_staff = True
            usuario.is_superuser = True
        usuario.save()
        return usuario

    def _perfil(self, usuario, tipo, nome_completo, telefone=''):
        perfil, _ = PerfilUsuario.objects.get_or_create(
            usuario=usuario,
            defaults={
                'tipo_usuario': tipo,
                'nome_completo': nome_completo,
                'telefone': telefone,
            },
        )
        # Reaplica os campos para manter a consistência em re-execuções.
        perfil.tipo_usuario = tipo
        perfil.nome_completo = nome_completo
        perfil.telefone = telefone
        perfil.save()
        return perfil

    # --- papéis ---

    def _criar_especialidades(self):
        for dados in ESPECIALIDADES:
            especialidade, _ = Especialidade.objects.get_or_create(
                nome=dados['nome'],
            )
            especialidade.descricao = dados['descricao']
            especialidade.save()

    def _criar_medica(self):
        usuario = self._conta(MEDICA['username'], MEDICA['email'])
        perfil = self._perfil(
            usuario,
            PerfilUsuario.TIPO_MEDICA,
            MEDICA['nome_completo'],
            MEDICA['telefone'],
        )
        medica, _ = Medica.objects.get_or_create(perfil=perfil)
        medica.crm = MEDICA['crm']
        medica.especialidade = MEDICA['especialidade']
        medica.save()
        return medica

    def _criar_admin(self):
        usuario = self._conta(
            ADMIN['username'], ADMIN['email'], set_superuser=True
        )
        self._perfil(usuario, PerfilUsuario.TIPO_ADMIN, ADMIN['nome_completo'])

    def _criar_paciente(self, dados, medica):
        usuario = self._conta(dados['username'], dados['email'])
        perfil = self._perfil(
            usuario,
            PerfilUsuario.TIPO_PACIENTE,
            dados['nome_completo'],
            dados['telefone'],
        )
        paciente, _ = Paciente.objects.get_or_create(perfil=perfil)
        paciente.data_nascimento = date.fromisoformat(dados['data_nascimento'])
        paciente.tipo_sanguineo = dados['tipo_sanguineo']
        paciente.medicamentos_em_uso = dados['medicamentos_em_uso']
        paciente.observacoes_medicas = dados['observacoes_medicas']
        paciente.medica_responsavel = medica
        paciente.save()
        self._popular_clinico(paciente, medica, dados)

    # --- conteúdo clínico ---

    def _popular_clinico(self, paciente, medica, dados):
        # Recria o conteúdo clínico do zero para manter o seed idempotente sem
        # depender de chaves naturais nas consultas.
        paciente.consultas.all().delete()
        paciente.medicamentos.all().delete()

        for c in dados['consultas']:
            Consulta.objects.create(
                paciente=paciente,
                medica=medica if c['com_medica'] else None,
                especialidade=Especialidade.objects.filter(
                    nome=c['especialidade']
                ).first(),
                data_horario=self._quando(c['dias'], c['hora']),
                local=c['local'],
                observacoes=c['observacoes'],
                status=c['status'],
            )

        for m in dados['medicamentos']:
            Medicamento.objects.create(
                paciente=paciente,
                nome=m['nome'],
                dose=m['dose'],
                horario=time(*m['hora']),
                instrucoes=m['instrucoes'],
            )

    def _quando(self, dias, hora):
        """Datetime relativo a hoje, no fuso configurado, na hora indicada."""
        base = timezone.localtime(timezone.now()) + timedelta(days=dias)
        return base.replace(hour=hora[0], minute=hora[1], second=0, microsecond=0)

    # --- limpeza ---

    def _remover_legado(self):
        User = get_user_model()
        # Apagar o usuário cascateia para perfil, paciente, consultas e
        # medicamentos da conta legada.
        apagados, _ = User.objects.filter(username=USUARIO_LEGADO).delete()
        if apagados:
            self.stdout.write(
                f'  Conta legada "{USUARIO_LEGADO}" removida.'
            )
