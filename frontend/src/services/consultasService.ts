import { requisicao } from './api'
import type { Consulta, EventoTratamento } from '../types'

function listarConsultas(): Promise<Consulta[]> {
  return requisicao<Consulta[]>('/consultas/')
}

function listarProximasConsultas(): Promise<Consulta[]> {
  return requisicao<Consulta[]>('/consultas/proximas/')
}

function listarEventos(): Promise<EventoTratamento[]> {
  return requisicao<EventoTratamento[]>('/eventos/')
}

export { listarConsultas, listarProximasConsultas, listarEventos }
