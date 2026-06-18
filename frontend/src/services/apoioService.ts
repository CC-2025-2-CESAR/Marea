import { requisicao } from './api'
import type { ConteudoApoio } from '../types'

function listarConteudosApoio({
  categoria,
}: { categoria?: string } = {}): Promise<ConteudoApoio[]> {
  const params = new URLSearchParams()
  if (categoria?.trim()) {
    params.set('categoria', categoria.trim())
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return requisicao<ConteudoApoio[]>(`/apoio/${query}`)
}

function obterConteudoApoio(id: number): Promise<ConteudoApoio> {
  return requisicao<ConteudoApoio>(`/apoio/${id}/`)
}

export { listarConteudosApoio, obterConteudoApoio }
