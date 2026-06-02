import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'

/**
 * Envolve o <Outlet /> do AppLayout para dar uma transição curta e suave
 * entre as rotas internas. Usa apenas opacidade (crossfade), sem
 * deslocamento vertical — o movimento vertical somado ao mode="wait" era o
 * que dava a sensação de "travadinha" na troca de página. Desliga a
 * animação se a paciente pediu redução de movimento no sistema operacional.
 *
 * Detalhes:
 * - mode="wait": a página anterior termina de sair antes de a próxima
 *   entrar, evitando sobreposição de conteúdo. A saída é mais rápida que a
 *   entrada para o conjunto parecer ágil, não arrastado.
 * - initial={false}: não anima a montagem inicial do app (primeira visita
 *   ou refresh entram instantâneos).
 * - key={pathname}: sinaliza a troca de rota para o AnimatePresence.
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
