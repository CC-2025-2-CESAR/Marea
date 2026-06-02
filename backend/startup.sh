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

# Seed OPCIONAL de demonstração (idempotente):
#   - criar_usuarios_teste cria as contas de teste E todo o conteúdo clínico de
#     demonstração (pacientes-persona, médica, especialidades, consultas e
#     medicamentos), ligado por relacionamento — sem depender de PK fixa;
#   - o dicionário continua vindo de fixture por ser conteúdo de referência sem
#     vínculo com paciente.
# Ative definindo a App Setting SEED_DEMO=true para popular o conteúdo inicial;
# depois defina SEED_DEMO=false para que reinícios não sobrescrevam dados
# criados em uso (ex.: registros feitos pela médica).
if [ "${SEED_DEMO}" = "true" ]; then
  echo "[startup] SEED_DEMO=true: populando dados de demonstração..."
  python manage.py criar_usuarios_teste \
    || echo "[startup] aviso: criar_usuarios_teste falhou (seguindo mesmo assim)"
  python manage.py loaddata termos_iniciais \
    || echo "[startup] aviso: loaddata termos_iniciais falhou (seguindo mesmo assim)"
fi

exec gunicorn marea_api.wsgi \
  --bind=0.0.0.0:8000 \
  --workers=2 \
  --timeout=600 \
  --access-logfile '-' \
  --error-logfile '-'
