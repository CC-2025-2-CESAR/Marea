import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import './Modal.css'

interface Props {
  aberto: boolean
  onFechar: () => void
  titulo: string
  children?: ReactNode
  /** Conteúdo do rodapé (botões de ação). */
  rodape?: ReactNode
  /** Rótulo acessível do botão de fechar (×). */
  rotuloFechar?: string
  /** Mostra o botão × no cabeçalho. Padrão: true. */
  mostrarFechar?: boolean
  /** Fecha ao clicar no fundo escurecido. Padrão: true. */
  fecharNoFundo?: boolean
  /** Prefixo de data-cy (o diálogo recebe `dataCy`; fundo/fechar derivam dele). */
  dataCy?: string
}

const FOCAVEIS =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo modal acessível: foco preso, Escape fecha, o fundo escurece e o
 * scroll do corpo trava enquanto aberto. No celular vira folha inferior
 * (bottom-sheet). Renderiza por portal no body para escapar de overflow e
 * empilhamento das telas.
 */
function Modal({
  aberto,
  onFechar,
  titulo,
  children,
  rodape,
  rotuloFechar = 'Fechar',
  mostrarFechar = true,
  fecharNoFundo = true,
  dataCy,
}: Props) {
  const tituloId = useId()
  const descricaoId = useId()
  const dialogoRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLElement | null>(null)
  const reduzir = useReducedMotion()

  // Guarda quem tinha o foco para devolvê-lo quando o modal fechar.
  useEffect(() => {
    if (aberto) {
      gatilhoRef.current = document.activeElement as HTMLElement | null
    }
  }, [aberto])

  // Trava o scroll do corpo enquanto o modal está aberto.
  useEffect(() => {
    if (!aberto) return undefined
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [aberto])

  // Leva o foco para dentro ao abrir e o devolve ao gatilho ao fechar.
  useEffect(() => {
    if (!aberto) return undefined
    const no = dialogoRef.current
    const primeiro = no?.querySelector<HTMLElement>(FOCAVEIS)
    ;(primeiro ?? no)?.focus()
    return () => {
      gatilhoRef.current?.focus()
    }
  }, [aberto])

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === 'Escape') {
      evento.stopPropagation()
      onFechar()
      return
    }
    if (evento.key !== 'Tab') return
    const no = dialogoRef.current
    if (!no) return
    const focaveis = Array.from(no.querySelectorAll<HTMLElement>(FOCAVEIS))
    if (focaveis.length === 0) {
      evento.preventDefault()
      return
    }
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    }
  }

  return createPortal(
    <AnimatePresence>
      {aberto ? (
        <motion.div
          key="modal-fundo"
          className="modal-fundo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={fecharNoFundo ? onFechar : undefined}
          data-cy={dataCy ? `${dataCy}-fundo` : undefined}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            aria-describedby={children ? descricaoId : undefined}
            tabIndex={-1}
            ref={dialogoRef}
            data-cy={dataCy}
            onKeyDown={aoTeclar}
            onClick={(evento) => evento.stopPropagation()}
            initial={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={reduzir ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="modal__cabecalho">
              <h2 className="modal__titulo" id={tituloId}>
                {titulo}
              </h2>
              {mostrarFechar ? (
                <button
                  type="button"
                  className="modal__fechar"
                  onClick={onFechar}
                  aria-label={rotuloFechar}
                  data-cy={dataCy ? `${dataCy}-fechar` : undefined}
                >
                  ×
                </button>
              ) : null}
            </div>
            {children ? (
              <div className="modal__corpo" id={descricaoId}>
                {children}
              </div>
            ) : null}
            {rodape ? <div className="modal__rodape">{rodape}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default Modal
