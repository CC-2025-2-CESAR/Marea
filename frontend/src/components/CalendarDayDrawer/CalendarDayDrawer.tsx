import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal/Modal'
import Button from '../Button/Button'
import InputField from '../InputField/InputField'
import SelectField from '../SelectField/SelectField'
import StatusBadge from '../ui/StatusBadge/StatusBadge'
import { useToast } from '../ui/Toast/useToast'
import { criarRegistroCiclo } from '../../services/cicloService'
import { criarSintoma } from '../../services/sintomasService'
import type {
  Consulta,
  EtapaCiclo,
  EventoTratamento,
  Medicamento,
  RegistroSintoma,
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
  /** Chamado após registrar ciclo/sintoma pelo dia (para a agenda re-derivar). */
  onRegistrado?: () => void
}

type ModoRegistro = null | 'ciclo' | 'sintoma'

const OPCOES_ETAPA: { valor: EtapaCiclo; rotulo: string }[] = [
  { valor: 'menstruacao', rotulo: 'Menstruação' },
  { valor: 'folicular', rotulo: 'Fase folicular' },
  { valor: 'ovulacao', rotulo: 'Ovulação' },
  { valor: 'lutea', rotulo: 'Fase lútea' },
]

const OPCOES_INTENSIDADE = [
  { valor: '', rotulo: 'Não informar' },
  { valor: '1', rotulo: '1 - Leve' },
  { valor: '2', rotulo: '2' },
  { valor: '3', rotulo: '3 - Moderada' },
  { valor: '4', rotulo: '4' },
  { valor: '5', rotulo: '5 - Intensa' },
]

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

// Data do dia selecionado em ISO 'YYYY-MM-DD' (local), formato que os
// endpoints de ciclo e sintomas esperam no payload.
function dataISO(data: Date | null) {
  if (!data) return ''
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
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
  onRegistrado,
}: Props) {
  const temConsultas = consultas.length > 0
  const temEventos = eventos.length > 0
  // Medicamentos são a rotina diária; o status (tomado/atrasado/pendente) só
  // faz sentido hoje, então a seção aparece apenas no dia de hoje.
  const temMedicamentos = ehHoje && medicamentos.length > 0
  const vazio = !temConsultas && !temEventos && !temMedicamentos

  // --- Registro pelo dia (ciclo ou sintoma) ---
  const [modo, setModo] = useState<ModoRegistro>(null)
  const [etapaCiclo, setEtapaCiclo] = useState<EtapaCiclo>('menstruacao')
  const [obsCiclo, setObsCiclo] = useState('')
  const [tipoSintoma, setTipoSintoma] = useState('')
  const [descricaoSintoma, setDescricaoSintoma] = useState('')
  const [intensidadeSintoma, setIntensidadeSintoma] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const { mostrarToast } = useToast()

  // O drawer é reusado entre dias; um dia só troca depois de fechar (o modal
  // cobre a grade). Então resetar o formulário ao fechar/salvar basta — sem
  // efeito sincronizando prop->estado.
  function limparRegistro() {
    setModo(null)
    setEtapaCiclo('menstruacao')
    setObsCiclo('')
    setTipoSintoma('')
    setDescricaoSintoma('')
    setIntensidadeSintoma('')
    setErro(null)
    setEnviando(false)
  }

  function fecharLimpo() {
    limparRegistro()
    onFechar()
  }

  async function salvarCiclo() {
    setEnviando(true)
    setErro(null)
    try {
      await criarRegistroCiclo({
        data: dataISO(data),
        etapa: etapaCiclo,
        status: 'registrado',
        observacoes: obsCiclo.trim(),
      })
      mostrarToast('Registro de ciclo salvo.', 'sucesso')
      onRegistrado?.()
      // Fecha o drawer: a paciente vê o toast e a marcação nova na grade.
      fecharLimpo()
    } catch {
      setEnviando(false)
      setErro('Não foi possível salvar agora. Tente novamente.')
    }
  }

  async function salvarSintoma() {
    if (!tipoSintoma.trim() || !descricaoSintoma.trim()) {
      setErro('Preencha o tipo e a descrição.')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const payload: Partial<RegistroSintoma> = {
        data: dataISO(data),
        tipo: tipoSintoma.trim(),
        descricao: descricaoSintoma.trim(),
      }
      if (intensidadeSintoma) payload.intensidade = Number(intensidadeSintoma)
      await criarSintoma(payload)
      mostrarToast('Registro salvo.', 'sucesso')
      onRegistrado?.()
      fecharLimpo()
    } catch {
      setEnviando(false)
      setErro('Não foi possível salvar agora. Tente novamente.')
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fecharLimpo}
      titulo={tituloDoDia(data)}
      dataCy="calendario-dia-drawer"
    >
      {vazio ? (
        <p className="calendario-dia__vazio" data-cy="calendario-dia-vazio">
          Nenhuma consulta ou evento neste dia. Você pode registrar algo abaixo.
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
                          onClick={fecharLimpo}
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

      <section
        className="calendario-dia__registrar"
        data-cy="calendario-dia-registrar"
      >
        <h3 className="calendario-dia__subtitulo">Registrar neste dia</h3>

        {modo === null ? (
          <div className="calendario-dia__registrar-acoes">
            <Button
              variant="secondary"
              onClick={() => {
                setErro(null)
                setModo('ciclo')
              }}
              dataCy="calendario-dia-registrar-ciclo"
            >
              Menstruação / ciclo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setErro(null)
                setModo('sintoma')
              }}
              dataCy="calendario-dia-registrar-sintoma"
            >
              Sintoma / observação
            </Button>
          </div>
        ) : null}

        {modo === 'ciclo' ? (
          <div className="calendario-dia__form" data-cy="calendario-dia-form-ciclo">
            <SelectField
              id="calendario-dia-ciclo-etapa"
              label="O que registrar"
              value={etapaCiclo}
              onChange={(valor: EtapaCiclo) => setEtapaCiclo(valor)}
              opcoes={OPCOES_ETAPA}
              dataCy="calendario-dia-ciclo-etapa"
            />
            <div className="calendario-dia__campo">
              <label
                className="calendario-dia__label"
                htmlFor="calendario-dia-ciclo-observacoes"
              >
                Observações (opcional)
              </label>
              <textarea
                id="calendario-dia-ciclo-observacoes"
                className="calendario-dia__textarea"
                value={obsCiclo}
                onChange={(e) => setObsCiclo(e.target.value)}
                rows={2}
                placeholder="Ex.: fluxo intenso, cólica, humor."
                data-cy="calendario-dia-ciclo-observacoes"
              />
            </div>
            {erro ? (
              <p
                className="calendario-dia__erro"
                role="alert"
                data-cy="calendario-dia-erro"
              >
                {erro}
              </p>
            ) : null}
            <div className="calendario-dia__form-acoes">
              <button
                type="button"
                className="calendario-dia__voltar"
                onClick={limparRegistro}
                data-cy="calendario-dia-registrar-voltar"
              >
                Voltar
              </button>
              <Button
                onClick={salvarCiclo}
                disabled={enviando}
                dataCy="calendario-dia-ciclo-salvar"
              >
                {enviando ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </div>
        ) : null}

        {modo === 'sintoma' ? (
          <div
            className="calendario-dia__form"
            data-cy="calendario-dia-form-sintoma"
          >
            <InputField
              id="calendario-dia-sintoma-tipo"
              name="tipo"
              label="Tipo"
              value={tipoSintoma}
              onChange={(e) => setTipoSintoma(e.target.value)}
              placeholder="Ex.: enjoo, cólica, ansiedade"
              dataCy="calendario-dia-sintoma-tipo"
            />
            <div className="calendario-dia__campo">
              <label
                className="calendario-dia__label"
                htmlFor="calendario-dia-sintoma-descricao"
              >
                Descrição
              </label>
              <textarea
                id="calendario-dia-sintoma-descricao"
                className="calendario-dia__textarea"
                value={descricaoSintoma}
                onChange={(e) => setDescricaoSintoma(e.target.value)}
                rows={2}
                placeholder="Conte com suas palavras o que você sentiu."
                data-cy="calendario-dia-sintoma-descricao"
              />
            </div>
            <SelectField
              id="calendario-dia-sintoma-intensidade"
              label="Intensidade (opcional)"
              value={intensidadeSintoma}
              onChange={(valor: string) => setIntensidadeSintoma(valor)}
              opcoes={OPCOES_INTENSIDADE}
              dataCy="calendario-dia-sintoma-intensidade"
            />
            {erro ? (
              <p
                className="calendario-dia__erro"
                role="alert"
                data-cy="calendario-dia-erro"
              >
                {erro}
              </p>
            ) : null}
            <div className="calendario-dia__form-acoes">
              <button
                type="button"
                className="calendario-dia__voltar"
                onClick={limparRegistro}
                data-cy="calendario-dia-registrar-voltar"
              >
                Voltar
              </button>
              <Button
                onClick={salvarSintoma}
                disabled={enviando}
                dataCy="calendario-dia-sintoma-salvar"
              >
                {enviando ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </Modal>
  )
}

export default CalendarDayDrawer
