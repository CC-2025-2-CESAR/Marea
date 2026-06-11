import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TermosRelacionados from '../../components/TermosRelacionados/TermosRelacionados'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { obterOrientacao } from '../../services/tratamentosService'
import type { Orientacao } from '../../types'
import './OrientacaoDetalhe.css'

/**
 * Página de detalhe de uma orientação (`/orientacoes/:id`): conteúdo completo,
 * a que tratamento/etapa se relaciona e os termos do dicionário ligados. Trata
 * os estados de carregando, erro e não encontrado (404).
 */
function OrientacaoDetalhe() {
  const { id } = useParams()
  const [orientacao, setOrientacao] = useState<Orientacao | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setCarregando(true)
      setNaoEncontrado(false)
      setErro(false)
      try {
        const dados = await obterOrientacao(Number(id))
        if (!cancelado) setOrientacao(dados)
      } catch (e: unknown) {
        if (cancelado) return
        const status =
          e && typeof e === 'object' && 'status' in e
            ? (e as { status?: number }).status
            : undefined
        if (status === 404) {
          setNaoEncontrado(true)
        } else {
          setErro(true)
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  const relacao = orientacao
    ? [orientacao.tratamento_nome, orientacao.etapa_titulo]
        .filter(Boolean)
        .join(' — ')
    : ''

  return (
    <section className="orientacao-detalhe" data-cy="page-orientacao-detalhe">
      <Link
        className="orientacao-detalhe__voltar"
        to="/orientacoes"
        data-cy="orientacao-detalhe-voltar"
      >
        ← Voltar às orientações
      </Link>

      {carregando ? (
        <p
          className="orientacao-detalhe__mensagem"
          data-cy="orientacao-detalhe-carregando"
        >
          Carregando orientação...
        </p>
      ) : naoEncontrado ? (
        <div data-cy="orientacao-detalhe-nao-encontrado">
          <EmptyState
            titulo="Orientação não encontrada"
            descricao="Essa orientação não existe ou saiu do catálogo."
            acao={
              <Link className="orientacao-detalhe__acao" to="/orientacoes">
                Ver todas as orientações
              </Link>
            }
          />
        </div>
      ) : erro ? (
        <p
          className="orientacao-detalhe__mensagem orientacao-detalhe__mensagem--erro"
          role="alert"
          data-cy="orientacao-detalhe-erro"
        >
          Não foi possível carregar a orientação no momento.
        </p>
      ) : orientacao ? (
        <article className="orientacao-detalhe__conteudo">
          <header className="orientacao-detalhe__cabecalho">
            <h1 data-cy="orientacao-detalhe-titulo">{orientacao.titulo}</h1>
            {orientacao.categoria ? (
              <span
                className="orientacao-detalhe__tag"
                data-cy="orientacao-detalhe-tag"
              >
                {orientacao.categoria}
              </span>
            ) : null}
          </header>

          {relacao ? (
            <p
              className="orientacao-detalhe__relacao"
              data-cy="orientacao-detalhe-relacao"
            >
              Relacionado a: {relacao}
            </p>
          ) : null}

          {orientacao.conteudo ? (
            <p
              className="orientacao-detalhe__texto"
              data-cy="orientacao-detalhe-conteudo"
            >
              {orientacao.conteudo}
            </p>
          ) : null}

          <TermosRelacionados termos={orientacao.termos_relacionados} />
        </article>
      ) : null}
    </section>
  )
}

export default OrientacaoDetalhe
