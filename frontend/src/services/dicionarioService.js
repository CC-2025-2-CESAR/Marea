import { requisicao } from './api'

function listarTermos(busca) {
  const termoBusca = busca?.trim()
  const query = termoBusca
    ? `?busca=${encodeURIComponent(termoBusca)}`
    : ''
  return requisicao(`/dicionario/termos/${query}`)
}

function obterTermo(id) {
  return requisicao(`/dicionario/termos/${id}/`)
}

export { listarTermos, obterTermo }
