import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import logoMarea from '../../assets/marea-logo.png'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import './Login.css'

function IconeOlho({ aberto }) {
  if (aberto) {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
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
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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

function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [feedback, setFeedback] = useState(null)

  function handleSubmit(evento) {
    evento.preventDefault()

    if (!usuario.trim() || !senha.trim()) {
      setFeedback({
        tipo: 'erro',
        texto: 'Preencha usuário/e-mail e senha para continuar.',
      })
      return
    }

    setFeedback({ tipo: 'sucesso', texto: 'Login simulado com sucesso.' })
  }

  const usuarioInvalido = feedback?.tipo === 'erro' && !usuario.trim()
  const senhaInvalida = feedback?.tipo === 'erro' && !senha.trim()

  return (
    <main className="login-tela">
      <motion.section
        className="login-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.img
          className="login-logo"
          src={logoMarea}
          alt="Maréa"
          data-cy="marea-logo"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
        />

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <InputField
            id="usuario"
            name="usuario"
            label="Usuário ou e-mail"
            hideLabel
            type="text"
            value={usuario}
            onChange={(e) => {
              setUsuario(e.target.value)
              setFeedback(null)
            }}
            placeholder="usuário ou e-mail"
            autoComplete="username"
            error={usuarioInvalido}
            dataCy="login-username"
          />

          <InputField
            id="senha"
            name="senha"
            label="Senha"
            hideLabel
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value)
              setFeedback(null)
            }}
            placeholder="senha"
            autoComplete="current-password"
            error={senhaInvalida}
            dataCy="login-password"
            trailing={
              <button
                type="button"
                className="login-olho"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                data-cy="login-toggle-password"
              >
                <IconeOlho aberto={mostrarSenha} />
              </button>
            }
          />

          <a className="login-esqueceu" href="#" data-cy="login-forgot">
            Esqueceu a senha?
          </a>

          <AnimatePresence>
            {feedback ? (
              <motion.p
                key={`${feedback.tipo}-${feedback.texto}`}
                className={`login-feedback login-feedback--${feedback.tipo}`}
                role="alert"
                data-cy="login-feedback"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {feedback.texto}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <Button type="submit" dataCy="login-submit">
            Entrar
          </Button>
        </form>
      </motion.section>
    </main>
  )
}

export default Login
