import { NavLink, useNavigate } from 'react-router-dom'
import logoAmare from '../../assets/amare-logo.png'
import IconeLogout from '../IconeLogout/IconeLogout'
import { useAuth } from '../../contexts/useAuth'
import './Sidebar.css'

const links = [
  { to: '/', label: 'Início', dataCy: 'nav-home' },
  { to: '/perfil', label: 'Perfil', dataCy: 'nav-perfil' },
  { to: '/calendario', label: 'Calendário', dataCy: 'nav-calendario' },
  { to: '/ciclo', label: 'Ciclo', dataCy: 'nav-ciclo' },
  { to: '/dicionario', label: 'Dicionário', dataCy: 'nav-dicionario' },
  { to: '/bot', label: 'Bot', dataCy: 'nav-bot' },
  { to: '/tratamentos', label: 'Tratamentos', dataCy: 'nav-tratamentos' },
  {
    to: '/especialidades',
    label: 'Especialidades',
    dataCy: 'nav-especialidades',
  },
]

function Sidebar() {
  const { logout } = useAuth()
  const navegar = useNavigate()

  function handleLogout() {
    logout()
    navegar('/login', { replace: true })
  }

  return (
    <aside
      className="sidebar"
      data-cy="app-sidebar"
      aria-label="Navegação principal"
    >
      <div className="sidebar__topo">
        <img src={logoAmare} alt="Amare" className="sidebar__logo" />
      </div>
      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            data-cy={link.dataCy}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--ativo' : 'sidebar__link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__rodape">
        <button
          type="button"
          className="sidebar__logout"
          onClick={handleLogout}
          data-cy="nav-logout"
          aria-label="Sair da conta"
        >
          <IconeLogout tamanho={22} className="sidebar__logout-icone" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
