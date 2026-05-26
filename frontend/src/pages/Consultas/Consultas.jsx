import { useEffect, useState } from 'react'
import { listarConsultas } from '../../services/consultasService'
import './Consultas.css'

const STATUS_PROXIMAS = ['agendada']
const STATUS_REALIZADAS = ['realizada']
const STATUS_CANCELADAS = ['cancelada', 'remarcada']

function formatarData(iso) {
  if (!iso) return ''
  const data = new Date(iso)
  return data.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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

  const proximas = consultas.filter((c) => STATUS_PROXIMAS.includes(c.status))
  const realizadas = consultas.filter((c) =>
    STATUS_REALIZADAS.includes(c.status),
  )
  const canceladas = consultas.filter((c) =>
    STATUS_CANCELADAS.includes(c.status),
  )

  return (
    <section className="consultas-pagina" data-cy="page-calendario">
      <header className="consultas-cabecalho">
        <h1>Calendário de consultas</h1>
        <p>
          Acompanhe seus próximos atendimentos e as consultas já realizadas
          durante o tratamento.
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
      ) : consultas.length === 0 ? (
        <p className="consultas-mensagem" data-cy="consultas-mensagem-vazia">
          Você ainda não tem consultas cadastradas. Quando a clínica agendar um
          atendimento, ele aparecerá aqui.
        </p>
      ) : (
        <>
          <GrupoConsultas
            titulo="Próximas"
            descricao="Consultas marcadas que ainda vão acontecer."
            itens={proximas}
            variante="proxima"
            dataCy="consultas-grupo-proximas"
          />
          <GrupoConsultas
            titulo="Realizadas"
            descricao="Atendimentos que já aconteceram."
            itens={realizadas}
            variante="realizada"
            dataCy="consultas-grupo-realizadas"
          />
          <GrupoConsultas
            titulo="Canceladas ou remarcadas"
            descricao="Consultas que não vão ocorrer no horário original."
            itens={canceladas}
            variante="cancelada"
            dataCy="consultas-grupo-canceladas"
          />
        </>
      )}
    </section>
  )
}

function GrupoConsultas({ titulo, descricao, itens, variante, dataCy }) {
  if (itens.length === 0) return null

  return (
    <section className="consultas-grupo" data-cy={dataCy}>
      <header className="consultas-grupo__cabecalho">
        <h2 className="consultas-grupo__titulo">{titulo}</h2>
        <p className="consultas-grupo__descricao">{descricao}</p>
      </header>
      <ul className="consultas-lista">
        {itens.map((consulta) => (
          <li
            key={consulta.id}
            className={`consultas-card consultas-card--${variante}`}
            data-cy="consultas-card"
            data-status={consulta.status}
          >
            <p
              className="consultas-card__data"
              data-cy="consultas-card-data"
            >
              {formatarData(consulta.data_horario)}
            </p>
            <h3
              className="consultas-card__titulo"
              data-cy="consultas-card-especialidade"
            >
              {consulta.especialidade_nome || 'Especialidade não informada'}
            </h3>
            <p
              className="consultas-card__medica"
              data-cy="consultas-card-medica"
            >
              {consulta.medica_nome
                ? `com ${consulta.medica_nome}`
                : 'Profissional a confirmar'}
            </p>
            {consulta.local ? (
              <p className="consultas-card__local">
                Local: <span>{consulta.local}</span>
              </p>
            ) : null}
            {consulta.observacoes ? (
              <p className="consultas-card__observacoes">
                {consulta.observacoes}
              </p>
            ) : null}
            <span
              className={`consultas-card__status consultas-card__status--${consulta.status}`}
              data-cy="consultas-card-status"
            >
              {consulta.status_label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Consultas
