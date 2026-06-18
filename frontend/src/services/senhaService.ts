/**
 * Troca de senha pelo próprio usuário autenticado (Segurança da conta).
 */

import { requisicao } from './api'

export interface EntradaAlterarSenha {
  senha_atual: string
  nova_senha: string
}

interface RespostaDetalhe {
  detail: string
}

function alterarSenha(dados: EntradaAlterarSenha): Promise<RespostaDetalhe> {
  return requisicao<RespostaDetalhe>('/auth/alterar-senha/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export { alterarSenha }
