import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Header from '../../components/Header/Header'
import Sidebar from '../../components/Sidebar/Sidebar'
import './AppLayout.css'

/**
 * Layout principal das telas internas. Em desktop, mostra a sidebar lateral
 * fixa. Em mobile (<768px), a sidebar fica escondida e aparece como drawer
 * lateral animado quando a paciente toca no hambúrguer do header.
 *
 * O fechamento do drawer ao navegar é tratado pelo onClick dos links da
 * Sidebar (`onFechar` por prop). Aqui escutamos popstate para cobrir o
 * botão Voltar do navegador e Esc enquanto o drawer está aberto.
 */
function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false)

  // Fecha o drawer quando a paciente usa o botão voltar do navegador.
  useEffect(() => {
    function aoVoltar() {
      setMenuAberto(false)
    }
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])

  // Trava o scroll do body e escuta Esc enquanto o drawer está aberto.
  useEffect(() => {
    if (!menuAberto) return undefined
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function aoApertarTecla(evento) {
      if (evento.key === 'Escape') {
        setMenuAberto(false)
      }
    }
    window.addEventListener('keydown', aoApertarTecla)
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', aoApertarTecla)
    }
  }, [menuAberto])

  function fecharMenu() {
    setMenuAberto(false)
  }

  return (
    <div className="app-layout" data-cy="app-layout">
      <div className="app-layout__sidebar-desktop">
        <Sidebar />
      </div>

      <AnimatePresence>
        {menuAberto ? (
          <>
            <motion.div
              key="backdrop"
              className="app-layout__backdrop"
              data-cy="app-layout-backdrop"
              onClick={fecharMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              key="drawer"
              id="app-sidebar-drawer"
              className="app-layout__drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              data-cy="app-layout-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Sidebar modoDrawer onFechar={fecharMenu} />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="app-layout__conteudo">
        <Header onAbrirMenu={() => setMenuAberto(true)} />
        <main className="app-layout__principal">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
