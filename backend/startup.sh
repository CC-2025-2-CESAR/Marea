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
#   - fixtures com PK fixa  -> loaddata funciona como upsert (não duplica);
#   - usuários de teste      -> criados via get_or_create.
# Ative definindo a App Setting SEED_DEMO=true para popular o conteúdo inicial
# e os usuários de teste; depois defina SEED_DEMO=false para que reinícios não
# sobrescrevam dados criados em uso (ex.: registros feitos pela médica).
if [ "${SEED_DEMO}" = "true" ]; then
  echo "[startup] SEED_DEMO=true: populando usuários de teste e conteúdo..."
  # Usuários PRIMEIRO: as fixtures de consultas/medicamentos têm FK para a
  # paciente, então ela precisa existir antes do loaddata. Cada loaddata é
  # separado para que uma falha não impeça as demais (loaddata é atômico por
  # invocação).
  python manage.py criar_usuarios_teste \
    || echo "[startup] aviso: criar_usuarios_teste falhou (seguindo mesmo assim)"
  for fixture in termos_iniciais consultas_iniciais medicamentos_iniciais; do
    python manage.py loaddata "$fixture" \
      || echo "[startup] aviso: loaddata $fixture falhou (seguindo mesmo assim)"
  done
fi

exec gunicorn marea_api.wsgi \
  --bind=0.0.0.0:8000 \
  --workers=2 \
  --timeout=600 \
  --access-logfile '-' \
  --error-logfile '-'
