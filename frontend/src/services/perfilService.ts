/**
 * Chamadas relacionadas ao perfil da paciente autenticada.
 */

import { requisicao } from './api'
import type { Perfil } from '../types'

function obterPerfil(): Promise<Perfil> {
  return requisicao<Perfil>('/perfil/')
}

function atualizarPerfil(dados: Partial<Perfil>): Promise<Perfil> {
  return requisicao<Perfil>('/perfil/', {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export { obterPerfil, atualizarPerfil }
