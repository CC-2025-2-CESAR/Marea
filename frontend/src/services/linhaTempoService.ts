import { requisicao } from './api'
import type { EtapaJornada } from '../types'

function listarJornada(): Promise<EtapaJornada[]> {
  return requisicao<EtapaJornada[]>('/jornada/')
}

export { listarJornada }
