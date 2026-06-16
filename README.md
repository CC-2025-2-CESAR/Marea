# Amare (projeto do grupo Maréa)

> **Plataforma**: Amare (mesmo nome da Clínica parceira).
> **Grupo**: Maréa — Grupo 08 da CESAR School. O repositório no GitHub e algumas
> referências internas (módulo `marea_api`, pacote `marea-frontend`) preservam o
> nome do grupo.

A **Amare** é uma plataforma web desenvolvida pelo grupo Maréa para apoiar a experiência
das pacientes da Clínica Amare (Recife/PE), reunindo recursos digitais voltados ao
acompanhamento, organização e compreensão de informações relacionadas aos tratamentos
de fertilidade e reprodução humana.

Nesta etapa, o projeto já conta com autenticação real, perfil de paciente persistido em
banco e base preparada para diferenciar pacientes, médicas e administradoras.

## Status atual

- **No ar**: a plataforma está publicada no Azure (App Service F1, gratuito) com
  PostgreSQL gerenciado externamente no Neon. Acesse em
  **https://marea-amare.azurewebsites.net**. Detalhes em [Deploy (produção)](docs/deploy-azure.md).
- Login real com JWT contra o backend Django.
- Página de perfil consumindo a API (`GET` e `PATCH /api/perfil/`).
- Tipos de usuário: paciente, médica e administradora (gerenciados pelo Django Admin).
- Rotas internas protegidas: sem sessão, qualquer acesso volta para `/login`.
- Botão de logout funcional na sidebar.
- Página de Dicionário consumindo a primeira API real do projeto (PROJ-3 e PROJ-4).
- Página de Calendário com grade mensal, marcadores nos dias com consulta e
  painel lateral com próximas consultas e lembretes (PROJ-1), além de banner
  de "Próxima consulta" na página inicial.
- Página de Medicamentos com checklist diário (PROJ-2): checkbox por
  medicamento prescrito, atualização otimista e reset implícito a cada
  novo dia. O card "Lembretes" no Calendário consome a mesma checklist.
- Interface adaptada para celular: menu lateral em drawer (hambúrguer) abaixo de
  768px, breakpoints padronizados em 480/768/1024 e tap targets de pelo menos 44px.
- Polimento de UX: transição suave entre rotas internas, sidebar com microinterações
  e indicador lateral de rota ativa, SelectField customizado para tipo sanguíneo,
  máscara brasileira de telefone no perfil e respeito a `prefers-reduced-motion`.
- Controle de acesso por papel: a médica tem uma área própria (`/area-medica`)
  com as pacientes vinculadas a ela, onde acompanha e registra consultas e
  medicamentos (PROJ-19 e PROJ-20); não acessa as telas da paciente. O
  `/api/perfil/` é restrito a pacientes no backend, e o login tem limite de
  tentativas.
- Páginas de Tratamentos e Orientações com conteúdo de referência vindo do
  banco e gerido pelo Django Admin (PROJ-23 e PROJ-18): a de Tratamentos lista
  cada tratamento com suas etapas; a de Orientações traz textos em linguagem
  simples com filtro por categoria.
- Busca global no cabeçalho (PROJ-25): procura em dicionário, tratamentos,
  orientações e especialidades de uma vez, com resultados agrupados por tipo em
  `/busca` e link para a página de origem.
- Página de Ciclo menstrual (PROJ-5 e PROJ-6): painel com **anel da fase atual**,
  cards de resumo (próxima menstruação, chances de gravidez e ciclo médio) e
  calendário com os dias marcados; a paciente registra, edita e exclui as fases
  do ciclo e vê previsões (próxima menstruação e período fértil estimado)
  calculadas a partir dos próprios registros — sempre como estimativa que não
  substitui orientação médica.
- Demais páginas internas seguem como placeholders para evolução futura.

## Tecnologias

- Backend: Django (Python)
- API: Django REST Framework
- Autenticação: JSON Web Tokens (`djangorestframework-simplejwt`)
- Frontend: React (JavaScript, em migração incremental para TypeScript)
- Build do frontend: Vite
- Animações: Motion (microinterações e transições suaves)
- Design system: primitivos em `components/ui/` (Toast com `aria-live`, EmptyState, Skeleton) + rodapé e shell acessível (skip-link, foco visível, `prefers-reduced-motion`)
- Testes E2E: Cypress
- Padronização: ESLint e Prettier
- Tipos: TypeScript incremental (`allowJs`) — `services/` e `src/types/` tipados; checagem `tsc --noEmit` (`npm run typecheck`) no CI
- Banco: SQLite em desenvolvimento; PostgreSQL (Neon) em produção
- Hospedagem: Azure App Service (Linux, F1) servindo o Django e o build do React
  via WhiteNoise; deploy por pacote zip

## Rotas atuais

- `/login`: tela de login pública, sem sidebar, header ou busca.
- `/`: página inicial da plataforma (requer login).
- `/perfil`: perfil da paciente com formulário editável (requer login).
- `/calendario`: grade mensal de consultas e eventos do tratamento, com painel
  lateral de próximas consultas, próximos eventos e lembretes.
- `/medicamentos`: checklist diário de remédios prescritos com marcar/desmarcar.
- `/ciclo`: ciclo menstrual da paciente — painel com anel da fase atual, cards de
  resumo e calendário marcado, além do registro das fases (data, etapa,
  observações, status) e previsões (próxima menstruação e período fértil
  estimado), com aviso de que não substituem orientação médica.
- `/dicionario`: dicionário de termos médicos com busca, lista e detalhes.
- `/bot`: placeholder de bot.
- `/tratamentos`: tratamentos da clínica com as etapas principais de cada um.
- `/orientacoes`: orientações em linguagem simples, com filtro por categoria.
- `/especialidades`: especialidades da clínica e as médicas relacionadas.
- `/linha-do-tempo`: etapas do tratamento da paciente, com a etapa atual destacada.
- `/apoio`: conteúdos de apoio emocional, com aviso de que não substituem
  acompanhamento profissional.
- `/sintomas`: registro de sintomas e observações escrito pela própria paciente.
- `/busca`: resultados da busca global, agrupados por tipo (dicionário,
  tratamentos, orientações e especialidades).
- `/area-medica`: área exclusiva da médica (fora do layout da paciente), com a
  lista de pacientes vinculadas e o painel de acompanhamento (requer papel de médica).

## Layouts

- `AuthLayout`: usado em rotas públicas, como `/login`.
- `AppLayout`: usado nas rotas internas, com sidebar, header, busca e área principal de
  conteúdo.

A maioria das páginas internas já tem funcionalidade real (ver **Status atual**).
As restantes seguem como placeholders, mostrando apenas título e texto básico até
serem desenvolvidas.

## Como rodar o backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata termos_iniciais tratamentos_iniciais orientacoes_iniciais apoio_inicial respostas_iniciais
python manage.py criar_usuarios_teste
python manage.py runserver
```

Backend em `http://127.0.0.1:8000/`.

A ordem importa: carregue as fixtures **antes** de `criar_usuarios_teste`, porque
a linha do tempo (jornada) das pacientes aponta para as etapas dos tratamentos.

O command `criar_usuarios_teste` é idempotente — pode rodar mais de uma vez sem
duplicar registros. Ele cria as contas fictícias abaixo (todas com senha
`amare123`) e, para cada paciente, as consultas, medicamentos, eventos do
calendário, a linha do tempo (jornada) e alguns registros de sintomas de
demonstração:

| Usuário | Tipo | Para que serve |
|---|---|---|
| `renata` | Paciente | Persona Renata Cegonha — FIV com doação de sêmen. |
| `amanda` | Paciente | Persona Amanda Coelho — acompanhamento após perdas gestacionais. |
| `medica_teste` | Médica | Dra. Helena Costa — área da médica (acompanha as duas pacientes). |
| `admin_teste` | Administradora (superuser) | Acesso ao Django Admin em `http://localhost:8000/admin/`. |

Use esses dados apenas em ambiente local — eles não devem ir para produção.

## Como rodar o frontend

```
cd frontend
npm install
npm run dev
```

Frontend em `http://localhost:5173/`.

## Como rodar o Cypress

Com o frontend rodando, em outro terminal:

```
cd frontend
npm run cypress:open
```

Para rodar os testes no terminal:

```
npm run cypress:run
```

## Deploy (produção)

A plataforma está publicada no **Azure App Service** (Linux, plano **F1 —
gratuito**), num único serviço que serve a API Django **e** o build do React no
mesmo domínio (via WhiteNoise + rota catch-all para o React Router). O banco é
**PostgreSQL no Neon** (gratuito, fora do Azure para não consumir créditos).

- Produção: **https://marea-amare.azurewebsites.net**
- Os segredos (chave do Django, `DATABASE_URL`) ficam em App Settings do Azure,
  nunca no repositório.
- Passo a passo de publicação, variáveis de ambiente e o empacotador
  (`scripts/empacotar_deploy.py`) estão em [Deploy em produção (Azure + Neon)](docs/deploy-azure.md).

## Login e perfil (H5)

Autenticação real via JWT. O `User` padrão do Django é mantido; um modelo
`PerfilUsuario` (com `OneToOne` para `User`) carrega os dados comuns e os
modelos `Paciente` e `Medica` carregam os dados específicos de cada papel.

Endpoints novos:

- `POST /api/auth/login/` — recebe `{username, password}` (o campo
  `username` aceita o **nome de usuário ou o e-mail** da conta) e devolve
  `{access, refresh, usuario}`.
- `POST /api/auth/refresh/` — troca um `refresh` válido por um novo `access`.
- `GET /api/auth/me/` — devolve os dados básicos do usuário autenticado.
- `GET /api/perfil/` — devolve o perfil completo da paciente autenticada.
- `PATCH /api/perfil/` — atualiza `nome_completo`, `telefone`,
  `data_nascimento` e `tipo_sanguineo`. Email e dados clínicos
  (medicamentos, observações) só são editáveis pelo Django Admin nesta etapa.

Para testar o fluxo ponta-a-ponta:

1. Backend rodando com `criar_usuarios_teste` já executado.
2. Frontend rodando (`npm run dev`).
3. Acesse `http://localhost:5173/login`, entre com `renata` / `amare123`
   (ou pelo e-mail `renata@amare.test`).
4. Você é redirecionada para `/perfil`. Edite o telefone, clique em Salvar.
5. O botão "Sair" no rodapé da sidebar limpa a sessão e volta para `/login`.

Para gerenciar usuários, médicas e dados clínicos:

```
http://localhost:8000/admin/
```

Use `admin_teste` / `amare123`. O Django Admin permite criar/editar perfis,
ajustar tipo de usuário, preencher medicamentos e observações da paciente, e
cadastrar dados profissionais das médicas.

## Cadastro e convite de primeiro acesso (PROJ-7)

A clínica cria a conta da paciente e a paciente assume o acesso por um link de
convite. A conta nasce **inativa e sem senha utilizável**: ninguém entra por
ela até a paciente usar o convite e definir a própria senha. O token é
**único, de uso único e válido por 48h**.

Endpoints (todos function-based):

- `POST /api/clinica/pacientes/` — restrito à **médica responsável ou à
  administração** (`IsMedicaOuAdmin`). Recebe os dados mínimos (`nome_completo`,
  `email`; opcionais `telefone`, `data_nascimento`, `medica_responsavel_id`),
  cria `User` inativo + `PerfilUsuario` + `Paciente` + o convite e **devolve o
  link de primeiro acesso** (`/ativar/<token>`) para a clínica repassar à
  paciente. Quando quem cadastra é uma médica, ela já fica como responsável. O
  e-mail precisa ser único (é a chave de acesso da paciente no login).
- `GET /api/convite/<token>/` — público. Informa se o convite é válido
  (`{valido, status, nome, email}`), para a tela de ativação saber o que exibir.
- `POST /api/convite/<token>/definir-senha/` — público. Recebe `{password}`,
  aplica os validadores de senha do Django, **ativa a conta, queima o token** e
  já devolve `{access, refresh, usuario}` (a paciente entra direto). A partir
  daí ela faz login normalmente por e-mail ou username.

Esta etapa é **só backend**: a tela `/ativar/:token` e o formulário "Nova
paciente" vêm na fatia seguinte. O envio por e-mail (SMTP) é plugável e fica
para depois — por ora o link aparece na resposta da API para a clínica copiar.

## Dicionário de termos médicos (PROJ-3 e PROJ-4)

Primeira feature do projeto com persistência real. Disponível em
[`/dicionario`](http://localhost:5173/dicionario).

A página segue o protótipo do grupo: grid responsivo de cards autocontidos
(título, definição, artigos relacionados e tag colorida por categoria),
busca com ícone de lupa e filtro por categoria via chips.

A busca vive na URL (`/dicionario?busca=<termo>`), então o dicionário pode ser
aberto já filtrado a partir dos chips de **termos relacionados** das telas de
Tratamentos e Orientações (deep-link).

Endpoints do backend:

- `GET /api/dicionario/termos/` — lista termos ativos
- `GET /api/dicionario/termos/?busca=fiv` — filtra por nome, definição ou categoria
- `GET /api/dicionario/termos/<id>/` — detalhe do termo

Cada termo expõe os campos `id`, `termo`, `definicao`, `categoria`,
`exemplo` e `artigos_relacionados` (lista de `{titulo, url}`).

Como subir o ambiente completo:

```
# backend (uma vez)
cd backend
python manage.py migrate
python manage.py loaddata termos_iniciais
python manage.py runserver

# frontend (em outro terminal)
cd frontend
cp .env.example .env       # opcional: aponta para outro backend
npm install
npm run dev
```

Para cadastrar novos termos sem migrations, use o Django Admin em
`http://localhost:8000/admin/dicionario/termodicionario/` (precisa de um superusuário,
criado com `python manage.py createsuperuser`).

Detalhes das histórias e cenários BDD: [Histórias de usuário](docs/historias-de-usuario.md).

## Área da médica (PROJ-19 e PROJ-20)

A médica tem uma área própria em
[`/area-medica`](http://localhost:5173/area-medica), fora do layout da paciente.
Ela vê apenas as pacientes **vinculadas a ela** (campo `medica_responsavel`),
abre o detalhe de cada uma (dados básicos, consultas e medicamentos) e tem
poderes de escrita para agendar consultas e cadastrar medicamentos.

O escopo é garantido no backend (escopo por objeto — ponto sensível de LGPD): a
médica só enxerga/altera as pacientes vinculadas; uma médica não acessa as
pacientes de outra; a paciente é barrada da área; a administradora vê todas.

Endpoints do backend (exigem papel de médica ou administradora):

- `GET /api/medica/pacientes/` — lista as pacientes no escopo de quem pede
- `GET /api/medica/pacientes/<id>/` — detalhe (dados, consultas e medicamentos)
- `POST /api/medica/pacientes/<id>/consultas/` — agenda uma consulta para a paciente
- `POST /api/medica/pacientes/<id>/medicamentos/` — cadastra um medicamento para a paciente

O vínculo Médica↔Paciente é explícito (não derivado de consultas) e é definido
no Django Admin ou pelo seed `criar_usuarios_teste`, que já liga as pacientes de
demonstração (Renata e Amanda) à Dra. Helena Costa (`medica_teste`).

## Tratamentos e orientações (PROJ-23 e PROJ-18)

Conteúdo de referência da paciente, gerido pelo Django Admin e **público** no
backend (como o dicionário). O app `tratamentos` reúne `Tratamento`,
`EtapaTratamento` e `OrientacaoTratamento`.

- [`/tratamentos`](http://localhost:5173/tratamentos): lista os tratamentos com
  nome, descrição, indicação e as etapas principais de cada um.
- [`/orientacoes`](http://localhost:5173/orientacoes): orientações em linguagem
  simples, com filtro por categoria; cada uma pode apontar para um tratamento e
  uma etapa.

Cada tratamento e cada orientação pode listar **termos relacionados** do
dicionário. Eles aparecem como chips ("No dicionário: …") nos cards e levam
ao dicionário já filtrado por aquele termo — criando a ligação entre o
conteúdo da paciente e a explicação simples do termo. O vínculo é curado no
Django Admin (campo `termos_relacionados`, com seletor duplo) e exposto na API
em `termos_relacionados` (lista de `{id, termo}`).

Endpoints do backend (públicos, somente leitura):

- `GET /api/tratamentos/` — lista os tratamentos ativos com as etapas
- `GET /api/tratamentos/?busca=fiv` — filtra por nome, descrição ou indicação
- `GET /api/tratamentos/<id>/` — detalhe de um tratamento
- `GET /api/orientacoes/` — lista as orientações ativas
- `GET /api/orientacoes/?categoria=Procedimentos` — filtra por categoria

Para popular o conteúdo inicial fictício (idempotente). Como as fixtures já
ligam alguns termos do dicionário, carregue `termos_iniciais` antes:

```
cd backend
python manage.py loaddata termos_iniciais tratamentos_iniciais orientacoes_iniciais
```

Para cadastrar/editar sem migrations, use o Django Admin em
`http://localhost:8000/admin/tratamentos/`.

## Especialidades (PROJ-24)

A página [`/especialidades`](http://localhost:5173/especialidades) lista as
especialidades da clínica com nome, descrição e as **médicas relacionadas**
(quando houver). É conteúdo de referência gerido pelo Django Admin e **público**
no backend.

A `Especialidade` mora no app `consultas` (é usada nas consultas); o vínculo
Médica↔Especialidade é um ManyToMany explícito, definido no Django Admin ou pelo
seed `criar_usuarios_teste` (que liga a Dra. Helena Costa à Reprodução humana).

Endpoint do backend (público, somente leitura):

- `GET /api/especialidades/` — lista as especialidades ativas com as médicas
  relacionadas

## Calendário, linha do tempo e apoio (PROJ-15, PROJ-17, PROJ-22)

Mais conteúdo da paciente. Os dois primeiros são **escopados por dono** (a
paciente só vê o que é dela, garantido no backend); o terceiro é conteúdo de
referência público gerido pelo Django Admin.

- **Eventos no calendário (PROJ-15)**: além das consultas, o
  [`/calendario`](http://localhost:5173/calendario) mostra os **eventos do
  tratamento** (exame, procedimento, medicação, lembrete) com marcador próprio
  na grade e um painel "Próximos eventos". O modelo `EventoTratamento` mora no
  app `consultas`.
- **Linha do tempo (PROJ-17)**: a [`/linha-do-tempo`](http://localhost:5173/linha-do-tempo)
  mostra as etapas do tratamento da paciente em ordem, com a **etapa atual
  destacada**. O modelo `EtapaJornada` (app `tratamentos`) liga a paciente às
  `EtapaTratamento` e guarda o status de cada uma.
- **Apoio emocional (PROJ-22)**: a [`/apoio`](http://localhost:5173/apoio)
  reúne mensagens de acolhimento e exibe um aviso de que o conteúdo **não
  substitui acompanhamento profissional**. O modelo `ConteudoApoio` (app
  `apoio`) é gerido pelo Django Admin.

Endpoints do backend:

- `GET /api/eventos/` — eventos da paciente autenticada (escopo por dono)
- `GET /api/jornada/` — linha do tempo da paciente autenticada (escopo por dono)
- `GET /api/apoio/` — conteúdos de apoio publicados (público); filtro `?categoria=`

## Registro de sintomas (PROJ-21)

Primeira tela em que a paciente **escreve** os próprios dados. Em
[`/sintomas`](http://localhost:5173/sintomas) ela registra sintomas e
observações (data, tipo, descrição e intensidade opcional de 1 a 5) e vê o
histórico dos próprios registros. É dado pessoal de saúde: cada paciente só
acessa o que é dela, garantido no backend.

O modelo `RegistroSintoma` mora no app `sintomas`. Endpoints (exigem papel de
paciente):

- `GET /api/sintomas/` — lista os registros da paciente autenticada
- `POST /api/sintomas/` — cria um registro para a paciente autenticada (a dona
  vem da sessão, nunca do corpo da requisição)

Registros de demonstração são criados pelo `criar_usuarios_teste`.

## Busca global (PROJ-25)

A busca do cabeçalho procura, de uma vez, em todo o conteúdo público de
referência: dicionário, tratamentos, orientações e especialidades. Ao enviar o
termo, a `SearchBar` leva para
[`/busca?q=<termo>`](http://localhost:5173/busca?q=fiv), que mostra os
resultados **agrupados por tipo**, cada um com um link para a página de origem
(o dicionário abre já filtrado pelo termo).

Um único endpoint público resolve tudo e devolve o **tipo** de cada resultado.
Não há models novos: a busca consulta o conteúdo já existente.

- `GET /api/busca/?q=<termo>` — busca unificada; cada item traz `tipo`,
  `tipo_label`, `id`, `titulo`, `descricao` (trecho) e `url` (deep-link). Termo
  com menos de dois caracteres devolve lista vazia; há limite por tipo.

## Ciclo menstrual (PROJ-5 e PROJ-6)

Em [`/ciclo`](http://localhost:5173/ciclo) a paciente **registra** as fases do
próprio ciclo (data, etapa — menstruação, fase folicular, ovulação ou fase
lútea —, observações e status), edita e exclui (com confirmação) cada registro e
vê **previsões** do próximo ciclo. É dado pessoal de saúde: cada paciente só
acessa o que é dela, garantido no backend.

As previsões usam **apenas os registros de etapa "menstruação"** como início de
ciclo: a partir de dois ou mais inícios, estimam a próxima menstruação (pela
média dos intervalos) e o período fértil (cerca de 14 dias antes). Com menos de
dois inícios, a tela informa que ainda faltam dados. A previsão é sempre uma
estimativa e traz o aviso de que **não substitui a orientação da equipe médica**.

No alto da página, um **painel visual** resume o momento do ciclo: um anel mostra
a **fase atual** (menstrual, folicular, ovulatória ou lútea), o dia do ciclo e
quantos dias faltam para a próxima menstruação; três cards trazem a próxima
menstruação, as **chances de gravidez** (estimadas pela janela fértil) e a
duração média; e o calendário do mês destaca os dias de menstruação, a janela
fértil, a ovulação e a previsão. Tudo é estimativa e convive com o mesmo aviso.

O modelo `RegistroCiclo` mora no app `ciclo`. Endpoints (exigem papel de
paciente):

- `GET /api/ciclo/registros/` — lista os registros da paciente autenticada
- `POST /api/ciclo/registros/` — cria um registro (a dona vem da sessão)
- `GET/PATCH/DELETE /api/ciclo/registros/<id>/` — lê, atualiza ou exclui um
  registro da própria paciente
- `GET /api/ciclo/previsoes/` — previsão a partir dos inícios de menstruação
  (próxima menstruação, janela fértil, fase atual, dia do ciclo e chances de
  gravidez), sempre como estimativa

Registros de demonstração são criados pelo `criar_usuarios_teste`.

## Segurança e Privacidade (LGPD)

A Amare trata **dados pessoais sensíveis** (dados de saúde), então privacidade é
critério técnico de qualidade, não enfeite. Medidas adotadas:

- **Minimização**: cada etapa coleta só o necessário.
- **Separação de dados**: conta, perfil e dados clínicos em tabelas distintas.
- **Controle de acesso no backend**: cada papel (paciente, médica, admin) só
  acessa o que lhe compete — nunca confiando apenas no frontend.
- **Segredos fora do código**: `SECRET_KEY`, banco e demais credenciais vêm de
  variáveis de ambiente; `.env` não é versionado (há `.env.example`).
- **Produção endurecida**: com `DJANGO_DEBUG=False`, o projeto liga HTTPS
  obrigatório, HSTS e cookies seguros automaticamente.
- **Sem dado sensível em URL nem em log**; **dados fictícios** em
  desenvolvimento, testes e demonstrações.

Documentação completa em [`docs/lgpd/`](docs/lgpd/README.md): mapeamento de
dados, registro de operações, RIPD simplificado, plano de incidente e rascunho
da política de privacidade. Toda PR que toca dado pessoal passa pelo checklist
LGPD do template de pull request.

## Documentação

- [Configuração do ambiente](docs/configuracao-do-ambiente.md)
- [Guia do Django](docs/guia-django.md)
- [Guia do React](docs/guia-react.md)
- [Guia do Cypress](docs/guia-cypress.md)
- [Guia da Motion](docs/guia-motion.md)
- [Guia do ESLint e Prettier](docs/guia-eslint-prettier.md)
- [Fluxo de Git](docs/fluxo-git.md)
- [Histórias de usuário](docs/historias-de-usuario.md)
- [Segurança e Privacidade (LGPD)](docs/lgpd/README.md)
- [Deploy em produção (Azure + Neon)](docs/deploy-azure.md)
- [Como contribuir](CONTRIBUTING.md)

## Estrutura do projeto

```
backend/
├── manage.py
├── marea_api/              configuração do projeto Django (settings, urls raiz)
├── usuarios/               autenticação JWT + perfis (paciente, médica, admin)
├── dicionario/             termos médicos (PROJ-3, PROJ-4)
├── consultas/              consultas e especialidades (PROJ-1)
├── medicamentos/           checklist diário de medicamentos prescritos (PROJ-2)
├── area_medica/            área da médica com escopo por objeto (PROJ-19, PROJ-20)
├── tratamentos/            tratamentos, etapas, orientações e linha do tempo (PROJ-23, PROJ-18, PROJ-17)
├── apoio/                  conteúdos de apoio emocional (PROJ-22)
├── sintomas/               registro de sintomas escrito pela paciente (PROJ-21)
├── requirements.txt
└── README.md
frontend/
├── src/
│   ├── assets/
│   ├── components/         AnelCiclo, BannerProximaConsulta, Button, CalendarioMes,
│   │                       Header, IconeChevron, IconeFechar, IconeLogout, IconeLupa,
│   │                       IconeMenu, InputField, PageTransition, ProtectedRoute,
│   │                       SearchBar, SelectField, Sidebar
│   ├── contexts/           AuthContext + useAuth (sessão JWT)
│   ├── layouts/            AppLayout (rotas internas) e AuthLayout (login)
│   ├── pages/              ApoioEmocional, AreaMedica, Bot, Ciclo, Consultas,
│   │                       Dicionario, EmBreve, Especialidades, Home,
│   │                       LinhaDoTempo, Login, Medicamentos, Orientacoes,
│   │                       Perfil, Sintomas, Tratamentos
│   ├── routes/             AppRoutes (mapeamento de rotas + ProtectedRoute)
│   ├── services/           (TypeScript) api, apoioService, authService, cicloService,
│   │                       consultasService, dicionarioService, linhaTempoService,
│   │                       medicaService, medicamentosService, perfilService,
│   │                       sintomasService, tratamentosService
│   ├── types/              index.ts (tipos do domínio da API)
│   ├── styles/             variables.css, global.css, a11y.css
│   ├── utils/              formatadores (telefone)
│   ├── App.jsx             MotionConfig + AuthProvider + AppRoutes
│   └── main.jsx
├── cypress/
│   └── e2e/                apoio, area-medica, busca, ciclo, consultas,
│                           dicionario, especialidades, layout-rotas,
│                           linha-do-tempo, login, medicamentos, orientacoes,
│                           perfil, polimento-ux-perfil, responsividade-mobile,
│                           sintomas, tratamentos (147 testes)
├── cypress.config.js
├── package.json
├── tsconfig.json            TypeScript incremental (allowJs, strict, noEmit)
└── vite.config.js          porta fixa 5173 (strictPort)
docs/                       guias de Django, React, Cypress, Motion, ESLint,
                            Git, configuração e histórias de usuário
.gitignore
README.md
CONTRIBUTING.md
```

---

## Contexto e pesquisa do projeto

Este repositório concentra a visão do projeto, os aprendizados da pesquisa e o direcionamento do MVP da plataforma Amare, criada pelo grupo Maréa para uma cliente real: a Clínica Amare. A proposta é reduzir confusão, ansiedade e risco de erro ao longo da jornada de fertilização, oferecendo uma experiência mais clara, organizada e humana para pacientes em acompanhamento.

## Sobre a clínica parceira

A Clínica Amare é uma clínica real de fertilidade e reprodução humana, localizada em Recife-PE, com foco em medicina humanizada e acompanhamento especializado ao longo da jornada reprodutiva.

A clínica atua com foco em:

- reprodução humana;
- tratamentos de fertilidade;
- acompanhamento especializado com abordagem humanizada.

Entre os tratamentos destacados pela clínica estão coito programado, inseminação intrauterina, fertilização in vitro, preservação da fertilidade e aconselhamento reprodutivo.

As três médicas donas da Clínica Amare são:

- Adriana Leal Griz Notaro — Especialista em Reprodução Assistida;
- Ana Caroline Paz Serafim — Especialista em Videocirurgia Ginecológica;
- Mariana Corrêa Nunes — Especialista em Reprodução Assistida.

## Sobre o projeto do grupo

A plataforma se chama **Amare**, o mesmo nome da clínica parceira, reforçando a conexão entre o produto digital e o atendimento real. O **grupo** que desenvolve a plataforma se chama **Maréa** (Grupo 08 da CESAR School).

Em outras palavras:

- a **Clínica Amare** é a organização real atendida pelo projeto;
- a **plataforma Amare** é o produto digital concebido pelo grupo Maréa para melhorar a experiência das pacientes dessa clínica.

## Integrantes do grupo

O projeto é desenvolvido pelo grupo `Maréa`, Grupo 08 do segundo período da CESAR School. A equipe é formada por:

- Anita de Arruda Santana — Designer;
- Arthur de Almeida Oliveira — Cientista da Computação;
- Arthur Filipe Silva dos Reis — Cientista da Computação;
- Gabriel Gondim Malta — Cientista da Computação;
- Gabriel Mendes Cavalcanti — Cientista da Computação;
- Guilherme Silva Guimarães — Cientista da Computação;
- Hélio de Moraes Rêgo Neto — Cientista da Computação;
- Júlia Moura de Oliveira Gambôa — Designer;
- Matheus Assis de Souza Jácome — Cientista da Computação;
- Pedro Henrique Martins Cavalcanti — Cientista da Computação.

## Orientação acadêmica

- Professora orientadora: Fernanda.

## Visão geral do projeto

A oportunidade identificada pelo grupo foi apoiar digitalmente uma clínica real que já oferece atendimento especializado em fertilidade e reprodução humana, mas cujo desafio inclui digitalizar melhor a experiência da paciente.

Hoje, parte relevante dessa jornada ainda depende de múltiplos canais, informações dispersas, linguagem médica difícil e rotinas altamente cronometradas. O resultado é previsível: sobrecarga, insegurança e medo de errar etapas importantes do tratamento.

Este README resume a fase de pesquisa e define o direcionamento do MVP.

## Problema que o projeto quer resolver

Pacientes em tratamento de fertilidade enfrentam uma combinação de dificuldades práticas e emocionais:

- excesso de informação em momentos de alta ansiedade;
- linguagem técnica que dificulta a compreensão do processo;
- dificuldade para acompanhar consultas, exames, medicações e próximos passos;
- informações descentralizadas em diferentes canais;
- sensação de pouca clareza e pouco suporte contínuo ao longo da jornada.

Na prática, o problema não está na existência da clínica, que já é real e especializada, mas na ausência de um suporte digital à altura da complexidade dessa jornada. É um desafio informacional, arquitetural e de experiência: faltam centralização, clareza e apoio contextual.

## Objetivo da plataforma

O objetivo da Amare é funcionar como um ponto de apoio digital para pessoas em tratamento de fertilidade, ajudando a:

- organizar etapas, datas e orientações do tratamento;
- reduzir o risco de esquecimento de medicações e procedimentos;
- traduzir informações complexas para uma linguagem mais acessível;
- centralizar conteúdos importantes em um único lugar;
- oferecer uma experiência mais acolhedora durante uma jornada emocionalmente delicada.

## Público-alvo e persona-síntese

O público principal são pacientes que estão passando, ou já passaram, por tratamentos de fertilidade, especialmente FIV.

Persona-síntese:

- mulher adulta, com rotina intensa e múltiplas responsabilidades;
- busca engravidar e valoriza acompanhamento confiável;
- precisa de informações claras, organização prática e segurança;
- sente o peso emocional do processo e precisa de uma solução que ajude sem gerar mais carga cognitiva.

## Principais dores do usuário

Com base na jornada atual, nas entrevistas e no relatório de pesquisa, as dores mais recorrentes foram:

- medo de errar horários, doses ou etapas do tratamento;
- dificuldade para entender termos e orientações médicas;
- ansiedade gerada pela falta de clareza sobre o que vem a seguir;
- cansaço causado por exames, consultas e registros espalhados;
- ausência de suporte emocional estruturado durante o processo;
- sensação de que os apps existentes são genéricos demais ou complexos demais para esse contexto.

## Insights da pesquisa

- A pesquisa quantitativa analisou 15 respostas, das quais 12 foram consideradas válidas.
- `66,7%` dos participantes afirmaram nunca ter usado aplicativos de fertilidade.
- Mesmo com baixa adoção atual, `91,6%` demonstraram interesse em usar uma solução de apoio ao processo.
- O principal gap não é falta de mercado, e sim baixa qualidade percebida nas soluções existentes.
- As necessidades mais recorrentes foram: lembretes de medicação e procedimentos, organização de exames e consultas, explicações claras, acesso confiável a informações e suporte emocional.
- Os maiores obstáculos relatados foram excesso de informação, linguagem médica complexa, dificuldade de lembrar orientações e falta de clareza sobre próximos passos.
- A jornada atual concentra fricções em praticamente todas as etapas: decisão, busca por informação, consultas, entendimento do tratamento, execução das rotinas e espera por resultados.
- No material qualitativo, surgiu com força a percepção de que o processo é complexo por natureza, mas pode ser melhor apoiado com organização, lembretes, registro de custos e uma experiência menos confusa.
- O valor percebido está menos em "ter muitas features" e mais em simplificar, orientar e acompanhar bem.

## Funcionalidades priorizadas

O MVP foi direcionado para poucas funcionalidades com alto impacto real:

- `Lembretes de medicamentos`: ajudar o paciente a acompanhar horários, doses e etapas críticas.
- `Calendário do tratamento`: reunir consultas, exames, procedimentos e marcos importantes em uma visão única.
- `Centralização de informações`: concentrar orientações, exames, instruções e conteúdos relevantes em um só lugar.
- `Explicação simples do processo`: traduzir o tratamento para uma linguagem clara, direta e menos intimidadora.

Essas prioridades vieram tanto da pesquisa quanto do benchmark, e foram escolhidas por serem viáveis para o time e valiosas para o usuário.

## Restrições e limites do projeto

- O projeto lida com dados sensíveis de saúde, então segurança, privacidade, login e controle de acesso são obrigatórios.
- O escopo atual assume uma stack realista para o grupo: `Django`, `Python`, `HTML`, `CSS` e `JavaScript`.
- A primeira versão não depende de integração real com sistemas internos da clínica.
- Sempre que necessário, os dados podem ser inseridos manualmente.
- O app depende de internet e, por isso, não deve depender de integrações externas críticas para o funcionamento básico.
- `IA avançada` está fora do escopo desta versão.
- Integrações complexas com prontuários, automações avançadas e ecossistemas médicos completos também ficam fora do MVP.
- A diretriz principal do projeto é simples: fazer poucas coisas muito bem feitas, em vez de tentar cobrir tudo.

## Benchmark resumido

| Referência | O que aproveitar | O que evitar |
| --- | --- | --- |
| Flo | Interface acolhedora, lembretes, linguagem mais humana | excesso de notificações, sobrecarga de conteúdo e foco pouco específico em fertilização |
| Clue | Visualização clara de dados, organização de informações, design confiável | curva de aprendizado maior e sensação menos acolhedora |
| Apple Health | privacidade, consistência e registro simples | baixa personalização e pouca especialização para fertilidade |

Aprendizado prático: a Amare não deve competir em volume de funcionalidades. Deve competir em clareza, foco no contexto de fertilização e utilidade real na rotina.

## Artefatos e links do projeto

- Clínica parceira: [site oficial da Clínica Amare](https://clinicaamare.com/)
- Site do projeto do grupo: [Google Sites - Cesar Unified](https://sites.google.com/cesar.school/cesarunified/home?authuser=1)
- Matriz de pesquisa: [Figma Board](https://www.figma.com/board/cHnSL4PJFX6hUpjrfkIbKY/matriz-de-pesquisa?node-id=0-1&t=lz3TiODBaHzbTfmV-1)
- Persona: [Figma Design](https://www.figma.com/design/zhsCkmDpmJWLEErBN7jMgj/Persona?node-id=0-1&t=iC3nAk7Bc6UZrwpT-1)
- Ideação: [FigJam](https://www.figma.com/board/wsmsoRGorPJMUXdpqb7Dp4/Sem-t%C3%ADtulo?node-id=0-1&t=OgXX1tJBl1CKz1aD-1)

## Próximos passos

- transformar os achados da pesquisa em backlog priorizado do MVP;
- detalhar fluxos principais de paciente, especialmente calendário, lembretes e centralização de informações;
- consolidar wireframes e decisões de interface com foco em simplicidade e acolhimento;
- definir melhor o modelo de dados e as regras de acesso para pacientes e profissionais;
- implementar a primeira versão funcional com foco em confiabilidade, clareza e baixo esforço de uso.

## Base de pesquisa consolidada neste README

Este resumo foi consolidado a partir dos seguintes materiais do projeto:

- desk research;
- benchmarking;
- jornada atual do usuário;
- planejamento de usuário e persona;
- entrevistas com usuários;
- relatório de pesquisa;
- matriz de desk research;
- lista de restrições do produto;
- links de artefatos em Figma.
