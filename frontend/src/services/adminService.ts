/**
 * Chamadas do painel administrativo (`/api/admin/`, exclusivas da
 * administração). O backend aplica `IsAdminClinica`; o frontend só esconde o
 * que ele já nega.
 */

import { requisicao } from './api'
import type {
  VisaoGeralAdmin,
  LogAtividade,
  TermoAdmin,
  EntradaTermo,
} from '../types'

function visaoGeral(): Promise<VisaoGeralAdmin> {
  return requisicao<VisaoGeralAdmin>('/admin/visao-geral/')
}

function listarLogs(): Promise<LogAtividade[]> {
  return requisicao<LogAtividade[]>('/admin/logs/')
}

function listarTermos(busca = ''): Promise<TermoAdmin[]> {
  const termo = busca.trim()
  const query = termo ? `?busca=${encodeURIComponent(termo)}` : ''
  return requisicao<TermoAdmin[]>(`/admin/termos/${query}`)
}

function criarTermo(dados: EntradaTermo): Promise<TermoAdmin> {
  return requisicao<TermoAdmin>('/admin/termos/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

function atualizarTermo(
  id: number,
  dados: Partial<EntradaTermo>,
): Promise<TermoAdmin> {
  return requisicao<TermoAdmin>(`/admin/termos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

function excluirTermo(id: number): Promise<void> {
  return requisicao<void>(`/admin/termos/${id}/`, { method: 'DELETE' })
}

export {
  visaoGeral,
  listarLogs,
  listarTermos,
  criarTermo,
  atualizarTermo,
  excluirTermo,
}
