import { requisicao } from './api'
import type { Especialidade } from '../types'

function listarEspecialidades(): Promise<Especialidade[]> {
  return requisicao<Especialidade[]>('/especialidades/')
}

function obterEspecialidade(id: number): Promise<Especialidade> {
  return requisicao<Especialidade>(`/especialidades/${id}/`)
}

export { listarEspecialidades, obterEspecialidade }
