import { Link } from 'react-router-dom'
import type { TermoDicionario } from '../../types'
import './TermosRelacionados.css'

/**
 * Chips com os termos do dicionário ligados a um conteúdo (tratamento ou
 * orientação). Cada chip leva ao Dicionário já filtrado pelo termo, criando a
 * ligação entre o conteúdo da paciente e a explicação simples do termo.
 */
function TermosRelacionados({ termos }: { termos?: TermoDicionario[] }) {
  const lista = termos || []
  if (lista.length === 0) {
    return null
  }

  return (
    <div className="termos-relacionados" data-cy="termos-relacionados">
      <span className="termos-relacionados__rotulo">No dicionário:</span>
      <ul className="termos-relacionados__lista">
        {lista.map((termo) => (
          <li key={termo.id} className="termos-relacionados__item">
            <Link
              className="termos-relacionados__chip"
              to={`/dicionario?busca=${encodeURIComponent(termo.termo)}`}
              data-cy="termo-relacionado-chip"
              data-termo={termo.termo}
            >
              {termo.termo}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TermosRelacionados
