/**
 * Detalhe de uma paciente na area da medica.
 *
 * Mostra os dados basicos, o status de acesso (selo), as consultas e os
 * medicamentos. A escrita (agendar consulta / cadastrar medicamento) so aparece
 * para quem o backend autoriza (`permissao.pode_editar`). Quem esta em modo de
 * visualizacao pode assumir o atendimento, com motivo registrado na trilha de
 * auditoria, para liberar a edicao.
 */

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../components/Button/Button'
import Modal from '../../components/ui/Modal/Modal'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import {
  assumirAtendimento,
  criarConsulta,
  criarMedicamento,
  obterPaciente,
} from '../../services/medicaService'
import type {
  Consulta,
  EntradaAssumir,
  Medicamento,
  MotivoAssumir,
  PacienteDetalhe,
} from '../../types'
import { tomDoPapel } from './permissaoUi'

interface Props {
  pacienteId: number
  aoAtualizarResumo?: () => void
}

interface Feedback {
  tipo: 'erro' | 'sucesso'
  texto: string
}

interface FormConsulta {
  data_horario: string
  local: string
  observacoes: string
}

interface FormMedicamento {
  nome: string
  dose: string
  horario: string
  instrucoes: string
}

function formatarDataHora(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const CONSULTA_VAZIA: FormConsulta = {
  data_horario: '',
  local: '',
  observacoes: '',
}

const MEDICAMENTO_VAZIO: FormMedicamento = {
  nome: '',
  dose: '',
  horario: '',
  instrucoes: '',
}

const MOTIVOS_ASSUMIR: { valor: MotivoAssumir; rotulo: string }[] = [
  { valor: 'cobertura_agenda', rotulo: 'Cobertura de agenda' },
  { valor: 'plantao', rotulo: 'Plantao' },
  { valor: 'consulta_compartilhada', rotulo: 'Consulta compartilhada' },
  { valor: 'retorno_emergencial', rotulo: 'Retorno emergencial' },
  { valor: 'outro', rotulo: 'Outro' },
]

function DetalhePaciente({ pacienteId, aoAtualizarResumo }: Props) {
  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const [formConsulta, setFormConsulta] = useState<FormConsulta>(CONSULTA_VAZIA)
  const [formMedicamento, setFormMedicamento] =
    useState<FormMedicamento>(MEDICAMENTO_VAZIO)
  const [enviandoConsulta, setEnviandoConsulta] = useState(false)
  const [enviandoMedicamento, setEnviandoMedicamento] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [assumirAberto, setAssumirAberto] = useState(false)
  const [motivo, setMotivo] = useState<MotivoAssumir>(
    MOTIVOS_ASSUMIR[0].valor,
  )
  const [observacao, setObservacao] = useState('')
  const [enviandoAssumir, setEnviandoAssumir] = useState(false)
  const [erroAssumir, setErroAssumir] = useState<string | null>(null)

  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const dados = await obterPaciente(pacienteId)
        if (!cancelado) {
          setPaciente(dados)
          setErro(false)
        }
      } catch {
        if (!cancelado) setErro(true)
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [pacienteId, recarregar])

  async function enviarConsulta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formConsulta.data_horario) {
      setFeedback({
        tipo: 'erro',
        texto: 'Informe a data e o horario da consulta.',
      })
      return
    }
    setEnviandoConsulta(true)
    setFeedback(null)
    try {
      await criarConsulta(pacienteId, formConsulta as Partial<Consulta>)
      setFormConsulta(CONSULTA_VAZIA)
      setFeedback({ tipo: 'sucesso', texto: 'Consulta agendada.' })
      setRecarregar((n) => n + 1)
      aoAtualizarResumo?.()
    } catch {
      setFeedback({
        tipo: 'erro',
        texto: 'Nao foi possivel agendar a consulta.',
      })
    } finally {
      setEnviandoConsulta(false)
    }
  }

  async function enviarMedicamento(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formMedicamento.nome.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe o nome do medicamento.' })
      return
    }
    const dados: Partial<Medicamento> = {
      nome: formMedicamento.nome,
      dose: formMedicamento.dose,
      instrucoes: formMedicamento.instrucoes,
    }
    if (formMedicamento.horario) {
      dados.horario = formMedicamento.horario
    }
    setEnviandoMedicamento(true)
    setFeedback(null)
    try {
      await criarMedicamento(pacienteId, dados)
      setFormMedicamento(MEDICAMENTO_VAZIO)
      setFeedback({ tipo: 'sucesso', texto: 'Medicamento cadastrado.' })
      setRecarregar((n) => n + 1)
      aoAtualizarResumo?.()
    } catch {
      setFeedback({
        tipo: 'erro',
        texto: 'Nao foi possivel cadastrar o medicamento.',
      })
    } finally {
      setEnviandoMedicamento(false)
    }
  }

  function abrirAssumir() {
    setMotivo(MOTIVOS_ASSUMIR[0].valor)
    setObservacao('')
    setErroAssumir(null)
    setAssumirAberto(true)
  }

  async function confirmarAssumir() {
    if (motivo === 'outro' && !observacao.trim()) {
      setErroAssumir('Descreva o motivo quando escolher "Outro".')
      return
    }
    setEnviandoAssumir(true)
    setErroAssumir(null)
    const dados: EntradaAssumir = {
      motivo,
      observacao: observacao.trim(),
    }
    try {
      await assumirAtendimento(pacienteId, dados)
      setAssumirAberto(false)
      setFeedback({
        tipo: 'sucesso',
        texto: 'Atendimento assumido. Voce ja pode registrar alteracoes.',
      })
      setRecarregar((n) => n + 1)
      aoAtualizarResumo?.()
    } catch {
      setErroAssumir('Nao foi possivel assumir o atendimento. Tente novamente.')
    } finally {
      setEnviandoAssumir(false)
    }
  }

  if (carregando) {
    return <p className="area-medica__estado">Carregando paciente...</p>
  }
  if (erro || !paciente) {
    return (
      <p className="area-medica__estado">
        Nao foi possivel carregar a paciente.
      </p>
    )
  }

  const permissao = paciente.permissao
  const podeEditar = permissao ? permissao.pode_editar : true
  const consultas = paciente.consultas ?? []
  const medicamentos = paciente.medicamentos ?? []

  return (
    <div className="detalhe" data-cy="detalhe-paciente">
      <header className="detalhe__cabecalho">
        <div className="detalhe__cabecalho-linha">
          <h2>{paciente.nome_completo}</h2>
          {permissao ? (
            <StatusBadge
              tom={tomDoPapel(permissao.papel)}
              dataCy="detalhe-permissao"
            >
              {permissao.rotulo}
            </StatusBadge>
          ) : null}
        </div>
        <p className="detalhe__meta">
          {paciente.email}
          {paciente.telefone ? ` - ${paciente.telefone}` : ''}
        </p>
      </header>

      {feedback ? (
        <p
          className={`detalhe__feedback detalhe__feedback--${feedback.tipo}`}
          role="alert"
          data-cy="detalhe-feedback"
        >
          {feedback.texto}
        </p>
      ) : null}

      {!podeEditar ? (
        <div className="detalhe__leitura" data-cy="detalhe-somente-leitura">
          <p>
            Voce esta em modo de visualizacao. Para registrar consultas ou
            medicamentos, assuma o atendimento; o motivo fica na trilha de
            auditoria.
          </p>
          <Button onClick={abrirAssumir} dataCy="assumir-abrir">
            Assumir atendimento
          </Button>
        </div>
      ) : null}

      <div className="detalhe__colunas">
        <section className="detalhe__bloco">
          <h3>Consultas</h3>
          {consultas.length === 0 ? (
            <p className="detalhe__vazio">Nenhuma consulta registrada.</p>
          ) : (
            <ul className="detalhe__itens" data-cy="lista-consultas">
              {consultas.map((consulta) => (
                <li key={consulta.id} className="detalhe__item">
                  <strong>{formatarDataHora(consulta.data_horario)}</strong>
                  <span>
                    {consulta.status_label}
                    {consulta.local ? ` - ${consulta.local}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {podeEditar ? (
            <form className="detalhe__form" onSubmit={enviarConsulta}>
              <h4>Agendar consulta</h4>
              <label>
                Data e horario
                <input
                  type="datetime-local"
                  value={formConsulta.data_horario}
                  onChange={(e) =>
                    setFormConsulta({
                      ...formConsulta,
                      data_horario: e.target.value,
                    })
                  }
                  data-cy="consulta-data"
                  required
                />
              </label>
              <label>
                Local
                <input
                  type="text"
                  value={formConsulta.local}
                  onChange={(e) =>
                    setFormConsulta({ ...formConsulta, local: e.target.value })
                  }
                  placeholder="Ex.: Clinica Amare"
                  data-cy="consulta-local"
                />
              </label>
              <label>
                Observacoes
                <textarea
                  value={formConsulta.observacoes}
                  onChange={(e) =>
                    setFormConsulta({
                      ...formConsulta,
                      observacoes: e.target.value,
                    })
                  }
                  rows={2}
                />
              </label>
              <Button
                type="submit"
                dataCy="consulta-enviar"
                disabled={enviandoConsulta}
              >
                {enviandoConsulta ? 'Agendando...' : 'Agendar consulta'}
              </Button>
            </form>
          ) : null}
        </section>

        <section className="detalhe__bloco">
          <h3>Medicamentos</h3>
          {medicamentos.length === 0 ? (
            <p className="detalhe__vazio">Nenhum medicamento ativo.</p>
          ) : (
            <ul className="detalhe__itens" data-cy="lista-medicamentos">
              {medicamentos.map((medicamento) => (
                <li key={medicamento.id} className="detalhe__item">
                  <strong>{medicamento.nome}</strong>
                  <span>
                    {[medicamento.dose, medicamento.horario]
                      .filter(Boolean)
                      .join(' - ')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {podeEditar ? (
            <form className="detalhe__form" onSubmit={enviarMedicamento}>
              <h4>Cadastrar medicamento</h4>
              <label>
                Nome
                <input
                  type="text"
                  value={formMedicamento.nome}
                  onChange={(e) =>
                    setFormMedicamento({
                      ...formMedicamento,
                      nome: e.target.value,
                    })
                  }
                  placeholder="Ex.: Progesterona"
                  data-cy="medicamento-nome"
                  required
                />
              </label>
              <label>
                Dose
                <input
                  type="text"
                  value={formMedicamento.dose}
                  onChange={(e) =>
                    setFormMedicamento({
                      ...formMedicamento,
                      dose: e.target.value,
                    })
                  }
                  placeholder="Ex.: 200mg"
                />
              </label>
              <label>
                Horario
                <input
                  type="time"
                  value={formMedicamento.horario}
                  onChange={(e) =>
                    setFormMedicamento({
                      ...formMedicamento,
                      horario: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Instrucoes
                <textarea
                  value={formMedicamento.instrucoes}
                  onChange={(e) =>
                    setFormMedicamento({
                      ...formMedicamento,
                      instrucoes: e.target.value,
                    })
                  }
                  rows={2}
                />
              </label>
              <Button
                type="submit"
                dataCy="medicamento-enviar"
                disabled={enviandoMedicamento}
              >
                {enviandoMedicamento
                  ? 'Cadastrando...'
                  : 'Cadastrar medicamento'}
              </Button>
            </form>
          ) : null}
        </section>
      </div>

      <Modal
        aberto={assumirAberto}
        onFechar={() => setAssumirAberto(false)}
        titulo="Assumir atendimento"
        dataCy="assumir-dialog"
        rodape={
          <>
            <Button
              variant="secondary"
              onClick={() => setAssumirAberto(false)}
              disabled={enviandoAssumir}
              dataCy="assumir-cancelar"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarAssumir}
              disabled={enviandoAssumir}
              dataCy="assumir-confirmar"
            >
              {enviandoAssumir ? 'Assumindo...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        <p className="detalhe__assumir-texto">
          Voce passara a poder editar esta paciente. A acao e as edicoes
          seguintes ficam registradas na trilha de auditoria.
        </p>
        <label className="detalhe__assumir-campo">
          Motivo
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoAssumir)}
            data-cy="assumir-motivo"
          >
            {MOTIVOS_ASSUMIR.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="detalhe__assumir-campo">
          {motivo === 'outro'
            ? 'Observacao (obrigatoria)'
            : 'Observacao (opcional)'}
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            data-cy="assumir-observacao"
          />
        </label>
        {erroAssumir ? (
          <p
            className="detalhe__assumir-erro"
            role="alert"
            data-cy="assumir-erro"
          >
            {erroAssumir}
          </p>
        ) : null}
      </Modal>
    </div>
  )
}

export default DetalhePaciente
