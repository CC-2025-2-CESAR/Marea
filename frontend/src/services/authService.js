/**
 * Chamadas de autenticação da Amare.
 *
 * Usa `fetch` direto (sem o wrapper `requisicao`) porque os endpoints de
 * autenticação são públicos e não devem disparar o auto-refresh em 401.
 */

import { API_BASE_URL, requisicao } from './api'

async function login(username, password) {
  const resposta = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!resposta.ok) {
    let detalhe
    try {
      detalhe = await resposta.json()
    } catch {
      detalhe = undefined
    }
    const erro = new Error(`Falha ${resposta.status} no login`)
    erro.status = resposta.status
    erro.detalhe = detalhe
    throw erro
  }

  return resposta.json()
}

function obterUsuarioAtual() {
  return requisicao('/auth/me/')
}

export { login, obterUsuarioAtual }
