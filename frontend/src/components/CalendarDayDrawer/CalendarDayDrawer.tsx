import { Link } from 'react-router-dom'
import Modal from '../ui/Modal/Modal'
import StatusBadge from '../ui/StatusBadge/StatusBadge'
import type {
  Consulta,
  EventoTratamento,
  Medicamento,
  StatusDiaMedicamento,
} from '../../types'
import './CalendarDayDrawer.css'

interface Props {
  aberto: boolean
  onFechar: () => void
  /** Dia selecionado; `null` quando o drawer está fechado. */
  data: Date | null
  consultas: Consulta[]
  eventos: EventoTratamento[]
  /** Rotina de medicamentos da paciente (lista diária). */
  medicamentos?: Medicamento[]
  /** Se o dia selecionado é hoje — só então os medicamentos do dia aparecem. */
  ehHoje?: boolean
}

// Tom do selo e rótulo por status do dia do medicamento (mesmo mapa da
// checklist), usados quando a API não traz o label pronto.
const TOM_STATUS: Record<StatusDiaMedicamento, 'sucesso' | 'aviso' | 'neutro'> = {
  tomado: 'sucesso',
  atrasado: 'aviso',
  pendente: 'neutro',
}

const ROTULO_STATUS: Record<StatusDiaMedicamento, string> = {
  tomado: 'Tomado',
  atrasado: 'Atrasado',
  pendente: 'Pendente',
}

function formatarHorario(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// O horário do medicamento é um `time` ('HH:MM:SS'), não um instante ISO.
function formatarHora(horario?: string) {
  if (!horario) return 'Sem horário fixo'
  return horario.slice(0, 5)
}

function tituloDoDia(data: Date | null) {
  if (!data) return ''
  const bruto = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
  return bruto.charAt(0).toUpperCase() + bruto.slice(1)
}

/**
 * Drawer do dia do calendário: ao tocar num dia, abre um painel (folha inferior
 * no celular) com as consultas e os eventos do tratamento daquele dia. No dia de
 * hoje, lista também a rotina de medicamentos com o status do dia — cada item
 * leva ao detalhe do medicamento. Construído sobre o `Modal` (foco preso,
 * Escape, scroll travado).
 */
function CalendarDayDrawer({
  aberto,
  onFechar,
  data,
  consultas,
  eventos,
  medicamentos = [],
  ehHoje = false,
}: Props) {
  const temConsultas = consultas.length > 0
  const temEventos = eventos.length > 0
  // Medicamentos são a rotina diária; o status (tomado/atrasado/pendente) só
  // faz sentido hoje, então a seção aparece apenas no dia de hoje.
  const temMedicamentos = ehHoje && medicamentos.length > 0
  const vazio = !temConsultas && !temEventos && !temMedicamentos

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={tituloDoDia(data)}
      dataCy="calendario-dia-drawer"
    >
      {vazio ? (
        <p className="calendario-dia__vazio" data-cy="calendario-dia-vazio">
          Nenhuma consulta ou evento neste dia.
        </p>
      ) : (
        <div className="calendario-dia">
          {temConsultas ? (
            <section className="calendario-dia__bloco">
              <h3 className="calendario-dia__subtitulo">Consultas</h3>
              <ul className="calendario-dia__lista">
                {consultas.map((consulta) => (
                  <li
                    key={consulta.id}
                    className="calendario-dia__item"
                    data-cy="calendario-dia-consulta"
                  >
                    <p className="calendario-dia__hora">
                      {formatarHorario(consulta.data_horario)}
                    </p>
                    <p className="calendario-dia__nome">
                      {consulta.especialidade_nome || 'Consulta'}
                    </p>
                    {consulta.medica_nome ? (
                      <p className="calendario-dia__meta">
                        com {consulta.medica_nome}
                      </p>
                    ) : null}
                    {consulta.local ? (
                      <p className="calendario-dia__meta">{consulta.local}</p>
                    ) : null}
                    {consulta.observacoes ? (
                      <p className="calendario-dia__obs">
                        {consulta.observacoes}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {temEventos ? (
            <section className="calendario-dia__bloco">
              <h3 className="calendario-dia__subtitulo">
                Eventos do tratamento
              </h3>
              <ul className="calendario-dia__lista">
                {eventos.map((evento) => (
                  <li
                    key={evento.id}
                    className="calendario-dia__item calendario-dia__item--evento"
                    data-cy="calendario-dia-evento"
                  >
                    <p className="calendario-dia__hora">
                      {formatarHorario(evento.data_horario)}
                    </p>
                    <p className="calendario-dia__nome">{evento.titulo}</p>
                    {evento.tipo_label ? (
                      <p className="calendario-dia__meta">{evento.tipo_label}</p>
                    ) : null}
                    {evento.descricao ? (
                      <p className="calendario-dia__obs">{evento.descricao}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {temMedicamentos ? (
            <section
              className="calendario-dia__bloco"
              data-cy="calendario-dia-medicamentos"
            >
              <h3 className="calendario-dia__subtitulo">Medicamentos de hoje</h3>
              <ul className="calendario-dia__lista">
                {medicamentos.map((medicamento) => {
                  const status = medicamento.status_dia
                  return (
                    <li
                      key={medicamento.id}
                      className="calendario-dia__item calendario-dia__item--medicamento"
                      data-cy="calendario-dia-medicamento"
                    >
                      <p className="calendario-dia__hora">
                        {formatarHora(medicamento.horario)}
                      </p>
                      <p className="calendario-dia__nome">
                        <Link
                          to={`/medicamentos/${medicamento.id}`}
                          className="calendario-dia__link"
                          data-cy="calendario-dia-medicamento-link"
                          onClick={onFechar}
                        >
                          {medicamento.nome}
                        </Link>
                        {medicamento.dose ? (
                          <span className="calendario-dia__dose">
                            {' — '}
                            {medicamento.dose}
                          </span>
                        ) : null}
                      </p>
                      {status ? (
                        <span className="calendario-dia__status">
                          <StatusBadge
                            tom={TOM_STATUS[status]}
                            dataCy="calendario-dia-medicamento-status"
                          >
                            {medicamento.status_dia_label ||
                              ROTULO_STATUS[status]}
                          </StatusBadge>
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  )
}

export default CalendarDayDrawer
