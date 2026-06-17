/**
 * Privacidade/LGPD do titular dos dados (`/api/privacidade/`). Todos os
 * endpoints são autenticados e devolvem/aceitam apenas os dados do próprio
 * usuário — o escopo de dono é garantido no backend.
 */

import { requisicao } from './api'
import type {
  EntradaSolicitacao,
  MeusDados,
  SolicitacaoPrivacidade,
} from '../types'

/** Retrato consolidado dos próprios dados (acesso/portabilidade). */
function obterMeusDados(): Promise<MeusDados> {
  return requisicao<MeusDados>('/privacidade/meus-dados/')
}

/** Lista as solicitações de privacidade abertas pelo próprio usuário. */
function listarSolicitacoes(): Promise<SolicitacaoPrivacidade[]> {
  return requisicao<SolicitacaoPrivacidade[]>('/privacidade/solicitacoes/')
}

/** Abre uma nova solicitação (correção ou exclusão). */
function criarSolicitacao(
  dados: EntradaSolicitacao,
): Promise<SolicitacaoPrivacidade> {
  return requisicao<SolicitacaoPrivacidade>('/privacidade/solicitacoes/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export { obterMeusDados, listarSolicitacoes, criarSolicitacao }
