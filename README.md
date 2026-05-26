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

- Login real com JWT contra o backend Django.
- Página de perfil consumindo a API (`GET` e `PATCH /api/perfil/`).
- Tipos de usuário: paciente, médica e administradora (gerenciados pelo Django Admin).
- Rotas internas protegidas: sem sessão, qualquer acesso volta para `/login`.
- Botão de logout funcional na sidebar.
- Página de Dicionário consumindo a primeira API real do projeto (PROJ-3 e PROJ-4).
- Página de Calendário com lista de consultas agendadas, realizadas e canceladas
  (PROJ-1), além de banner de "Próxima consulta" na página inicial.
- Interface adaptada para celular: menu lateral em drawer (hambúrguer) abaixo de
  768px, breakpoints padronizados em 480/768/1024 e tap targets de pelo menos 44px.
- Polimento de UX: transição suave entre rotas internas, sidebar com microinterações
  e indicador lateral de rota ativa, SelectField customizado para tipo sanguíneo,
  máscara brasileira de telefone no perfil e respeito a `prefers-reduced-motion`.
- Demais páginas internas seguem como placeholders para evolução futura.

## Tecnologias

- Backend: Django (Python)
- API: Django REST Framework
- Autenticação: JSON Web Tokens (`djangorestframework-simplejwt`)
- Frontend: React (JavaScript)
- Build do frontend: Vite
- Animações: Motion (microinterações e transições suaves)
- Testes E2E: Cypress
- Padronização: ESLint e Prettier
- Banco local: SQLite (recomendado PostgreSQL no futuro)

## Rotas atuais

- `/login`: tela de login pública, sem sidebar, header ou busca.
- `/`: página inicial da plataforma (requer login).
- `/perfil`: perfil da paciente com formulário editável (requer login).
- `/calendario`: lista de consultas agendadas, realizadas e canceladas da paciente.
- `/ciclo`: placeholder de ciclo.
- `/dicionario`: dicionário de termos médicos com busca, lista e detalhes.
- `/bot`: placeholder de bot.
- `/tratamentos`: placeholder de tratamentos.
- `/especialidades`: placeholder de especialidades.

## Layouts

- `AuthLayout`: usado em rotas públicas, como `/login`.
- `AppLayout`: usado nas rotas internas, com sidebar, header, busca e área principal de
  conteúdo.

As páginas internas ainda não possuem funcionalidades reais. Elas mostram apenas título e
texto básico enquanto a navegação e a estrutura visual são preparadas.

## Como rodar o backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata termos_iniciais
python manage.py loaddata consultas_iniciais
python manage.py criar_usuarios_teste
python manage.py runserver
```

Backend em `http://127.0.0.1:8000/`.

O command `criar_usuarios_teste` é idempotente — pode rodar mais de uma vez sem
duplicar registros. Ele cria três usuários fictícios com senha `amare123`:

| Usuário | Tipo | Para que serve |
|---|---|---|
| `paciente_teste` | Paciente | Login da paciente, fluxo principal do app. |
| `medica_teste` | Médica | Reservado para futuro fluxo da médica. |
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

## Login e perfil (H5)

Autenticação real via JWT. O `User` padrão do Django é mantido; um modelo
`PerfilUsuario` (com `OneToOne` para `User`) carrega os dados comuns e os
modelos `Paciente` e `Medica` carregam os dados específicos de cada papel.

Endpoints novos:

- `POST /api/auth/login/` — recebe `{username, password}` e devolve
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
3. Acesse `http://localhost:5173/login`, entre com `paciente_teste` / `amare123`.
4. Você é redirecionada para `/perfil`. Edite o telefone, clique em Salvar.
5. O botão "Sair" no rodapé da sidebar limpa a sessão e volta para `/login`.

Para gerenciar usuários, médicas e dados clínicos:

```
http://localhost:8000/admin/
```

Use `admin_teste` / `amare123`. O Django Admin permite criar/editar perfis,
ajustar tipo de usuário, preencher medicamentos e observações da paciente, e
cadastrar dados profissionais das médicas.

## Dicionário de termos médicos (PROJ-3 e PROJ-4)

Primeira feature do projeto com persistência real. Disponível em
[`/dicionario`](http://localhost:5173/dicionario).

A página segue o protótipo do grupo: grid responsivo de cards autocontidos
(título, definição, artigos relacionados e tag colorida por categoria),
busca com ícone de lupa e filtro por categoria via chips.

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

## Documentação

- [Configuração do ambiente](docs/configuracao-do-ambiente.md)
- [Guia do Django](docs/guia-django.md)
- [Guia do React](docs/guia-react.md)
- [Guia do Cypress](docs/guia-cypress.md)
- [Guia do ESLint e Prettier](docs/guia-eslint-prettier.md)
- [Fluxo de Git](docs/fluxo-git.md)
- [Histórias de usuário](docs/historias-de-usuario.md)
- [Como contribuir](CONTRIBUTING.md)

## Estrutura inicial do projeto

```
backend/
├── manage.py
├── marea_api/
├── requirements.txt
└── README.md
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Button/
│   │   └── InputField/
│   ├── pages/
│   │   └── Login/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── cypress/
│   └── e2e/
├── cypress.config.js
├── package.json
└── vite.config.js
docs/
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
