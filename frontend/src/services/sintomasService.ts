import { requisicao } from './api'
import type { RegistroSintoma } from '../types'

function listarSintomas(): Promise<RegistroSintoma[]> {
  return requisicao<RegistroSintoma[]>('/sintomas/')
}

function criarSintoma(dados: Partial<RegistroSintoma>): Promise<RegistroSintoma> {
  return requisicao<RegistroSintoma>('/sintomas/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

function atualizarSintoma(
  id: number,
  dados: Partial<RegistroSintoma>,
): Promise<RegistroSintoma> {
  return requisicao<RegistroSintoma>(`/sintomas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

function excluirSintoma(id: number): Promise<void> {
  return requisicao<void>(`/sintomas/${id}/`, { method: 'DELETE' })
}

export { listarSintomas, criarSintoma, atualizarSintoma, excluirSintoma }
