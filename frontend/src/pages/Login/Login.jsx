import { useState } from 'react'
import logoMarea from '../../assets/marea-logo.svg'
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

  function handleSubmit(evento) {
    evento.preventDefault()
  }

  return (
    <main className="login-tela">
      <section className="login-card">
        <img
          className="login-logo"
          src={logoMarea}
          alt="Maréa"
          data-cy="marea-logo"
        />
        <p className="login-subtitulo">Bem-vinda à sua jornada de cuidado</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <InputField
            id="usuario"
            name="usuario"
            label="Usuário ou e-mail"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Digite seu usuário ou e-mail"
            autoComplete="username"
            dataCy="login-username"
          />

          <InputField
            id="senha"
            name="senha"
            label="Senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
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

          <Button type="submit" dataCy="login-submit">
            Entrar
          </Button>
        </form>
      </section>
    </main>
  )
}

export default Login
