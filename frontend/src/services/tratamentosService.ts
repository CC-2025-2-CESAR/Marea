import { requisicao } from './api'
import type { Tratamento, Orientacao } from '../types'

function listarTratamentos(busca?: string): Promise<Tratamento[]> {
  const termo = busca?.trim()
  const query = termo ? `?busca=${encodeURIComponent(termo)}` : ''
  return requisicao<Tratamento[]>(`/tratamentos/${query}`)
}

function obterTratamento(id: number): Promise<Tratamento> {
  return requisicao<Tratamento>(`/tratamentos/${id}/`)
}

function listarOrientacoes({
  categoria,
  busca,
}: { categoria?: string; busca?: string } = {}): Promise<Orientacao[]> {
  const params = new URLSearchParams()
  if (categoria?.trim()) {
    params.set('categoria', categoria.trim())
  }
  if (busca?.trim()) {
    params.set('busca', busca.trim())
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return requisicao<Orientacao[]>(`/orientacoes/${query}`)
}

function obterOrientacao(id: number): Promise<Orientacao> {
  return requisicao<Orientacao>(`/orientacoes/${id}/`)
}

export {
  listarTratamentos,
  obterTratamento,
  listarOrientacoes,
  obterOrientacao,
}
