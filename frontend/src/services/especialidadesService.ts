import { requisicao } from './api'
import type { Especialidade } from '../types'

function listarEspecialidades(): Promise<Especialidade[]> {
  return requisicao<Especialidade[]>('/especialidades/')
}

export { listarEspecialidades }
