import { requisicao } from './api'
import type { Medicamento } from '../types'

function listarMedicamentos(): Promise<Medicamento[]> {
  return requisicao<Medicamento[]>('/medicamentos/')
}

function obterMedicamento(id: number): Promise<Medicamento> {
  return requisicao<Medicamento>(`/medicamentos/${id}/`)
}

function alternarTomada(id: number, tomado: boolean): Promise<Medicamento> {
  return requisicao<Medicamento>(`/medicamentos/${id}/toma/`, {
    method: 'PATCH',
    body: JSON.stringify({ tomado }),
  })
}

export { listarMedicamentos, obterMedicamento, alternarTomada }
