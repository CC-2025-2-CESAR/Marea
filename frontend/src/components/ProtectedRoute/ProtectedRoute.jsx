/**
 * ProtectedRoute — bloqueia a renderização de uma rota até a paciente logar.
 *
 * Uso em `AppRoutes.jsx`:
 *   <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
 *
 * Enquanto o contexto ainda está hidratando o `localStorage`, devolve `null`
 * (evita piscar a tela de login no F5 de quem já está autenticado).
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

function ProtectedRoute({ children }) {
  const { autenticado, carregando } = useAuth()

  if (carregando) return null
  if (!autenticado) return <Navigate to="/login" replace />

  return children ?? <Outlet />
}

export default ProtectedRoute
