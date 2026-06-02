# Mapeamento de dados pessoais — Amare

Inventário dos dados pessoais tratados pela plataforma. Atualizar sempre que um
campo novo for criado (faz parte do checklist de PR).

Legenda de sensibilidade:
- **Comum**: dado pessoal comum.
- **Sensível**: dado pessoal sensível (saúde) — cuidado reforçado pela LGPD.

## Conta e autenticação

| Dado | Finalidade | Onde fica | Quem acessa | Retenção | Sensível |
|---|---|---|---|---|---|
| `username` | Identificar a conta | `auth_user` | a própria titular, admin | enquanto a conta existir | Comum |
| `email` | Login e contato | `auth_user.email` | a própria titular, admin | enquanto a conta existir | Comum |
| senha (hash) | Autenticação | `auth_user.password` | ninguém lê (hash) | enquanto a conta existir | Comum |

A senha é guardada apenas como **hash** (mecanismo padrão do Django) — nunca em
texto puro, nunca em resposta de API, nunca em log.

## Perfil (todas as titulares)

| Dado | Finalidade | Onde fica | Quem acessa | Retenção | Sensível |
|---|---|---|---|---|---|
| `nome_completo` | Identificação | `usuarios_perfilusuario` | a própria, médica vinculada, admin | enquanto a conta existir | Comum |
| `telefone` | Contato | `usuarios_perfilusuario` | a própria, médica vinculada, admin | enquanto a conta existir | Comum |
| `tipo_usuario` | Controle de acesso | `usuarios_perfilusuario` | sistema, admin | enquanto a conta existir | Comum |

## Paciente (dados clínicos)

| Dado | Finalidade | Onde fica | Quem acessa | Retenção | Sensível |
|---|---|---|---|---|---|
| `data_nascimento` | Acompanhamento clínico | `usuarios_paciente` | a própria, médica vinculada, admin | enquanto a conta existir | Comum |
| `tipo_sanguineo` | Acompanhamento clínico | `usuarios_paciente` | a própria, médica vinculada | enquanto a conta existir | **Sensível** |
| `medicamentos_em_uso` | Acompanhamento clínico | `usuarios_paciente` | a própria, médica vinculada | enquanto a conta existir | **Sensível** |
| `observacoes_medicas` | Acompanhamento clínico | `usuarios_paciente` | médica vinculada | enquanto a conta existir | **Sensível** |

## Médica

| Dado | Finalidade | Onde fica | Quem acessa | Retenção | Sensível |
|---|---|---|---|---|---|
| `crm` | Identificação profissional | `usuarios_medica` | a própria, admin | enquanto a conta existir | Comum |
| `especialidade` | Organização do atendimento | `usuarios_medica` | todas as titulares | enquanto a conta existir | Comum |

## Consultas

| Dado | Finalidade | Onde fica | Quem acessa | Retenção | Sensível |
|---|---|---|---|---|---|
| `data_horario`, `local`, `status` | Agenda do tratamento | `consultas_consulta` | a paciente dona, médica vinculada | histórico do tratamento | Comum |
| `observacoes` | Detalhe da consulta | `consultas_consulta` | a paciente dona, médica vinculada | histórico do tratamento | **Sensível** |

## Medicamentos

| Dado | Finalidade | Onde fica | Quem acessa | Retenção | Sensível |
|---|---|---|---|---|---|
| `nome`, `dose`, `horario`, `instrucoes` | Rotina de medicação | `medicamentos_medicamento` | a paciente dona, médica vinculada | enquanto ativo | **Sensível** |
| `tomado_hoje` | Checklist diário | `medicamentos_medicamento` | a paciente dona, médica vinculada | reinicia a cada dia | **Sensível** |

## Observações

- O acesso "médica vinculada" depende do vínculo explícito Médica↔Paciente
  (implementado na área da médica). Sem vínculo, não há acesso.
- "admin" é a administradora do sistema; o acesso a dado **clínico** pela admin
  não é automático e deve ser justificado.
- Nenhum dado real de paciente é usado em desenvolvimento, teste ou
  demonstração — apenas dados fictícios.
