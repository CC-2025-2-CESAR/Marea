# Processo e ferramentas

Como a Amare é construída: o fluxo de trabalho do time e a stack que sustenta o
projeto. Cada item abaixo aponta para o guia detalhado quando ele existe.

## Processo de desenvolvimento

### Entrega em PRs pequenos

O trabalho avança em **pull requests pequenos e independentes**, cada um com um
escopo coeso (uma página, um endpoint, uma fatia de funcionalidade). Isso mantém
a revisão simples, o histórico legível e cada mudança verde em relação à `main`.
PRs grandes (ex.: a migração para TypeScript) são **fatiados** em etapas que
entram uma de cada vez.

Convenções: commits em pt-BR, branch por tema, e o contrato de testes
(`data-cy`) preservado — nunca se remove um hook sem atualizar o spec no mesmo
PR. Detalhes em [Fluxo de Git](fluxo-git.md) e [Como contribuir](../CONTRIBUTING.md).

### Verificação antes de abrir PR

Antes de subir, roda-se localmente:

- **Frontend:** `npm run lint` e `npm run build` (que inclui `tsc --noEmit`).
- **Backend:** `manage.py makemigrations --check --dry-run`, `manage.py check` e
  `manage.py test`.
- **E2E:** `npm run cypress:run` com o servidor de desenvolvimento de pé.

### Integração contínua (GitHub Actions)

Toda PR dispara três checks obrigatórios, que precisam estar **verdes** para o
merge:

1. **Backend (Django)** — suíte de testes do backend.
2. **Frontend (lint + build)** — ESLint + `tsc --noEmit` + build de produção.
3. **Testes E2E (Cypress)** — a suíte completa contra o build do frontend.

### Privacidade no processo (LGPD)

Toda PR que toca dado pessoal passa pelo **checklist LGPD** do template de pull
request. O detalhamento (mapeamento de dados, RIPD, plano de incidente) está em
[`docs/lgpd/`](lgpd/README.md).

## Stack e ferramentas

### Backend

- **Django** + **Django REST Framework**, com views **function-based**
  (`@api_view` + `@permission_classes`). Guia em [Guia do Django](guia-django.md).
- **Autenticação JWT** via `djangorestframework-simplejwt`.
- **Banco:** SQLite em desenvolvimento; **PostgreSQL no Neon** em produção.

### Frontend

- **React** + **TypeScript** (strict), com build em **Vite**. A migração para
  TypeScript foi concluída — o `tsc --noEmit` cobre 100% do `src` (sem
  `allowJs`). Guia em [Guia do React](guia-react.md).
- **Motion** para microinterações e transições, sempre respeitando
  `prefers-reduced-motion`. Guia em [Guia da Motion](guia-motion.md).
- **Design system** próprio em `components/ui/` (Toast, Modal, EmptyState,
  Skeleton, StatusBadge, Tabs, ConfirmDialog) sobre um shell acessível.

### Qualidade e testes

- **Cypress** para testes E2E (specs 100% `cy.intercept`-stubbed). Guia em
  [Guia do Cypress](guia-cypress.md).
- **ESLint + Prettier** para padronização. Guia em
  [Guia do ESLint e Prettier](guia-eslint-prettier.md).
- **Acessibilidade e usabilidade** acompanhadas em
  [Acessibilidade](acessibilidade.md) e [Heurísticas de Nielsen](heuristicas-nielsen.md).

### Infraestrutura e deploy

- **Azure App Service** (Linux, plano **F1 — gratuito**) serve a API Django e o
  build do React no mesmo domínio (WhiteNoise + catch-all para o React Router).
- **Neon** hospeda o PostgreSQL de produção, fora do Azure para não consumir
  créditos.
- **Segredos** (chave do Django, `DATABASE_URL`) vivem em App Settings do Azure,
  nunca no repositório.
- **Commits assinados (GPG)** pelo autor.
- Passo a passo em [Deploy em produção (Azure + Neon)](deploy-azure.md).

## Para começar

Quem está chegando agora deve seguir, nesta ordem:

1. [Configuração do ambiente](configuracao-do-ambiente.md)
2. [Como rodar o backend e o frontend](../README.md#como-rodar)
3. [Como contribuir](../CONTRIBUTING.md) + [Fluxo de Git](fluxo-git.md)
