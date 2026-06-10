import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ToastContext } from './ToastContext'
import type { TipoToast } from './ToastContext'
import './Toast.css'

interface ToastItem {
  id: number
  mensagem: string
  tipo: TipoToast
}

const DURACAO_MS = 4000

/**
 * Provê o `mostrarToast` para toda a árvore e renderiza a região de
 * notificações (canto inferior, `aria-live`). Cada toast some sozinho após
 * alguns segundos ou ao clicar em fechar.
 */
function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const proximoId = useRef(1)
  const reduzir = useReducedMotion()

  const fechar = useCallback((id: number) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id))
  }, [])

  const mostrarToast = useCallback(
    (mensagem: string, tipo: TipoToast = 'sucesso') => {
      const id = proximoId.current
      proximoId.current += 1
      setToasts((atuais) => [...atuais, { id, mensagem, tipo }])
      window.setTimeout(() => fechar(id), DURACAO_MS)
      return id
    },
    [fechar],
  )

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div
        className="toast-viewport"
        role="region"
        aria-label="Notificações"
        data-cy="toast-viewport"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast toast--${t.tipo}`}
              role="status"
              data-cy="toast"
              data-tipo={t.tipo}
              initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={reduzir ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduzir ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <span className="toast__mensagem">{t.mensagem}</span>
              <button
                type="button"
                className="toast__fechar"
                onClick={() => fechar(t.id)}
                aria-label="Fechar notificação"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
