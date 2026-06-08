import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'
import SelectField from '../../components/SelectField/SelectField'
import {
  atualizarRegistroCiclo,
  criarRegistroCiclo,
  excluirRegistroCiclo,
  listarRegistrosCiclo,
  obterPrevisoesCiclo,
} from '../../services/cicloService'
import './Ciclo.css'

const OPCOES_ETAPA = [
  { valor: 'menstruacao', rotulo: 'Menstruação' },
  { valor: 'folicular', rotulo: 'Fase folicular' },
  { valor: 'ovulacao', rotulo: 'Ovulação' },
  { valor: 'lutea', rotulo: 'Fase lútea' },
]

const OPCOES_STATUS = [
  { valor: 'registrado', rotulo: 'Registrado' },
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'concluido', rotulo: 'Concluído' },
]

// A previsão é apenas uma estimativa — nunca substitui orientação médica.
const AVISO_PREVISAO =
  'Estimativa baseada nos seus registros. Não substitui a orientação da equipe médica.'

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatarData(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function Ciclo() {
  const [registros, setRegistros] = useState([])
  const [previsoes, setPrevisoes] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [data, setData] = useState(hojeISO())
  const [etapa, setEtapa] = useState('menstruacao')
  const [statusCiclo, setStatusCiclo] = useState('registrado')
  const [observacoes, setObservacoes] = useState('')
  const [editandoId, setEditandoId] = useState(null)

  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const [lista, prev] = await Promise.all([
          listarRegistrosCiclo(),
          obterPrevisoesCiclo(),
        ])
        if (!cancelado) {
          setRegistros(Array.isArray(lista) ? lista : [])
          setPrevisoes(prev || null)
        }
      } catch {
        if (!cancelado) {
          setRegistros([])
          setErro('Não foi possível carregar seu ciclo no momento.')
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  async function recarregarPrevisoes() {
    try {
      const prev = await obterPrevisoesCiclo()
      setPrevisoes(prev || null)
    } catch {
      // A previsão é secundária: se falhar, mantém a anterior sem travar a tela.
    }
  }

  function limparFormulario() {
    setEditandoId(null)
    setData(hojeISO())
    setEtapa('menstruacao')
    setStatusCiclo('registrado')
    setObservacoes('')
  }

  function iniciarEdicao(registro) {
    setEditandoId(registro.id)
    setData(registro.data)
    setEtapa(registro.etapa)
    setStatusCiclo(registro.status)
    setObservacoes(registro.observacoes || '')
    setErroEnvio(null)
    setSucesso(null)
  }

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErroEnvio(null)
    setSucesso(null)

    if (!data || !etapa) {
      setErroEnvio('Informe a data e a etapa do ciclo.')
      return
    }

    const payload = {
      data,
      etapa,
      status: statusCiclo,
      observacoes: observacoes.trim(),
    }

    setEnviando(true)
    try {
      if (editandoId) {
        const atualizado = await atualizarRegistroCiclo(editandoId, payload)
        setRegistros((atuais) =>
          atuais.map((r) => (r.id === editandoId ? atualizado : r)),
        )
        setSucesso('Registro atualizado.')
      } else {
        const criado = await criarRegistroCiclo(payload)
        setRegistros((atuais) => [criado, ...atuais])
        setSucesso('Registro salvo.')
      }
      limparFormulario()
      recarregarPrevisoes()
    } catch {
      setErroEnvio('Não foi possível salvar o registro. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function confirmarExclusao(id) {
    try {
      await excluirRegistroCiclo(id)
      setRegistros((atuais) => atuais.filter((r) => r.id !== id))
      setConfirmandoId(null)
      if (editandoId === id) {
        limparFormulario()
      }
      recarregarPrevisoes()
    } catch {
      setErroEnvio('Não foi possível excluir o registro. Tente novamente.')
      setConfirmandoId(null)
    }
  }

  const temPrevisao = previsoes && previsoes.tem_dados

  return (
    <section className="ciclo-pagina" data-cy="page-ciclo">
      <header className="ciclo-cabecalho">
        <h1>Meu ciclo</h1>
        <p>
          Registre as fases do seu ciclo para acompanhar e ver uma estimativa
          dos próximos dias. Só você vê os seus registros.
        </p>
      </header>

      <section
        className="ciclo-previsoes"
        data-cy="ciclo-previsoes"
        aria-label="Previsões do ciclo"
      >
        <h2 className="ciclo-previsoes__titulo">Previsões</h2>
        {temPrevisao ? (
          <div className="ciclo-previsoes__grade">
            <div className="ciclo-previsao" data-cy="ciclo-previsao-proxima">
              <span className="ciclo-previsao__rotulo">Próxima menstruação</span>
              <strong className="ciclo-previsao__valor">
                {formatarData(previsoes.proxima_menstruacao)}
              </strong>
            </div>
            <div className="ciclo-previsao" data-cy="ciclo-previsao-fertil">
              <span className="ciclo-previsao__rotulo">Período fértil estimado</span>
              <strong className="ciclo-previsao__valor">
                {formatarData(previsoes.janela_fertil_inicio)} a{' '}
                {formatarData(previsoes.janela_fertil_fim)}
              </strong>
            </div>
            <div className="ciclo-previsao">
              <span className="ciclo-previsao__rotulo">Ciclo médio</span>
              <strong className="ciclo-previsao__valor">
                {previsoes.ciclo_medio_dias} dias
              </strong>
            </div>
          </div>
        ) : (
          <p className="ciclo-previsoes__vazia" data-cy="ciclo-previsao-vazia">
            {previsoes?.mensagem ||
              'Registre pelo menos dois inícios de menstruação para ver as previsões.'}
          </p>
        )}
        <p className="ciclo-previsoes__aviso" data-cy="ciclo-aviso">
          {AVISO_PREVISAO}
        </p>
      </section>

      <form className="ciclo-form" onSubmit={handleSubmit} data-cy="ciclo-form">
        <h2 className="ciclo-form__titulo">
          {editandoId ? 'Editar registro' : 'Novo registro'}
        </h2>
        <div className="ciclo-form__linha">
          <InputField
            id="ciclo-data"
            name="data"
            label="Data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            dataCy="ciclo-data"
          />
          <SelectField
            id="ciclo-etapa"
            label="Etapa do ciclo"
            value={etapa}
            onChange={(valor) => setEtapa(valor)}
            opcoes={OPCOES_ETAPA}
            dataCy="ciclo-etapa"
          />
          <SelectField
            id="ciclo-status"
            label="Status"
            value={statusCiclo}
            onChange={(valor) => setStatusCiclo(valor)}
            opcoes={OPCOES_STATUS}
            dataCy="ciclo-status"
          />
        </div>

        <div className="ciclo-campo">
          <label className="ciclo-campo__label" htmlFor="ciclo-observacoes">
            Observações (opcional)
          </label>
          <textarea
            id="ciclo-observacoes"
            className="ciclo-textarea"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Ex.: fluxo intenso, cólica, humor."
            data-cy="ciclo-observacoes"
          />
        </div>

        {erroEnvio ? (
          <p className="ciclo-mensagem--erro" role="alert" data-cy="ciclo-erro-envio">
            {erroEnvio}
          </p>
        ) : null}
        {sucesso ? (
          <p className="ciclo-mensagem--sucesso" role="status" data-cy="ciclo-sucesso">
            {sucesso}
          </p>
        ) : null}

        <div className="ciclo-form__acoes">
          <Button type="submit" disabled={enviando} dataCy="ciclo-enviar">
            {enviando
              ? 'Salvando...'
              : editandoId
                ? 'Salvar alterações'
                : 'Salvar registro'}
          </Button>
          {editandoId ? (
            <Button
              type="button"
              variant="secondary"
              onClick={limparFormulario}
              dataCy="ciclo-cancelar-edicao"
            >
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <h2 className="ciclo-lista-titulo">Seus registros</h2>

      {carregando ? (
        <p className="ciclo-mensagem" data-cy="ciclo-carregando">
          Carregando seu ciclo...
        </p>
      ) : erro ? (
        <p className="ciclo-mensagem--erro" role="alert" data-cy="ciclo-erro">
          {erro}
        </p>
      ) : registros.length === 0 ? (
        <p className="ciclo-mensagem" data-cy="ciclo-vazia">
          Você ainda não tem registros. Use o formulário acima para criar o
          primeiro.
        </p>
      ) : (
        <ul className="ciclo-lista" data-cy="ciclo-lista">
          {registros.map((registro) => (
            <li
              key={registro.id}
              className="ciclo-item"
              data-cy="ciclo-item"
              data-etapa={registro.etapa}
            >
              <div className="ciclo-item__cabecalho">
                <span className="ciclo-item__etapa">
                  {registro.etapa_display}
                </span>
                <span className="ciclo-item__data">
                  {formatarData(registro.data)}
                </span>
              </div>
              {registro.observacoes ? (
                <p className="ciclo-item__observacoes">{registro.observacoes}</p>
              ) : null}
              <span className="ciclo-item__status">
                {registro.status_display}
              </span>

              {confirmandoId === registro.id ? (
                <div
                  className="ciclo-item__confirmar"
                  data-cy="ciclo-confirmar-exclusao"
                >
                  <span>Excluir este registro?</span>
                  <div className="ciclo-item__confirmar-acoes">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => confirmarExclusao(registro.id)}
                      dataCy="ciclo-confirmar-sim"
                    >
                      Sim, excluir
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setConfirmandoId(null)}
                      dataCy="ciclo-confirmar-nao"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="ciclo-item__acoes">
                  <button
                    type="button"
                    className="ciclo-item__botao"
                    onClick={() => iniciarEdicao(registro)}
                    data-cy="ciclo-item-editar"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="ciclo-item__botao ciclo-item__botao--perigo"
                    onClick={() => setConfirmandoId(registro.id)}
                    data-cy="ciclo-item-excluir"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Ciclo
