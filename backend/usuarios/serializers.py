"""Serializers da app usuarios."""

from rest_framework import serializers

from .models import Paciente, PerfilUsuario


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
