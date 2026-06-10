import type { ReactNode } from 'react'
import './StatusBadge.css'

type TomBadge = 'neutro' | 'info' | 'sucesso' | 'aviso' | 'perigo'

interface Props {
  children: ReactNode
  /** Cor semântica do selo. Padrão: neutro. */
  tom?: TomBadge
  dataCy?: string
}

/** Selo de status compacto (pílula) com um ponto colorido conforme o tom. */
function StatusBadge({ children, tom = 'neutro', dataCy }: Props) {
  return (
    <span className={`status-badge status-badge--${tom}`} data-cy={dataCy}>
      {children}
    </span>
  )
}

export default StatusBadge
