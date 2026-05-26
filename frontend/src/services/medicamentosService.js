import { requisicao } from './api'

function listarMedicamentos() {
  return requisicao('/medicamentos/')
}

function alternarTomada(id, tomado) {
  return requisicao(`/medicamentos/${id}/toma/`, {
    method: 'PATCH',
    body: JSON.stringify({ tomado }),
  })
}

export { listarMedicamentos, alternarTomada }
