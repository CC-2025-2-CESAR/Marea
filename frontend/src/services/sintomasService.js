import { requisicao } from './api'

function listarSintomas() {
  return requisicao('/sintomas/')
}

function criarSintoma(dados) {
  return requisicao('/sintomas/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export { listarSintomas, criarSintoma }
