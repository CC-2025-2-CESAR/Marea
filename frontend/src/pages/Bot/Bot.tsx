import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import { useToast } from '../../components/ui/Toast/useToast'
import {
  obterSugestoesAssistente,
  perguntarAssistente,
} from '../../services/assistenteService'
import type {
  AcaoAssistente,
  FonteAssistente,
  SugestaoAssistente,
} from '../../types'
import './Bot.css'

// Aviso exibido enquanto o disclaimer do backend não chega (ou se a carga
// falhar). O texto oficial vem da API e substitui este assim que disponível.
const DISCLAIMER_PADRAO =
  'O Assistente Amare ajuda com informações gerais da Amare e não substitui a ' +
  'orientação da sua equipe médica. Ele não faz diagnósticos nem ajusta doses ' +
  'de medicação.'

/** Balão da conversa: ou da usuária, ou do assistente. */
interface MensagemUsuaria {
  id: number
  autor: 'usuaria'
  texto: string
}

interface MensagemAssistente {
  id: number
  autor: 'assistente'
  texto: string
  sensivel?: boolean
  encontrou?: boolean
  fonte?: FonteAssistente | null
  acoes?: AcaoAssistente[]
  falhou?: boolean
}

type Mensagem = MensagemUsuaria | MensagemAssistente

// Contador simples para dar uma chave estável a cada balão da conversa.
let proximoId = 0
function novoId() {
  proximoId += 1
  return proximoId
}

function Bot() {
  const [disclaimer, setDisclaimer] = useState(DISCLAIMER_PADRAO)
  const [sugestoes, setSugestoes] = useState<SugestaoAssistente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [pergunta, setPergunta] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { mostrarToast } = useToast()
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await obterSugestoesAssistente()
        if (!cancelado) {
          setDisclaimer(dados?.disclaimer || DISCLAIMER_PADRAO)
          setSugestoes(Array.isArray(dados?.sugestoes) ? dados.sugestoes : [])
        }
      } catch {
        if (!cancelado) {
          setErro('Não foi possível carregar o assistente no momento.')
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  // Mantém a conversa rolada para a última mensagem (e para o indicador de
  // "escrevendo").
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens, enviando])

  async function enviarPergunta(texto: string) {
    const limpo = (texto || '').trim()
    if (!limpo || enviando) return

    setMensagens((atuais) => [
      ...atuais,
      { id: novoId(), autor: 'usuaria', texto: limpo },
    ])
    setPergunta('')
    setEnviando(true)

    try {
      const resposta = await perguntarAssistente(limpo)
      setMensagens((atuais) => [
        ...atuais,
        {
          id: novoId(),
          autor: 'assistente',
          texto: resposta.resposta,
          sensivel: Boolean(resposta.sensivel),
          encontrou: Boolean(resposta.encontrou),
          fonte: resposta.fonte || null,
          acoes: Array.isArray(resposta.acoes) ? resposta.acoes : [],
        },
      ])
    } catch {
      mostrarToast('Não foi possível responder agora. Tente novamente.', 'erro')
      setMensagens((atuais) => [
        ...atuais,
        {
          id: novoId(),
          autor: 'assistente',
          texto:
            'Tive um problema para responder agora. Tente de novo em instantes ' +
            'ou fale com a clínica.',
          falhou: true,
          acoes: [],
        },
      ])
    } finally {
      setEnviando(false)
    }
  }

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    enviarPergunta(pergunta)
  }

  return (
    <section className="bot-pagina" data-cy="page-bot">
      <header className="bot-cabecalho">
        <h1>Assistente Amare</h1>
        <p>
          Tire dúvidas sobre o seu acompanhamento na Amare. Escolha uma sugestão
          ou escreva a sua pergunta.
        </p>
      </header>

      <p className="bot-disclaimer" data-cy="bot-disclaimer" role="note">
        {disclaimer}
      </p>

      {erro ? (
        <p className="bot-erro" role="alert" data-cy="bot-erro">
          {erro}
        </p>
      ) : null}

      <div className="bot-conversa" data-cy="bot-conversa">
        {mensagens.length === 0 ? (
          <div className="bot-boas-vindas" data-cy="bot-boas-vindas">
            <p>
              Oi! Posso te ajudar a encontrar informações da Amare — consultas,
              medicamentos, etapas do tratamento e mais. Sobre o que você quer
              saber?
            </p>
          </div>
        ) : (
          <ul className="bot-mensagens">
            {mensagens.map((mensagem) =>
              mensagem.autor === 'usuaria' ? (
                <li
                  key={mensagem.id}
                  className="bot-balao bot-balao--usuaria"
                  data-cy="bot-mensagem-usuaria"
                >
                  {mensagem.texto}
                </li>
              ) : (
                <li
                  key={mensagem.id}
                  className={`bot-balao bot-balao--assistente${
                    mensagem.sensivel ? ' bot-balao--sensivel' : ''
                  }`}
                  data-cy="bot-mensagem-assistente"
                  data-sensivel={mensagem.sensivel ? 'true' : 'false'}
                >
                  {mensagem.sensivel ? (
                    <StatusBadge tom="aviso" dataCy="bot-sensivel">
                      Procure a clínica
                    </StatusBadge>
                  ) : null}
                  <p className="bot-resposta" data-cy="bot-resposta">
                    {mensagem.texto}
                  </p>
                  {mensagem.fonte ? (
                    <Link
                      className="bot-fonte"
                      to={mensagem.fonte.rota}
                      data-cy="bot-fonte"
                    >
                      Fonte: {mensagem.fonte.rotulo}
                    </Link>
                  ) : null}
                  {mensagem.acoes && mensagem.acoes.length > 0 ? (
                    <div className="bot-acoes">
                      {mensagem.acoes.map((acao) => (
                        <Link
                          key={`${mensagem.id}-${acao.rota}`}
                          className="bot-acao"
                          to={acao.rota}
                          data-cy="bot-acao"
                        >
                          {acao.rotulo}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </li>
              ),
            )}
            {enviando ? (
              <li
                className="bot-balao bot-balao--assistente bot-digitando"
                data-cy="bot-digitando"
                role="status"
                aria-label="Escrevendo resposta"
              >
                <span className="bot-digitando__ponto" aria-hidden="true" />
                <span className="bot-digitando__ponto" aria-hidden="true" />
                <span className="bot-digitando__ponto" aria-hidden="true" />
              </li>
            ) : null}
          </ul>
        )}
        <div ref={fimRef} />
      </div>

      {sugestoes.length > 0 ? (
        <div className="bot-sugestoes" data-cy="bot-sugestoes">
          <span className="bot-sugestoes__titulo">Perguntas frequentes</span>
          <div className="bot-sugestoes__lista">
            {sugestoes.map((sugestao) => (
              <button
                key={sugestao.intencao}
                type="button"
                className="bot-chip"
                onClick={() => enviarPergunta(sugestao.pergunta_exemplo)}
                disabled={enviando}
                data-cy="bot-sugestao"
              >
                {sugestao.pergunta_exemplo}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form className="bot-form" onSubmit={handleSubmit} data-cy="bot-form">
        <InputField
          id="bot-pergunta"
          name="pergunta"
          label="Sua pergunta"
          hideLabel
          value={pergunta}
          onChange={(evento: ChangeEvent<HTMLInputElement>) =>
            setPergunta(evento.target.value)
          }
          placeholder="Escreva sua pergunta..."
          dataCy="bot-input"
        />
        <Button
          type="submit"
          disabled={enviando || carregando || !pergunta.trim()}
          dataCy="bot-enviar"
        >
          Enviar
        </Button>
      </form>
    </section>
  )
}

export default Bot
