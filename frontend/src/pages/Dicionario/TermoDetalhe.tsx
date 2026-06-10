import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { obterTermo } from '../../services/dicionarioService'
import type { TermoDicionario } from '../../types'
import './TermoDetalhe.css'

/**
 * Página de detalhe de um termo do dicionário (`/dicionario/:id`). Lê o termo
 * pela API, mostra definição, exemplo e artigos relacionados, e trata os
 * estados de carregando, erro e não encontrado (404).
 */
function TermoDetalhe() {
  const { id } = useParams()
  const [termo, setTermo] = useState<TermoDicionario | null>(null)
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
        const dados = await obterTermo(Number(id))
        if (!cancelado) setTermo(dados)
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
    <section className="termo-detalhe" data-cy="page-termo-detalhe">
      <Link
        className="termo-detalhe__voltar"
        to="/dicionario"
        data-cy="termo-detalhe-voltar"
      >
        ← Voltar ao dicionário
      </Link>

      {carregando ? (
        <p
          className="termo-detalhe__mensagem"
          data-cy="termo-detalhe-carregando"
        >
          Carregando termo...
        </p>
      ) : naoEncontrado ? (
        <div data-cy="termo-detalhe-nao-encontrado">
          <EmptyState
            titulo="Termo não encontrado"
            descricao="Esse termo não existe ou saiu do dicionário."
            acao={
              <Link className="termo-detalhe__acao" to="/dicionario">
                Ver todos os termos
              </Link>
            }
          />
        </div>
      ) : erro ? (
        <p
          className="termo-detalhe__mensagem termo-detalhe__mensagem--erro"
          role="alert"
          data-cy="termo-detalhe-erro"
        >
          Não foi possível carregar o termo no momento.
        </p>
      ) : termo ? (
        <article className="termo-detalhe__conteudo">
          <header className="termo-detalhe__cabecalho">
            <h1 data-cy="termo-detalhe-titulo">{termo.termo}</h1>
            {termo.categoria ? (
              <span className="termo-detalhe__tag" data-cy="termo-detalhe-tag">
                {termo.categoria}
              </span>
            ) : null}
          </header>

          <p
            className="termo-detalhe__definicao"
            data-cy="termo-detalhe-definicao"
          >
            {termo.definicao}
          </p>

          {termo.exemplo ? (
            <div className="termo-detalhe__bloco" data-cy="termo-detalhe-exemplo">
              <h2 className="termo-detalhe__subtitulo">Exemplo de uso</h2>
              <p>{termo.exemplo}</p>
            </div>
          ) : null}

          {termo.artigos_relacionados &&
          termo.artigos_relacionados.length > 0 ? (
            <div className="termo-detalhe__bloco" data-cy="termo-detalhe-artigos">
              <h2 className="termo-detalhe__subtitulo">Para saber mais</h2>
              <ul className="termo-detalhe__artigos">
                {termo.artigos_relacionados.map((artigo) => (
                  <li key={artigo.titulo}>
                    <a
                      className="termo-detalhe__artigo"
                      href={artigo.url || '#'}
                    >
                      {artigo.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  )
}

export default TermoDetalhe
