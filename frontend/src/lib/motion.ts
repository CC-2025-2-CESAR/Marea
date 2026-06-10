import type { Variants } from 'motion/react'

/**
 * Variantes de animação reutilizáveis (Motion). Padronizam a "entrada" de
 * grids, listas e blocos para dar a sensação fluida do app sem repetir valores.
 * O respeito a `prefers-reduced-motion` é global (MotionConfig reducedMotion).
 */

/** Container que escalona a entrada dos filhos (grids, listas). */
export const containerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

/** Item que sobe e aparece — usado em cards e itens de lista. */
export const itemRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

/** Aparição simples por opacidade — para blocos, painéis e overlays. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
}
