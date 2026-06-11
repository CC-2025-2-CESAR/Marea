import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { obterEspecialidade } from '../../services/especialidadesService'
import type { Especialidade } from '../../types'
import './EspecialidadeDetalhe.css'

/**
 * Página de detalhe de uma especialidade (`/especialidades/:id`): descrição e
 * médicas relacionadas, com estados de carregando, erro e não encontrado (404).
 */
function EspecialidadeDetalhe() {
  const { id } = useParams()
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(null)
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
        const dados = await obterEspecialidade(Number(id))
        if (!cancelado) setEspecialidade(dados)
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

  const medicas = especialidade?.medicas ?? []

  return (
    <section
      className="especialidade-detalhe"
      data-cy="page-especialidade-detalhe"
    >
      <Link
        className="especialidade-detalhe__voltar"
        to="/especialidades"
        data-cy="especialidade-detalhe-voltar"
      >
        ← Voltar às especialidades
      </Link>

      {carregando ? (
        <p
          className="especialidade-detalhe__mensagem"
          data-cy="especialidade-detalhe-carregando"
        >
          Carregando especialidade...
        </p>
      ) : naoEncontrado ? (
        <div data-cy="especialidade-detalhe-nao-encontrado">
          <EmptyState
            titulo="Especialidade não encontrada"
            descricao="Essa especialidade não existe ou saiu do catálogo."
            acao={
              <Link
                className="especialidade-detalhe__acao"
                to="/especialidades"
              >
                Ver todas as especialidades
              </Link>
            }
          />
        </div>
      ) : erro ? (
        <p
          className="especialidade-detalhe__mensagem especialidade-detalhe__mensagem--erro"
          role="alert"
          data-cy="especialidade-detalhe-erro"
        >
          Não foi possível carregar a especialidade no momento.
        </p>
      ) : especialidade ? (
        <article className="especialidade-detalhe__conteudo">
          <header className="especialidade-detalhe__cabecalho">
            <h1 data-cy="especialidade-detalhe-titulo">
              {especialidade.nome}
            </h1>
          </header>

          {especialidade.descricao ? (
            <p
              className="especialidade-detalhe__descricao"
              data-cy="especialidade-detalhe-descricao"
            >
              {especialidade.descricao}
            </p>
          ) : null}

          {medicas.length > 0 ? (
            <div
              className="especialidade-detalhe__bloco"
              data-cy="especialidade-detalhe-medicas"
            >
              <h2 className="especialidade-detalhe__subtitulo">
                Médicas relacionadas
              </h2>
              <ul className="especialidade-detalhe__medicas">
                {medicas.map((medica) => (
                  <li key={medica.id}>{medica.nome}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  )
}

export default EspecialidadeDetalhe
