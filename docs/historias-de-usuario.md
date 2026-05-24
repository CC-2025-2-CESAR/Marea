# Histórias de usuário

Este documento registra as histórias de usuário entregues em cada etapa do Maréa, com
o texto integral retirado do Jira (projeto `PROJ` em `afreis.atlassian.net`). Cada
história aponta para a issue correspondente no GitHub.

## Etapa atual — Dicionário de termos médicos (épico PROJ-9)

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

## Próximas etapas (histórias planejadas, ainda não implementadas)

- **Gestão de Consultas, Calendário e Lembretes** (épico [PROJ-8](https://afreis.atlassian.net/browse/PROJ-8) — issue [#1](https://github.com/CC-2025-2-CESAR/Marea/issues/1))
  - PROJ-1 — Consultas agendadas — issue [#4](https://github.com/CC-2025-2-CESAR/Marea/issues/4)
  - PROJ-2 — Checklist de remédios — issue [#5](https://github.com/CC-2025-2-CESAR/Marea/issues/5)
- **Ciclo menstrual** (épico [PROJ-10](https://afreis.atlassian.net/browse/PROJ-10) — issue [#3](https://github.com/CC-2025-2-CESAR/Marea/issues/3))
  - PROJ-5 — Registro e atualizações do ciclo — issue [#8](https://github.com/CC-2025-2-CESAR/Marea/issues/8)
  - PROJ-6 — Previsões do ciclo — issue [#9](https://github.com/CC-2025-2-CESAR/Marea/issues/9)
