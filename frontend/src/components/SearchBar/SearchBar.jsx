import IconeLupa from '../IconeLupa/IconeLupa'
import './SearchBar.css'

function SearchBar() {
  return (
    <form className="search-bar" role="search" data-cy="app-search">
      <label className="search-bar__label" htmlFor="busca-geral">
        Buscar
      </label>
      <IconeLupa className="search-bar__icone" />
      <input
        id="busca-geral"
        type="search"
        placeholder="Buscar no Maréa"
        aria-label="Buscar no Maréa"
      />
    </form>
  )
}

export default SearchBar
