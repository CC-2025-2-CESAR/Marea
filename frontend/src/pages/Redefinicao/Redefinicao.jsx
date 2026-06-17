import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import logoAmare from '../../assets/amare-logo.png'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import {
  redefinirSenha,
  validarRedefinicao,
} from '../../services/recuperacaoService'
import './Redefinicao.css'

function IconeOlho({ aberto }) {
  if (aberto) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.3 4M6.1 6.1A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 3.4-.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const MENSAGEM_INVALIDO = {
  expirado:
    'Este link de redefinição expirou. Solicite um novo na tela de recuperação.',
  usado: 'Este link já foi utilizado. Se você já redefiniu a senha, faça login.',
  nao_encontrado: 'Link de redefinição não encontrado. Confira o endereço.',
  falha: 'Não foi possível validar o link agora. Tente novamente em instantes.',
}

function mensagemErroSenha(erro) {
  const detalhe = erro?.detalhe
  if (detalhe && typeof detalhe === 'object') {
    if (Array.isArray(detalhe.password) && detalhe.password.length) {
      return detalhe.password.join(' ')
    }
    if (typeof detalhe.detail === 'string') {
      return detalhe.detail
    }
  }
  if (erro?.status === 404) {
    return 'Link de redefinição não encontrado. Confira o endereço.'
  }
  return 'Não foi possível redefinir a senha agora. Tente novamente.'
}

function Redefinicao() {
  const { token } = useParams()

  const [carregando, setCarregando] = useState(true)
  const [motivoInvalido, setMotivoInvalido] = useState(null)
  const [concluido, setConcluido] = useState(false)

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const dados = await validarRedefinicao(token)
        if (cancelado) return
        if (!dados.valido) {
          setMotivoInvalido(dados.status === 'usado' ? 'usado' : 'expirado')
        }
      } catch (erro) {
        if (cancelado) return
        setMotivoInvalido(erro?.status === 404 ? 'nao_encontrado' : 'falha')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [token])

  async function handleSubmit(evento) {
    evento.preventDefault()

    if (!senha || !confirmar) {
      setFeedback({ tipo: 'erro', texto: 'Crie e confirme a sua nova senha.' })
      return
    }
    if (senha !== confirmar) {
      setFeedback({ tipo: 'erro', texto: 'As senhas não coincidem.' })
      return
    }

    setEnviando(true)
    setFeedback(null)
    try {
      await redefinirSenha(token, senha)
      setConcluido(true)
    } catch (erro) {
      setFeedback({ tipo: 'erro', texto: mensagemErroSenha(erro) })
      setEnviando(false)
    }
  }

  return (
    <main className="redefinicao-tela" data-cy="page-redefinicao">
      <motion.section
        className="redefinicao-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <img className="redefinicao-logo" src={logoAmare} alt="Amare" data-cy="amare-logo" />

        {carregando ? (
          <p className="redefinicao-sub" data-cy="redefinicao-carregando">
            Validando o link…
          </p>
        ) : concluido ? (
          <div className="redefinicao-sucesso" data-cy="redefinicao-sucesso">
            <h1 className="redefinicao-titulo">Senha redefinida</h1>
            <p className="redefinicao-sub">
              Tudo certo! Agora é só entrar com a sua nova senha.
            </p>
            <Link className="redefinicao-voltar" to="/login" data-cy="redefinicao-ir-login">
              Ir para o login
            </Link>
          </div>
        ) : motivoInvalido ? (
          <div className="redefinicao-invalido" data-cy="redefinicao-invalido">
            <h1 className="redefinicao-titulo">Link indisponível</h1>
            <p className="redefinicao-sub">{MENSAGEM_INVALIDO[motivoInvalido]}</p>
            <Link
              className="redefinicao-voltar"
              to="/recuperar"
              data-cy="redefinicao-ir-recuperar"
            >
              Pedir um novo link
            </Link>
          </div>
        ) : (
          <>
            <div className="redefinicao-intro">
              <h1 className="redefinicao-titulo">Criar nova senha</h1>
              <p className="redefinicao-sub">
                Escolha uma nova senha para a sua conta.
              </p>
            </div>

            <form className="redefinicao-form" onSubmit={handleSubmit} noValidate>
              <InputField
                id="senha"
                name="senha"
                label="Nova senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value)
                  setFeedback(null)
                }}
                placeholder="crie uma nova senha"
                autoComplete="new-password"
                dataCy="redefinicao-senha"
                trailing={
                  <button
                    type="button"
                    className="redefinicao-olho"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    data-cy="redefinicao-toggle-password"
                  >
                    <IconeOlho aberto={mostrarSenha} />
                  </button>
                }
              />

              <InputField
                id="confirmar"
                name="confirmar"
                label="Confirmar nova senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => {
                  setConfirmar(e.target.value)
                  setFeedback(null)
                }}
                placeholder="repita a nova senha"
                autoComplete="new-password"
                dataCy="redefinicao-confirmar"
              />

              <p className="redefinicao-ajuda">
                Use ao menos 8 caracteres, evitando senhas óbvias ou só números.
              </p>

              <AnimatePresence>
                {feedback ? (
                  <motion.p
                    key={feedback.texto}
                    className={`redefinicao-feedback redefinicao-feedback--${feedback.tipo}`}
                    role="alert"
                    data-cy="redefinicao-feedback"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {feedback.texto}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <Button type="submit" dataCy="redefinicao-submit" disabled={enviando}>
                {enviando ? 'Salvando…' : 'Redefinir senha'}
              </Button>
            </form>
          </>
        )}
      </motion.section>
    </main>
  )
}

export default Redefinicao
