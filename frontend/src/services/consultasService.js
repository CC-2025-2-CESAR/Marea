import { requisicao } from './api'

function listarConsultas() {
  return requisicao('/consultas/')
}

function listarProximasConsultas() {
  return requisicao('/consultas/proximas/')
}

export { listarConsultas, listarProximasConsultas }
