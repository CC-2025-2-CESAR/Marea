import { useEffect, useState } from 'react'
import { listarTermos } from '../../services/dicionarioService'
import './Dicionario.css'

function Dicionario() {
  const [termos, setTermos] = useState([])
  const [termoSelecionado, setTermoSelecionado] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  async function buscarTermos(termoBusca) {
    setCarregando(true)
    setErro(null)
    try {
      const dados = await listarTermos(termoBusca)
      setTermos(dados)
      setTermoSelecionado((atual) => {
        if (!atual) {
          return null
        }
        return dados.find((termo) => termo.id === atual.id) || null
      })
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

  function handleSelecionar(termo) {
    setTermoSelecionado(termo)
  }

  return (
    <section className="dicionario-pagina" data-cy="page-dicionario">
      <header className="dicionario-cabecalho">
        <h1>Dicionário</h1>
        <p>
          Encontre explicações simples de termos médicos usados ao longo do
          tratamento.
        </p>
      </header>

      <form className="dicionario-busca" onSubmit={handleBuscar} role="search">
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
        <button
          type="submit"
          className="dicionario-busca__submit"
          data-cy="dicionario-busca-submit"
        >
          Buscar
        </button>
      </form>

      <div className="dicionario-conteudo">
        <aside
          className="dicionario-lista"
          aria-label="Termos do dicionário"
          data-cy="dicionario-lista"
        >
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
            <ul className="dicionario-lista__itens">
              {termos.map((termo) => {
                const ativo = termoSelecionado?.id === termo.id
                return (
                  <li key={termo.id}>
                    <button
                      type="button"
                      className={
                        ativo
                          ? 'dicionario-card dicionario-card--ativo'
                          : 'dicionario-card'
                      }
                      onClick={() => handleSelecionar(termo)}
                      data-cy="dicionario-card"
                    >
                      <span className="dicionario-card__termo">
                        {termo.termo}
                      </span>
                      {termo.categoria ? (
                        <span className="dicionario-card__categoria">
                          {termo.categoria}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        <article
          className="dicionario-detalhes"
          data-cy="dicionario-detalhes"
        >
          {termoSelecionado ? (
            <>
              <h2 className="dicionario-detalhes__titulo">
                {termoSelecionado.termo}
              </h2>
              {termoSelecionado.categoria ? (
                <span className="dicionario-detalhes__categoria">
                  {termoSelecionado.categoria}
                </span>
              ) : null}
              <p className="dicionario-detalhes__definicao">
                {termoSelecionado.definicao}
              </p>
              {termoSelecionado.exemplo ? (
                <div className="dicionario-detalhes__exemplo">
                  <h3>Exemplo</h3>
                  <p>{termoSelecionado.exemplo}</p>
                </div>
              ) : null}
            </>
          ) : (
            <p
              className="dicionario-mensagem dicionario-mensagem--placeholder"
              data-cy="dicionario-mensagem-selecione"
            >
              Selecione um termo para ver os detalhes.
            </p>
          )}
        </article>
      </div>
    </section>
  )
}

export default Dicionario
