/**
 * Chamadas da área da médica.
 *
 * Todos os endpoints exigem papel de médica (ou admin) e aplicam escopo por
 * objeto no backend: a médica só enxerga/altera as pacientes vinculadas a ela.
 */

import { requisicao } from './api'
import type {
  PacienteResumo,
  PacienteDetalhe,
  Consulta,
  Medicamento,
} from '../types'

function listarPacientes(): Promise<PacienteResumo[]> {
  return requisicao<PacienteResumo[]>('/medica/pacientes/')
}

function obterPaciente(id: number): Promise<PacienteDetalhe> {
  return requisicao<PacienteDetalhe>(`/medica/pacientes/${id}/`)
}

function criarConsulta(id: number, dados: Partial<Consulta>): Promise<Consulta> {
  return requisicao<Consulta>(`/medica/pacientes/${id}/consultas/`, {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

function criarMedicamento(
  id: number,
  dados: Partial<Medicamento>,
): Promise<Medicamento> {
  return requisicao<Medicamento>(`/medica/pacientes/${id}/medicamentos/`, {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export { listarPacientes, obterPaciente, criarConsulta, criarMedicamento }
