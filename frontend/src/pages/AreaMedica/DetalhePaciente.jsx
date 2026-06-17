/**
 * Detalhe de uma paciente na área da médica.
 *
 * Mostra os dados básicos, o status de acesso (selo), as consultas e os
 * medicamentos. A escrita (agendar consulta / cadastrar medicamento) só aparece
 * para quem o backend autoriza (`permissao.pode_editar`). Quem está em modo de
 * visualização pode **assumir o atendimento** — com motivo registrado na trilha
 * de auditoria — para liberar a edição.
 */

import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button'
import Modal from '../../components/ui/Modal/Modal'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import {
  assumirAtendimento,
  criarConsulta,
  criarMedicamento,
  obterPaciente,
} from '../../services/medicaService'
import { tomDoPapel } from './permissaoUi'

function formatarDataHora(iso) {
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

const CONSULTA_VAZIA = { data_horario: '', local: '', observacoes: '' }
const MEDICAMENTO_VAZIO = { nome: '', dose: '', horario: '', instrucoes: '' }

// Motivos para assumir o atendimento (espelham o backend; "outro" exige
// observação).
const MOTIVOS_ASSUMIR = [
  { valor: 'cobertura_agenda', rotulo: 'Cobertura de agenda' },
  { valor: 'plantao', rotulo: 'Plantão' },
  { valor: 'consulta_compartilhada', rotulo: 'Consulta compartilhada' },
  { valor: 'retorno_emergencial', rotulo: 'Retorno emergencial' },
  { valor: 'outro', rotulo: 'Outro' },
]

function DetalhePaciente({ pacienteId, aoAtualizarResumo }) {
  const [paciente, setPaciente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const [formConsulta, setFormConsulta] = useState(CONSULTA_VAZIA)
  const [formMedicamento, setFormMedicamento] = useState(MEDICAMENTO_VAZIO)
  const [enviandoConsulta, setEnviandoConsulta] = useState(false)
  const [enviandoMedicamento, setEnviandoMedicamento] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const [assumirAberto, setAssumirAberto] = useState(false)
  const [motivo, setMotivo] = useState(MOTIVOS_ASSUMIR[0].valor)
  const [observacao, setObservacao] = useState('')
  const [enviandoAssumir, setEnviandoAssumir] = useState(false)
  const [erroAssumir, setErroAssumir] = useState(null)

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

  async function enviarConsulta(evento) {
    evento.preventDefault()
    if (!formConsulta.data_horario) {
      setFeedback({ tipo: 'erro', texto: 'Informe a data e o horário da consulta.' })
      return
    }
    setEnviandoConsulta(true)
    setFeedback(null)
    try {
      await criarConsulta(pacienteId, formConsulta)
      setFormConsulta(CONSULTA_VAZIA)
      setFeedback({ tipo: 'sucesso', texto: 'Consulta agendada.' })
      setRecarregar((n) => n + 1)
      aoAtualizarResumo?.()
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Não foi possível agendar a consulta.' })
    } finally {
      setEnviandoConsulta(false)
    }
  }

  async function enviarMedicamento(evento) {
    evento.preventDefault()
    if (!formMedicamento.nome.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe o nome do medicamento.' })
      return
    }
    // Omite o horário quando vazio: o campo é opcional e o backend não aceita
    // string vazia em um campo de hora.
    const dados = {
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
      setFeedback({ tipo: 'erro', texto: 'Não foi possível cadastrar o medicamento.' })
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
    try {
      await assumirAtendimento(pacienteId, {
        motivo,
        observacao: observacao.trim(),
      })
      setAssumirAberto(false)
      setFeedback({
        tipo: 'sucesso',
        texto: 'Atendimento assumido. Você já pode registrar alterações.',
      })
      setRecarregar((n) => n + 1)
      aoAtualizarResumo?.()
    } catch {
      setErroAssumir('Não foi possível assumir o atendimento. Tente novamente.')
    } finally {
      setEnviandoAssumir(false)
    }
  }

  if (carregando) {
    return <p className="area-medica__estado">Carregando paciente…</p>
  }
  if (erro || !paciente) {
    return (
      <p className="area-medica__estado">Não foi possível carregar a paciente.</p>
    )
  }

  const permissao = paciente.permissao
  // Sem permissão no payload (ex.: dado antigo), assume editável — o backend
  // continua sendo a barreira real.
  const podeEditar = permissao ? permissao.pode_editar : true

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
          {paciente.telefone ? ` · ${paciente.telefone}` : ''}
        </p>
      </header>

      {feedback && (
        <p
          className={`detalhe__feedback detalhe__feedback--${feedback.tipo}`}
          role="alert"
          data-cy="detalhe-feedback"
        >
          {feedback.texto}
        </p>
      )}

      {!podeEditar && (
        <div className="detalhe__leitura" data-cy="detalhe-somente-leitura">
          <p>
            Você está em modo de visualização. Para registrar consultas ou
            medicamentos, assuma o atendimento — o motivo fica na trilha de
            auditoria.
          </p>
          <Button onClick={abrirAssumir} dataCy="assumir-abrir">
            Assumir atendimento
          </Button>
        </div>
      )}

      <div className="detalhe__colunas">
        <section className="detalhe__bloco">
          <h3>Consultas</h3>
          {paciente.consultas.length === 0 ? (
            <p className="detalhe__vazio">Nenhuma consulta registrada.</p>
          ) : (
            <ul className="detalhe__itens" data-cy="lista-consultas">
              {paciente.consultas.map((consulta) => (
                <li key={consulta.id} className="detalhe__item">
                  <strong>{formatarDataHora(consulta.data_horario)}</strong>
                  <span>
                    {consulta.status_label}
                    {consulta.local ? ` · ${consulta.local}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {podeEditar && (
            <form className="detalhe__form" onSubmit={enviarConsulta}>
              <h4>Agendar consulta</h4>
              <label>
                Data e horário
                <input
                  type="datetime-local"
                  value={formConsulta.data_horario}
                  onChange={(e) =>
                    setFormConsulta({ ...formConsulta, data_horario: e.target.value })
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
                  placeholder="Ex.: Clínica Amare"
                  data-cy="consulta-local"
                />
              </label>
              <label>
                Observações
                <textarea
                  value={formConsulta.observacoes}
                  onChange={(e) =>
                    setFormConsulta({ ...formConsulta, observacoes: e.target.value })
                  }
                  rows={2}
                />
              </label>
              <Button type="submit" dataCy="consulta-enviar" disabled={enviandoConsulta}>
                {enviandoConsulta ? 'Agendando…' : 'Agendar consulta'}
              </Button>
            </form>
          )}
        </section>

        <section className="detalhe__bloco">
          <h3>Medicamentos</h3>
          {paciente.medicamentos.length === 0 ? (
            <p className="detalhe__vazio">Nenhum medicamento ativo.</p>
          ) : (
            <ul className="detalhe__itens" data-cy="lista-medicamentos">
              {paciente.medicamentos.map((medicamento) => (
                <li key={medicamento.id} className="detalhe__item">
                  <strong>{medicamento.nome}</strong>
                  <span>
                    {[medicamento.dose, medicamento.horario]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {podeEditar && (
            <form className="detalhe__form" onSubmit={enviarMedicamento}>
              <h4>Cadastrar medicamento</h4>
              <label>
                Nome
                <input
                  type="text"
                  value={formMedicamento.nome}
                  onChange={(e) =>
                    setFormMedicamento({ ...formMedicamento, nome: e.target.value })
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
                    setFormMedicamento({ ...formMedicamento, dose: e.target.value })
                  }
                  placeholder="Ex.: 200mg"
                />
              </label>
              <label>
                Horário
                <input
                  type="time"
                  value={formMedicamento.horario}
                  onChange={(e) =>
                    setFormMedicamento({ ...formMedicamento, horario: e.target.value })
                  }
                />
              </label>
              <label>
                Instruções
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
                {enviandoMedicamento ? 'Cadastrando…' : 'Cadastrar medicamento'}
              </Button>
            </form>
          )}
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
              {enviandoAssumir ? 'Assumindo…' : 'Confirmar'}
            </Button>
          </>
        }
      >
        <p className="detalhe__assumir-texto">
          Você passará a poder editar esta paciente. A ação e as edições
          seguintes ficam registradas na trilha de auditoria.
        </p>
        <label className="detalhe__assumir-campo">
          Motivo
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
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
          {motivo === 'outro' ? 'Observação (obrigatória)' : 'Observação (opcional)'}
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            data-cy="assumir-observacao"
          />
        </label>
        {erroAssumir && (
          <p className="detalhe__assumir-erro" role="alert" data-cy="assumir-erro">
            {erroAssumir}
          </p>
        )}
      </Modal>
    </div>
  )
}

export default DetalhePaciente
