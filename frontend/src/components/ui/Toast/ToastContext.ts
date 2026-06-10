import { createContext } from 'react'

export type TipoToast = 'sucesso' | 'erro' | 'aviso' | 'info'

export interface ToastContextValor {
  /** Mostra um toast e devolve o id (para fechar manualmente, se preciso). */
  mostrarToast: (mensagem: string, tipo?: TipoToast) => number
}

export const ToastContext = createContext<ToastContextValor | null>(null)
