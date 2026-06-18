/**
 * Hook de acesso ao `AuthContext`. Mantido em arquivo separado (sem componente)
 * para satisfazer `react-refresh/only-export-components`.
 */

import { useContext } from 'react'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from '../types'

export function useAuth(): AuthContextValue {
  // O `AuthContext` ainda é `.jsx` (createContext(null)); tipamos o valor aqui
  // até o provider virar `.tsx` na varredura final do TypeScript.
  const ctx = useContext(AuthContext) as AuthContextValue | null
  if (ctx === null) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  }
  return ctx
}
