import type { KeyboardEvent } from 'react'
import './Tabs.css'

export interface Aba {
  id: string
  rotulo: string
  dataCy?: string
}

interface Props {
  abas: Aba[]
  /** Id da aba ativa (componente controlado). */
  ativa: string
  onMudar: (id: string) => void
  /** Rótulo acessível da faixa de abas. */
  rotuloLista?: string
  dataCy?: string
}

/**
 * Faixa de abas acessível (tablist/tab). O painel é renderizado por quem usa —
 * este componente cuida só da seleção, do estado ARIA e da navegação por seta
 * (← → ↑ ↓, Home, End). A aba ativa recebe `id="tab-<id>"`; o consumidor deve
 * dar ao painel `id="painel-<id>"`, `role="tabpanel"` e `aria-labelledby`.
 */
function Tabs({ abas, ativa, onMudar, rotuloLista, dataCy }: Props) {
  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    const indice = abas.findIndex((a) => a.id === ativa)
    if (indice < 0) return
    let proximo: number
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
      proximo = (indice + 1) % abas.length
    } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
      proximo = (indice - 1 + abas.length) % abas.length
    } else if (evento.key === 'Home') {
      proximo = 0
    } else if (evento.key === 'End') {
      proximo = abas.length - 1
    } else {
      return
    }
    evento.preventDefault()
    onMudar(abas[proximo].id)
  }

  return (
    <div
      className="tabs"
      role="tablist"
      aria-label={rotuloLista}
      onKeyDown={aoTeclar}
      data-cy={dataCy}
    >
      {abas.map((aba) => {
        const selecionada = aba.id === ativa
        return (
          <button
            key={aba.id}
            type="button"
            role="tab"
            id={`tab-${aba.id}`}
            aria-selected={selecionada}
            aria-controls={`painel-${aba.id}`}
            tabIndex={selecionada ? 0 : -1}
            className={selecionada ? 'tabs__aba tabs__aba--ativa' : 'tabs__aba'}
            onClick={() => onMudar(aba.id)}
            data-cy={aba.dataCy}
          >
            {aba.rotulo}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
