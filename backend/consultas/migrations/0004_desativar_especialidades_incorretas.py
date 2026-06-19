"""Retira especialidades que não pertencem à Clínica Amare.

O seed de demonstração antigo (`criar_usuarios_teste`) chegou a criar as
especialidades "Endocrinologia" e "Psicologia", que não fazem parte da clínica
(as corretas são Ginecologia, Cirurgia Ginecológica e Reprodução humana). Esta
migração de dados as desativa onde já existirem, para que sumam da página
pública de especialidades — que lista apenas `ativo=True`.

É idempotente (se não houver linhas com esses nomes, não faz nada) e roda em
todo deploy via `migrate`, independentemente do gate `SEED_DEMO`. Desativa em
vez de excluir para preservar eventuais consultas históricas que apontem para
elas (a FK é `SET_NULL`, mas manter a linha evita perder o rótulo).
"""

from django.db import migrations


ESPECIALIDADES_INCORRETAS = ['Endocrinologia', 'Psicologia']


def desativar(apps, schema_editor):
    Especialidade = apps.get_model('consultas', 'Especialidade')
    Especialidade.objects.filter(
        nome__in=ESPECIALIDADES_INCORRETAS
    ).update(ativo=False)


def reverter(apps, schema_editor):
    # Sem reversão: reativar reintroduziria conteúdo incorreto.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('consultas', '0003_eventotratamento'),
    ]

    operations = [
        migrations.RunPython(desativar, reverter),
    ]
