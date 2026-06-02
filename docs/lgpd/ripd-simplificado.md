# Relatório de Impacto (RIPD) simplificado — Amare

Como a Amare trata dado de saúde (sensível), este relatório registra os riscos
de privacidade e as medidas que os mitigam. É um documento vivo, atualizado a
cada funcionalidade que toca dado pessoal.

## 1. Contexto do sistema

Plataforma web (backend Django + frontend React) que apoia pacientes em
tratamento de fertilidade: perfil, consultas, medicamentos, conteúdos
informativos e, futuramente, área da médica e registros do tratamento.

## 2. Dados tratados

Ver [`mapeamento-dados.md`](mapeamento-dados.md). Em resumo: dados de conta,
perfil e **dados clínicos sensíveis** (medicamentos, observações, consultas).

## 3. Quem acessa

- **Paciente**: apenas os próprios dados.
- **Médica**: apenas as pacientes vinculadas a ela.
- **Admin**: gestão do sistema; acesso a dado clínico não é automático.

## 4. Riscos e medidas de mitigação

| # | Risco | Mitigação |
|---|---|---|
| R1 | Paciente acessar dados de outra paciente trocando o ID na URL | Filtragem por dono no backend + permissão por objeto + testes de acesso negado |
| R2 | Médica acessar paciente não vinculada a ela | Permissão por objeto checando o vínculo Médica↔Paciente |
| R3 | Vazamento de segredo (SECRET_KEY, senha de banco) | Segredos em variáveis de ambiente; `.env` fora do versionamento; `.env.example` sem valores reais |
| R4 | Exposição de dado sensível em log ou URL | Proibição no checklist de PR; sem `console.log`/`print` de dados; busca por ID, não por dado |
| R5 | Sessão sequestrada (XSS) | JWT com expiração curta; dívida conhecida: mover refresh para cookie httpOnly |
| R6 | Força bruta no login | Limite de tentativas (throttle) + mensagem de erro genérica |
| R7 | Tráfego interceptado | HTTPS obrigatório em produção (SSL redirect + HSTS) |
| R8 | Banco de produção exposto | Banco gerenciado e fora do repositório; nunca versionar `db.sqlite3` |
| R9 | Dado real usado em demonstração | Apenas dados fictícios em dev/teste/demo |

## 5. Pendências conhecidas

- Mover o refresh token de `localStorage` para cookie `httpOnly` (reduz risco
  de XSS).
- Avaliar tabela de auditoria de acesso a dado clínico na área da médica.
- Formalizar fluxo de exclusão/anonimização de conta.

## 6. Conclusão

Os riscos mais críticos (R1, R2) são endereçados por controle de acesso no
backend e testes automatizados de acesso permitido e negado. As pendências não
bloqueiam o uso acadêmico, mas estão registradas para evolução.
