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

gunicorn marea_api.wsgi \
  --bind=0.0.0.0:8000 \
  --workers=2 \
  --timeout=600 \
  --access-logfile '-' \
  --error-logfile '-'
