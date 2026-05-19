import { NavLink } from 'react-router-dom'
import logoMarea from '../../assets/marea-logo.png'
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
  return (
    <aside
      className="sidebar"
      data-cy="app-sidebar"
      aria-label="Navegação principal"
    >
      <div className="sidebar__topo">
        <img src={logoMarea} alt="Maréa" className="sidebar__logo" />
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
    </aside>
  )
}

export default Sidebar
