/**
 * Chamadas de autenticação da Amare.
 *
 * `login` usa `fetch` direto (sem o wrapper `requisicao`) porque o endpoint é
 * público e não deve disparar o auto-refresh em 401.
 */

import { API_BASE_URL, requisicao } from './api'
import type { ErroRequisicao } from './api'
import type { RespostaLogin, Usuario } from '../types'

async function login(
  username: string,
  password: string,
): Promise<RespostaLogin> {
  const resposta = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!resposta.ok) {
    let detalhe: unknown
    try {
      detalhe = await resposta.json()
    } catch {
      detalhe = undefined
    }
    const erro = new Error(`Falha ${resposta.status} no login`) as ErroRequisicao
    erro.status = resposta.status
    erro.detalhe = detalhe
    throw erro
  }

  return resposta.json() as Promise<RespostaLogin>
}

function obterUsuarioAtual(): Promise<Usuario> {
  return requisicao<Usuario>('/auth/me/')
}

export { login, obterUsuarioAtual }
