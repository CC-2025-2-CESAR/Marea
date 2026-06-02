/**
 * ProtectedRoute — bloqueia a rota até a usuária logar e, opcionalmente,
 * restringe por papel (tipo_usuario).
 *
 * Uso em `AppRoutes.jsx`:
 *   // só autenticação
 *   <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
 *   // só médica
 *   <ProtectedRoute papel="medica"><AreaMedica /></ProtectedRoute>
 *   // qualquer um, menos médica (área da paciente)
 *   <ProtectedRoute excetoPapel="medica"><AppLayout /></ProtectedRoute>
 *
 * Props:
 * - papel (string | string[]): lista de papéis permitidos. Se o usuário não
 *   estiver nela, é redirecionado para a "casa" do papel dele.
 * - excetoPapel (string): papel que NÃO pode entrar (atalho para a área da
 *   paciente, que aceita todos menos a médica).
 *
 * O destino do redirecionamento é sempre uma rota que o usuário pode ver
 * (médica → /area-medica; demais → /), evitando laços de redirect.
 *
 * Enquanto o contexto hidrata o localStorage, devolve `null` (evita piscar a
 * tela de login no F5 de quem já está autenticado).
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

function larDoPapel(tipoUsuario) {
  return tipoUsuario === 'medica' ? '/area-medica' : '/'
}

function ProtectedRoute({ children, papel, excetoPapel }) {
  const { autenticado, carregando, tipoUsuario } = useAuth()

  if (carregando) return null
  if (!autenticado) return <Navigate to="/login" replace />

  if (papel) {
    const permitidos = Array.isArray(papel) ? papel : [papel]
    if (!permitidos.includes(tipoUsuario)) {
      return <Navigate to={larDoPapel(tipoUsuario)} replace />
    }
  }

  if (excetoPapel && tipoUsuario === excetoPapel) {
    return <Navigate to={larDoPapel(tipoUsuario)} replace />
  }

  return children ?? <Outlet />
}

export default ProtectedRoute
