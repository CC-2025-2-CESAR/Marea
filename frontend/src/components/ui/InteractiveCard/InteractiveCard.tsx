import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import './InteractiveCard.css'

interface Props {
  /** Destino ao clicar — o card inteiro é o link. */
  to: string
  titulo: string
  children?: ReactNode
  /** Texto do call-to-action no rodapé do card (decorativo). */
  cta?: string
  /** data-cy aplicado ao `<article>`. */
  dataCy?: string
  /** data-cy aplicado ao `<a>` interno (preserva hooks `*-card-link`). */
  linkDataCy?: string
  className?: string
}

/**
 * Card de conteúdo clicável por inteiro (porta do padrão do RELIC): o card
 * todo vira um link para o detalhe, com leve elevação no hover. Use apenas
 * quando o conteúdo NÃO tem links próprios dentro — senão eles ficariam
 * aninhados dentro do `<a>`.
 */
function InteractiveCard({
  to,
  titulo,
  children,
  cta = 'Ver detalhes',
  dataCy,
  linkDataCy,
  className,
}: Props) {
  const reduzir = useReducedMotion()
  return (
    <motion.article
      className={`interactive-card${className ? ` ${className}` : ''}`}
      data-cy={dataCy}
      whileHover={reduzir ? undefined : { y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <Link
        className="interactive-card__link"
        to={to}
        aria-label={titulo}
        data-cy={linkDataCy}
      >
        <h2 className="interactive-card__titulo">{titulo}</h2>
        {children ? (
          <div className="interactive-card__corpo">{children}</div>
        ) : null}
        <span className="interactive-card__cta" aria-hidden="true">
          {cta}
          <span className="interactive-card__seta"> →</span>
        </span>
      </Link>
    </motion.article>
  )
}

export default InteractiveCard
