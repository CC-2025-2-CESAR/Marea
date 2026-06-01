# Registro simplificado de operações de tratamento — Amare

Baseado no modelo da ANPD para agentes de tratamento de pequeno porte. Descreve
as operações com dados pessoais realizadas pela plataforma.

## 1. Cadastro e autenticação

- **Dados**: username, e-mail, senha (hash), tipo de usuário.
- **Finalidade**: criar e autenticar a conta da titular.
- **Base de tratamento**: execução de contrato / interesse legítimo de operar o
  serviço.
- **Compartilhamento**: nenhum com terceiros.
- **Acesso**: a própria titular e a administradora do sistema.
- **Retenção**: enquanto a conta estiver ativa.
- **Medidas**: hash de senha, JWT com expiração, HTTPS em produção, controle de
  acesso por papel, limite de tentativas de login.

## 2. Perfil da paciente

- **Dados**: nome, telefone, data de nascimento, tipo sanguíneo.
- **Finalidade**: identificar a paciente e apoiar o acompanhamento.
- **Base de tratamento**: tutela da saúde / execução de contrato.
- **Acesso**: a própria paciente, a médica vinculada e a admin.
- **Retenção**: enquanto a conta estiver ativa.
- **Medidas**: separação em tabela própria, serializers que expõem só o
  necessário, edição limitada.

## 3. Dados clínicos (medicamentos, observações, consultas)

- **Dados**: medicamentos em uso, observações médicas, consultas, checklist de
  medicação.
- **Finalidade**: acompanhamento do tratamento de fertilidade.
- **Base de tratamento**: tutela da saúde (art. 11, II, "f", LGPD).
- **Categoria**: **dado pessoal sensível**.
- **Acesso**: a paciente dona e a médica vinculada a ela.
- **Retenção**: histórico do tratamento.
- **Medidas**: controle de acesso por objeto (a médica só vê as próprias
  pacientes), filtragem por dono no backend, nada sensível em URL ou log.

## 4. Conteúdo informativo (dicionário, tratamentos, orientações)

- **Dados**: nenhum dado pessoal — conteúdo público da clínica.
- **Finalidade**: informar a paciente em linguagem simples.
- **Acesso**: todas as titulares autenticadas (e conteúdo público quando
  aplicável).

## Atualização deste registro

Revisar quando: (a) um campo de dado pessoal novo for criado; (b) um
compartilhamento com terceiro for introduzido; (c) uma finalidade mudar. A
revisão faz parte do checklist de pull request.
