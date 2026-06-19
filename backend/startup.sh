#!/usr/bin/env bash
# Comando de inicialização do backend no Azure App Service (Linux, Python).
#
# Configure no App Service como Startup Command:
#   bash startup.sh
#
# Aplica as migrações do banco (idempotente) e sobe o servidor de aplicação
# (gunicorn) escutando na porta que o App Service espera (8000).
set -e

python manage.py migrate --noinput

# Respostas do Assistente Amare (conteúdo guiado do bot). Roda SEMPRE, fora do
# gate de demonstração: a tabela precisa estar populada também em produção, ou o
# assistente cai no texto genérico. O comando é idempotente — só cria o que
# falta e preserva as respostas que a clínica editar no painel.
python manage.py seed_assistente \
  || echo "[startup] aviso: seed_assistente falhou (seguindo mesmo assim)"

# Seed OPCIONAL de demonstração (idempotente):
#   - o conteúdo de referência (dicionário, tratamentos/etapas/orientações e
#     apoio emocional) vem de fixtures, sem vínculo com paciente;
#   - criar_usuarios_teste cria as contas de teste E o conteúdo clínico de
#     demonstração (pacientes-persona, médica, especialidades, consultas,
#     medicamentos, eventos do calendário e a linha do tempo/jornada).
# A ORDEM importa: o conteúdo de referência precisa existir ANTES de
# criar_usuarios_teste, porque a jornada da paciente (linha do tempo) aponta
# para as etapas dos tratamentos carregadas por fixture.
# Ative definindo a App Setting SEED_DEMO=true para popular o conteúdo inicial;
# depois defina SEED_DEMO=false para que reinícios não sobrescrevam dados
# criados em uso (ex.: registros feitos pela médica).
if [ "${SEED_DEMO}" = "true" ]; then
  echo "[startup] SEED_DEMO=true: populando dados de demonstração..."
  python manage.py loaddata termos_iniciais \
    || echo "[startup] aviso: loaddata termos_iniciais falhou (seguindo mesmo assim)"
  # Conteúdo de referência da paciente (tratamentos -> etapas -> orientações).
  # A ordem importa: orientações apontam para tratamentos e etapas.
  python manage.py loaddata tratamentos_iniciais orientacoes_iniciais \
    || echo "[startup] aviso: loaddata de tratamentos/orientações falhou (seguindo mesmo assim)"
  python manage.py loaddata apoio_inicial \
    || echo "[startup] aviso: loaddata apoio_inicial falhou (seguindo mesmo assim)"
  # Equipe médica real da clínica (conteúdo público, contas inativas). Roda
  # antes de criar_usuarios_teste para as especialidades já existirem.
  python manage.py seed_equipe_medica \
    || echo "[startup] aviso: seed_equipe_medica falhou (seguindo mesmo assim)"
  python manage.py criar_usuarios_teste \
    || echo "[startup] aviso: criar_usuarios_teste falhou (seguindo mesmo assim)"
fi

exec gunicorn marea_api.wsgi \
  --bind=0.0.0.0:8000 \
  --workers=2 \
  --timeout=600 \
  --access-logfile '-' \
  --error-logfile '-'
