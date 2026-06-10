import { useContext } from 'react'
import { ToastContext } from './ToastContext'

/** Acessa o disparador de toasts. Precisa estar dentro de `<ToastProvider>`. */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast precisa estar dentro de <ToastProvider>.')
  }
  return ctx
}
