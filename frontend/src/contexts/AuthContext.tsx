/**
 * AuthContext — guarda token JWT e usuário autenticado da Amare.
 *
 * Persiste em `localStorage` (chave `marea_auth`) para sobreviver a F5.
 * Em projeto acadêmico isso é aceitável; em produção, o refresh token
 * deveria estar em cookie httpOnly. Documentado como dívida em
 * `docs/guia-django.md`.
 *
 * Escuta o evento `marea:logout` (disparado por `services/api` quando o
 * refresh falha em 401) e força logout local.
 *
 * O hook `useAuth` vive em arquivo separado (`useAuth.ts`) para satisfazer a
 * regra `react-refresh/only-export-components` — este arquivo exporta o
 * provider (componente) e o contexto; o hook fica fora.
 */

import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginRequest } from '../services/authService'
import { CHAVE_STORAGE } from './authStorage'
import type {
  AuthContextValue,
  RespostaLogin,
  Sessao,
  Usuario,
} from '../types'

const AuthContext = createContext<AuthContextValue | null>(null)

function lerStorage(): Sessao | null {
  try {
    const cru = window.localStorage.getItem(CHAVE_STORAGE)
    if (!cru) return null
    const dados = JSON.parse(cru) as Sessao
    if (!dados?.access || !dados?.refresh || !dados?.usuario) return null
    return dados
  } catch {
    return null
  }
}

function salvarStorage(dados: RespostaLogin) {
  window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados))
}

function limparStorage() {
  window.localStorage.removeItem(CHAVE_STORAGE)
}

function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy init: lê o localStorage uma única vez no primeiro render,
  // sem precisar de `useEffect` que dispararia warning de set-state-in-effect.
  const [usuario, setUsuario] = useState<Usuario | null>(
    () => lerStorage()?.usuario ?? null,
  )

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
  const iniciarSessao = useCallback((sessao: RespostaLogin) => {
    salvarStorage(sessao)
    setUsuario(sessao.usuario ?? null)
    return sessao.usuario
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      const resposta = await loginRequest(username, password)
      return iniciarSessao(resposta)
    },
    [iniciarSessao],
  )

  const logout = useCallback(() => {
    limparStorage()
    setUsuario(null)
  }, [])

  const valor: AuthContextValue = {
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
