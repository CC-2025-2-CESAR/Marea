"""Serializers da app usuarios."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Medica, Paciente, PerfilUsuario

User = get_user_model()


class UsuarioBasicoSerializer(serializers.Serializer):
    """Dados mínimos para identificar o usuário autenticado no frontend."""

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    tipo_usuario = serializers.SerializerMethodField()
    nome_completo = serializers.SerializerMethodField()

    def get_tipo_usuario(self, usuario):
        perfil = getattr(usuario, 'perfil', None)
        if perfil is None:
            return ''
        return perfil.tipo_usuario

    def get_nome_completo(self, usuario):
        perfil = getattr(usuario, 'perfil', None)
        if perfil is None:
            return ''
        return perfil.nome_completo


class PerfilPacienteSerializer(serializers.ModelSerializer):
    """Perfil completo de uma paciente, combinando PerfilUsuario + Paciente.

    Só os campos `nome_completo`, `telefone`, `data_nascimento` e
    `tipo_sanguineo` são editáveis nesta etapa. Email e dados clínicos são
    expostos como leitura — atualização passa pelo Django Admin.
    """

    username = serializers.CharField(source='usuario.username', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)
    tipo_usuario = serializers.CharField(read_only=True)

    data_nascimento = serializers.DateField(
        source='paciente.data_nascimento',
        required=False,
        allow_null=True,
    )
    tipo_sanguineo = serializers.CharField(
        source='paciente.tipo_sanguineo',
        required=False,
        allow_blank=True,
    )
    medicamentos_em_uso = serializers.CharField(
        source='paciente.medicamentos_em_uso',
        read_only=True,
    )
    observacoes_medicas = serializers.CharField(
        source='paciente.observacoes_medicas',
        read_only=True,
    )

    class Meta:
        model = PerfilUsuario
        fields = [
            'username',
            'email',
            'tipo_usuario',
            'nome_completo',
            'telefone',
            'foto_url',
            'data_nascimento',
            'tipo_sanguineo',
            'medicamentos_em_uso',
            'observacoes_medicas',
        ]
        read_only_fields = ['foto_url']

    def update(self, instance, validated_data):
        # Campos do PerfilUsuario
        instance.nome_completo = validated_data.get(
            'nome_completo', instance.nome_completo
        )
        instance.telefone = validated_data.get('telefone', instance.telefone)
        instance.save()

        # Campos do Paciente vinculado (via source='paciente.*')
        paciente_data = validated_data.get('paciente', {})
        if paciente_data:
            paciente, _ = Paciente.objects.get_or_create(perfil=instance)
            for campo in ('data_nascimento', 'tipo_sanguineo'):
                if campo in paciente_data:
                    setattr(paciente, campo, paciente_data[campo])
            paciente.save()

        return instance


class CriarPacienteSerializer(serializers.Serializer):
    """Valida os dados mínimos para a clínica cadastrar uma nova paciente.

    Não cria nada por si só — a orquestração (User inativo + PerfilUsuario +
    Paciente + ConviteAcesso) fica na view, dentro de uma transação. Aqui só
    garantimos os campos obrigatórios e que o e-mail ainda não está em uso.
    """

    nome_completo = serializers.CharField(max_length=180)
    email = serializers.EmailField()
    telefone = serializers.CharField(
        max_length=30, required=False, allow_blank=True, default=''
    )
    data_nascimento = serializers.DateField(required=False, allow_null=True)
    medica_responsavel_id = serializers.IntegerField(
        required=False, allow_null=True
    )

    def validate_nome_completo(self, valor):
        valor = valor.strip()
        if not valor:
            raise serializers.ValidationError('Informe o nome da paciente.')
        return valor

    def validate_email(self, valor):
        valor = valor.strip()
        # E-mail é a chave de acesso da paciente (login por e-mail). Recusamos
        # duplicatas aqui para não criar a ambiguidade que o login evita.
        if User.objects.filter(email__iexact=valor).exists():
            raise serializers.ValidationError(
                'Já existe uma conta com este e-mail.'
            )
        return valor

    def validate_medica_responsavel_id(self, valor):
        if valor in (None, ''):
            return None
        if not Medica.objects.filter(pk=valor).exists():
            raise serializers.ValidationError(
                'Médica responsável não encontrada.'
            )
        return valor


class DefinirSenhaSerializer(serializers.Serializer):
    """Valida a senha escolhida pela paciente no primeiro acesso.

    Aplica os mesmos validadores de senha do Django configurados no projeto
    (tamanho mínimo, senha comum, só números, semelhança com os dados da
    conta). A conta convidada é passada no contexto para a checagem de
    semelhança funcionar.
    """

    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, valor):
        if not valor:
            raise serializers.ValidationError('Informe uma senha.')
        try:
            validate_password(valor, user=self.context.get('usuario'))
        except DjangoValidationError as erro:
            raise serializers.ValidationError(list(erro.messages))
        return valor
