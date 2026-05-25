import { Link } from 'react-router-dom'
import './Home.css'

const cards = [
  {
    titulo: 'Calendário',
    texto: 'Organização de consultas, exames e próximos passos.',
    caminho: '/calendario',
  },
  {
    titulo: 'Ciclo',
    texto: 'Acompanhamento visual das etapas importantes do tratamento.',
    caminho: '/ciclo',
  },
  {
    titulo: 'Dicionário',
    texto: 'Termos e explicações para apoiar a compreensão da jornada.',
    caminho: '/dicionario',
  },
  {
    titulo: 'Bot',
    texto: 'Apoio digital para dúvidas e orientações em uma próxima etapa.',
    caminho: '/bot',
  },
]

function Home() {
  return (
    <section className="home" data-cy="home-page">
      <div className="home__intro">
        <h1>Bem-vinda à Amare</h1>
        <p>
          A plataforma reunirá recursos para acompanhamento, organização e
          compreensão das informações relacionadas aos tratamentos.
        </p>
      </div>

      <div className="home__cards" aria-label="Recursos em preparação">
        {cards.map((card) => (
          <Link className="home-card" to={card.caminho} key={card.caminho}>
            <span>{card.titulo}</span>
            <p>{card.texto}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Home
