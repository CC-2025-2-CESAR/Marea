/**
 * Hook de acesso ao `AuthContext`. Mantido em arquivo `.js` separado para
 * satisfazer `react-refresh/only-export-components`.
 */

import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  }
  return ctx
}
