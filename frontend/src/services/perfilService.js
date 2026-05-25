/**
 * Chamadas relacionadas ao perfil da paciente autenticada.
 */

import { requisicao } from './api'

function obterPerfil() {
  return requisicao('/perfil/')
}

function atualizarPerfil(dados) {
  return requisicao('/perfil/', {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export { obterPerfil, atualizarPerfil }
