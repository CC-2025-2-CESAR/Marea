import { useEffect, useState } from 'react'
import { listarEspecialidades } from '../../services/especialidadesService'
import InteractiveCard from '../../components/ui/InteractiveCard/InteractiveCard'
import type { Especialidade } from '../../types'
import './Especialidades.css'

function Especialidades() {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarEspecialidades()
        if (!cancelado) {
          setEspecialidades(dados)
        }
      } catch {
        if (!cancelado) {
          setEspecialidades([])
          setErro('Não foi possível carregar as especialidades no momento.')
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

  return (
    <section className="especialidades-pagina" data-cy="page-especialidades">
      <header className="especialidades-cabecalho">
        <h1>Especialidades</h1>
        <p>
          Conheça as áreas de cuidado que fazem parte do acompanhamento na
          clínica e as médicas relacionadas a cada uma.
        </p>
      </header>

      {carregando ? (
        <p
          className="especialidades-mensagem"
          data-cy="especialidades-mensagem-carregando"
        >
          Carregando especialidades...
        </p>
      ) : erro ? (
        <p
          className="especialidades-mensagem especialidades-mensagem--erro"
          role="alert"
          data-cy="especialidades-mensagem-erro"
        >
          {erro}
        </p>
      ) : especialidades.length === 0 ? (
        <p
          className="especialidades-mensagem"
          data-cy="especialidades-mensagem-vazia"
        >
          Nenhuma especialidade cadastrada no momento.
        </p>
      ) : (
        <div className="especialidades-grid" data-cy="especialidades-grid">
          {especialidades.map((especialidade) => {
            const medicas = especialidade.medicas || []
            return (
              <InteractiveCard
                key={especialidade.id}
                to={`/especialidades/${especialidade.id}`}
                titulo={especialidade.nome}
                cta="Ver especialidade"
                dataCy="especialidades-card"
              >
                {especialidade.descricao ? (
                  <p className="especialidades-card__descricao">
                    {especialidade.descricao}
                  </p>
                ) : null}
                {medicas.length > 0 ? (
                  <div
                    className="especialidades-card__medicas"
                    data-cy="especialidades-card-medicas"
                  >
                    <h3 className="especialidades-card__medicas-titulo">
                      Médicas relacionadas
                    </h3>
                    <ul className="especialidades-card__medicas-lista">
                      {medicas.map((medica) => (
                        <li
                          key={medica.id}
                          className="especialidades-card__medica"
                        >
                          {medica.nome}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </InteractiveCard>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Especialidades
