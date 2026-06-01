# LGPD e Segurança — Amare

A Amare atende pacientes em tratamento de fertilidade. Por isso trata **dados
pessoais sensíveis** (dados de saúde), que a Lei Geral de Proteção de Dados
(Lei nº 13.709/2018) protege com cuidado reforçado.

Esta pasta reúne a documentação prática de privacidade do projeto. Ela não é
peça jurídica: é um conjunto de critérios técnicos e organizacionais que o time
segue para reduzir risco real às titulares (pacientes e médicas).

## Documentos

- [`mapeamento-dados.md`](mapeamento-dados.md) — quais dados são coletados, para
  quê, onde ficam, quem acessa e por quanto tempo.
- [`registro-operacoes.md`](registro-operacoes.md) — registro simplificado das
  operações de tratamento de dados.
- [`ripd-simplificado.md`](ripd-simplificado.md) — relatório de impacto: riscos
  e medidas de mitigação.
- [`plano-incidente.md`](plano-incidente.md) — o que fazer em caso de incidente
  de segurança.
- [`politica-privacidade.md`](politica-privacidade.md) — rascunho da política de
  privacidade voltada às titulares.

## Princípios que guiam o projeto

1. **Minimização**: coletar só o necessário para cada etapa.
2. **Separação**: dados de acesso, perfil e dados clínicos em tabelas distintas.
3. **Controle de acesso no backend**: cada papel (paciente, médica, admin) só
   acessa o que lhe compete; nunca confiar apenas no frontend.
4. **Segredos fora do código**: chaves e credenciais em variáveis de ambiente.
5. **Nada sensível em URL nem em log**.
6. **Dados fictícios** em desenvolvimento, testes e demonstrações.

## Referências

- Lei nº 13.709/2018 (LGPD).
- ANPD — Guia de segurança da informação para agentes de tratamento de pequeno
  porte.
- ANPD — Modelo de registro simplificado de operações de tratamento.
