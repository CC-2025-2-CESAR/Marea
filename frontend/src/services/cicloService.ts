import { requisicao } from './api'
import type {
  RegistroCiclo,
  EntradaRegistroCiclo,
  PrevisoesCiclo,
} from '../types'

function listarRegistrosCiclo(): Promise<RegistroCiclo[]> {
  return requisicao<RegistroCiclo[]>('/ciclo/registros/')
}

function criarRegistroCiclo(
  dados: EntradaRegistroCiclo,
): Promise<RegistroCiclo> {
  return requisicao<RegistroCiclo>('/ciclo/registros/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

function atualizarRegistroCiclo(
  id: number,
  dados: Partial<EntradaRegistroCiclo>,
): Promise<RegistroCiclo> {
  return requisicao<RegistroCiclo>(`/ciclo/registros/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

function excluirRegistroCiclo(id: number): Promise<void> {
  return requisicao<void>(`/ciclo/registros/${id}/`, { method: 'DELETE' })
}

function obterPrevisoesCiclo(): Promise<PrevisoesCiclo> {
  return requisicao<PrevisoesCiclo>('/ciclo/previsoes/')
}

export {
  listarRegistrosCiclo,
  criarRegistroCiclo,
  atualizarRegistroCiclo,
  excluirRegistroCiclo,
  obterPrevisoesCiclo,
}
