/**
 * Detalhe de uma paciente na área da médica.
 *
 * Mostra os dados básicos, as consultas e os medicamentos da paciente, e
 * oferece dois formulários para a médica agendar consulta e cadastrar
 * medicamento. Após cada criação, recarrega o detalhe e avisa a tela-mãe para
 * atualizar os contadores da lista.
 */

import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button'
import {
  criarConsulta,
  criarMedicamento,
  obterPaciente,
} from '../../services/medicaService'

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

function DetalhePaciente({ pacienteId, aoAtualizarResumo }) {
  const [paciente, setPaciente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const [formConsulta, setFormConsulta] = useState(CONSULTA_VAZIA)
  const [formMedicamento, setFormMedicamento] = useState(MEDICAMENTO_VAZIO)
  const [enviandoConsulta, setEnviandoConsulta] = useState(false)
  const [enviandoMedicamento, setEnviandoMedicamento] = useState(false)
  const [feedback, setFeedback] = useState(null)

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

  if (carregando) {
    return <p className="area-medica__estado">Carregando paciente…</p>
  }
  if (erro || !paciente) {
    return (
      <p className="area-medica__estado">Não foi possível carregar a paciente.</p>
    )
  }

  return (
    <div className="detalhe" data-cy="detalhe-paciente">
      <header className="detalhe__cabecalho">
        <h2>{paciente.nome_completo}</h2>
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
        </section>
      </div>
    </div>
  )
}

export default DetalhePaciente
