import { requisicao } from './api'

function listarTratamentos(busca) {
  const termo = busca?.trim()
  const query = termo ? `?busca=${encodeURIComponent(termo)}` : ''
  return requisicao(`/tratamentos/${query}`)
}

function obterTratamento(id) {
  return requisicao(`/tratamentos/${id}/`)
}

function listarOrientacoes({ categoria, busca } = {}) {
  const params = new URLSearchParams()
  if (categoria?.trim()) {
    params.set('categoria', categoria.trim())
  }
  if (busca?.trim()) {
    params.set('busca', busca.trim())
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return requisicao(`/orientacoes/${query}`)
}

export { listarTratamentos, obterTratamento, listarOrientacoes }
