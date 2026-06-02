# Deploy em produção (Azure + Neon)

A Amare está publicada num único **Azure App Service** (Linux, plano **F1 —
gratuito**) que serve tanto a API Django quanto o build do React, com banco
**PostgreSQL no Neon** (serviço externo gratuito, mantido fora do Azure para não
consumir créditos).

- **URL de produção:** https://marea-amare.azurewebsites.net
- **Custo:** App Service F1 = gratuito; Neon (free tier) = gratuito.

## Arquitetura

Um processo só (gunicorn) atende tudo no mesmo domínio:

- `/api/...` → Django REST Framework
- `/admin/...` → Django Admin
- arquivos do build do React (`/assets/...`, `/favicon.svg`) → WhiteNoise
- qualquer outra rota (`/`, `/perfil`, `/login`, ...) → `index.html` do React
  (view catch-all em `marea_api/urls.py`), para o roteamento do React Router
  funcionar ao recarregar a página.

Como front e back ficam no mesmo domínio, a API é chamada em `/api` (caminho
relativo) e **não há CORS** entre eles. O build do React é copiado para
`backend/frontend_dist` e servido pelo WhiteNoise (`WHITENOISE_ROOT`).

## Recursos no Azure

| Recurso | Nome | Observação |
|---|---|---|
| Resource group | `amare-rg` | Brazil South |
| App Service Plan | `amare-plan` | Linux, **F1 (Free)** |
| Web App | `marea-amare` | Python 3.12, Startup: `bash startup.sh` |

Banco: **Neon** (PostgreSQL gerenciado, free tier), região São Paulo
(`sa-east-1`).

## Variáveis de ambiente (App Settings)

Configuradas no Web App (Configuration → Application settings). Os **segredos
ficam só aqui**, nunca no repositório:

| Variável | Para que serve |
|---|---|
| `DJANGO_SECRET_KEY` | chave do Django (64 caracteres aleatórios) |
| `DJANGO_DEBUG` | `False` em produção |
| `DJANGO_ALLOWED_HOSTS` | `marea-amare.azurewebsites.net` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://marea-amare.azurewebsites.net` |
| `DJANGO_CORS_ALLOWED_ORIGINS` | `https://marea-amare.azurewebsites.net` |
| `DATABASE_URL` | string de conexão do Neon (PostgreSQL) |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` (Oryx instala deps + roda collectstatic) |
| `SEED_DEMO` | `true` para semear dados de demonstração; depois `false` |
| `PYTHONUNBUFFERED` | `1` (logs em tempo real) |

Com `DJANGO_DEBUG=False`, o `settings.py` liga automaticamente HTTPS
obrigatório, HSTS e cookies seguros.

## Como o startup funciona (`backend/startup.sh`)

1. `python manage.py migrate --noinput`
2. Se `SEED_DEMO=true`: roda `criar_usuarios_teste`, que cria as contas de teste
   e todo o conteúdo clínico de demonstração (pacientes-persona, médica,
   especialidades, consultas e medicamentos) ligado por relacionamento; e
   carrega a fixture do dicionário (`termos_iniciais`). É idempotente.
3. `exec gunicorn marea_api.wsgi --bind=0.0.0.0:8000 ...`

## Como reimplantar (deploy manual)

Pré-requisitos: Azure CLI (`az login`), Node e o venv do backend.

```powershell
# 1. Build do frontend (produção; a API vira /api no mesmo domínio)
cd frontend; npm ci; npm run build; cd ..

# 2. Copiar o build para dentro do backend
Remove-Item -Recurse -Force backend\frontend_dist -ErrorAction SilentlyContinue
Copy-Item -Recurse frontend\dist backend\frontend_dist

# 3. Empacotar o backend (zip com barras normais, compatível com Linux)
python scripts\empacotar_deploy.py backend "$env:TEMP\amare.zip"

# 4. Publicar
az webapp deploy --resource-group amare-rg --name marea-amare `
  --src-path "$env:TEMP\amare.zip" --type zip
```

> **Por que o `empacotar_deploy.py`?** O `Compress-Archive` do Windows
> PowerShell 5.1 grava os caminhos com barra invertida, que quebram no Linux do
> App Service (o Oryx os trata como nome de arquivo, não pasta). O script usa o
> módulo `zipfile` do Python, que grava com barra normal — padrão do formato.

`frontend_dist`, `staticfiles`, `venv` e `db.sqlite3` ficam fora do
versionamento (`.gitignore`) e o `empacotar_deploy.py` também os exclui do zip.

## Primeiro deploy contra um banco novo

1. Defina `DATABASE_URL` (Neon) e `SEED_DEMO=true` nas App Settings.
2. Reimplante (passos acima). O startup migra o esquema e semeia os dados.
3. Defina `SEED_DEMO=false` para que reinícios futuros **não** re-semear nem
   sobrescrever dados criados em uso. O Neon persiste tudo.

## Usuários de demonstração

`renata` e `amanda` (pacientes-persona), `medica_teste` (Dra. Helena Costa) e
`admin_teste` — senha `amare123`. Apenas para demonstração acadêmica; nunca usar
em um cenário com dados reais.

## Verificação rápida

```
curl https://marea-amare.azurewebsites.net/                        # React (HTTP 200)
curl https://marea-amare.azurewebsites.net/api/dicionario/termos/  # JSON dos termos
```

Logs ao vivo do App Service:

```
az webapp log tail --resource-group amare-rg --name marea-amare
```
