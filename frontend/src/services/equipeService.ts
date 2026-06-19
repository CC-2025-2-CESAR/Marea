import { requisicao } from './api'
import type { MembroEquipe } from '../types'

/** Lista a equipe medica da clinica (conteudo publico). */
function listarEquipeMedica(): Promise<MembroEquipe[]> {
  return requisicao<MembroEquipe[]>('/equipe-medica/')
}

export { listarEquipeMedica }
