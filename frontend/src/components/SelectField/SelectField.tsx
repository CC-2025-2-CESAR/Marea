import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import IconeChevron from '../IconeChevron/IconeChevron'
import type { OpcaoSelect } from '../../types'
import './SelectField.css'

/**
 * Select customizado, acessível e animado.
 *
 * Existe porque o <select> nativo abre o dropdown do sistema operacional
 * e não permite animar nem estilizar a abertura. Para campos onde a
 * sensação de fluidez importa, este componente entrega abertura suave com
 * Motion, navegação por teclado e ARIA combobox/listbox/option.
 *
 * É genérico em `T extends string`: o valor e as opções compartilham o mesmo
 * tipo (ex.: `EtapaCiclo`), então o `onChange` devolve exatamente esse tipo
 * — sem `as` no consumidor.
 *
 * Props:
 * - id (obrigatório): id base, usado também para a label e o aria-controls.
 * - label (opcional): rótulo visível acima do campo.
 * - value: valor atualmente selecionado.
 * - onChange(novoValor): chamado quando a paciente escolhe uma opção.
 * - opcoes: array de { valor, rotulo }.
 * - dataCy: vai no <button> raiz; cada opção recebe `${dataCy}-opcao-${valor}`.
 * - placeholder (opcional): texto quando value não bate com nenhuma opção.
 * - disabled (opcional).
 *
 * Teclado: ↑/↓ movem o destaque (abrem se fechado); Enter/Espaço abrem ou
 * confirmam; Esc fecha e devolve o foco; Tab fecha e segue o fluxo. O
 * click-outside é tratado por um listener global de mousedown.
 */
interface SelectFieldProps<T extends string> {
  id: string
  label?: string
  value: T
  onChange?: (valor: T) => void
  opcoes: OpcaoSelect<T>[]
  dataCy?: string
  placeholder?: string
  disabled?: boolean
}

function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  opcoes,
  dataCy,
  placeholder = 'Selecione',
  disabled = false,
}: SelectFieldProps<T>) {
  const [aberto, setAberto] = useState(false)
  const [destacado, setDestacado] = useState(() => {
    const indice = opcoes.findIndex((o) => o.valor === value)
    return indice >= 0 ? indice : 0
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const idGerado = useId()
  const movimentoReduzido = useReducedMotion()

  const idListbox = `${id || idGerado}-listbox`
  const opcaoSelecionada = opcoes.find((o) => o.valor === value)

  // O destacado é recalculado a partir do value sempre que a lista
  // abre (via abrir()) — não precisamos sincronizar em useEffect.

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return undefined
    function aoMousedown(evento: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(evento.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', aoMousedown)
    return () => document.removeEventListener('mousedown', aoMousedown)
  }, [aberto])

  function abrir() {
    if (disabled) return
    const indice = opcoes.findIndex((o) => o.valor === value)
    setDestacado(indice >= 0 ? indice : 0)
    setAberto(true)
  }

  function fechar({ devolverFoco = true }: { devolverFoco?: boolean } = {}) {
    setAberto(false)
    if (devolverFoco && botaoRef.current) {
      botaoRef.current.focus()
    }
  }

  function selecionar(novoValor: T) {
    onChange?.(novoValor)
    fechar()
  }

  function aoClicarBotao() {
    if (aberto) {
      fechar({ devolverFoco: false })
    } else {
      abrir()
    }
  }

  function aoTeclarBotao(evento: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (!aberto) {
        abrir()
        return
      }
      setDestacado((atual) => {
        const passo = evento.key === 'ArrowDown' ? 1 : -1
        const proximo = (atual + passo + opcoes.length) % opcoes.length
        return proximo
      })
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      if (!aberto) {
        abrir()
      } else {
        const op = opcoes[destacado]
        if (op) selecionar(op.valor)
      }
    } else if (evento.key === 'Escape' && aberto) {
      evento.preventDefault()
      fechar()
    } else if (evento.key === 'Tab' && aberto) {
      // deixa o Tab continuar o fluxo, só fecha a lista
      setAberto(false)
    }
  }

  const idOpcaoDestaque = `${id || idGerado}-opcao-${destacado}`

  return (
    <div className="select-field" ref={containerRef}>
      {label ? (
        <label className="select-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}

      <button
        ref={botaoRef}
        id={id}
        type="button"
        className={`select-field__botao${aberto ? ' select-field__botao--aberto' : ''}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={idListbox}
        aria-activedescendant={aberto ? idOpcaoDestaque : undefined}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={aoClicarBotao}
        onKeyDown={aoTeclarBotao}
        data-cy={dataCy}
      >
        <span className="select-field__valor">
          {opcaoSelecionada ? opcaoSelecionada.rotulo : placeholder}
        </span>
        <IconeChevron tamanho={18} className="select-field__chevron" />
      </button>

      <AnimatePresence>
        {aberto ? (
          <motion.ul
            id={idListbox}
            role="listbox"
            className="select-field__lista"
            aria-labelledby={label ? id : undefined}
            initial={
              movimentoReduzido
                ? { opacity: 1 }
                : { opacity: 0, y: -4, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              movimentoReduzido
                ? { opacity: 0 }
                : { opacity: 0, y: -4, scale: 0.98 }
            }
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {opcoes.map((op, indice) => {
              const selecionada = op.valor === value
              const destacada = indice === destacado
              return (
                <li
                  key={op.valor}
                  id={`${id || idGerado}-opcao-${indice}`}
                  role="option"
                  aria-selected={selecionada}
                  className={[
                    'select-field__opcao',
                    selecionada ? 'select-field__opcao--selecionada' : '',
                    destacada ? 'select-field__opcao--destacada' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setDestacado(indice)}
                  onClick={() => selecionar(op.valor)}
                  data-cy={dataCy ? `${dataCy}-opcao-${op.valor}` : undefined}
                >
                  {op.rotulo}
                </li>
              )
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default SelectField
