/**
 * Cadastro de nova paciente na area da medica (PROJ-7).
 *
 * A clinica informa os dados minimos; o backend cria a conta inativa e devolve
 * um link de primeiro acesso, que a medica copia e repassa a paciente. A conta
 * so e ativada quando a paciente define a propria senha pelo link.
 */

import { useState } from 'react'
import type { FormEvent } from 'react'
import { criarPaciente, reenviarConvite } from '../../services/conviteService'
import type { ErroRequisicao } from '../../services/api'
import type { NovaPacienteEntrada, RespostaCriarPaciente } from '../../types'

interface Props {
  aoCadastrar?: () => void
}

interface Feedback {
  tipo: 'erro'
  texto: string
}

type CampoForm = keyof NovaPacienteEntrada

const FORM_VAZIO: NovaPacienteEntrada = {
  nome_completo: '',
  email: '',
  telefone: '',
  data_nascimento: '',
}

function mensagemErro(erro: unknown): string {
  const detalhe = (erro as ErroRequisicao)?.detalhe
  if (detalhe && typeof detalhe === 'object') {
    const campos = detalhe as {
      email?: string[]
      nome_completo?: string[]
      detail?: string
    }
    if (Array.isArray(campos.email) && campos.email.length > 0) {
      return campos.email[0]
    }
    if (
      Array.isArray(campos.nome_completo) &&
      campos.nome_completo.length > 0
    ) {
      return campos.nome_completo[0]
    }
    if (typeof campos.detail === 'string') {
      return campos.detail
    }
  }
  return 'Nao foi possivel concluir agora. Tente novamente.'
}

function NovaPaciente({ aoCadastrar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState<NovaPacienteEntrada>(FORM_VAZIO)
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [resultado, setResultado] = useState<RespostaCriarPaciente | null>(null)
  const [copiado, setCopiado] = useState(false)

  function atualizar(campo: CampoForm, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function fechar() {
    setAberto(false)
    setForm(FORM_VAZIO)
    setFeedback(null)
    setResultado(null)
    setCopiado(false)
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!form.nome_completo.trim() || !form.email.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe ao menos nome e e-mail.' })
      return
    }
    setEnviando(true)
    setFeedback(null)
    try {
      const dados = await criarPaciente({
        nome_completo: form.nome_completo.trim(),
        email: form.email.trim(),
        telefone: form.telefone?.trim(),
        data_nascimento: form.data_nascimento || null,
      })
      setResultado(dados)
      setForm(FORM_VAZIO)
      setCopiado(false)
      aoCadastrar?.()
    } catch (erro) {
      setFeedback({ tipo: 'erro', texto: mensagemErro(erro) })
    } finally {
      setEnviando(false)
    }
  }

  async function copiarLink() {
    if (!resultado?.convite?.link) return
    try {
      await navigator.clipboard.writeText(resultado.convite.link)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  async function gerarNovoLink() {
    if (!resultado?.paciente?.id) return
    setEnviando(true)
    setFeedback(null)
    try {
      const dados = await reenviarConvite(resultado.paciente.id)
      setResultado((atual) =>
        atual ? { ...atual, convite: dados.convite } : atual,
      )
      setCopiado(false)
    } catch (erro) {
      setFeedback({ tipo: 'erro', texto: mensagemErro(erro) })
    } finally {
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        className="nova-paciente__abrir"
        onClick={() => setAberto(true)}
        data-cy="nova-paciente-abrir"
      >
        + Nova paciente
      </button>
    )
  }

  return (
    <section className="nova-paciente" data-cy="nova-paciente">
      <div className="nova-paciente__cabecalho">
        <h2>Nova paciente</h2>
        <button
          type="button"
          className="nova-paciente__fechar"
          onClick={fechar}
          aria-label="Fechar cadastro"
        >
          x
        </button>
      </div>

      {resultado ? (
        <div className="nova-paciente__sucesso" data-cy="nova-paciente-sucesso">
          <p className="nova-paciente__ok">
            <strong>{resultado.paciente.nome_completo}</strong> cadastrada.
            Envie o link de primeiro acesso (valido por 48h):
          </p>
          <input
            className="nova-paciente__link"
            type="text"
            readOnly
            value={resultado.convite.link}
            data-cy="nova-paciente-link"
            onFocus={(e) => e.target.select()}
          />
          <div className="nova-paciente__acoes">
            <button
              type="button"
              className="nova-paciente__copiar"
              onClick={copiarLink}
              data-cy="nova-paciente-copiar"
            >
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
            <button
              type="button"
              className="nova-paciente__secundario"
              onClick={gerarNovoLink}
              disabled={enviando}
              data-cy="nova-paciente-reenviar"
            >
              Gerar novo link
            </button>
          </div>
          <p className="nova-paciente__aviso">
            A conta so e ativada quando a paciente define a propria senha pelo
            link.
          </p>
          {feedback ? (
            <p
              className={`nova-paciente__feedback nova-paciente__feedback--${feedback.tipo}`}
              role="alert"
              data-cy="nova-paciente-feedback"
            >
              {feedback.texto}
            </p>
          ) : null}
          <button
            type="button"
            className="nova-paciente__novo"
            onClick={() => {
              setResultado(null)
              setCopiado(false)
            }}
            data-cy="nova-paciente-outra"
          >
            Cadastrar outra
          </button>
        </div>
      ) : (
        <form className="nova-paciente__form" onSubmit={handleSubmit} noValidate>
          <label>
            Nome completo
            <input
              type="text"
              value={form.nome_completo}
              onChange={(e) => atualizar('nome_completo', e.target.value)}
              data-cy="nova-paciente-nome"
              autoComplete="off"
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(e) => atualizar('email', e.target.value)}
              data-cy="nova-paciente-email"
              autoComplete="off"
            />
          </label>
          <label>
            Telefone (opcional)
            <input
              type="tel"
              value={form.telefone ?? ''}
              onChange={(e) => atualizar('telefone', e.target.value)}
              data-cy="nova-paciente-telefone"
              autoComplete="off"
            />
          </label>
          <label>
            Data de nascimento (opcional)
            <input
              type="date"
              value={form.data_nascimento ?? ''}
              onChange={(e) => atualizar('data_nascimento', e.target.value)}
              data-cy="nova-paciente-nascimento"
            />
          </label>

          {feedback ? (
            <p
              className={`nova-paciente__feedback nova-paciente__feedback--${feedback.tipo}`}
              role="alert"
              data-cy="nova-paciente-feedback"
            >
              {feedback.texto}
            </p>
          ) : null}

          <button
            type="submit"
            className="nova-paciente__enviar"
            disabled={enviando}
            data-cy="nova-paciente-enviar"
          >
            {enviando ? 'Cadastrando...' : 'Cadastrar e gerar link'}
          </button>
        </form>
      )}
    </section>
  )
}

export default NovaPaciente
