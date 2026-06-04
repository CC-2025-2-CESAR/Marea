import { requisicao } from './api'

function listarEspecialidades() {
  return requisicao('/especialidades/')
}

export { listarEspecialidades }
