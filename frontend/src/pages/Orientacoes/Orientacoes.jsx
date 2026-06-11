import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TermosRelacionados from '../../components/TermosRelacionados/TermosRelacionados'
import { listarOrientacoes } from '../../services/tratamentosService'
import './Orientacoes.css'

const FILTRO_TODOS = '__todos__'

function Orientacoes() {
  const [orientacoes, setOrientacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState(FILTRO_TODOS)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarOrientacoes()
        if (!cancelado) {
          setOrientacoes(dados)
        }
      } catch {
        if (!cancelado) {
          setOrientacoes([])
          setErro('Não foi possível carregar as orientações no momento.')
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

  const categoriasDisponiveis = Array.from(
    new Set(orientacoes.map((o) => o.categoria).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const orientacoesVisiveis =
    categoriaSelecionada === FILTRO_TODOS
      ? orientacoes
      : orientacoes.filter((o) => o.categoria === categoriaSelecionada)

  return (
    <section className="orientacoes-pagina" data-cy="page-orientacoes">
      <header className="orientacoes-cabecalho">
        <h1>Orientações</h1>
        <p>
          Orientações em linguagem simples para te ajudar em cada etapa do
          tratamento. Em caso de dúvida, fale sempre com a sua equipe.
        </p>
      </header>

      {categoriasDisponiveis.length > 0 ? (
        <div
          className="orientacoes-filtro"
          role="group"
          aria-label="Filtrar por categoria"
          data-cy="orientacoes-filtro"
        >
          <button
            type="button"
            className={
              categoriaSelecionada === FILTRO_TODOS
                ? 'orientacoes-filtro__chip orientacoes-filtro__chip--ativo'
                : 'orientacoes-filtro__chip'
            }
            onClick={() => setCategoriaSelecionada(FILTRO_TODOS)}
            data-cy="orientacoes-filtro-chip"
            data-categoria="__todos__"
            aria-pressed={categoriaSelecionada === FILTRO_TODOS}
          >
            Todas
          </button>
          {categoriasDisponiveis.map((categoria) => {
            const ativo = categoriaSelecionada === categoria
            return (
              <button
                key={categoria}
                type="button"
                className={
                  ativo
                    ? 'orientacoes-filtro__chip orientacoes-filtro__chip--ativo'
                    : 'orientacoes-filtro__chip'
                }
                onClick={() => setCategoriaSelecionada(categoria)}
                data-cy="orientacoes-filtro-chip"
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
          className="orientacoes-mensagem"
          data-cy="orientacoes-mensagem-carregando"
        >
          Carregando orientações...
        </p>
      ) : erro ? (
        <p
          className="orientacoes-mensagem orientacoes-mensagem--erro"
          role="alert"
          data-cy="orientacoes-mensagem-erro"
        >
          {erro}
        </p>
      ) : orientacoesVisiveis.length === 0 ? (
        <p
          className="orientacoes-mensagem"
          data-cy="orientacoes-mensagem-vazia"
        >
          Nenhuma orientação cadastrada no momento.
        </p>
      ) : (
        <ul className="orientacoes-grid" data-cy="orientacoes-grid">
          {orientacoesVisiveis.map((orientacao) => {
            const relacao = [
              orientacao.tratamento_nome,
              orientacao.etapa_titulo,
            ]
              .filter(Boolean)
              .join(' — ')
            return (
              <li
                key={orientacao.id}
                className="orientacoes-card"
                data-cy="orientacoes-card"
                data-categoria={orientacao.categoria || ''}
              >
                <h2 className="orientacoes-card__titulo">
                  <Link
                    className="orientacoes-card__link"
                    to={`/orientacoes/${orientacao.id}`}
                    data-cy="orientacoes-card-link"
                  >
                    {orientacao.titulo}
                  </Link>
                </h2>
                <p className="orientacoes-card__conteudo">
                  {orientacao.conteudo}
                </p>
                {relacao ? (
                  <p
                    className="orientacoes-card__relacao"
                    data-cy="orientacoes-card-relacao"
                  >
                    Relacionado a: {relacao}
                  </p>
                ) : null}
                <TermosRelacionados termos={orientacao.termos_relacionados} />
                {orientacao.categoria ? (
                  <span
                    className="orientacoes-card__tag"
                    data-cy="orientacoes-card-tag"
                  >
                    {orientacao.categoria}
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

export default Orientacoes
