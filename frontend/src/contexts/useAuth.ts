/**
 * Hook de acesso ao `AuthContext`. Mantido em arquivo separado (sem componente)
 * para satisfazer `react-refresh/only-export-components`.
 */

import { useContext } from 'react'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from '../types'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  }
  return ctx
}
