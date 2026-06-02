"""Cria usuários fictícios para teste local da Amare.

Uso:
    py manage.py criar_usuarios_teste

Idempotente: pode ser executado mais de uma vez sem duplicar registros.
Senha padrão para todos: `amare123`.

Nunca use estes usuários em produção.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from usuarios.models import Medica, Paciente, PerfilUsuario


SENHA_PADRAO = 'amare123'

USUARIOS_TESTE = [
    {
        'username': 'paciente_teste',
        'email': 'paciente@amare.test',
        'tipo': PerfilUsuario.TIPO_PACIENTE,
        'nome_completo': 'Júlia Pereira',
        'telefone': '(81) 91234-5678',
        'paciente': {
            'data_nascimento': '1993-04-12',
            'tipo_sanguineo': 'O+',
            'medicamentos_em_uso': 'Ácido fólico 5mg, uma vez ao dia.',
            'observacoes_medicas': 'Em acompanhamento para indução da ovulação.',
        },
    },
    {
        'username': 'medica_teste',
        'email': 'medica@amare.test',
        'tipo': PerfilUsuario.TIPO_MEDICA,
        'nome_completo': 'Dra. Helena Costa',
        'telefone': '(81) 98888-1111',
        'medica': {
            'crm': 'CRM/PE 12345',
            'especialidade': 'Reprodução humana',
        },
    },
    {
        'username': 'admin_teste',
        'email': 'admin@amare.test',
        'tipo': PerfilUsuario.TIPO_ADMIN,
        'nome_completo': 'Administradora Amare',
        'telefone': '',
        'is_superuser': True,
    },
]


class Command(BaseCommand):
    help = (
        'Cria pacientes, médicas e administradoras fictícios para '
        'desenvolvimento local. Idempotente.'
    )

    def handle(self, *args, **options):
        User = get_user_model()
        criados = []
        ja_existentes = []

        for dados in USUARIOS_TESTE:
            username = dados['username']
            usuario, criado = User.objects.get_or_create(
                username=username,
                defaults={'email': dados['email']},
            )

            if criado:
                usuario.set_password(SENHA_PADRAO)
                if dados.get('is_superuser'):
                    usuario.is_staff = True
                    usuario.is_superuser = True
                usuario.email = dados['email']
                usuario.save()
                criados.append(username)
            else:
                ja_existentes.append(username)

            perfil, _ = PerfilUsuario.objects.get_or_create(
                usuario=usuario,
                defaults={
                    'tipo_usuario': dados['tipo'],
                    'nome_completo': dados['nome_completo'],
                    'telefone': dados['telefone'],
                },
            )
            # Reaplica os campos para garantir consistência mesmo em re-execução
            perfil.tipo_usuario = dados['tipo']
            perfil.nome_completo = dados['nome_completo']
            perfil.telefone = dados['telefone']
            perfil.save()

            if 'paciente' in dados:
                paciente, _ = Paciente.objects.get_or_create(perfil=perfil)
                for campo, valor in dados['paciente'].items():
                    setattr(paciente, campo, valor)
                paciente.save()

            if 'medica' in dados:
                medica, _ = Medica.objects.get_or_create(perfil=perfil)
                for campo, valor in dados['medica'].items():
                    setattr(medica, campo, valor)
                medica.save()

        # Vincula a paciente de teste à médica de teste, para a área da médica
        # já ter um caso real de acompanhamento. Idempotente.
        try:
            paciente = Paciente.objects.get(
                perfil__usuario__username='paciente_teste'
            )
            medica = Medica.objects.get(
                perfil__usuario__username='medica_teste'
            )
            if paciente.medica_responsavel_id != medica.id:
                paciente.medica_responsavel = medica
                paciente.save(update_fields=['medica_responsavel'])
        except (Paciente.DoesNotExist, Medica.DoesNotExist):
            pass

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Usuários de teste prontos.'))
        if criados:
            self.stdout.write(
                self.style.SUCCESS(f'  Criados agora: {", ".join(criados)}')
            )
        if ja_existentes:
            self.stdout.write(
                f'  Já existiam (atualizados): {", ".join(ja_existentes)}'
            )
        self.stdout.write(
            f'  Senha padrão para todos: {SENHA_PADRAO} '
            '(apenas para desenvolvimento local).'
        )
        self.stdout.write('')
