import { requisicao } from './api'

function listarConteudosApoio({ categoria } = {}) {
  const params = new URLSearchParams()
  if (categoria?.trim()) {
    params.set('categoria', categoria.trim())
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return requisicao(`/apoio/${query}`)
}

export { listarConteudosApoio }
