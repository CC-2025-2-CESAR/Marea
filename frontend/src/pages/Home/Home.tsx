import { Link } from 'react-router-dom'
import BannerProximaConsulta from '../../components/BannerProximaConsulta/BannerProximaConsulta'
import { useAuth } from '../../contexts/useAuth'
import { primeiroNome } from '../../utils/iniciais'
import './Home.css'

interface CardHome {
  titulo: string
  texto: string
  caminho: string
}

const cards: CardHome[] = [
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
  const { usuario } = useAuth()
  const nome = primeiroNome(usuario?.nome_completo)
  const saudacao = nome ? `Bem-vinda, ${nome}` : 'Bem-vinda à Amare'

  return (
    <section className="home" data-cy="home-page">
      <div className="home__intro">
        <h1 data-cy="home-saudacao">{saudacao}</h1>
        <p>
          A plataforma reunirá recursos para acompanhamento, organização e
          compreensão das informações relacionadas aos tratamentos.
        </p>
      </div>

      <BannerProximaConsulta />

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
