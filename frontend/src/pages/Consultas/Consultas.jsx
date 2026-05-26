import { useEffect, useMemo, useState } from 'react'
import CalendarioMes from '../../components/CalendarioMes/CalendarioMes'
import { listarConsultas } from '../../services/consultasService'
import './Consultas.css'

function formatarDataCurta(iso) {
  if (!iso) return ''
  const data = new Date(iso)
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
  })
}

function formatarHorario(iso) {
  if (!iso) return ''
  const data = new Date(iso)
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Consultas() {
  const [consultas, setConsultas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const dados = await listarConsultas()
        if (!cancelado) setConsultas(Array.isArray(dados) ? dados : [])
      } catch {
        if (!cancelado) {
          setErro('Não foi possível carregar suas consultas no momento.')
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  const agendadas = useMemo(
    () => consultas.filter((c) => c.status === 'agendada'),
    [consultas],
  )

  const proximas = useMemo(() => {
    const agora = new Date()
    return agendadas
      .filter((c) => new Date(c.data_horario) >= agora)
      .sort(
        (a, b) => new Date(a.data_horario) - new Date(b.data_horario),
      )
      .slice(0, 5)
  }, [agendadas])

  const mesInicial = useMemo(() => {
    if (proximas.length > 0) return new Date(proximas[0].data_horario)
    if (agendadas.length > 0) return new Date(agendadas[0].data_horario)
    return undefined
  }, [proximas, agendadas])

  return (
    <section className="consultas-pagina" data-cy="page-calendario">
      <header className="consultas-cabecalho">
        <h1>Calendário</h1>
        <p>
          Veja seus próximos atendimentos no mês e mantenha em vista os
          lembretes da rotina de tratamento.
        </p>
      </header>

      {carregando ? (
        <p
          className="consultas-mensagem"
          data-cy="consultas-mensagem-carregando"
        >
          Carregando suas consultas...
        </p>
      ) : erro ? (
        <p
          className="consultas-mensagem consultas-mensagem--erro"
          role="alert"
          data-cy="consultas-mensagem-erro"
        >
          {erro}
        </p>
      ) : (
        <div className="consultas-layout" data-cy="consultas-layout">
          <CalendarioMes
            consultas={agendadas}
            mesInicial={mesInicial}
            key={mesInicial ? mesInicial.toISOString() : 'sem-mes'}
          />

          <aside className="consultas-painel" aria-label="Próximas consultas e lembretes">
            <PainelProximas
              proximas={proximas}
              totalCadastrado={consultas.length}
            />
            <PainelLembretes />
          </aside>
        </div>
      )}
    </section>
  )
}

function PainelProximas({ proximas, totalCadastrado }) {
  if (totalCadastrado === 0) {
    return (
      <div
        className="painel-card painel-card--proximas"
        data-cy="painel-proximas"
      >
        <h2 className="painel-card__titulo">Próximas consultas</h2>
        <p
          className="painel-card__vazio"
          data-cy="consultas-mensagem-vazia"
        >
          Você ainda não tem consultas cadastradas. Quando a clínica agendar
          um atendimento, ele aparecerá aqui.
        </p>
      </div>
    )
  }

  if (proximas.length === 0) {
    return (
      <div
        className="painel-card painel-card--proximas"
        data-cy="painel-proximas"
      >
        <h2 className="painel-card__titulo">Próximas consultas</h2>
        <p className="painel-card__vazio">
          Sem consultas agendadas a partir de hoje.
        </p>
      </div>
    )
  }

  return (
    <div
      className="painel-card painel-card--proximas"
      data-cy="painel-proximas"
    >
      <h2 className="painel-card__titulo">Próximas consultas</h2>
      <ul className="painel-proximas__lista">
        {proximas.map((consulta) => (
          <li
            key={consulta.id}
            className="painel-proximas__item"
            data-cy="painel-proximas-item"
          >
            <p
              className="painel-proximas__data"
              data-cy="painel-proximas-data"
            >
              {formatarDataCurta(consulta.data_horario)}
              <span className="painel-proximas__hora">
                {' às '}
                {formatarHorario(consulta.data_horario)}
              </span>
            </p>
            <p
              className="painel-proximas__detalhe"
              data-cy="painel-proximas-detalhe"
            >
              <strong>
                {consulta.especialidade_nome || 'Consulta'}
              </strong>
              {consulta.medica_nome ? ` com ${consulta.medica_nome}` : ''}
              {consulta.observacoes ? `: ${consulta.observacoes}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PainelLembretes() {
  return (
    <div
      className="painel-card painel-card--lembretes"
      data-cy="painel-lembretes"
    >
      <h2 className="painel-card__titulo">Lembretes</h2>
      <p className="painel-card__vazio">
        Em breve: aqui aparecerão os medicamentos do dia para você marcar como
        tomados, junto com os lembretes da rotina de tratamento.
      </p>
    </div>
  )
}

export default Consultas
