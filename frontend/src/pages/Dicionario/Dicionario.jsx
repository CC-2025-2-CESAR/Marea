import { useEffect, useState } from 'react'
import IconeLupa from '../../components/IconeLupa/IconeLupa'
import { listarTermos } from '../../services/dicionarioService'
import './Dicionario.css'

function slugCategoria(categoria) {
  if (!categoria) {
    return 'sem-categoria'
  }
  return (
    categoria
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'sem-categoria'
  )
}

function Dicionario() {
  const [termos, setTermos] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  async function buscarTermos(termoBusca) {
    setCarregando(true)
    setErro(null)
    try {
      const dados = await listarTermos(termoBusca)
      setTermos(dados)
    } catch {
      setTermos([])
      setErro('Não foi possível carregar os termos no momento.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    let cancelado = false

    async function carregarInicial() {
      try {
        const dados = await listarTermos('')
        if (!cancelado) {
          setTermos(dados)
        }
      } catch {
        if (!cancelado) {
          setTermos([])
          setErro('Não foi possível carregar os termos no momento.')
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregarInicial()

    return () => {
      cancelado = true
    }
  }, [])

  function handleBuscar(evento) {
    evento.preventDefault()
    buscarTermos(busca)
  }

  return (
    <section className="dicionario-pagina" data-cy="page-dicionario">
      <header className="dicionario-cabecalho">
        <h1>Dicionário</h1>
        <p>
          Encontre explicações simples sobre termos médicos, exames,
          procedimentos e remédios que aparecem ao longo do tratamento.
        </p>
      </header>

      <form className="dicionario-busca" onSubmit={handleBuscar} role="search">
        <div className="dicionario-busca__campo">
          <IconeLupa className="dicionario-busca__icone" />
          <input
            className="dicionario-busca__input"
            type="search"
            name="busca"
            placeholder="Buscar termo..."
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label="Buscar termo no dicionário"
            data-cy="dicionario-busca-input"
          />
        </div>
        <button
          type="submit"
          className="dicionario-busca__submit"
          data-cy="dicionario-busca-submit"
        >
          Buscar
        </button>
      </form>

      {carregando ? (
        <p
          className="dicionario-mensagem"
          data-cy="dicionario-mensagem-carregando"
        >
          Carregando termos...
        </p>
      ) : erro ? (
        <p
          className="dicionario-mensagem dicionario-mensagem--erro"
          role="alert"
          data-cy="dicionario-mensagem-erro"
        >
          {erro}
        </p>
      ) : termos.length === 0 ? (
        <p
          className="dicionario-mensagem"
          data-cy="dicionario-mensagem-vazia"
        >
          Nenhum termo encontrado.
        </p>
      ) : (
        <ul className="dicionario-grid" data-cy="dicionario-grid">
          {termos.map((termo) => {
            const slug = slugCategoria(termo.categoria)
            const artigos = termo.artigos_relacionados || []
            return (
              <li
                key={termo.id}
                className={`dicionario-card dicionario-card--${slug}`}
                data-cy="dicionario-card"
                data-categoria={termo.categoria || ''}
              >
                <h2 className="dicionario-card__titulo">{termo.termo}</h2>
                <p className="dicionario-card__definicao">{termo.definicao}</p>
                {artigos.length > 0 ? (
                  <p
                    className="dicionario-card__artigos"
                    data-cy="dicionario-card-artigos"
                  >
                    Artigos relacionados:{' '}
                    {artigos.map((artigo, indice) => (
                      <span key={`${termo.id}-${artigo.titulo}`}>
                        <a
                          className="dicionario-card__artigo"
                          href={artigo.url || '#'}
                        >
                          {artigo.titulo}
                        </a>
                        {indice < artigos.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                ) : null}
                {termo.categoria ? (
                  <span
                    className={`dicionario-card__tag dicionario-card__tag--${slug}`}
                    data-cy="dicionario-card-tag"
                  >
                    {termo.categoria}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default Dicionario
