/**
 * Chamadas da área da médica.
 *
 * Todos os endpoints exigem papel de médica (ou admin) e aplicam escopo por
 * objeto no backend: a médica só enxerga/altera as pacientes vinculadas a ela.
 */

import { requisicao } from './api'

function listarPacientes() {
  return requisicao('/medica/pacientes/')
}

function obterPaciente(id) {
  return requisicao(`/medica/pacientes/${id}/`)
}

function criarConsulta(id, dados) {
  return requisicao(`/medica/pacientes/${id}/consultas/`, {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

function criarMedicamento(id, dados) {
  return requisicao(`/medica/pacientes/${id}/medicamentos/`, {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export { listarPacientes, obterPaciente, criarConsulta, criarMedicamento }
