import { requisicao } from './api'

function listarRegistrosCiclo() {
  return requisicao('/ciclo/')
}

function criarRegistroCiclo(dados) {
  return requisicao('/ciclo/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

function atualizarRegistroCiclo(id, dados) {
  return requisicao(`/ciclo/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

function excluirRegistroCiclo(id) {
  return requisicao(`/ciclo/${id}/`, {
    method: 'DELETE',
  })
}

function obterPrevisoesCiclo() {
  return requisicao('/ciclo/previsao/')
}

export {
  listarRegistrosCiclo,
  criarRegistroCiclo,
  atualizarRegistroCiclo,
  excluirRegistroCiclo,
  obterPrevisoesCiclo,
}