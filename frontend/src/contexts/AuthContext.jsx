/**
 * AuthContext — guarda token JWT e usuário autenticado da Amare.
 *
 * Persiste em `localStorage` (chave `marea_auth`) para sobreviver a F5.
 * Em projeto acadêmico isso é aceitável; em produção, o refresh token
 * deveria estar em cookie httpOnly. Documentado como dívida em
 * `docs/guia-django.md`.
 *
 * Escuta o evento `marea:logout` (disparado por `services/api.js` quando o
 * refresh falha em 401) e força logout local.
 *
 * O hook `useAuth` vive em arquivo separado (`useAuth.js`) para satisfazer a
 * regra `react-refresh/only-export-components` — arquivo `.jsx` exporta só
 * componentes; hooks e constantes ficam em `.js`.
 */

import { createContext, useCallback, useEffect, useState } from 'react'
import { login as loginRequest } from '../services/authService'
import { CHAVE_STORAGE } from './authStorage'

const AuthContext = createContext(null)

function lerStorage() {
  try {
    const cru = window.localStorage.getItem(CHAVE_STORAGE)
    if (!cru) return null
    const dados = JSON.parse(cru)
    if (!dados?.access || !dados?.refresh || !dados?.usuario) return null
    return dados
  } catch {
    return null
  }
}

function salvarStorage(dados) {
  window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados))
}

function limparStorage() {
  window.localStorage.removeItem(CHAVE_STORAGE)
}

function AuthProvider({ children }) {
  // Lazy init: lê o localStorage uma única vez no primeiro render,
  // sem precisar de `useEffect` que dispararia warning de set-state-in-effect.
  const [usuario, setUsuario] = useState(() => lerStorage()?.usuario ?? null)

  // Reage ao evento global de logout disparado pelo wrapper de API
  // quando o refresh token também falhou.
  useEffect(() => {
    function aoLogout() {
      setUsuario(null)
    }
    window.addEventListener('marea:logout', aoLogout)
    return () => window.removeEventListener('marea:logout', aoLogout)
  }, [])

  // Inicia a sessão a partir de uma resposta de autenticação já obtida
  // ({access, refresh, usuario}). Reaproveitado pelo login e pelo primeiro
  // acesso por convite, que devolve os tokens ao definir a senha.
  const iniciarSessao = useCallback((sessao) => {
    salvarStorage(sessao)
    setUsuario(sessao.usuario)
    return sessao.usuario
  }, [])

  const login = useCallback(
    async (username, password) => {
      const resposta = await loginRequest(username, password)
      return iniciarSessao(resposta)
    },
    [iniciarSessao],
  )

  const logout = useCallback(() => {
    limparStorage()
    setUsuario(null)
  }, [])

  const valor = {
    usuario,
    // Papel do usuário (paciente | medica | admin) para o controle de acesso
    // por rota no frontend. Vem do login/me do backend.
    tipoUsuario: usuario?.tipo_usuario ?? null,
    autenticado: usuario !== null,
    carregando: false,
    login,
    iniciarSessao,
    logout,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
