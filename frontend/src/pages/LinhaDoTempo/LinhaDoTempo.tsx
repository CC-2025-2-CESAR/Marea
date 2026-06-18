import { useEffect, useState } from 'react'
import TreatmentTimeline from '../../components/TreatmentTimeline/TreatmentTimeline'
import type { AcaoTimeline } from '../../components/TreatmentTimeline/TreatmentTimeline'
import { listarJornada } from '../../services/linhaTempoService'
import type { EtapaJornada } from '../../types'
import './LinhaDoTempo.css'

// Atalhos da etapa atual ("o que fazer agora"): levam às áreas onde a paciente
// age sobre o tratamento neste momento.
const ACOES_ETAPA_ATUAL: AcaoTimeline[] = [
  {
    to: '/calendario',
    rotulo: 'Ver a agenda',
    cy: 'linha-do-tempo-acao-calendario',
  },
  {
    to: '/medicamentos',
    rotulo: 'Meus medicamentos',
    cy: 'linha-do-tempo-acao-medicamentos',
  },
  {
    to: '/sintomas',
    rotulo: 'Registrar um sintoma',
    cy: 'linha-do-tempo-acao-sintomas',
  },
  { to: '/ciclo', rotulo: 'Registrar o ciclo', cy: 'linha-do-tempo-acao-ciclo' },
  {
    to: '/orientacoes',
    rotulo: 'Ver orientações',
    cy: 'linha-do-tempo-acao-orientacoes',
  },
]

function LinhaDoTempo() {
  const [etapas, setEtapas] = useState<EtapaJornada[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarJornada()
        if (!cancelado) {
          setEtapas(Array.isArray(dados) ? dados : [])
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
          Toque em uma etapa para ver os detalhes.
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
          <TreatmentTimeline
            etapas={etapas}
            acoesEtapaAtual={ACOES_ETAPA_ATUAL}
          />
          <p
            className="linha-tempo-aviso"
            data-cy="linha-do-tempo-aviso-previsao"
          >
            Essa previsão é estimada e pode mudar de acordo com a orientação da
            equipe médica.
          </p>
        </>
      )}
    </section>
  )
}

export default LinhaDoTempo
