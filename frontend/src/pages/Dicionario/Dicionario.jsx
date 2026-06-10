import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

const FILTRO_TODOS = '__todos__'

function Dicionario() {
  const [searchParams, setSearchParams] = useSearchParams()
  // O termo da busca vive na URL (?busca=...). Assim o Dicionário pode ser
  // aberto já filtrado a partir dos chips de "termos relacionados" das telas
  // de Tratamentos e Orientações (deep-link).
  const buscaParam = searchParams.get('busca') || ''

  const [termos, setTermos] = useState([])
  const [busca, setBusca] = useState(buscaParam)
  const [buscaParamAnterior, setBuscaParamAnterior] = useState(buscaParam)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState(FILTRO_TODOS)

  // Sincroniza o input com a URL quando o ?busca= muda por fora (deep-link),
  // ajustando o estado durante a renderização — o padrão recomendado pelo
  // React para derivar estado de uma prop, sem efeito nem render extra.
  if (buscaParam !== buscaParamAnterior) {
    setBuscaParamAnterior(buscaParam)
    setBusca(buscaParam)
  }

  // Recarrega sempre que o ?busca= muda: na carga inicial e quando um
  // deep-link troca o termo.
  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setCarregando(true)
      setErro(null)
      try {
        const dados = await listarTermos(buscaParam)
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

    carregar()

    return () => {
      cancelado = true
    }
  }, [buscaParam])

  function handleBuscar(evento) {
    evento.preventDefault()
    const termo = busca.trim()
    // Atualiza a URL; o efeito acima dispara a busca de fato.
    setSearchParams(termo ? { busca: termo } : {})
  }

  // Categorias presentes nos termos carregados, em ordem alfabética.
  const categoriasDisponiveis = Array.from(
    new Set(termos.map((t) => t.categoria).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const termosVisiveis =
    categoriaSelecionada === FILTRO_TODOS
      ? termos
      : termos.filter((t) => t.categoria === categoriaSelecionada)

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

      {categoriasDisponiveis.length > 0 ? (
        <div
          className="dicionario-filtro"
          role="group"
          aria-label="Filtrar por categoria"
          data-cy="dicionario-filtro"
        >
          <button
            type="button"
            className={
              categoriaSelecionada === FILTRO_TODOS
                ? 'dicionario-filtro__chip dicionario-filtro__chip--ativo'
                : 'dicionario-filtro__chip'
            }
            onClick={() => setCategoriaSelecionada(FILTRO_TODOS)}
            data-cy="dicionario-filtro-chip"
            data-categoria="__todos__"
            aria-pressed={categoriaSelecionada === FILTRO_TODOS}
          >
            Todos
          </button>
          {categoriasDisponiveis.map((categoria) => {
            const slug = slugCategoria(categoria)
            const ativo = categoriaSelecionada === categoria
            return (
              <button
                key={categoria}
                type="button"
                className={
                  ativo
                    ? `dicionario-filtro__chip dicionario-filtro__chip--${slug} dicionario-filtro__chip--ativo`
                    : `dicionario-filtro__chip dicionario-filtro__chip--${slug}`
                }
                onClick={() => setCategoriaSelecionada(categoria)}
                data-cy="dicionario-filtro-chip"
                data-categoria={categoria}
                aria-pressed={ativo}
              >
                {categoria}
              </button>
            )
          })}
        </div>
      ) : null}

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
      ) : termosVisiveis.length === 0 ? (
        <p
          className="dicionario-mensagem"
          data-cy="dicionario-mensagem-vazia"
        >
          Nenhum termo encontrado.
        </p>
      ) : (
        <ul className="dicionario-grid" data-cy="dicionario-grid">
          {termosVisiveis.map((termo) => {
            const slug = slugCategoria(termo.categoria)
            const artigos = termo.artigos_relacionados || []
            return (
              <li
                key={termo.id}
                className={`dicionario-card dicionario-card--${slug}`}
                data-cy="dicionario-card"
                data-categoria={termo.categoria || ''}
              >
                <h2 className="dicionario-card__titulo">
                  <Link
                    className="dicionario-card__link"
                    to={`/dicionario/${termo.id}`}
                    data-cy="dicionario-card-link"
                  >
                    {termo.termo}
                  </Link>
                </h2>
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
