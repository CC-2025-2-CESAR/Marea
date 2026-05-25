import SearchBar from '../SearchBar/SearchBar'
import './Header.css'

function Header() {
  return (
    <header className="app-header" data-cy="app-header">
      <div className="app-header__texto">
        <span className="app-header__marca">Amare</span>
        <p>Plataforma de cuidado e acompanhamento</p>
      </div>
      <SearchBar />
    </header>
  )
}

export default Header
