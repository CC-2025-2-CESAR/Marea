import { useEffect, useState } from 'react'
import InteractiveCard from '../../components/ui/InteractiveCard/InteractiveCard'
import { listarTratamentos } from '../../services/tratamentosService'
import type { Tratamento } from '../../types'
import './Tratamentos.css'

/**
 * Lista de tratamentos (`/tratamentos`). Cada card é um resumo clicável por
 * inteiro que leva ao detalhe acolhedor (`/tratamentos/:id`), onde ficam as
 * etapas e os termos relacionados. Mantém os estados de carregando/erro/vazio.
 */
function Tratamentos() {
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarTratamentos()
        if (!cancelado) {
          setTratamentos(dados)
        }
      } catch {
        if (!cancelado) {
          setTratamentos([])
          setErro('Não foi possível carregar os tratamentos no momento.')
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
    <section className="tratamentos-pagina" data-cy="page-tratamentos">
      <header className="tratamentos-cabecalho">
        <h1>Tratamentos</h1>
        <p>
          Conheça os principais tratamentos oferecidos pela clínica. Toque em um
          card para ver as etapas explicadas com calma. Esta página é
          informativa e não substitui a orientação da sua equipe.
        </p>
      </header>

      {carregando ? (
        <p
          className="tratamentos-mensagem"
          data-cy="tratamentos-mensagem-carregando"
        >
          Carregando tratamentos...
        </p>
      ) : erro ? (
        <p
          className="tratamentos-mensagem tratamentos-mensagem--erro"
          role="alert"
          data-cy="tratamentos-mensagem-erro"
        >
          {erro}
        </p>
      ) : tratamentos.length === 0 ? (
        <p
          className="tratamentos-mensagem"
          data-cy="tratamentos-mensagem-vazia"
        >
          Nenhum tratamento cadastrado no momento.
        </p>
      ) : (
        <div className="tratamentos-grid" data-cy="tratamentos-grid">
          {tratamentos.map((tratamento) => (
            <InteractiveCard
              key={tratamento.id}
              to={`/tratamentos/${tratamento.id}`}
              titulo={tratamento.nome}
              cta="Ver tratamento"
              dataCy="tratamentos-card"
              linkDataCy="tratamentos-card-link"
            >
              {tratamento.descricao ? (
                <p className="tratamentos-card__descricao">
                  {tratamento.descricao}
                </p>
              ) : null}
            </InteractiveCard>
          ))}
        </div>
      )}
    </section>
  )
}

export default Tratamentos
