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

## Etapa atual — Gestão de Consultas e Lembretes (épico PROJ-8)

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

### PROJ-2 — Checklist de remédios

- Jira: [PROJ-2](https://afreis.atlassian.net/browse/PROJ-2)
- GitHub: [#5](https://github.com/CC-2025-2-CESAR/Marea/issues/5)
- Épico: [PROJ-8 — Gestão de Consultas, Calendário e Lembretes](https://afreis.atlassian.net/browse/PROJ-8) — issue [#1](https://github.com/CC-2025-2-CESAR/Marea/issues/1)

**História**: Como paciente, quero marcar os remédios prescritos como
tomados ao longo do dia para não esquecer nenhuma dose nem perder o fio
do tratamento.

**Objetivo**: Dar à paciente uma checklist diária simples dos
medicamentos prescritos, com toggle reversível e estado que reseta a
cada novo dia. Reaproveitar a mesma checklist no card Lembretes do
calendário, evitando duplicar lógica.

**Critérios de aceitação**:

- A página `/medicamentos` deve listar os medicamentos cadastrados para
  a paciente, com nome, dose, horário e instruções.
- Cada item deve ter checkbox para marcar/desmarcar como tomado hoje.
- A interface deve exibir um contador "X de Y tomados hoje".
- A marcação deve ser otimista (UI atualiza antes da resposta do
  servidor) e reverter se o PATCH falhar.
- A checklist deve resetar implicitamente a cada novo dia.
- O card Lembretes do `/calendario` deve consumir a mesma checklist.
- Quando não houver medicamentos prescritos, exibir mensagem amigável.

**Cenários BDD**:

```
Cenário: Visualizar a checklist diária
  Dado que a paciente tem medicamentos prescritos
  Quando ela acessa /medicamentos
  Então o sistema deve listar cada remédio com dose, horário e checkbox

Cenário: Marcar remédio como tomado
  Dado que a paciente está em /medicamentos
  Quando ela clica no checkbox de um remédio pendente
  Então o sistema deve marcá-lo como tomado e atualizar o contador

Cenário: Nenhum medicamento prescrito
  Dado que a paciente não tem medicamentos cadastrados
  Quando ela acessa /medicamentos
  Então o sistema deve exibir uma mensagem amigável de lista vazia
```

**Dados envolvidos**: `Medicamento` (FK para `Paciente`), com
relacionamento implícito de tomada do dia (reset a cada novo dia).

**Notas de entrega**: 12 testes Cypress em `medicamentos.cy.js` cobrindo
visualização, marcação/desmarcação, contador, mensagens de vazio/erro,
atualização otimista, rollback no erro do PATCH e link da sidebar.

## Etapa atual — Área da médica (PROJ-19 e PROJ-20)

### PROJ-19 e PROJ-20 — Acompanhamento e gestão das pacientes pela médica

- Jira: [PROJ-19](https://afreis.atlassian.net/browse/PROJ-19) e [PROJ-20](https://afreis.atlassian.net/browse/PROJ-20)

**História**: Como médica, quero uma área própria com as pacientes vinculadas a
mim, para acompanhar a evolução de cada uma e registrar consultas e
medicamentos sem misturar com a navegação da paciente.

**Objetivo**: Dar à médica um espaço separado (`/area-medica`) com escopo por
objeto: ela vê e altera apenas as pacientes sob sua responsabilidade. O vínculo
Médica↔Paciente é explícito (campo `medica_responsavel`), não derivado das
consultas. A administradora enxerga todas as pacientes.

**Critérios de aceitação**:

- A médica é direcionada para `/area-medica` e não acessa as telas da paciente.
- A lista mostra apenas as pacientes vinculadas à médica autenticada.
- O detalhe da paciente traz dados básicos, consultas e medicamentos.
- A médica pode agendar consulta e cadastrar medicamento para a paciente.
- Uma médica não acessa (nem altera) pacientes de outra médica — resposta 404.
- A paciente é barrada da área (403) e o acesso anônimo é negado (401).
- A administradora vê todas as pacientes.

**Cenários BDD**:

```
Cenário: Médica vê apenas as suas pacientes
  Dado que a médica tem pacientes vinculadas a ela
  Quando ela acessa /area-medica
  Então o sistema deve listar somente as pacientes sob sua responsabilidade

Cenário: Médica agenda uma consulta
  Dado que a médica está no detalhe de uma paciente vinculada
  Quando ela preenche e envia o formulário de consulta
  Então o sistema deve registrar a consulta para aquela paciente

Cenário: Médica tenta acessar paciente de outra médica
  Dado que existe uma paciente vinculada a outra médica
  Quando a médica tenta abrir o detalhe dessa paciente
  Então o sistema deve responder 404, sem vazar dados
```

**Dados envolvidos**: `Paciente.medica_responsavel` (FK para `Medica`),
`Consulta` e `Medicamento` (FK para `Paciente`), criados/lidos com escopo por
objeto no backend (`backend/area_medica/`).

**Notas de entrega**: 9 testes de backend em `area_medica/tests.py` (acesso
permitido **e** negado) e 8 testes Cypress em `area-medica.cy.js` (controle de
acesso por papel e fluxo de acompanhamento). Pacientes de demonstração baseadas
nas personas do projeto (Renata Cegonha e Amanda Coelho), criadas pelo seed
`criar_usuarios_teste`.

## Etapa atual — Conteúdo da paciente (PROJ-23, PROJ-18)

Conteúdo de referência gerido pelo Django Admin e lido de forma pública pela
paciente (não é dado pessoal). O app `tratamentos` reúne os modelos
`Tratamento`, `EtapaTratamento` e `OrientacaoTratamento`.

Tratamentos e orientações se ligam ao **dicionário** (PROJ-3/PROJ-4): cada um
pode apontar termos relacionados que, na tela, viram chips com deep-link para o
dicionário já filtrado. Assim a paciente salta do conteúdo direto para a
explicação simples do termo, espelhando os "artigos relacionados" do dicionário.

### PROJ-23 — H14 Página de tratamentos

- Jira: [PROJ-23](https://afreis.atlassian.net/browse/PROJ-23)

**História**: Como paciente, quero visualizar informações sobre os tratamentos
disponíveis, para entender melhor as opções oferecidas pela clínica.

**Objetivo**: Apresentar os tratamentos de forma simples, organizada e
confiável, ajudando a paciente a entender possibilidades sem depender de buscas
externas confusas.

**Critérios de aceitação**:

- A página deve listar tratamentos cadastrados.
- Cada tratamento deve ter nome, descrição simples, indicação geral e etapas
  principais quando houver.
- Os dados devem ser lidos do banco de dados.
- O conteúdo deve ser gerenciado pelo Django Admin.
- A linguagem deve ser clara e acessível.
- Caso não existam tratamentos cadastrados, o sistema deve exibir uma mensagem
  informativa.

**Cenários BDD**:

```
Cenário: Visualizar tratamentos cadastrados
  Dado que existem tratamentos cadastrados no sistema
  Quando a paciente acessa a página de tratamentos
  Então o sistema deve exibir a lista de tratamentos disponíveis

Cenário: Visualizar detalhes de um tratamento
  Dado que existem tratamentos cadastrados
  Quando a paciente seleciona um tratamento
  Então o sistema deve exibir sua descrição e etapas principais

Cenário: Nenhum tratamento cadastrado
  Dado que não existem tratamentos cadastrados
  Quando a paciente acessa a página de tratamentos
  Então o sistema deve informar que nenhum tratamento foi encontrado
```

**Dados envolvidos**: `Tratamento`, `EtapaTratamento`.

**Notas de entrega**: app `tratamentos` com endpoints públicos
`GET /api/tratamentos/`, `GET /api/tratamentos/?busca=` e
`GET /api/tratamentos/<id>/`. Conteúdo inicial fictício em
`tratamentos_iniciais.json`. Cada tratamento pode listar **termos relacionados**
do dicionário (M2M `termos_relacionados`, curado no Admin e exposto na API como
lista de `{id, termo}`); na tela viram chips que levam ao dicionário já
filtrado (`/dicionario?busca=<termo>`). 7 testes Cypress em `tratamentos.cy.js`
e testes de API em `tratamentos/tests.py`.

### PROJ-18 — H9 Orientações do tratamento em linguagem simples

- Jira: [PROJ-18](https://afreis.atlassian.net/browse/PROJ-18)

**História**: Como paciente, quero acessar orientações simples sobre meu
tratamento, para entender melhor o que preciso fazer em cada etapa.

**Objetivo**: Reduzir dúvidas e insegurança usando uma linguagem clara, direta e
acessível, sem excesso de termos técnicos.

**Critérios de aceitação**:

- A paciente deve visualizar orientações cadastradas.
- Cada orientação deve ter título, conteúdo, categoria e etapa relacionada
  quando houver.
- Os dados devem ser lidos do banco de dados.
- As orientações devem ser gerenciadas pelo Django Admin.
- Caso não existam orientações cadastradas, o sistema deve exibir uma mensagem
  informativa.

**Cenários BDD**:

```
Cenário: Visualizar orientações cadastradas
  Dado que existem orientações cadastradas no sistema
  Quando a paciente acessa a página de orientações
  Então o sistema deve exibir as orientações em linguagem simples

Cenário: Filtrar orientações por categoria
  Dado que existem orientações de categorias diferentes
  Quando a paciente seleciona uma categoria
  Então o sistema deve exibir apenas orientações compatíveis

Cenário: Nenhuma orientação cadastrada
  Dado que não existem orientações cadastradas
  Quando a paciente acessa a página de orientações
  Então o sistema deve informar que nenhuma orientação foi encontrada
```

**Dados envolvidos**: `OrientacaoTratamento`, `Tratamento`, `EtapaTratamento`.

**Notas de entrega**: endpoint público `GET /api/orientacoes/` (filtros
`?categoria=` e `?busca=`), com o nome do tratamento e da etapa resolvidos para
a tela. Conteúdo inicial fictício em `orientacoes_iniciais.json`. Cada
orientação também pode listar **termos relacionados** do dicionário, que viram
chips com deep-link para `/dicionario?busca=<termo>`. 9 testes Cypress em
`orientacoes.cy.js`.

## Próximas etapas (histórias planejadas, ainda não implementadas)

- **Ciclo menstrual** (épico [PROJ-10](https://afreis.atlassian.net/browse/PROJ-10) — issue [#3](https://github.com/CC-2025-2-CESAR/Marea/issues/3))
  - PROJ-5 — Registro e atualizações do ciclo — issue [#8](https://github.com/CC-2025-2-CESAR/Marea/issues/8)
  - PROJ-6 — Previsões do ciclo — issue [#9](https://github.com/CC-2025-2-CESAR/Marea/issues/9)
