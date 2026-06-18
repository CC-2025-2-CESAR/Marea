import { useEffect, useState } from 'react'
import InteractiveCard from '../../components/ui/InteractiveCard/InteractiveCard'
import { listarConteudosApoio } from '../../services/apoioService'
import type { ConteudoApoio } from '../../types'
import './ApoioEmocional.css'

/**
 * Apoio emocional (`/apoio`). Cada card é um resumo clicável por inteiro que
 * leva ao texto completo (`/apoio/:id`). O aviso de que o conteúdo não
 * substitui acompanhamento profissional fica sempre visível.
 */
function ApoioEmocional() {
  const [conteudos, setConteudos] = useState<ConteudoApoio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarConteudosApoio()
        if (!cancelado) {
          setConteudos(dados)
        }
      } catch {
        if (!cancelado) {
          setConteudos([])
          setErro('Não foi possível carregar os conteúdos no momento.')
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [])

  return (
    <section className="apoio-pagina" data-cy="page-apoio">
      <header className="apoio-cabecalho">
        <h1>Apoio emocional</h1>
        <p>
          Mensagens e orientações para te acolher nos diferentes momentos do
          tratamento.
        </p>
      </header>

      <p className="apoio-aviso" role="note" data-cy="apoio-aviso">
        Este conteúdo é informativo e <strong>não substitui o acompanhamento
        profissional</strong>. Se precisar, fale com a sua equipe ou com um
        profissional de saúde mental.
      </p>

      {carregando ? (
        <p className="apoio-mensagem" data-cy="apoio-mensagem-carregando">
          Carregando conteúdos...
        </p>
      ) : erro ? (
        <p
          className="apoio-mensagem apoio-mensagem--erro"
          role="alert"
          data-cy="apoio-mensagem-erro"
        >
          {erro}
        </p>
      ) : conteudos.length === 0 ? (
        <p className="apoio-mensagem" data-cy="apoio-mensagem-vazia">
          Nenhum conteúdo de apoio cadastrado no momento.
        </p>
      ) : (
        <div className="apoio-grid" data-cy="apoio-grid">
          {conteudos.map((conteudo) => (
            <InteractiveCard
              key={conteudo.id}
              to={`/apoio/${conteudo.id}`}
              titulo={conteudo.titulo}
              cta="Ler conteúdo"
              dataCy="apoio-card"
              linkDataCy="apoio-card-link"
            >
              {conteudo.texto ? (
                <p className="apoio-card__texto">{conteudo.texto}</p>
              ) : null}
              {conteudo.categoria ? (
                <span className="apoio-card__tag" data-cy="apoio-card-tag">
                  {conteudo.categoria}
                </span>
              ) : null}
            </InteractiveCard>
          ))}
        </div>
      )}
    </section>
  )
}

export default ApoioEmocional
