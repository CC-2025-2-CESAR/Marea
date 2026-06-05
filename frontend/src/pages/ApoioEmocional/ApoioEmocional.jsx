import { useEffect, useState } from 'react'
import { listarConteudosApoio } from '../../services/apoioService'
import './ApoioEmocional.css'

function ApoioEmocional() {
  const [conteudos, setConteudos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

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
        <ul className="apoio-grid" data-cy="apoio-grid">
          {conteudos.map((conteudo) => (
            <li key={conteudo.id} className="apoio-card" data-cy="apoio-card">
              <h2 className="apoio-card__titulo">{conteudo.titulo}</h2>
              <p className="apoio-card__texto">{conteudo.texto}</p>
              {conteudo.categoria ? (
                <span className="apoio-card__tag" data-cy="apoio-card-tag">
                  {conteudo.categoria}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ApoioEmocional
