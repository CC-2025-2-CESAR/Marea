import { requisicao } from './api'

function listarConsultas() {
  return requisicao('/consultas/')
}

function listarProximasConsultas() {
  return requisicao('/consultas/proximas/')
}

function listarEventos() {
  return requisicao('/eventos/')
}

export { listarConsultas, listarProximasConsultas, listarEventos }
