# Amare (projeto do grupo Maréa)

> **Plataforma**: Amare (mesmo nome da Clínica parceira).
> **Grupo**: Maréa — Grupo 08 da CESAR School. O repositório no GitHub e algumas
> referências internas (módulo `marea_api`, pacote `marea-frontend`) preservam o
> nome do grupo.

A **Amare** é uma plataforma web criada pelo grupo Maréa para apoiar as pacientes
da **Clínica Amare** (Recife/PE) ao longo da jornada de tratamentos de
fertilidade e reprodução humana. Ela centraliza calendário, medicamentos,
conteúdo em linguagem simples e acompanhamento — reduzindo confusão, ansiedade e
risco de erro num processo emocionalmente delicado.

**No ar:** https://marea-amare.azurewebsites.net

## O problema e a solução

Pacientes em tratamento de fertilidade lidam com excesso de informação, linguagem
técnica, rotinas cronometradas e dados espalhados por vários canais — em um
momento de alta ansiedade. A Amare responde a isso centralizando o essencial,
traduzindo o que é complexo e organizando a rotina, com foco em **clareza,
acolhimento e baixo esforço de uso** (poucas coisas, muito bem feitas).

O contexto completo — pesquisa, persona, dores, insights, benchmark e equipe —
está em [Contexto e pesquisa do projeto](docs/contexto-pesquisa.md).

## Funcionalidades

- **Login e perfil** — autenticação real via JWT; perfil da paciente persistido
  e editável. Três papéis (paciente, médica, administradora) com acesso
  controlado no backend.
- **Primeiro acesso e recuperação de senha** — convite por link (a clínica
  cadastra, a paciente define a senha) e fluxo de redefinição por e-mail.
- **Calendário** — grade mensal com consultas, eventos do tratamento e
  marcadores do ciclo; registro pelo próprio dia.
- **Medicamentos** — checklist diário dos remédios prescritos, com reset a cada
  novo dia.
- **Ciclo menstrual** — anel da fase atual, previsões estimadas (próxima
  menstruação e período fértil) e registro guiado das fases.
- **Linha do tempo** — etapas do tratamento da paciente, com a atual destacada e
  estimativa de dias para a próxima.
- **Sintomas** — registro de sintomas e observações escrito pela própria paciente.
- **Conteúdo da clínica** — dicionário de termos, tratamentos, orientações em
  linguagem simples, especialidades e equipe médica, com **busca global**.
- **Assistente Amare** — bot guiado que responde a partir de conteúdo curado e
  encaminha temas sensíveis para a clínica (nunca diagnostica nem ajusta dose).
- **Área da médica** — pacientes da clínica em abas (Minhas / Compartilhadas /
  Todas), edição das suas e "assumir atendimento" com trilha de auditoria.
- **Painel da administração** (`/gestao`) — visão geral, gestão do dicionário e
  logs de auditoria.
- **Privacidade (LGPD) na interface** — política pública e área "Meus dados"
  (ver, baixar cópia em JSON e pedir correção/exclusão).
- **Acolhimento de produto** — mobile-first, transições suaves, foco acessível e
  respeito a `prefers-reduced-motion`.

## Tecnologias

- **Backend:** Django + Django REST Framework (views function-based);
  autenticação JWT (`djangorestframework-simplejwt`).
- **Frontend:** React + **TypeScript** (strict, `tsc --noEmit` no CI), build com
  Vite; animações com Motion; design system próprio em `components/ui/`.
- **Banco:** SQLite em desenvolvimento; PostgreSQL (Neon) em produção.
- **Testes:** Cypress (E2E); ESLint + Prettier para padronização.
- **Hospedagem:** Azure App Service (Linux, F1) servindo o Django e o build do
  React via WhiteNoise.

Visão completa do fluxo de trabalho e da stack em
[Processo e ferramentas](docs/processo-e-ferramentas.md).

## Como rodar

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata termos_iniciais tratamentos_iniciais orientacoes_iniciais apoio_inicial
python manage.py seed_assistente
python manage.py criar_usuarios_teste
python manage.py runserver
```

Backend em `http://127.0.0.1:8000/`.

A ordem importa: carregue as fixtures **antes** de `criar_usuarios_teste`, porque
a linha do tempo (jornada) das pacientes aponta para as etapas dos tratamentos.

### Frontend

```
cd frontend
npm install
npm run dev
```

Frontend em `http://localhost:5173/`.

## Usuárias de teste

`criar_usuarios_teste` é idempotente e cria as contas fictícias abaixo (todas com
senha `amare123`), com consultas, medicamentos, eventos, linha do tempo e
sintomas de demonstração. **Use apenas em ambiente local — não vão para produção.**

| Usuário | Tipo | Para que serve |
|---|---|---|
| `renata` | Paciente | Persona Renata Cegonha — FIV com doação de sêmen. |
| `amanda` | Paciente | Persona Amanda Coelho — acompanhamento após perdas gestacionais. |
| `medica_teste` | Médica | Dra. Helena Costa — área da médica (acompanha as duas pacientes). |
| `admin_teste` | Administradora (superuser) | Acesso ao Django Admin em `http://localhost:8000/admin/`. |

## Testes

Com o frontend rodando, em outro terminal:

```
cd frontend
npm run cypress:open   # interativo
npm run cypress:run    # no terminal (suíte completa)
```

Backend:

```
cd backend
python manage.py test
```

## Documentação

- [Contexto e pesquisa do projeto](docs/contexto-pesquisa.md)
- [Processo e ferramentas](docs/processo-e-ferramentas.md)
- [Configuração do ambiente](docs/configuracao-do-ambiente.md)
- [Guia do Django](docs/guia-django.md)
- [Guia do React](docs/guia-react.md)
- [Guia do Cypress](docs/guia-cypress.md)
- [Guia da Motion](docs/guia-motion.md)
- [Guia do ESLint e Prettier](docs/guia-eslint-prettier.md)
- [Fluxo de Git](docs/fluxo-git.md)
- [Histórias de usuário](docs/historias-de-usuario.md)
- [Acessibilidade](docs/acessibilidade.md)
- [Heurísticas de Nielsen](docs/heuristicas-nielsen.md)
- [Segurança e Privacidade (LGPD)](docs/lgpd/README.md)
- [Deploy em produção (Azure + Neon)](docs/deploy-azure.md)
- [Como contribuir](CONTRIBUTING.md)

## Segurança e Privacidade (LGPD)

A Amare trata **dados pessoais sensíveis** (dados de saúde), então privacidade é
critério técnico de qualidade. Em resumo: minimização de dados, separação entre
conta / perfil / dados clínicos, controle de acesso por papel no backend,
segredos fora do código e produção endurecida (HTTPS/HSTS/cookies seguros). Há
política pública em `/privacidade` e a área **Meus dados** (`/meus-dados`) para o
titular ver, exportar e solicitar correção/exclusão. Documentação completa em
[`docs/lgpd/`](docs/lgpd/README.md).

## Equipe e contexto

Projeto do grupo **Maréa** (Grupo 08 da CESAR School), para a **Clínica Amare**.
A lista de integrantes, a orientação acadêmica e a base de pesquisa estão em
[Contexto e pesquisa do projeto](docs/contexto-pesquisa.md).
