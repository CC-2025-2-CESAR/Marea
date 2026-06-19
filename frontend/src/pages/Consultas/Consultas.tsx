import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CalendarioMes from '../../components/CalendarioMes/CalendarioMes'
import ChecklistMedicamentos from '../../components/ChecklistMedicamentos/ChecklistMedicamentos'
import LegendaCiclo from '../../components/LegendaCiclo/LegendaCiclo'
import { useMarcacoesCiclo } from '../../hooks/useMarcacoesCiclo'
import { listarConsultas, listarEventos } from '../../services/consultasService'
import { listarMedicamentos } from '../../services/medicamentosService'
import type { Consulta, EventoTratamento, Medicamento } from '../../types'
import './Consultas.css'

function formatarDataCurta(iso?: string) {
  if (!iso) return ''
  const data = new Date(iso)
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
  })
}

function formatarHorario(iso?: string) {
  if (!iso) return ''
  const data = new Date(iso)
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Consultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [eventos, setEventos] = useState<EventoTratamento[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Marcações do ciclo (menstruação/fértil/ovulação/previsão) no mesmo
  // calendário das consultas — uma visão única do mês. O ciclo é secundário
  // aqui: se a busca falhar, o hook degrada para [] sem afetar a agenda.
  const { marcacoes, recarregar } = useMarcacoesCiclo()

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        // Medicamentos são secundários no calendário (rotina do dia no drawer):
        // uma falha neles não pode derrubar a agenda, então degradam para [].
        const [dadosConsultas, dadosEventos, dadosMedicamentos] =
          await Promise.all([
            listarConsultas(),
            listarEventos(),
            listarMedicamentos().catch(() => [] as Medicamento[]),
          ])
        if (!cancelado) {
          setConsultas(Array.isArray(dadosConsultas) ? dadosConsultas : [])
          setEventos(Array.isArray(dadosEventos) ? dadosEventos : [])
          setMedicamentos(
            Array.isArray(dadosMedicamentos) ? dadosMedicamentos : [],
          )
        }
      } catch {
        if (!cancelado) {
          setErro('Não foi possível carregar sua agenda no momento.')
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
        (a, b) =>
          new Date(a.data_horario).getTime() -
          new Date(b.data_horario).getTime(),
      )
      .slice(0, 5)
  }, [agendadas])

  const proximosEventos = useMemo(() => {
    const agora = new Date()
    return eventos
      .filter((e) => new Date(e.data_horario) >= agora)
      .sort(
        (a, b) =>
          new Date(a.data_horario).getTime() -
          new Date(b.data_horario).getTime(),
      )
      .slice(0, 5)
  }, [eventos])

  const mesInicial = useMemo(() => {
    if (proximas.length > 0) return new Date(proximas[0].data_horario)
    if (proximosEventos.length > 0) {
      return new Date(proximosEventos[0].data_horario)
    }
    if (agendadas.length > 0) return new Date(agendadas[0].data_horario)
    return undefined
  }, [proximas, proximosEventos, agendadas])

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
          <div className="consultas-calendario">
            <CalendarioMes
              consultas={agendadas}
              eventos={eventos}
              marcacoes={marcacoes}
              medicamentos={medicamentos}
              mesInicial={mesInicial}
              diaClicavel
              onRegistrado={recarregar}
              key={mesInicial ? mesInicial.toISOString() : 'sem-mes'}
            />
            {marcacoes.length > 0 ? (
              <LegendaCiclo dataCy="calendario-legenda-ciclo" />
            ) : null}
          </div>

          <aside className="consultas-painel" aria-label="Próximas consultas, eventos e lembretes">
            <PainelProximas
              proximas={proximas}
              totalCadastrado={consultas.length}
            />
            <PainelEventos proximos={proximosEventos} total={eventos.length} />
            <PainelLembretes />
          </aside>
        </div>
      )}
    </section>
  )
}

function PainelProximas({
  proximas,
  totalCadastrado,
}: {
  proximas: Consulta[]
  totalCadastrado: number
}) {
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

function PainelEventos({
  proximos,
  total,
}: {
  proximos: EventoTratamento[]
  total: number
}) {
  return (
    <div
      className="painel-card painel-card--eventos"
      data-cy="painel-eventos"
    >
      <h2 className="painel-card__titulo">Próximos eventos</h2>
      {total === 0 ? (
        <p className="painel-card__vazio" data-cy="eventos-mensagem-vazia">
          Nenhum evento do tratamento cadastrado no momento.
        </p>
      ) : proximos.length === 0 ? (
        <p className="painel-card__vazio">Sem eventos a partir de hoje.</p>
      ) : (
        <ul className="painel-proximas__lista">
          {proximos.map((evento) => (
            <li
              key={evento.id}
              className="painel-proximas__item"
              data-cy="painel-eventos-item"
            >
              <p className="painel-proximas__data">
                {formatarDataCurta(evento.data_horario)}
                <span className="painel-proximas__hora">
                  {' às '}
                  {formatarHorario(evento.data_horario)}
                </span>
              </p>
              <p className="painel-proximas__detalhe">
                <strong>{evento.titulo}</strong>
                {evento.tipo_label ? ` · ${evento.tipo_label}` : ''}
                {evento.descricao ? `: ${evento.descricao}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PainelLembretes() {
  return (
    <div
      className="painel-card painel-card--lembretes"
      data-cy="painel-lembretes"
    >
      <div className="painel-card__cabecalho">
        <h2 className="painel-card__titulo">Lembretes</h2>
        <Link
          to="/medicamentos"
          className="painel-card__link"
          data-cy="painel-lembretes-link"
        >
          Ver todos
        </Link>
      </div>
      <ChecklistMedicamentos modo="compacto" />
    </div>
  )
}

export default Consultas
