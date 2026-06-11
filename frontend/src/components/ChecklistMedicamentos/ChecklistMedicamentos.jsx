import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../ui/StatusBadge/StatusBadge'
import {
  alternarTomada,
  listarMedicamentos,
} from '../../services/medicamentosService'
import './ChecklistMedicamentos.css'

function formatarHorario(horario) {
  if (!horario) return 'sem horário fixo'
  return horario.slice(0, 5)
}

const ROTULO_STATUS = {
  tomado: 'Tomado',
  atrasado: 'Atrasado',
  pendente: 'Pendente',
}

const TOM_STATUS = {
  tomado: 'sucesso',
  atrasado: 'aviso',
  pendente: 'neutro',
}

// Resolve o status do dia de um medicamento para exibição. Dá prioridade ao
// `tomado` local (atualização otimista ao marcar) e cai no `status_dia` vindo
// da API; sem dado, assume "pendente".
function statusDoDia(medicamento) {
  if (medicamento.tomado) return 'tomado'
  return medicamento.status_dia || 'pendente'
}

function ChecklistMedicamentos({ modo = 'completo' }) {
  const [medicamentos, setMedicamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(null)
  const [erroAtualizacao, setErroAtualizacao] = useState(null)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const dados = await listarMedicamentos()
        if (!cancelado) {
          setMedicamentos(Array.isArray(dados) ? dados : [])
        }
      } catch {
        if (!cancelado) {
          setErroCarregamento(
            'Não foi possível carregar seus medicamentos no momento.',
          )
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

  async function aoAlternar(medicamento) {
    const estadoAnterior = medicamento.tomado
    const novoEstado = !estadoAnterior

    setMedicamentos((prev) =>
      prev.map((m) =>
        m.id === medicamento.id ? { ...m, tomado: novoEstado } : m,
      ),
    )

    try {
      const atualizado = await alternarTomada(medicamento.id, novoEstado)
      setMedicamentos((prev) =>
        prev.map((m) =>
          m.id === medicamento.id ? { ...m, ...atualizado } : m,
        ),
      )
      setErroAtualizacao(null)
    } catch {
      setMedicamentos((prev) =>
        prev.map((m) =>
          m.id === medicamento.id ? { ...m, tomado: estadoAnterior } : m,
        ),
      )
      setErroAtualizacao(
        'Não conseguimos atualizar este medicamento. Tente novamente.',
      )
    }
  }

  if (carregando) {
    return (
      <p
        className="checklist-medicamentos__mensagem"
        data-cy="medicamentos-mensagem-carregando"
      >
        Carregando seus medicamentos...
      </p>
    )
  }

  if (erroCarregamento && medicamentos.length === 0) {
    return (
      <p
        className="checklist-medicamentos__mensagem checklist-medicamentos__mensagem--erro"
        role="alert"
        data-cy="medicamentos-mensagem-erro"
      >
        {erroCarregamento}
      </p>
    )
  }

  if (medicamentos.length === 0) {
    return (
      <p
        className="checklist-medicamentos__mensagem"
        data-cy="medicamentos-mensagem-vazia"
      >
        Você ainda não tem medicamentos cadastrados. Quando a clínica
        prescrever, eles aparecerão aqui.
      </p>
    )
  }

  const tomados = medicamentos.filter((m) => m.tomado).length
  const total = medicamentos.length

  return (
    <div
      className={`checklist-medicamentos checklist-medicamentos--${modo}`}
      data-cy="medicamentos-checklist"
      data-modo={modo}
    >
      <p
        className="checklist-medicamentos__contador"
        data-cy="medicamentos-contador"
      >
        <strong>{tomados}</strong>
        {' de '}
        <strong>{total}</strong>
        {total === 1 ? ' tomado hoje' : ' tomados hoje'}
      </p>

      {erroAtualizacao ? (
        <p
          className="checklist-medicamentos__erro-toast"
          role="alert"
          data-cy="medicamentos-mensagem-erro-toggle"
        >
          {erroAtualizacao}
        </p>
      ) : null}

      <ul className="checklist-medicamentos__lista">
        {medicamentos.map((med) => (
          <li
            key={med.id}
            className={
              med.tomado
                ? 'checklist-medicamentos__item checklist-medicamentos__item--tomado'
                : 'checklist-medicamentos__item'
            }
            data-cy="medicamentos-item"
            data-id={med.id}
            data-tomado={med.tomado ? 'true' : 'false'}
          >
            <button
              type="button"
              className="checklist-medicamentos__checkbox"
              role="checkbox"
              aria-checked={med.tomado ? 'true' : 'false'}
              onClick={() => aoAlternar(med)}
              data-cy="medicamentos-checkbox"
              aria-label={
                med.tomado
                  ? `Desmarcar ${med.nome} como tomado`
                  : `Marcar ${med.nome} como tomado`
              }
            >
              {med.tomado ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5L6.5 12L13 4.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>

            <div className="checklist-medicamentos__info">
              <p className="checklist-medicamentos__nome">
                <Link
                  className="checklist-medicamentos__nome-link"
                  to={`/medicamentos/${med.id}`}
                  data-cy="medicamentos-nome"
                >
                  <strong>{med.nome}</strong>
                </Link>
                {med.dose ? (
                  <span className="checklist-medicamentos__dose">
                    {' — '}
                    {med.dose}
                  </span>
                ) : null}
              </p>
              <p
                className="checklist-medicamentos__horario"
                data-cy="medicamentos-horario"
              >
                {formatarHorario(med.horario)}
              </p>
              {modo === 'completo' ? (
                <span
                  className="checklist-medicamentos__status"
                  data-cy="medicamentos-status"
                  data-status={statusDoDia(med)}
                >
                  <StatusBadge tom={TOM_STATUS[statusDoDia(med)]}>
                    {ROTULO_STATUS[statusDoDia(med)]}
                  </StatusBadge>
                </span>
              ) : null}
              {modo === 'completo' && med.instrucoes ? (
                <p
                  className="checklist-medicamentos__instrucoes"
                  data-cy="medicamentos-instrucoes"
                >
                  {med.instrucoes}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ChecklistMedicamentos
