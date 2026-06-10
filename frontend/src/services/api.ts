/**
 * Wrapper de `fetch` para a API da Amare.
 *
 * Lê a URL base de `VITE_API_BASE_URL` (com fallback para localhost) e
 * injeta automaticamente o cabeçalho `Authorization: Bearer <access>` quando
 * há um token no `localStorage` (chave `marea_auth`).
 *
 * Em 401 com token presente, tenta uma vez renovar o access via
 * `POST /auth/refresh/` e repete a chamada. Se o refresh falhar, limpa o
 * `localStorage` e dispara o evento `marea:logout` para o `AuthContext`
 * derrubar a sessão no frontend.
 */

import { CHAVE_STORAGE } from '../contexts/authStorage'
import type { Sessao } from '../types'

// URL base da API. Se `VITE_API_BASE_URL` estiver definida, ela manda. Caso
// contrário: em build de produção o frontend é servido pelo próprio Django no
// mesmo domínio, então a API fica em `/api` (relativo — dispensa CORS); em
// desenvolvimento, aponta para o backend local na porta 8000.
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api')

/** Opções de `requisicao`: um `RequestInit` com cabeçalhos em objeto simples. */
export type OpcoesRequisicao = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
  /** Marca interna: evita laço infinito de refresh ao repetir a chamada. */
  _jaTentouRefresh?: boolean
}

/** Erro de chamada à API, com o status HTTP e o corpo de detalhe (se houver). */
export type ErroRequisicao = Error & { status?: number; detalhe?: unknown }

function lerSessao(): Sessao | null {
  try {
    const cru = window.localStorage.getItem(CHAVE_STORAGE)
    if (!cru) return null
    return JSON.parse(cru) as Sessao
  } catch {
    return null
  }
}

function salvarSessao(sessao: Sessao): void {
  window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(sessao))
}

function limparSessao(): void {
  window.localStorage.removeItem(CHAVE_STORAGE)
}

function dispararLogout(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('marea:logout'))
  }
}

async function tentarRefresh(): Promise<Sessao | null> {
  const sessao = lerSessao()
  if (!sessao?.refresh) return null

  const resposta = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: sessao.refresh }),
  })

  if (!resposta.ok) return null

  const dados = (await resposta.json()) as { access?: string }
  if (!dados?.access) return null

  const novaSessao: Sessao = { ...sessao, access: dados.access }
  salvarSessao(novaSessao)
  return novaSessao
}

async function executar(
  caminho: string,
  opcoes: OpcoesRequisicao,
): Promise<Response> {
  const sessao = lerSessao()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opcoes.headers || {}),
  }
  if (sessao?.access) {
    headers.Authorization = `Bearer ${sessao.access}`
  }

  return fetch(`${API_BASE_URL}${caminho}`, { ...opcoes, headers })
}

async function requisicao<T = unknown>(
  caminho: string,
  opcoes: OpcoesRequisicao = {},
): Promise<T> {
  let resposta = await executar(caminho, opcoes)

  if (resposta.status === 401 && !opcoes._jaTentouRefresh) {
    const novaSessao = await tentarRefresh()
    if (novaSessao) {
      resposta = await executar(caminho, { ...opcoes, _jaTentouRefresh: true })
    } else if (lerSessao()) {
      // Tinha sessão mas o refresh falhou — força logout.
      limparSessao()
      dispararLogout()
    }
  }

  if (!resposta.ok) {
    let detalhe: unknown
    try {
      detalhe = await resposta.json()
    } catch {
      detalhe = undefined
    }
    const erro = new Error(
      `Falha ${resposta.status} ao chamar ${caminho}`,
    ) as ErroRequisicao
    erro.status = resposta.status
    erro.detalhe = detalhe
    throw erro
  }

  if (resposta.status === 204) {
    return null as T
  }

  return (await resposta.json()) as T
}

export { API_BASE_URL, requisicao }
