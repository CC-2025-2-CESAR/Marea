import { requisicao } from './api'

function listarRegistrosCiclo() {
  return requisicao('/ciclo/registros/')
}

function criarRegistroCiclo(dados) {
  return requisicao('/ciclo/registros/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

function atualizarRegistroCiclo(id, dados) {
  return requisicao(/ciclo/registros/${id}/, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

function excluirRegistroCiclo(id) {
  return requisicao(/ciclo/registros/${id}/, { method: 'DELETE' })
}

function obterPrevisoesCiclo() {
  return requisicao('/ciclo/previsoes/')
}

export {
  listarRegistrosCiclo,
  criarRegistroCiclo,
  atualizarRegistroCiclo,
  excluirRegistroCiclo,
  obterPrevisoesCiclo,
}
