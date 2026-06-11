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

// ===== Vínculo médica ↔ paciente =====

export interface PacienteResumo {
  id: number
  nome_completo?: string
  email?: string
}

export interface PacienteDetalhe extends PacienteResumo {
  telefone?: string
  data_nascimento?: string | null
  medica_responsavel?: string | null
  consultas?: Consulta[]
  medicamentos?: Medicamento[]
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
