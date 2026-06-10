import './Skeleton.css'

interface Props {
  /** Quantas linhas de esqueleto mostrar. */
  linhas?: number
  /** Rótulo lido por leitores de tela enquanto carrega. */
  rotulo?: string
}

/** Placeholder de carregamento com `aria-busy` — para telas que dependem de API. */
function Skeleton({ linhas = 3, rotulo = 'Carregando…' }: Props) {
  return (
    <div
      className="skeleton"
      aria-busy="true"
      aria-live="polite"
      data-cy="skeleton"
    >
      <span className="sr-only">{rotulo}</span>
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          className={
            i === linhas - 1
              ? 'skeleton__linha skeleton__linha--curta'
              : 'skeleton__linha'
          }
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default Skeleton
