/**
 * ProtectedRoute — bloqueia a rota até a usuária logar e, opcionalmente,
 * restringe por papel (tipo_usuario).
 *
 * Uso em `AppRoutes`:
 *   // só autenticação
 *   <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
 *   // só médica
 *   <ProtectedRoute papel="medica"><AreaMedica /></ProtectedRoute>
 *   // qualquer um, menos médica (área da paciente)
 *   <ProtectedRoute excetoPapel="medica"><AppLayout /></ProtectedRoute>
 *
 * Props:
 * - papel (TipoUsuario | TipoUsuario[]): papéis permitidos. Se o usuário não
 *   estiver na lista, é redirecionado para a "casa" do papel dele.
 * - excetoPapel (TipoUsuario | TipoUsuario[]): papel(éis) que NÃO podem entrar
 *   (atalho para a área da paciente, que aceita todos menos médica e admin).
 *
 * O destino do redirecionamento é sempre a "casa" do papel (médica →
 * /area-medica; admin → /gestao; demais → /), evitando laços de redirect.
 *
 * Enquanto o contexto hidrata o localStorage, devolve `null` (evita piscar a
 * tela de login no F5 de quem já está autenticado).
 */

import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import type { TipoUsuario } from '../../types'

function larDoPapel(tipoUsuario: TipoUsuario | null) {
  if (tipoUsuario === 'medica') return '/area-medica'
  if (tipoUsuario === 'admin') return '/gestao'
  return '/'
}

interface ProtectedRouteProps {
  children?: ReactNode
  papel?: TipoUsuario | TipoUsuario[]
  excetoPapel?: TipoUsuario | TipoUsuario[]
}

function ProtectedRoute({ children, papel, excetoPapel }: ProtectedRouteProps) {
  const { autenticado, carregando, tipoUsuario } = useAuth()

  if (carregando) return null
  if (!autenticado) return <Navigate to="/login" replace />

  if (papel) {
    const permitidos = Array.isArray(papel) ? papel : [papel]
    if (!permitidos.includes(tipoUsuario as TipoUsuario)) {
      return <Navigate to={larDoPapel(tipoUsuario)} replace />
    }
  }

  if (excetoPapel) {
    const bloqueados = Array.isArray(excetoPapel) ? excetoPapel : [excetoPapel]
    if (bloqueados.includes(tipoUsuario as TipoUsuario)) {
      return <Navigate to={larDoPapel(tipoUsuario)} replace />
    }
  }

  return children ?? <Outlet />
}

export default ProtectedRoute
