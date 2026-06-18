import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../../contexts/useAuth'
import { iniciais as calcularIniciais } from '../../utils/iniciais'
import type { TipoUsuario } from '../../types'
import './HeaderProfileMenu.css'

interface ItemMenu {
  rotulo: string
  rota: string
  dataCy: string
}

interface GrupoMenu {
  titulo: string
  itens: ItemMenu[]
}

/**
 * Menu da conta no cabecalho — reune atalhos relacionados ao perfil e as acoes
 * de conta, por papel. Para a paciente, traz o acompanhamento (ciclo,
 * medicamentos, linha do tempo, sintomas) + conta (perfil, meus dados,
 * privacidade). Medica/admin veem so o atalho da sua area. "Sair" entra para
 * todas. Nada disso REMOVE a navegacao da Sidebar — e um atalho a mais.
 */
function gruposDoPapel(tipo: TipoUsuario | null): GrupoMenu[] {
  if (tipo === 'medica') {
    return [
      {
        titulo: 'Conta',
        itens: [
          {
            rotulo: 'Pacientes',
            rota: '/area-medica',
            dataCy: 'header-perfil-pacientes',
          },
        ],
      },
    ]
  }
  if (tipo === 'admin') {
    return [
      {
        titulo: 'Conta',
        itens: [
          { rotulo: 'Painel', rota: '/gestao', dataCy: 'header-perfil-painel' },
        ],
      },
    ]
  }
  return [
    {
      titulo: 'Acompanhamento',
      itens: [
        { rotulo: 'Ciclo', rota: '/ciclo', dataCy: 'header-perfil-ciclo' },
        {
          rotulo: 'Medicamentos',
          rota: '/medicamentos',
          dataCy: 'header-perfil-medicamentos',
        },
        {
          rotulo: 'Linha do tempo',
          rota: '/linha-do-tempo',
          dataCy: 'header-perfil-linha-do-tempo',
        },
        {
          rotulo: 'Sintomas',
          rota: '/sintomas',
          dataCy: 'header-perfil-sintomas',
        },
      ],
    },
    {
      titulo: 'Conta',
      itens: [
        { rotulo: 'Meu perfil', rota: '/perfil', dataCy: 'header-perfil-perfil' },
        {
          rotulo: 'Meus dados',
          rota: '/meus-dados',
          dataCy: 'header-perfil-meus-dados',
        },
        {
          rotulo: 'Privacidade',
          rota: '/privacidade',
          dataCy: 'header-perfil-privacidade',
        },
      ],
    },
  ]
}

function HeaderProfileMenu() {
  const { usuario, tipoUsuario, logout } = useAuth()
  const navegar = useNavigate()
  const reduzir = useReducedMotion()
  const [aberto, setAberto] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const fecharTimer = useRef<number | undefined>(undefined)

  const iniciais = calcularIniciais(usuario?.nome_completo, usuario?.username)
  const nome = usuario?.nome_completo || usuario?.username || 'usuária'
  const grupos = gruposDoPapel(tipoUsuario)

  // Fecha ao clicar fora do menu. Como o listener pega qualquer clique fora do
  // wrapper (inclusive em links da Sidebar), ele tambem cobre a troca de rota
  // disparada por fora do menu — sem precisar observar a navegacao.
  useEffect(() => {
    if (!aberto) return undefined
    function aoClicarFora(evento: MouseEvent) {
      if (!wrapperRef.current?.contains(evento.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  useEffect(() => () => window.clearTimeout(fecharTimer.current), [])

  function focarPrimeiroItem() {
    window.requestAnimationFrame(() => {
      painelRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus()
    })
  }

  function handleSair() {
    setAberto(false)
    logout()
    navegar('/login', { replace: true })
  }

  function aoTeclarGatilho(evento: KeyboardEvent<HTMLButtonElement>) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setAberto(true)
      focarPrimeiroItem()
    } else if (evento.key === 'Escape') {
      setAberto(false)
    }
  }

  function aoTeclarPainel(evento: KeyboardEvent<HTMLDivElement>) {
    const itens = Array.from(
      painelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
        [],
    )
    if (itens.length === 0) return
    const atual = itens.indexOf(document.activeElement as HTMLElement)

    if (evento.key === 'Escape') {
      evento.preventDefault()
      setAberto(false)
      gatilhoRef.current?.focus()
    } else if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      itens[(atual + 1) % itens.length].focus()
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      itens[(atual - 1 + itens.length) % itens.length].focus()
    } else if (evento.key === 'Home') {
      evento.preventDefault()
      itens[0].focus()
    } else if (evento.key === 'End') {
      evento.preventDefault()
      itens[itens.length - 1].focus()
    }
  }

  return (
    <div
      className="header-perfil"
      ref={wrapperRef}
      data-cy="header-perfil"
      onMouseEnter={() => {
        window.clearTimeout(fecharTimer.current)
        setAberto(true)
      }}
      onMouseLeave={() => {
        fecharTimer.current = window.setTimeout(() => setAberto(false), 140)
      }}
    >
      <button
        type="button"
        ref={gatilhoRef}
        className="header-perfil__gatilho"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls="header-perfil-painel"
        aria-label={`Conta de ${nome}`}
        onClick={() => setAberto(true)}
        onKeyDown={aoTeclarGatilho}
        data-cy="header-perfil-gatilho"
      >
        <span className="header-perfil__iniciais" aria-hidden="true">
          {iniciais}
        </span>
      </button>

      <AnimatePresence>
        {aberto ? (
          <motion.div
            id="header-perfil-painel"
            ref={painelRef}
            className="header-perfil__painel"
            role="menu"
            aria-label="Menu da conta"
            data-cy="header-perfil-painel"
            onKeyDown={aoTeclarPainel}
            initial={reduzir ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={reduzir ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <p className="header-perfil__nome" data-cy="header-perfil-nome">
              {nome}
            </p>
            {grupos.map((grupo) => (
              <div className="header-perfil__grupo" key={grupo.titulo}>
                <p className="header-perfil__grupo-titulo">{grupo.titulo}</p>
                {grupo.itens.map((item) => (
                  <Link
                    key={item.rota}
                    to={item.rota}
                    role="menuitem"
                    className="header-perfil__item"
                    data-cy={item.dataCy}
                    onClick={() => setAberto(false)}
                  >
                    {item.rotulo}
                  </Link>
                ))}
              </div>
            ))}
            <div className="header-perfil__grupo">
              <button
                type="button"
                role="menuitem"
                className="header-perfil__item header-perfil__item--sair"
                onClick={handleSair}
                data-cy="header-perfil-sair"
              >
                Sair
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default HeaderProfileMenu
