import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IconeLupa from '../IconeLupa/IconeLupa'
import './SearchBar.css'

/**
 * Busca global do cabeçalho (PROJ-25). Ao enviar (Enter ou clique na lupa),
 * navega para a página de resultados `/busca?q=<termo>`, que consulta o
 * endpoint unificado. Buscas vazias são ignoradas.
 */
function SearchBar() {
  const navegar = useNavigate()
  const [termo, setTermo] = useState('')

  function handleSubmit(evento) {
    evento.preventDefault()
    const q = termo.trim()
    if (!q) {
      return
    }
    navegar(`/busca?q=${encodeURIComponent(q)}`)
  }

  return (
    <form
      className="search-bar"
      role="search"
      data-cy="app-search"
      onSubmit={handleSubmit}
    >
      <label className="search-bar__label" htmlFor="busca-geral">
        Buscar
      </label>
      <button
        type="submit"
        className="search-bar__botao"
        aria-label="Buscar na Amare"
        data-cy="app-search-enviar"
      >
        <IconeLupa className="search-bar__icone" />
      </button>
      <input
        id="busca-geral"
        type="search"
        placeholder="Buscar na Amare"
        aria-label="Buscar na Amare"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        data-cy="app-search-input"
      />
    </form>
  )
}

export default SearchBar
