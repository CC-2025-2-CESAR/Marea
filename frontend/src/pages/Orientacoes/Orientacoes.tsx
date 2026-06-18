import { useEffect, useState } from 'react'
import InteractiveCard from '../../components/ui/InteractiveCard/InteractiveCard'
import { listarOrientacoes } from '../../services/tratamentosService'
import type { Orientacao } from '../../types'
import './Orientacoes.css'

const FILTRO_TODOS = '__todos__'

/**
 * Lista de orientações (`/orientacoes`). Cada card é um resumo clicável por
 * inteiro que leva ao detalhe (`/orientacoes/:id`), onde ficam o texto completo
 * e os termos relacionados. Mantém o filtro por categoria.
 */
function Orientacoes() {
  const [orientacoes, setOrientacoes] = useState<Orientacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
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
  ).sort((a, b) => (a ?? '').localeCompare(b ?? '', 'pt-BR'))

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
          tratamento. Toque em um card para ler com calma. Em caso de dúvida,
          fale sempre com a sua equipe.
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
                onClick={() => setCategoriaSelecionada(categoria as string)}
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
        <div className="orientacoes-grid" data-cy="orientacoes-grid">
          {orientacoesVisiveis.map((orientacao) => {
            const relacao = [
              orientacao.tratamento_nome,
              orientacao.etapa_titulo,
            ]
              .filter(Boolean)
              .join(' — ')
            return (
              <InteractiveCard
                key={orientacao.id}
                to={`/orientacoes/${orientacao.id}`}
                titulo={orientacao.titulo}
                cta="Ver orientação"
                dataCy="orientacoes-card"
                linkDataCy="orientacoes-card-link"
              >
                {orientacao.conteudo ? (
                  <p className="orientacoes-card__conteudo">
                    {orientacao.conteudo}
                  </p>
                ) : null}
                {relacao ? (
                  <p
                    className="orientacoes-card__relacao"
                    data-cy="orientacoes-card-relacao"
                  >
                    Relacionado a: {relacao}
                  </p>
                ) : null}
                {orientacao.categoria ? (
                  <span
                    className="orientacoes-card__tag"
                    data-cy="orientacoes-card-tag"
                  >
                    {orientacao.categoria}
                  </span>
                ) : null}
              </InteractiveCard>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Orientacoes
