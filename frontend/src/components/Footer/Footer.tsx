import { Link } from 'react-router-dom'
import './Footer.css'

/** Rodapé do app — marca, navegação rápida e aviso de protótipo acadêmico. */
function Footer() {
  return (
    <footer className="rodape" role="contentinfo" data-cy="rodape">
      <div className="rodape__conteudo">
        <div className="rodape__marca">
          <strong className="rodape__logo">amare</strong>
          <p>Acompanhamento de saúde reprodutiva e do tratamento.</p>
        </div>
        <nav className="rodape__nav" aria-label="Navegação do rodapé">
          <h2 className="rodape__titulo">Navegar</h2>
          <ul>
            <li>
              <Link to="/">Início</Link>
            </li>
            <li>
              <Link to="/perfil">Meu perfil</Link>
            </li>
            <li>
              <Link to="/calendario">Calendário</Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="rodape__aviso">
        Protótipo acadêmico. As estimativas e os conteúdos não substituem a
        orientação da equipe médica.
      </p>
    </footer>
  )
}

export default Footer
