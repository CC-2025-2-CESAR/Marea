import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { obterConteudoApoio } from '../../services/apoioService'
import type { ConteudoApoio } from '../../types'
import './ApoioDetalhe.css'

/**
 * Detalhe de um conteúdo de apoio emocional (`/apoio/:id`): texto completo, em
 * linguagem acolhedora, com o aviso de que não substitui acompanhamento
 * profissional. Trata os estados de carregando, erro e não encontrado (404).
 */
function ApoioDetalhe() {
  const { id } = useParams()
  const [conteudo, setConteudo] = useState<ConteudoApoio | null>(null)
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
        const dados = await obterConteudoApoio(Number(id))
        if (!cancelado) setConteudo(dados)
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

  return (
    <section className="apoio-detalhe" data-cy="page-apoio-detalhe">
      <Link
        className="apoio-detalhe__voltar"
        to="/apoio"
        data-cy="apoio-detalhe-voltar"
      >
        ← Voltar ao apoio emocional
      </Link>

      {carregando ? (
        <p className="apoio-detalhe__mensagem" data-cy="apoio-detalhe-carregando">
          Carregando conteúdo...
        </p>
      ) : naoEncontrado ? (
        <div data-cy="apoio-detalhe-nao-encontrado">
          <EmptyState
            titulo="Conteúdo não encontrado"
            descricao="Esse conteúdo de apoio não existe ou saiu do catálogo."
            acao={
              <Link className="apoio-detalhe__acao" to="/apoio">
                Ver todos os conteúdos
              </Link>
            }
          />
        </div>
      ) : erro ? (
        <p
          className="apoio-detalhe__mensagem apoio-detalhe__mensagem--erro"
          role="alert"
          data-cy="apoio-detalhe-erro"
        >
          Não foi possível carregar o conteúdo no momento.
        </p>
      ) : conteudo ? (
        <article className="apoio-detalhe__conteudo">
          <header className="apoio-detalhe__cabecalho">
            <h1 data-cy="apoio-detalhe-titulo">{conteudo.titulo}</h1>
            {conteudo.categoria ? (
              <span className="apoio-detalhe__tag" data-cy="apoio-detalhe-tag">
                {conteudo.categoria}
              </span>
            ) : null}
          </header>

          {conteudo.texto ? (
            <p className="apoio-detalhe__texto" data-cy="apoio-detalhe-texto">
              {conteudo.texto}
            </p>
          ) : null}

          <p className="apoio-detalhe__aviso" role="note" data-cy="apoio-detalhe-aviso">
            Este conteúdo é informativo e <strong>não substitui o
            acompanhamento profissional</strong>. Se precisar, fale com a sua
            equipe ou com um profissional de saúde mental.
          </p>
        </article>
      ) : null}
    </section>
  )
}

export default ApoioDetalhe
