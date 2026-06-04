import { useEffect, useState } from 'react'
import TermosRelacionados from '../../components/TermosRelacionados/TermosRelacionados'
import { listarTratamentos } from '../../services/tratamentosService'
import './Tratamentos.css'

function Tratamentos() {
  const [tratamentos, setTratamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

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
          Conheça os principais tratamentos oferecidos pela clínica, com as
          etapas de cada um explicadas de forma simples. Esta página é
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
        <ul className="tratamentos-grid" data-cy="tratamentos-grid">
          {tratamentos.map((tratamento) => {
            const etapas = tratamento.etapas || []
            return (
              <li
                key={tratamento.id}
                className="tratamentos-card"
                data-cy="tratamentos-card"
              >
                <h2 className="tratamentos-card__titulo">{tratamento.nome}</h2>
                <p className="tratamentos-card__descricao">
                  {tratamento.descricao}
                </p>
                {tratamento.indicacao ? (
                  <p className="tratamentos-card__indicacao">
                    <strong>Quando é indicado: </strong>
                    {tratamento.indicacao}
                  </p>
                ) : null}
                {etapas.length > 0 ? (
                  <div
                    className="tratamentos-card__etapas"
                    data-cy="tratamentos-card-etapas"
                  >
                    <h3 className="tratamentos-card__etapas-titulo">
                      Etapas principais
                    </h3>
                    <ol className="tratamentos-card__etapas-lista">
                      {etapas.map((etapa) => (
                        <li key={etapa.id} className="tratamentos-card__etapa">
                          <span className="tratamentos-card__etapa-nome">
                            {etapa.titulo}
                          </span>
                          {etapa.descricao ? (
                            <span className="tratamentos-card__etapa-descricao">
                              {etapa.descricao}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                <TermosRelacionados termos={tratamento.termos_relacionados} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default Tratamentos
