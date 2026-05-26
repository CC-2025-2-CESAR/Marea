import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'

/**
 * Envolve o <Outlet /> do AppLayout para dar uma transição curta de
 * fade + microdeslocamento vertical entre as rotas internas. Mantém o
 * scroll natural da página e desliga a animação se a paciente pediu
 * redução de movimento no sistema operacional.
 *
 * Detalhes:
 * - mode="wait" garante que a página anterior termine de sair antes da
 *   próxima entrar — evita overlap visual.
 * - initial={false} evita animar a montagem inicial do app (entra
 *   instantâneo na primeira visita / refresh).
 * - key={pathname} é o que sinaliza para o AnimatePresence que houve
 *   troca de rota.
 * - minHeight: 100% mitiga o "pulo" quando a página seguinte é mais
 *   alta ou mais baixa que a anterior.
 */
function PageTransition({ children }) {
  const local = useLocation()
  const movimentoReduzido = useReducedMotion()

  if (movimentoReduzido) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={local.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
