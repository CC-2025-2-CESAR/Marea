/**
 * Tipos do domínio da Amare — fundação TypeScript (migração incremental).
 *
 * Estes tipos descrevem as respostas da API consumidas pelos `services`. Como a
 * migração é gradual (`allowJs`), as páginas `.jsx` ainda não são checadas; os
 * campos aqui refletem o que o frontend usa hoje e serão refinados conforme os
 * componentes forem migrados para `.tsx`.
 */

// ===== Autenticação e usuário =====

export type TipoUsuario = 'paciente' | 'medica' | 'admin'

export interface Usuario {
  id: number
  username: string
  email?: string
  nome?: string
  tipo_usuario: TipoUsuario
}

/** Resposta de `POST /auth/login/` (par de tokens JWT + dados do usuário). */
export interface RespostaLogin {
  access: string
  refresh: string
  usuario?: Usuario
}

/** Sessão persistida no `localStorage` (chave `marea_auth`). */
export interface Sessao {
  access?: string
  refresh?: string
  usuario?: Usuario
}

// ===== Perfil da paciente =====

export interface Perfil {
  id: number
  username: string
  email?: string
  nome_completo?: string
  telefone?: string
  data_nascimento?: string | null
}

// ===== Vínculo médica ↔ paciente / acesso por papel (RBAC, PR8) =====

/** Classificação do acesso de quem pede a uma paciente (vira selo na UI). */
export type PapelNoCuidado =
  | 'admin'
  | 'responsavel'
  | 'assumido'
  | 'visualizacao'

/** Status de acesso de quem faz o request a uma paciente — espelha o backend. */
export interface PermissaoPaciente {
  papel: PapelNoCuidado
  pode_editar: boolean
  rotulo: string
}

export interface PacienteResumo {
  id: number
  nome_completo?: string
  email?: string
  telefone?: string
  tipo_sanguineo?: string
  total_consultas?: number
  total_medicamentos?: number
  permissao?: PermissaoPaciente
}

export interface PacienteDetalhe extends PacienteResumo {
  data_nascimento?: string | null
  medica_responsavel?: string | null
  medicamentos_em_uso?: string
  observacoes_medicas?: string
  consultas?: Consulta[]
  medicamentos?: Medicamento[]
}

/** Motivo de uma médica assumir o atendimento de paciente de outra. */
export type MotivoAssumir =
  | 'cobertura_agenda'
  | 'plantao'
  | 'consulta_compartilhada'
  | 'retorno_emergencial'
  | 'outro'

/** Corpo de `POST /api/medica/pacientes/<id>/assumir/`. */
export interface EntradaAssumir {
  motivo: MotivoAssumir
  /** Livre; obrigatória quando o motivo é "outro". */
  observacao?: string
}

/** Resposta de `POST /api/medica/pacientes/<id>/assumir/`. */
export interface RespostaAssumir {
  detail: string
  permissao: PermissaoPaciente
  vinculo: { id: number; papel: string; ja_estava_ativo: boolean }
}

// ===== Ciclo menstrual (PROJ-5 / PROJ-6) =====

export type EtapaCiclo = 'menstruacao' | 'folicular' | 'ovulacao' | 'lutea'
export type StatusCiclo = 'registrado' | 'em_andamento' | 'concluido'
export type ChanceGravidez = 'alta' | 'media' | 'baixa'

export interface RegistroCiclo {
  id: number
  data: string
  etapa: EtapaCiclo
  etapa_display?: string
  observacoes: string
  status: StatusCiclo
  status_display?: string
  criado_em?: string
  atualizado_em?: string
}

/** Campos que a paciente envia ao criar/atualizar um registro de ciclo. */
export type EntradaRegistroCiclo = Pick<
  RegistroCiclo,
  'data' | 'etapa' | 'status' | 'observacoes'
>

export interface JanelaFertil {
  inicio: string
  fim: string
}

/** Resposta de `GET /ciclo/previsoes/` (estimativas — nunca diagnóstico). */
export interface PrevisoesCiclo {
  tem_dados: boolean
  mensagem?: string
  proxima_menstruacao?: string | null
  janela_fertil?: JanelaFertil | null
  ovulacao?: string | null
  etapa_atual?: EtapaCiclo
  etapa_atual_display?: string
  dia_do_ciclo?: number
  total_do_ciclo?: number
  dias_para_proxima?: number
  atrasada?: boolean
  chance_gravidez?: ChanceGravidez
}

// ===== Consultas, eventos e medicamentos =====

export interface Consulta {
  id: number
  data_horario: string
  especialidade?: number | null
  especialidade_nome?: string
  medica_nome?: string
  local?: string
  observacoes?: string
}

export interface EventoTratamento {
  id: number
  titulo: string
  data_horario: string
  descricao?: string
  tipo?: string
  tipo_label?: string
}

export type StatusDiaMedicamento = 'tomado' | 'atrasado' | 'pendente'

export interface Medicamento {
  id: number
  nome: string
  dose?: string
  horario?: string
  instrucoes?: string
  armazenamento?: string
  tomado?: boolean
  status_dia?: StatusDiaMedicamento
  status_dia_label?: string
}

// ===== Sintomas (PROJ-21) =====

export interface RegistroSintoma {
  id: number
  data?: string
  tipo?: string
  descricao?: string
  intensidade?: number
  criado_em?: string
}

// ===== Conteúdo de referência =====

export interface ArtigoRelacionado {
  titulo: string
  url?: string
}

export interface TermoDicionario {
  id: number
  termo: string
  definicao: string
  categoria?: string
  exemplo?: string
  artigos_relacionados?: ArtigoRelacionado[]
}

export interface EtapaTratamento {
  id: number
  titulo: string
  descricao?: string
  ordem?: number
}

export interface Tratamento {
  id: number
  nome: string
  descricao?: string
  indicacao?: string
  etapas?: EtapaTratamento[]
  termos_relacionados?: TermoDicionario[]
}

export interface Orientacao {
  id: number
  titulo: string
  conteudo?: string
  categoria?: string
  tratamento?: number | null
  tratamento_nome?: string
  etapa?: number | null
  etapa_titulo?: string
  termos_relacionados?: TermoDicionario[]
}

export interface MedicaResumo {
  id: number
  nome: string
}

export interface Especialidade {
  id: number
  nome: string
  descricao?: string
  medicas?: MedicaResumo[]
}

export interface ConteudoApoio {
  id: number
  titulo: string
  conteudo?: string
  categoria?: string
}

// ===== Linha do tempo (jornada FIV) =====

export type StatusEtapaJornada = 'concluida' | 'atual' | 'futura'

export interface EtapaJornada {
  id: number
  status: StatusEtapaJornada
  status_label?: string
  observacao?: string
  etapa: number
  etapa_titulo: string
  etapa_descricao?: string
  etapa_ordem?: number
  tratamento_nome?: string
}

// ===== Busca global (PROJ-25) =====

export interface ResultadoBusca {
  tipo: string
  id: number
  titulo: string
  descricao?: string
  url?: string
}

// ===== Assistente Amare (PR 9) =====

/** Pergunta sugerida (chip) devolvida por `GET /api/assistente/`. */
export interface SugestaoAssistente {
  intencao: string
  pergunta_exemplo: string
  categoria?: string
}

/** Resposta de `GET /api/assistente/`: aviso fixo + perguntas sugeridas. */
export interface SugestoesAssistente {
  disclaimer: string
  sugestoes: SugestaoAssistente[]
}

/** Fonte interna que embasou a resposta (rótulo + rota clicável). */
export interface FonteAssistente {
  rotulo: string
  rota: string
}

/** Atalho (CTA) para uma página da Amare, exibido junto à resposta. */
export interface AcaoAssistente {
  rotulo: string
  rota: string
}

/**
 * Envelope de `POST /api/assistente/`. O assistente é guiado e seguro: nunca
 * diagnostica nem ajusta dose; em tema sensível, `sensivel` vem `true` e o texto
 * encaminha para a clínica (sem `fonte`/`acoes` de conteúdo).
 */
export interface RespostaAssistente {
  intencao: string | null
  encontrou: boolean
  resposta: string
  sensivel: boolean
  fonte: FonteAssistente | null
  acoes: AcaoAssistente[]
  disclaimer: string
}

// ===== Convite e primeiro acesso (PROJ-7) =====

export type StatusConvite = 'pendente' | 'expirado' | 'usado'

/** Resposta de `GET /api/convite/<token>/` — embasa a tela de ativação. */
export interface ConviteDetalhe {
  valido: boolean
  status: StatusConvite
  nome: string
  email: string
}

/** Link de primeiro acesso devolvido ao cadastrar/reenviar uma paciente. */
export interface DadosConvite {
  token: string
  link: string
  expira_em: string
  status: string
}

/** Campos que a clínica envia em `POST /api/clinica/pacientes/`. */
export interface NovaPacienteEntrada {
  nome_completo: string
  email: string
  telefone?: string
  data_nascimento?: string | null
  medica_responsavel_id?: number | null
}

/** Resposta de `POST /api/clinica/pacientes/`. */
export interface RespostaCriarPaciente {
  paciente: {
    id: number
    nome_completo: string
    email: string
    username: string
  }
  convite: DadosConvite
}

/** Resposta de `POST /api/clinica/pacientes/<id>/reenviar-convite/`. */
export interface RespostaReenviarConvite {
  convite: DadosConvite
}

/** `POST /api/convite/<token>/definir-senha/` autentica e já devolve a sessão. */
export type RespostaDefinirSenha = RespostaLogin

// ===== Recuperação de senha (PROJ-7) =====

/** Resposta de `GET /api/auth/redefinir/<token>/` (validação do link). */
export interface RedefinicaoDetalhe {
  valido: boolean
  status: StatusConvite
}

// ===== Painel administrativo (PR8) =====

/** Contagens do painel inicial da administração (`GET /api/admin/visao-geral/`). */
export interface VisaoGeralAdmin {
  pacientes: number
  medicas: number
  convites_pendentes: number
  termos: number
  termos_inativos: number
  logs: number
}

/** Evento da trilha de auditoria (`GET /api/admin/logs/`), com rótulos prontos. */
export interface LogAtividade {
  id: number
  usuario_nome: string
  acao: string
  acao_display: string
  entidade: string
  entidade_display: string
  entidade_id: number | null
  paciente_nome: string
  motivo: string
  data_hora: string
}

/** Termo do dicionário na visão da administração (inclui `ativo` + carimbos). */
export interface TermoAdmin {
  id: number
  termo: string
  definicao: string
  categoria?: string
  exemplo?: string
  artigos_relacionados?: ArtigoRelacionado[]
  ativo: boolean
  criado_em?: string
  atualizado_em?: string
}

/** Campos que a administração envia ao criar/editar um termo. */
export interface EntradaTermo {
  termo: string
  definicao: string
  categoria?: string
  exemplo?: string
  ativo?: boolean
}
