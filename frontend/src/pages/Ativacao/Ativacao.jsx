import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import logoAmare from '../../assets/amare-logo.png'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import { useAuth } from '../../contexts/useAuth'
import {
  definirSenhaConvite,
  detalharConvite,
} from '../../services/conviteService'
import './Ativacao.css'

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

// Mensagem mostrada quando o convite não pode ser usado.
const MENSAGEM_INVALIDO = {
  expirado: 'Este convite expirou. Solicite um novo link à clínica.',
  usado: 'Este convite já foi utilizado. Se você já criou sua senha, faça login.',
  nao_encontrado: 'Convite não encontrado. Confira o link com a clínica.',
  falha: 'Não foi possível validar o convite agora. Tente novamente em instantes.',
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
    return 'Convite não encontrado. Confira o link com a clínica.'
  }
  return 'Não foi possível definir a senha agora. Tente novamente.'
}

function Ativacao() {
  const { token } = useParams()
  const navegar = useNavigate()
  const { iniciarSessao } = useAuth()

  const [carregando, setCarregando] = useState(true)
  const [convite, setConvite] = useState(null)
  const [motivoInvalido, setMotivoInvalido] = useState(null)

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const dados = await detalharConvite(token)
        if (cancelado) return
        if (dados.valido) {
          setConvite(dados)
        } else {
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
      setFeedback({
        tipo: 'erro',
        texto: 'Crie e confirme sua senha para continuar.',
      })
      return
    }
    if (senha !== confirmar) {
      setFeedback({ tipo: 'erro', texto: 'As senhas não coincidem.' })
      return
    }

    setEnviando(true)
    setFeedback(null)
    try {
      const sessao = await definirSenhaConvite(token, senha)
      const usuario = iniciarSessao(sessao)
      navegar(
        usuario?.tipo_usuario === 'medica' ? '/area-medica' : '/perfil',
        { replace: true },
      )
    } catch (erro) {
      setFeedback({ tipo: 'erro', texto: mensagemErroSenha(erro) })
      setEnviando(false)
    }
  }

  return (
    <main className="ativacao-tela" data-cy="page-ativacao">
      <motion.section
        className="ativacao-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <img className="ativacao-logo" src={logoAmare} alt="Amare" data-cy="amare-logo" />

        {carregando ? (
          <p className="ativacao-sub" data-cy="ativacao-carregando">
            Validando seu convite…
          </p>
        ) : motivoInvalido ? (
          <div className="ativacao-invalido" data-cy="ativacao-invalido">
            <h1 className="ativacao-titulo">Convite indisponível</h1>
            <p className="ativacao-sub">{MENSAGEM_INVALIDO[motivoInvalido]}</p>
            <Link className="ativacao-voltar" to="/login" data-cy="ativacao-ir-login">
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="ativacao-intro">
              <h1 className="ativacao-titulo">Bem-vinda à Amare</h1>
              <p className="ativacao-sub">
                Olá,{' '}
                <span className="ativacao-nome" data-cy="ativacao-nome">
                  {convite.nome}
                </span>
                . Crie sua senha para ativar o acesso de{' '}
                <span className="ativacao-email">{convite.email}</span>.
              </p>
            </div>

            <form className="ativacao-form" onSubmit={handleSubmit} noValidate>
              <InputField
                id="senha"
                name="senha"
                label="Senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value)
                  setFeedback(null)
                }}
                placeholder="crie uma senha"
                autoComplete="new-password"
                dataCy="ativacao-senha"
                trailing={
                  <button
                    type="button"
                    className="ativacao-olho"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    data-cy="ativacao-toggle-password"
                  >
                    <IconeOlho aberto={mostrarSenha} />
                  </button>
                }
              />

              <InputField
                id="confirmar"
                name="confirmar"
                label="Confirmar senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => {
                  setConfirmar(e.target.value)
                  setFeedback(null)
                }}
                placeholder="repita a senha"
                autoComplete="new-password"
                dataCy="ativacao-confirmar"
              />

              <p className="ativacao-ajuda">
                Use ao menos 8 caracteres, evitando senhas óbvias ou só números.
              </p>

              <AnimatePresence>
                {feedback ? (
                  <motion.p
                    key={feedback.texto}
                    className={`ativacao-feedback ativacao-feedback--${feedback.tipo}`}
                    role="alert"
                    data-cy="ativacao-feedback"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {feedback.texto}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <Button type="submit" dataCy="ativacao-submit" disabled={enviando}>
                {enviando ? 'Ativando…' : 'Definir senha e entrar'}
              </Button>
            </form>
          </>
        )}
      </motion.section>
    </main>
  )
}

export default Ativacao
