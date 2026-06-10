import { requisicao } from './api'
import type { ResultadoBusca } from '../types'

// Busca global (PROJ-25): consulta o endpoint unificado que procura em
// dicionário, tratamentos, orientações e especialidades de uma vez. Termo
// vazio nem chega à API — devolve lista vazia direto.
function buscarGlobal(termo: string): Promise<ResultadoBusca[]> {
  const q = termo?.trim()
  if (!q) {
    return Promise.resolve([])
  }
  return requisicao<ResultadoBusca[]>(`/busca/?q=${encodeURIComponent(q)}`)
}

export { buscarGlobal }
