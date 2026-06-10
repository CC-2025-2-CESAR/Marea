import type { ReactNode } from 'react'
import './EmptyState.css'

interface Props {
  titulo: string
  descricao: string
  /** Ícone ou emoji opcional exibido no topo. */
  icone?: ReactNode
  /** Ação opcional (ex.: um botão/link) exibida abaixo do texto. */
  acao?: ReactNode
}

/** Estado vazio padronizado — quando uma lista ou seção não tem conteúdo. */
function EmptyState({ titulo, descricao, icone, acao }: Props) {
  return (
    <div className="empty-state" data-cy="empty-state">
      {icone ? (
        <span className="empty-state__icone" aria-hidden="true">
          {icone}
        </span>
      ) : null}
      <h3 className="empty-state__titulo">{titulo}</h3>
      <p className="empty-state__descricao">{descricao}</p>
      {acao ? <div className="empty-state__acao">{acao}</div> : null}
    </div>
  )
}

export default EmptyState
