import Modal from '../ui/Modal/Modal'
import type { Consulta, EventoTratamento } from '../../types'
import './CalendarDayDrawer.css'

interface Props {
  aberto: boolean
  onFechar: () => void
  /** Dia selecionado; `null` quando o drawer está fechado. */
  data: Date | null
  consultas: Consulta[]
  eventos: EventoTratamento[]
}

function formatarHorario(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
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
 * no celular) com as consultas e os eventos do tratamento daquele dia. Construído
 * sobre o `Modal` (foco preso, Escape, scroll travado).
 */
function CalendarDayDrawer({
  aberto,
  onFechar,
  data,
  consultas,
  eventos,
}: Props) {
  const vazio = consultas.length === 0 && eventos.length === 0

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
          {consultas.length > 0 ? (
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

          {eventos.length > 0 ? (
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
        </div>
      )}
    </Modal>
  )
}

export default CalendarDayDrawer
