import { useEffect, useState } from 'react'
import { listarJornada } from '../../services/linhaTempoService'
import './LinhaDoTempo.css'

function LinhaDoTempo() {
  const [etapas, setEtapas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarJornada()
        if (!cancelado) {
          setEtapas(dados)
        }
      } catch {
        if (!cancelado) {
          setEtapas([])
          setErro('Não foi possível carregar a linha do tempo no momento.')
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

  const tratamentoNome = etapas.length > 0 ? etapas[0].tratamento_nome : ''

  return (
    <section className="linha-tempo-pagina" data-cy="page-linha-do-tempo">
      <header className="linha-tempo-cabecalho">
        <h1>Linha do tempo</h1>
        <p>
          Acompanhe as etapas do seu tratamento e veja em que fase você está.
        </p>
      </header>

      {carregando ? (
        <p
          className="linha-tempo-mensagem"
          data-cy="linha-do-tempo-mensagem-carregando"
        >
          Carregando linha do tempo...
        </p>
      ) : erro ? (
        <p
          className="linha-tempo-mensagem linha-tempo-mensagem--erro"
          role="alert"
          data-cy="linha-do-tempo-mensagem-erro"
        >
          {erro}
        </p>
      ) : etapas.length === 0 ? (
        <p
          className="linha-tempo-mensagem"
          data-cy="linha-do-tempo-mensagem-vazia"
        >
          Nenhuma etapa cadastrada na sua linha do tempo no momento.
        </p>
      ) : (
        <>
          {tratamentoNome ? (
            <p
              className="linha-tempo-tratamento"
              data-cy="linha-do-tempo-tratamento"
            >
              Tratamento: <strong>{tratamentoNome}</strong>
            </p>
          ) : null}
          <ol className="linha-tempo-lista" data-cy="linha-do-tempo-lista">
            {etapas.map((etapa) => (
              <li
                key={etapa.id}
                className={`linha-tempo-item linha-tempo-item--${etapa.status}`}
                data-cy="linha-do-tempo-item"
                data-status={etapa.status}
                aria-current={etapa.status === 'atual' ? 'step' : undefined}
              >
                <span
                  className="linha-tempo-item__marcador"
                  aria-hidden="true"
                />
                <div className="linha-tempo-item__conteudo">
                  <div className="linha-tempo-item__cabecalho">
                    <h2 className="linha-tempo-item__titulo">
                      {etapa.etapa_titulo}
                    </h2>
                    <span
                      className="linha-tempo-item__status"
                      data-cy="linha-do-tempo-item-status"
                    >
                      {etapa.status_label}
                    </span>
                  </div>
                  {etapa.etapa_descricao ? (
                    <p className="linha-tempo-item__descricao">
                      {etapa.etapa_descricao}
                    </p>
                  ) : null}
                  {etapa.observacao ? (
                    <p className="linha-tempo-item__observacao">
                      {etapa.observacao}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

export default LinhaDoTempo
