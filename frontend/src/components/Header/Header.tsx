import { Link } from 'react-router-dom'
import logoAmare from '../../assets/amare-logo.png'
import IconeMenu from '../IconeMenu/IconeMenu'
import SearchBar from '../SearchBar/SearchBar'
import HeaderProfileMenu from '../HeaderProfileMenu/HeaderProfileMenu'
import './Header.css'

interface HeaderProps {
  onAbrirMenu?: () => void
}

/**
 * Header global. Em mobile (<768px), recebe a prop `onAbrirMenu` do AppLayout
 * para mostrar o botão de hambúrguer que abre o drawer lateral. Nesse tamanho o
 * texto institucional dá lugar ao logo clicável (volta ao início), evitando a
 * sobreposição com a busca.
 */
function Header({ onAbrirMenu }: HeaderProps) {
  return (
    <header className="app-header" data-cy="app-header">
      {onAbrirMenu ? (
        <button
          type="button"
          className="app-header__menu"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
          aria-controls="app-sidebar-drawer"
          data-cy="nav-abrir-drawer"
        >
          <IconeMenu tamanho={24} />
        </button>
      ) : null}
      <Link
        to="/"
        className="app-header__logo-link"
        aria-label="Ir para o início"
        data-cy="header-logo"
      >
        <img src={logoAmare} alt="Amare" className="app-header__logo" />
      </Link>
      <div className="app-header__texto">
        <span className="app-header__marca">Amare</span>
        <p>Plataforma de cuidado e acompanhamento</p>
      </div>
      <SearchBar />
      <HeaderProfileMenu />
    </header>
  )
}

export default Header
