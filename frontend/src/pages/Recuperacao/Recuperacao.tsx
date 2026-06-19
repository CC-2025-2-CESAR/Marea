import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import logoAmare from '../../assets/amare-logo.png'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import { solicitarRecuperacao } from '../../services/recuperacaoService'
import type { ErroRequisicao } from '../../services/api'
import './Recuperacao.css'

// Mensagem genérica de sucesso: não revela se o e-mail tem conta.
const MENSAGEM_GENERICA =
  'Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira a sua caixa de entrada.'

interface Feedback {
  tipo: 'erro' | 'sucesso'
  texto: string
}

function Recuperacao() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!email.trim()) {
      setFeedback({
        tipo: 'erro',
        texto: 'Informe o seu e-mail para continuar.',
      })
      return
    }

    setEnviando(true)
    setFeedback(null)
    try {
      await solicitarRecuperacao(email.trim())
      setEnviado(true)
    } catch (erro) {
      if ((erro as ErroRequisicao)?.status === 400) {
        setFeedback({
          tipo: 'erro',
          texto: 'Informe o seu e-mail para continuar.',
        })
      } else {
        setFeedback({
          tipo: 'erro',
          texto:
            'Não foi possível enviar agora. Verifique sua conexão e tente novamente.',
        })
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="recuperacao-tela" data-cy="page-recuperacao">
      <motion.section
        className="recuperacao-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <img className="recuperacao-logo" src={logoAmare} alt="Amare" data-cy="amare-logo" />

        {enviado ? (
          <div className="recuperacao-sucesso" data-cy="recuperacao-sucesso">
            <h1 className="recuperacao-titulo">Verifique o seu e-mail</h1>
            <p className="recuperacao-sub">{MENSAGEM_GENERICA}</p>
            <Link className="recuperacao-voltar" to="/login" data-cy="recuperacao-ir-login">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div className="recuperacao-intro">
              <h1 className="recuperacao-titulo">Recuperar senha</h1>
              <p className="recuperacao-sub">
                Informe o e-mail da sua conta. Enviaremos um link para você criar
                uma nova senha.
              </p>
            </div>

            <form className="recuperacao-form" onSubmit={handleSubmit} noValidate>
              <InputField
                id="email"
                name="email"
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFeedback(null)
                }}
                placeholder="seu e-mail"
                autoComplete="email"
                dataCy="recuperacao-email"
              />

              <AnimatePresence>
                {feedback ? (
                  <motion.p
                    key={feedback.texto}
                    className={`recuperacao-feedback recuperacao-feedback--${feedback.tipo}`}
                    role="alert"
                    data-cy="recuperacao-feedback"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {feedback.texto}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <Button type="submit" dataCy="recuperacao-submit" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar link'}
              </Button>

              <Link className="recuperacao-voltar" to="/login" data-cy="recuperacao-ir-login">
                Voltar ao login
              </Link>
            </form>
          </>
        )}
      </motion.section>
    </main>
  )
}

export default Recuperacao
