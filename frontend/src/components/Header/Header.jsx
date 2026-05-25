import IconeMenu from '../IconeMenu/IconeMenu'
import SearchBar from '../SearchBar/SearchBar'
import './Header.css'

/**
 * Header global. Em mobile (<768px), recebe a prop `onAbrirMenu` do AppLayout
 * para mostrar o botão de hambúrguer que abre o drawer lateral.
 */
function Header({ onAbrirMenu }) {
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
      <div className="app-header__texto">
        <span className="app-header__marca">Amare</span>
        <p>Plataforma de cuidado e acompanhamento</p>
      </div>
      <SearchBar />
    </header>
  )
}

export default Header
