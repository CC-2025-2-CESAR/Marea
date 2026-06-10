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

export { listarSintomas, criarSintoma }
