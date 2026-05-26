# Histórias de usuário

Este documento registra as histórias de usuário entregues em cada etapa do Maréa, com
o texto integral retirado do Jira (projeto `PROJ` em `afreis.atlassian.net`). Cada
história aponta para a issue correspondente no GitHub.

## Etapa atual — Dicionário de termos médicos (épico PROJ-9)

> **Atualização**: as duas histórias evoluíram durante a sprint para refletir o
> protótipo do grupo — grid de cards autocontidos com tag colorida por categoria,
> lista de artigos relacionados e filtro por categoria. O backend ganhou o campo
> `artigos_relacionados` (JSONField) para suportar a lista de links por termo.
> A busca por texto continua via parâmetro `?busca=` na API.

### PROJ-3 — H2 Lista de termos médicos

- Jira: [PROJ-3](https://afreis.atlassian.net/browse/PROJ-3)
- GitHub: [#6](https://github.com/CC-2025-2-CESAR/Marea/issues/6)
- Épico: [PROJ-9 — Dicionário Interativo de Termos Técnicos](https://afreis.atlassian.net/browse/PROJ-9) — issue [#2](https://github.com/CC-2025-2-CESAR/Marea/issues/2)

**História**: Como paciente, quero visualizar uma lista de termos médicos para entender
melhor palavras usadas durante o tratamento.

**Objetivo**: Oferecer explicações simples e acessíveis para termos técnicos relacionados
à fertilidade e aos tratamentos da clínica.

**Critérios de aceitação**:

- A página deve listar os termos médicos cadastrados.
- Cada termo deve exibir nome, explicação e categoria quando houver.
- Os dados devem ser lidos do banco de dados.
- A lista deve ser apresentada de forma clara e organizada.
- Caso não existam termos cadastrados, o sistema deve exibir uma mensagem informativa.

**Cenários BDD**:

```
Cenário: Visualizar termos cadastrados
  Dado que existem termos médicos cadastrados no sistema
  Quando a paciente acessa a página de dicionário
  Então ela deve visualizar a lista de termos com suas explicações

Cenário: Nenhum termo cadastrado
  Dado que não existem termos médicos cadastrados no sistema
  Quando a paciente acessa a página de dicionário
  Então o sistema deve informar que nenhum termo foi encontrado
```

**Dados envolvidos**: `TermoDicionario`.

### PROJ-4 — H2 Busca e detalhes dos termos médicos

- Jira: [PROJ-4](https://afreis.atlassian.net/browse/PROJ-4)
- GitHub: [#7](https://github.com/CC-2025-2-CESAR/Marea/issues/7)
- Épico: [PROJ-9 — Dicionário Interativo de Termos Técnicos](https://afreis.atlassian.net/browse/PROJ-9) — issue [#2](https://github.com/CC-2025-2-CESAR/Marea/issues/2)

**História**: Como paciente, quero pesquisar um termo médico e visualizar sua explicação
para tirar dúvidas de forma rápida durante o tratamento.

**Objetivo**: Facilitar o acesso a explicações simples sobre termos técnicos, permitindo
que a paciente encontre rapidamente o significado de uma palavra específica.

**Critérios de aceitação**:

- A página deve permitir pesquisar termos médicos pelo nome.
- O sistema deve exibir resultados compatíveis com a busca realizada.
- Ao selecionar um termo, a paciente deve visualizar sua explicação completa.
- Os dados devem ser lidos do banco de dados.
- Caso nenhum termo seja encontrado, o sistema deve exibir uma mensagem informativa.

**Cenários BDD**:

```
Cenário: Pesquisar termo existente
  Dado que existe o termo "FIV" cadastrado no sistema
  Quando a paciente pesquisa por "FIV"
  Então o sistema deve exibir o termo e sua explicação

Cenário: Visualizar detalhes de um termo
  Dado que existem termos cadastrados no dicionário
  Quando a paciente seleciona um termo da lista
  Então o sistema deve exibir a explicação completa do termo

Cenário: Pesquisar termo inexistente
  Dado que a paciente está na página de dicionário
  Quando ela pesquisa por um termo não cadastrado
  Então o sistema deve informar que nenhum termo foi encontrado
```

**Dados envolvidos**: `TermoDicionario`.

## Etapa atual — Autenticação e perfil

### H5 — Login e perfil de usuário

- Jira: ainda a registrar (sugestão de identificador: PROJ-15).
- GitHub: ainda a registrar.
- Épico sugerido: **Acesso e identidade** (a criar).

**História**: Como paciente, quero acessar minha conta e visualizar/atualizar
meus dados de perfil para acompanhar minhas informações dentro da plataforma
Amare.

**Objetivo**: Estabelecer a base de autenticação real e o cadastro de perfil
da paciente, preparando o sistema para diferenciar pacientes, médicas e
administradoras.

**Critérios de aceitação**:

- O usuário deve conseguir fazer login com credenciais válidas.
- O sistema deve identificar o tipo de usuário (paciente, médica ou admin).
- O usuário autenticado deve conseguir acessar a página de perfil.
- O perfil deve carregar dados vindos do banco.
- A paciente deve conseguir atualizar nome completo, telefone, data de
  nascimento e tipo sanguíneo do seu perfil.
- O e-mail e os dados clínicos (medicamentos, observações) aparecem como
  visualização — atualização pelo Django Admin.
- Usuários não autenticados não devem acessar páginas internas.
- O botão "Sair" deve limpar a sessão e voltar para a tela de login.

**Cenários BDD**:

```
Cenário: Login com credenciais válidas
  Dado que existe uma paciente cadastrada no sistema
  Quando ela informa usuário e senha válidos
  Então o sistema deve autenticá-la e redirecioná-la para a página de perfil

Cenário: Login com credenciais inválidas
  Dado que existe uma paciente cadastrada no sistema
  Quando ela informa um usuário ou senha incorreto
  Então o sistema deve exibir a mensagem "Usuário ou senha inválidos."

Cenário: Acessar perfil autenticado
  Dado que a paciente está autenticada
  Quando ela acessa a página de perfil
  Então o sistema deve exibir seus dados cadastrados

Cenário: Atualizar perfil
  Dado que a paciente está na página de perfil
  Quando ela altera o telefone e clica em Salvar
  Então o sistema deve atualizar o perfil no banco e exibir mensagem de sucesso

Cenário: Bloquear acesso sem login
  Dado que uma pessoa não está autenticada
  Quando tenta acessar a página de perfil
  Então o sistema deve redirecioná-la para a página de login

Cenário: Logout
  Dado que a paciente está autenticada
  Quando ela clica em Sair
  Então o sistema deve limpar a sessão e redirecioná-la para /login
```

**Dados envolvidos**: `User` (Django padrão), `PerfilUsuario`, `Paciente`,
`Medica`.

## Etapa atual — Consultas agendadas (épico PROJ-8)

### PROJ-1 — Consultas agendadas

- Jira: [PROJ-1](https://afreis.atlassian.net/browse/PROJ-1)
- GitHub: [#4](https://github.com/CC-2025-2-CESAR/Marea/issues/4)
- Épico: [PROJ-8 — Gestão de Consultas, Calendário e Lembretes](https://afreis.atlassian.net/browse/PROJ-8) — issue [#1](https://github.com/CC-2025-2-CESAR/Marea/issues/1)

**História**: Como paciente, quero visualizar minhas consultas agendadas e
saber qual é a próxima para não esquecer compromissos importantes do
tratamento.

**Objetivo**: Centralizar agenda da paciente em uma visão de calendário
mensal, com painel lateral de próximas consultas e lembretes, e dar
visibilidade da próxima consulta diretamente na página inicial.

**Critérios de aceitação**:

- A página `/calendario` deve mostrar uma grade mensal com marcadores
  visuais nos dias que têm consulta.
- O painel lateral deve listar as próximas consultas e os lembretes
  associados.
- A página inicial deve exibir um banner com a próxima consulta agendada
  da paciente nos próximos 7 dias.
- Os dados devem vir do banco via API REST autenticada.
- Quando não houver consultas agendadas, o banner some sem quebrar a
  Home.
- Pacientes só veem as próprias consultas.

**Cenários BDD**:

```
Cenário: Visualizar calendário com consultas
  Dado que existem consultas agendadas para a paciente
  Quando ela acessa /calendario
  Então o sistema deve exibir a grade mensal com marcadores nos dias correspondentes

Cenário: Próxima consulta na Home
  Dado que a paciente tem ao menos uma consulta agendada nos próximos 7 dias
  Quando ela acessa a página inicial
  Então o sistema deve exibir um banner com a próxima consulta

Cenário: Sem consultas agendadas
  Dado que a paciente não tem consultas agendadas nos próximos 7 dias
  Quando ela acessa a página inicial
  Então o banner de próxima consulta não deve aparecer
```

**Dados envolvidos**: `Especialidade`, `Consulta` (FK para `Paciente`,
`Medica`, `Especialidade`).

**Notas de entrega**: 11 testes Cypress em `consultas.cy.js` cobrindo
banner da Home, grade mensal, painel lateral, status das consultas e
seleção de dia.

## Próximas etapas (histórias planejadas, ainda não implementadas)

- **Gestão de Consultas, Calendário e Lembretes** (épico [PROJ-8](https://afreis.atlassian.net/browse/PROJ-8) — issue [#1](https://github.com/CC-2025-2-CESAR/Marea/issues/1))
  - PROJ-2 — Checklist de remédios — issue [#5](https://github.com/CC-2025-2-CESAR/Marea/issues/5)
- **Ciclo menstrual** (épico [PROJ-10](https://afreis.atlassian.net/browse/PROJ-10) — issue [#3](https://github.com/CC-2025-2-CESAR/Marea/issues/3))
  - PROJ-5 — Registro e atualizações do ciclo — issue [#8](https://github.com/CC-2025-2-CESAR/Marea/issues/8)
  - PROJ-6 — Previsões do ciclo — issue [#9](https://github.com/CC-2025-2-CESAR/Marea/issues/9)
