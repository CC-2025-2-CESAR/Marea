/**
 * Chamadas do fluxo de recuperação de senha (PROJ-7).
 *
 * Todos os endpoints são públicos (a pessoa esqueceu a senha, não tem sessão),
 * então usam `requisicaoPublica`. O link de redefinição chega por e-mail — a
 * API nunca o devolve aqui.
 */

import { requisicaoPublica } from './api'
import type { RedefinicaoDetalhe } from '../types'

/** Pede o link de redefinição por e-mail (resposta sempre genérica). */
function solicitarRecuperacao(email: string): Promise<{ detail: string }> {
  return requisicaoPublica<{ detail: string }>('/auth/recuperar/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/** Verifica se um link de redefinição ainda é válido (tela `/redefinir`). */
function validarRedefinicao(token: string): Promise<RedefinicaoDetalhe> {
  return requisicaoPublica<RedefinicaoDetalhe>(
    `/auth/redefinir/${encodeURIComponent(token)}/`,
  )
}

/** Redefine a senha usando um link válido. */
function redefinirSenha(
  token: string,
  password: string,
): Promise<{ detail: string }> {
  return requisicaoPublica<{ detail: string }>(
    `/auth/redefinir/${encodeURIComponent(token)}/`,
    { method: 'POST', body: JSON.stringify({ password }) },
  )
}

export { solicitarRecuperacao, validarRedefinicao, redefinirSenha }
