import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TermosRelacionados from '../../components/TermosRelacionados/TermosRelacionados'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { obterTratamento } from '../../services/tratamentosService'
import type { Tratamento } from '../../types'
import './TratamentoDetalhe.css'

/**
 * Página de detalhe de um tratamento (`/tratamentos/:id`): descrição, quando é
 * indicado, etapas e os termos do dicionário relacionados. Trata os estados de
 * carregando, erro e não encontrado (404).
 */
function TratamentoDetalhe() {
  const { id } = useParams()
  const [tratamento, setTratamento] = useState<Tratamento | null>(null)
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
        const dados = await obterTratamento(Number(id))
        if (!cancelado) setTratamento(dados)
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

  const etapas = tratamento?.etapas ?? []

  return (
    <section className="tratamento-detalhe" data-cy="page-tratamento-detalhe">
      <Link
        className="tratamento-detalhe__voltar"
        to="/tratamentos"
        data-cy="tratamento-detalhe-voltar"
      >
        ← Voltar aos tratamentos
      </Link>

      {carregando ? (
        <p
          className="tratamento-detalhe__mensagem"
          data-cy="tratamento-detalhe-carregando"
        >
          Carregando tratamento...
        </p>
      ) : naoEncontrado ? (
        <div data-cy="tratamento-detalhe-nao-encontrado">
          <EmptyState
            titulo="Tratamento não encontrado"
            descricao="Esse tratamento não existe ou saiu do catálogo."
            acao={
              <Link className="tratamento-detalhe__acao" to="/tratamentos">
                Ver todos os tratamentos
              </Link>
            }
          />
        </div>
      ) : erro ? (
        <p
          className="tratamento-detalhe__mensagem tratamento-detalhe__mensagem--erro"
          role="alert"
          data-cy="tratamento-detalhe-erro"
        >
          Não foi possível carregar o tratamento no momento.
        </p>
      ) : tratamento ? (
        <article className="tratamento-detalhe__conteudo">
          <header className="tratamento-detalhe__cabecalho">
            <h1 data-cy="tratamento-detalhe-titulo">{tratamento.nome}</h1>
          </header>

          {tratamento.descricao ? (
            <p
              className="tratamento-detalhe__descricao"
              data-cy="tratamento-detalhe-descricao"
            >
              {tratamento.descricao}
            </p>
          ) : null}

          {tratamento.indicacao ? (
            <div
              className="tratamento-detalhe__bloco"
              data-cy="tratamento-detalhe-indicacao"
            >
              <h2 className="tratamento-detalhe__subtitulo">Quando é indicado</h2>
              <p>{tratamento.indicacao}</p>
            </div>
          ) : null}

          {etapas.length > 0 ? (
            <div
              className="tratamento-detalhe__bloco"
              data-cy="tratamento-detalhe-etapas"
            >
              <h2 className="tratamento-detalhe__subtitulo">
                Etapas do tratamento
              </h2>
              <ol className="tratamento-detalhe__etapas">
                {etapas.map((etapa) => (
                  <li key={etapa.id} className="tratamento-detalhe__etapa">
                    <span className="tratamento-detalhe__etapa-nome">
                      {etapa.titulo}
                    </span>
                    {etapa.descricao ? (
                      <span className="tratamento-detalhe__etapa-descricao">
                        {etapa.descricao}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <TermosRelacionados termos={tratamento.termos_relacionados} />
        </article>
      ) : null}
    </section>
  )
}

export default TratamentoDetalhe
