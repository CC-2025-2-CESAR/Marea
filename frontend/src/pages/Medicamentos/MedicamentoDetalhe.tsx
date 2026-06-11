import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import {
  alternarTomada,
  obterMedicamento,
} from '../../services/medicamentosService'
import type { Medicamento, StatusDiaMedicamento } from '../../types'
import './MedicamentoDetalhe.css'

const ROTULO_STATUS: Record<StatusDiaMedicamento, string> = {
  tomado: 'Tomado',
  atrasado: 'Atrasado',
  pendente: 'Pendente',
}

const TOM_STATUS: Record<
  StatusDiaMedicamento,
  'sucesso' | 'aviso' | 'neutro'
> = {
  tomado: 'sucesso',
  atrasado: 'aviso',
  pendente: 'neutro',
}

function statusDoDia(medicamento: Medicamento): StatusDiaMedicamento {
  if (medicamento.tomado) return 'tomado'
  return medicamento.status_dia ?? 'pendente'
}

function formatarHorario(horario?: string): string {
  if (!horario) return 'Sem horário fixo'
  return horario.slice(0, 5)
}

/**
 * Página de detalhe de um medicamento (`/medicamentos/:id`): dose, horário,
 * instruções e armazenamento, com o status do dia e a ação de marcar como
 * tomado. Estados de carregando, erro e não encontrado (404).
 */
function MedicamentoDetalhe() {
  const { id } = useParams()
  const [medicamento, setMedicamento] = useState<Medicamento | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [erro, setErro] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const [erroAtualizacao, setErroAtualizacao] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setCarregando(true)
      setNaoEncontrado(false)
      setErro(false)
      try {
        const dados = await obterMedicamento(Number(id))
        if (!cancelado) setMedicamento(dados)
      } catch (e: unknown) {
        if (cancelado) return
        const status =
          e && typeof e === 'object' && 'status' in e
            ? (e as { status?: number }).status
            : undefined
        if (status === 404) {
          setNaoEncontrado(true)
        } else {
          setErro(true)
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  async function aoAlternar() {
    if (!medicamento || atualizando) return
    const anterior = medicamento
    const novoEstado = !medicamento.tomado

    setMedicamento({ ...medicamento, tomado: novoEstado })
    setAtualizando(true)
    setErroAtualizacao(false)

    try {
      const atualizado = await alternarTomada(medicamento.id, novoEstado)
      setMedicamento((atual) =>
        atual ? { ...atual, ...atualizado } : atualizado,
      )
    } catch {
      setMedicamento(anterior)
      setErroAtualizacao(true)
    } finally {
      setAtualizando(false)
    }
  }

  const status = medicamento ? statusDoDia(medicamento) : 'pendente'

  return (
    <section className="medicamento-detalhe" data-cy="page-medicamento-detalhe">
      <Link
        className="medicamento-detalhe__voltar"
        to="/medicamentos"
        data-cy="medicamento-detalhe-voltar"
      >
        ← Voltar aos medicamentos
      </Link>

      {carregando ? (
        <p
          className="medicamento-detalhe__mensagem"
          data-cy="medicamento-detalhe-carregando"
        >
          Carregando medicamento...
        </p>
      ) : naoEncontrado ? (
        <div data-cy="medicamento-detalhe-nao-encontrado">
          <EmptyState
            titulo="Medicamento não encontrado"
            descricao="Esse medicamento não existe ou não está mais ativo na sua rotina."
            acao={
              <Link className="medicamento-detalhe__acao" to="/medicamentos">
                Ver meus medicamentos
              </Link>
            }
          />
        </div>
      ) : erro ? (
        <p
          className="medicamento-detalhe__mensagem medicamento-detalhe__mensagem--erro"
          role="alert"
          data-cy="medicamento-detalhe-erro"
        >
          Não foi possível carregar o medicamento no momento.
        </p>
      ) : medicamento ? (
        <article className="medicamento-detalhe__conteudo">
          <header className="medicamento-detalhe__cabecalho">
            <div className="medicamento-detalhe__titulo-linha">
              <h1 data-cy="medicamento-detalhe-titulo">{medicamento.nome}</h1>
              <span
                className="medicamento-detalhe__status"
                data-cy="medicamento-detalhe-status"
                data-status={status}
              >
                <StatusBadge tom={TOM_STATUS[status]}>
                  {ROTULO_STATUS[status]}
                </StatusBadge>
              </span>
            </div>
            {medicamento.dose ? (
              <p
                className="medicamento-detalhe__dose"
                data-cy="medicamento-detalhe-dose"
              >
                {medicamento.dose}
              </p>
            ) : null}
          </header>

          <dl className="medicamento-detalhe__campos">
            <div className="medicamento-detalhe__campo">
              <dt>Horário</dt>
              <dd data-cy="medicamento-detalhe-horario">
                {formatarHorario(medicamento.horario)}
              </dd>
            </div>
            {medicamento.instrucoes ? (
              <div className="medicamento-detalhe__campo">
                <dt>Como tomar</dt>
                <dd data-cy="medicamento-detalhe-instrucoes">
                  {medicamento.instrucoes}
                </dd>
              </div>
            ) : null}
            {medicamento.armazenamento ? (
              <div className="medicamento-detalhe__campo">
                <dt>Armazenamento</dt>
                <dd data-cy="medicamento-detalhe-armazenamento">
                  {medicamento.armazenamento}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="medicamento-detalhe__acoes">
            <button
              type="button"
              className="medicamento-detalhe__marcar"
              onClick={aoAlternar}
              disabled={atualizando}
              data-cy="medicamento-detalhe-marcar"
              aria-pressed={medicamento.tomado ? 'true' : 'false'}
            >
              {medicamento.tomado
                ? 'Tomado hoje ✓'
                : 'Marcar como tomado hoje'}
            </button>
            {erroAtualizacao ? (
              <p
                className="medicamento-detalhe__erro-toast"
                role="alert"
                data-cy="medicamento-detalhe-erro-toggle"
              >
                Não conseguimos atualizar agora. Tente novamente.
              </p>
            ) : null}
          </div>

          <p
            className="medicamento-detalhe__aviso"
            data-cy="medicamento-detalhe-aviso"
          >
            Siga sempre a orientação da sua equipe médica. Em caso de dúvida
            sobre dose ou horário, fale com a clínica.
          </p>
        </article>
      ) : null}
    </section>
  )
}

export default MedicamentoDetalhe
