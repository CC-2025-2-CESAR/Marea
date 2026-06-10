import { requisicao } from './api'
import type { TermoDicionario } from '../types'

function listarTermos(busca?: string): Promise<TermoDicionario[]> {
  const termoBusca = busca?.trim()
  const query = termoBusca ? `?busca=${encodeURIComponent(termoBusca)}` : ''
  return requisicao<TermoDicionario[]>(`/dicionario/termos/${query}`)
}

function obterTermo(id: number): Promise<TermoDicionario> {
  return requisicao<TermoDicionario>(`/dicionario/termos/${id}/`)
}

export { listarTermos, obterTermo }
