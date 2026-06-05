import { requisicao } from './api'

function listarJornada() {
  return requisicao('/jornada/')
}

export { listarJornada }
