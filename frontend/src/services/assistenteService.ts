import { requisicao } from './api'
import type { RespostaAssistente, SugestoesAssistente } from '../types'

/** Carrega o aviso fixo e as perguntas sugeridas (chips) do assistente. */
function obterSugestoesAssistente(): Promise<SugestoesAssistente> {
  return requisicao<SugestoesAssistente>('/assistente/')
}

/** Envia uma pergunta e recebe a resposta curada (com fonte e atalhos). */
function perguntarAssistente(pergunta: string): Promise<RespostaAssistente> {
  return requisicao<RespostaAssistente>('/assistente/', {
    method: 'POST',
    body: JSON.stringify({ pergunta }),
  })
}

export { obterSugestoesAssistente, perguntarAssistente }
