/**
 * Chamadas do fluxo de convite e primeiro acesso (PROJ-7).
 *
 * Os dois endpoints de convite (detalhar/definir senha) são públicos: a
 * paciente ainda não tem sessão, então usam `fetch` direto (sem o wrapper
 * `requisicao`, que injeta token e tenta refresh em 401). Cadastrar paciente e
 * reenviar convite exigem médica/admin autenticada e usam `requisicao`.
 */

import { API_BASE_URL, requisicao } from './api'
import type { ErroRequisicao } from './api'
import type {
  ConviteDetalhe,
  NovaPacienteEntrada,
  RespostaCriarPaciente,
  RespostaDefinirSenha,
  RespostaReenviarConvite,
} from '../types'

async function fetchPublico<T>(
  caminho: string,
  opcoes: { method?: string; body?: string } = {},
): Promise<T> {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    method: opcoes.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opcoes.body,
  })

  if (!resposta.ok) {
    let detalhe: unknown
    try {
      detalhe = await resposta.json()
    } catch {
      detalhe = undefined
    }
    const erro = new Error(
      `Falha ${resposta.status} em ${caminho}`,
    ) as ErroRequisicao
    erro.status = resposta.status
    erro.detalhe = detalhe
    throw erro
  }

  return resposta.json() as Promise<T>
}

/** Valida um convite e diz quem ele convida (tela `/ativar/:token`). */
function detalharConvite(token: string): Promise<ConviteDetalhe> {
  return fetchPublico<ConviteDetalhe>(`/convite/${encodeURIComponent(token)}/`)
}

/** Define a senha do primeiro acesso e já devolve a sessão autenticada. */
function definirSenhaConvite(
  token: string,
  password: string,
): Promise<RespostaDefinirSenha> {
  return fetchPublico<RespostaDefinirSenha>(
    `/convite/${encodeURIComponent(token)}/definir-senha/`,
    { method: 'POST', body: JSON.stringify({ password }) },
  )
}

/** Cadastra uma nova paciente e devolve o link de primeiro acesso. */
function criarPaciente(
  dados: NovaPacienteEntrada,
): Promise<RespostaCriarPaciente> {
  return requisicao<RespostaCriarPaciente>('/clinica/pacientes/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

/** Emite um novo link para uma paciente que ainda não ativou o acesso. */
function reenviarConvite(
  pacienteId: number,
): Promise<RespostaReenviarConvite> {
  return requisicao<RespostaReenviarConvite>(
    `/clinica/pacientes/${pacienteId}/reenviar-convite/`,
    { method: 'POST' },
  )
}

export { detalharConvite, definirSenhaConvite, criarPaciente, reenviarConvite }
