import { NavLink, useNavigate } from 'react-router-dom'
import logoAmare from '../../assets/amare-logo.png'
import IconeFechar from '../IconeFechar/IconeFechar'
import IconeLogout from '../IconeLogout/IconeLogout'
import { useAuth } from '../../contexts/useAuth'
import './Sidebar.css'

// Navegação da paciente (qualquer usuária autenticada que não seja médica).
const linksPaciente = [
  { to: '/', label: 'Início', dataCy: 'nav-home' },
  { to: '/perfil', label: 'Perfil', dataCy: 'nav-perfil' },
  { to: '/meus-dados', label: 'Meus dados', dataCy: 'nav-meus-dados' },
  { to: '/calendario', label: 'Calendário', dataCy: 'nav-calendario' },
  { to: '/medicamentos', label: 'Medicamentos', dataCy: 'nav-medicamentos' },
  { to: '/ciclo', label: 'Ciclo', dataCy: 'nav-ciclo' },
  { to: '/dicionario', label: 'Dicionário', dataCy: 'nav-dicionario' },
  { to: '/bot', label: 'Bot', dataCy: 'nav-bot' },
  { to: '/tratamentos', label: 'Tratamentos', dataCy: 'nav-tratamentos' },
  { to: '/orientacoes', label: 'Orientações', dataCy: 'nav-orientacoes' },
  {
    to: '/especialidades',
    label: 'Especialidades',
    dataCy: 'nav-especialidades',
  },
  {
    to: '/linha-do-tempo',
    label: 'Linha do tempo',
    dataCy: 'nav-linha-do-tempo',
  },
  { to: '/apoio', label: 'Apoio emocional', dataCy: 'nav-apoio' },
  { to: '/sintomas', label: 'Sintomas', dataCy: 'nav-sintomas' },
]

// Navegação da médica: o acompanhamento das pacientes + o conteúdo
// institucional da clínica (compartilhado com a paciente).
const linksMedica = [
  { to: '/area-medica', label: 'Pacientes', dataCy: 'nav-pacientes' },
  { to: '/dicionario', label: 'Dicionário', dataCy: 'nav-dicionario' },
  { to: '/tratamentos', label: 'Tratamentos', dataCy: 'nav-tratamentos' },
  { to: '/orientacoes', label: 'Orientações', dataCy: 'nav-orientacoes' },
  {
    to: '/especialidades',
    label: 'Especialidades',
    dataCy: 'nav-especialidades',
  },
  { to: '/apoio', label: 'Apoio emocional', dataCy: 'nav-apoio' },
  { to: '/bot', label: 'Bot', dataCy: 'nav-bot' },
]

// Navegação da administração (painel /gestao).
const linksAdmin = [
  { to: '/gestao', label: 'Visão geral', dataCy: 'nav-gestao', end: true },
  {
    to: '/gestao/dicionario',
    label: 'Dicionário',
    dataCy: 'nav-gestao-dicionario',
  },
  { to: '/gestao/logs', label: 'Logs de auditoria', dataCy: 'nav-gestao-logs' },
]

function navDoPapel(tipoUsuario) {
  if (tipoUsuario === 'medica') return linksMedica
  if (tipoUsuario === 'admin') return linksAdmin
  return linksPaciente
}

/**
 * Sidebar usada em duas situações:
 *   - sem props: barra lateral fixa do desktop (comportamento atual).
 *   - com `modoDrawer`: dentro do drawer mobile, com botão de fechar no topo
 *     e fechamento automático ao tocar num link.
 *
 * A navegação muda por papel: a médica vê a área dela; as demais usuárias veem
 * a navegação da paciente.
 */
function Sidebar({ modoDrawer = false, onFechar }) {
  const { logout, tipoUsuario } = useAuth()
  const navegar = useNavigate()

  const links = navDoPapel(tipoUsuario)

  function handleLogout() {
    if (onFechar) onFechar()
    logout()
    navegar('/login', { replace: true })
  }

  function handleClicarLink() {
    if (onFechar) onFechar()
  }

  const classeRaiz = modoDrawer ? 'sidebar sidebar--drawer' : 'sidebar'

  return (
    <aside
      className={classeRaiz}
      data-cy="app-sidebar"
      aria-label="Navegação principal"
    >
      {modoDrawer && onFechar ? (
        <button
          type="button"
          className="sidebar__fechar"
          onClick={onFechar}
          aria-label="Fechar menu"
          data-cy="nav-fechar-drawer"
        >
          <IconeFechar tamanho={22} />
        </button>
      ) : null}
      <div className="sidebar__topo">
        <img src={logoAmare} alt="Amare" className="sidebar__logo" />
      </div>
      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end ?? link.to === '/'}
            data-cy={link.dataCy}
            onClick={handleClicarLink}
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
