/**
 * Chamadas do fluxo de convite e primeiro acesso (PROJ-7).
 *
 * Os dois endpoints de convite (detalhar/definir senha) são públicos: a
 * paciente ainda não tem sessão, então usam `requisicaoPublica` (sem token nem
 * refresh em 401). Cadastrar paciente e reenviar convite exigem médica/admin
 * autenticada e usam `requisicao`.
 */

import { requisicao, requisicaoPublica } from './api'
import type {
  ConviteDetalhe,
  NovaPacienteEntrada,
  RespostaCriarPaciente,
  RespostaDefinirSenha,
  RespostaReenviarConvite,
} from '../types'

/** Valida um convite e diz quem ele convida (tela `/ativar/:token`). */
function detalharConvite(token: string): Promise<ConviteDetalhe> {
  return requisicaoPublica<ConviteDetalhe>(
    `/convite/${encodeURIComponent(token)}/`,
  )
}

/** Define a senha do primeiro acesso e já devolve a sessão autenticada. */
function definirSenhaConvite(
  token: string,
  password: string,
): Promise<RespostaDefinirSenha> {
  return requisicaoPublica<RespostaDefinirSenha>(
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
