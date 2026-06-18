import { useState } from 'react'
import Modal from '../ui/Modal/Modal'
import Button from '../Button/Button'
import InputField from '../InputField/InputField'
import SelectField from '../SelectField/SelectField'
import { useToast } from '../ui/Toast/useToast'
import {
  atualizarRegistroCiclo,
  criarRegistroCiclo,
} from '../../services/cicloService'
import type {
  EntradaRegistroCiclo,
  EtapaCiclo,
  RegistroCiclo,
  StatusCiclo,
} from '../../types'
import './RegistroCicloModal.css'

interface Props {
  aberto: boolean
  onFechar: () => void
  /** Chamado após criar/atualizar com sucesso, com o registro resultante. */
  onSalvo: (registro: RegistroCiclo, modo: 'criar' | 'editar') => void
  /** Quando presente, o modal abre em modo edição (formulário direto). */
  registroEmEdicao?: RegistroCiclo | null
  /** Fase atual estimada — vira o padrão de "outra anotação" no passo 1. */
  etapaSugerida?: EtapaCiclo
}

const OPCOES_ETAPA: { valor: EtapaCiclo; rotulo: string }[] = [
  { valor: 'menstruacao', rotulo: 'Menstruação' },
  { valor: 'folicular', rotulo: 'Fase folicular' },
  { valor: 'ovulacao', rotulo: 'Ovulação' },
  { valor: 'lutea', rotulo: 'Fase lútea' },
]

const OPCOES_STATUS: { valor: StatusCiclo; rotulo: string }[] = [
  { valor: 'registrado', rotulo: 'Registrado' },
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'concluido', rotulo: 'Concluído' },
]

// Passos do registro guiado (criação). Cada cartão do passo 1 já define a etapa
// e avança — menos cliques, menos cara de planilha.
const OPCOES_PASSO1: {
  etapa: EtapaCiclo
  titulo: string
  descricao: string
  dataCy: string
}[] = [
  {
    etapa: 'menstruacao',
    titulo: 'Menstruação',
    descricao: 'Comecei ou estou menstruando.',
    dataCy: 'ciclo-wizard-opcao-menstruacao',
  },
  {
    etapa: 'ovulacao',
    titulo: 'Ovulação',
    descricao: 'Senti sinais de ovulação.',
    dataCy: 'ciclo-wizard-opcao-ovulacao',
  },
  {
    etapa: 'folicular',
    titulo: 'Outra anotação',
    descricao: 'Quero anotar como estou me sentindo.',
    dataCy: 'ciclo-wizard-opcao-anotacao',
  },
]

const TOTAL_PASSOS = 4

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatarData(iso: string) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function rotuloEtapa(etapa: EtapaCiclo) {
  return OPCOES_ETAPA.find((o) => o.valor === etapa)?.rotulo ?? etapa
}

/**
 * Modal para criar/editar um registro do ciclo. Ao criar, conduz por um
 * passo a passo curto (o que registrar → qual dia → como se sentindo →
 * revisar); ao editar, mostra os campos direto, já preenchidos. Em ambos os
 * casos envia o mesmo payload `{data, etapa, status, observacoes}` via
 * `cicloService` — a API não muda.
 */
function RegistroCicloModal({
  aberto,
  onFechar,
  onSalvo,
  registroEmEdicao,
  etapaSugerida,
}: Props) {
  const editando = Boolean(registroEmEdicao)

  // O estado parte direto das props. A página remonta este modal (via `key`) a
  // cada abertura, então os inicializadores valem para criação e edição sem
  // precisar sincronizar prop→estado num efeito (que dispararia re-renders).
  const [passo, setPasso] = useState(1)
  const [data, setData] = useState(() => registroEmEdicao?.data ?? hojeISO())
  const [etapa, setEtapa] = useState<EtapaCiclo>(
    () => registroEmEdicao?.etapa ?? etapaSugerida ?? 'menstruacao',
  )
  const [status, setStatus] = useState<StatusCiclo>(
    () => registroEmEdicao?.status ?? 'registrado',
  )
  const [observacoes, setObservacoes] = useState(
    () => registroEmEdicao?.observacoes ?? '',
  )
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const { mostrarToast } = useToast()

  function escolherNoPasso1(etapaEscolhida: EtapaCiclo) {
    setEtapa(etapaEscolhida)
    setErro(null)
    setPasso(2)
  }

  function avancar() {
    if (passo === 2 && !data) {
      setErro('Informe a data do registro.')
      return
    }
    setErro(null)
    setPasso((atual) => Math.min(atual + 1, TOTAL_PASSOS))
  }

  function voltar() {
    setErro(null)
    setPasso((atual) => Math.max(atual - 1, 1))
  }

  async function salvar() {
    if (!data) {
      setErro('Informe a data do registro.')
      if (!editando) setPasso(2)
      return
    }

    const payload: EntradaRegistroCiclo = {
      data,
      etapa,
      status,
      observacoes: observacoes.trim(),
    }

    setEnviando(true)
    setErro(null)
    try {
      if (editando && registroEmEdicao) {
        const atualizado = await atualizarRegistroCiclo(
          registroEmEdicao.id,
          payload,
        )
        mostrarToast('Registro atualizado.', 'sucesso')
        onSalvo(atualizado, 'editar')
      } else {
        const criado = await criarRegistroCiclo(payload)
        mostrarToast('Registro salvo.', 'sucesso')
        onSalvo(criado, 'criar')
      }
      onFechar()
    } catch {
      setEnviando(false)
      setErro('Não foi possível salvar o registro. Tente novamente.')
    }
  }

  const mensagemErro = erro ? (
    <p className="ciclo-registro__erro" role="alert" data-cy="ciclo-erro-envio">
      {erro}
    </p>
  ) : null

  // --- Modo edição: formulário direto, já preenchido ---------------------
  if (editando) {
    return (
      <Modal
        aberto={aberto}
        onFechar={onFechar}
        titulo="Editar registro"
        dataCy="ciclo-registro-modal"
        rodape={
          <>
            <button
              type="button"
              className="ciclo-registro__cancelar"
              onClick={onFechar}
              data-cy="ciclo-cancelar-edicao"
            >
              Cancelar
            </button>
            <Button onClick={salvar} disabled={enviando} dataCy="ciclo-enviar">
              {enviando ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </>
        }
      >
        <div className="ciclo-registro__form">
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
            onChange={(valor: EtapaCiclo) => setEtapa(valor)}
            opcoes={OPCOES_ETAPA}
            dataCy="ciclo-etapa"
          />
          <SelectField
            id="ciclo-status"
            label="Status"
            value={status}
            onChange={(valor: StatusCiclo) => setStatus(valor)}
            opcoes={OPCOES_STATUS}
            dataCy="ciclo-status"
          />
          <div className="ciclo-registro__campo">
            <label
              className="ciclo-registro__label"
              htmlFor="ciclo-observacoes"
            >
              Observações (opcional)
            </label>
            <textarea
              id="ciclo-observacoes"
              className="ciclo-registro__textarea"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Ex.: fluxo intenso, cólica, humor."
              data-cy="ciclo-observacoes"
            />
          </div>
          {mensagemErro}
        </div>
      </Modal>
    )
  }

  // --- Modo criação: passo a passo ---------------------------------------
  const rodapeWizard =
    passo === 1 ? null : (
      <>
        <button
          type="button"
          className="ciclo-registro__cancelar"
          onClick={voltar}
          data-cy="ciclo-wizard-voltar"
        >
          Voltar
        </button>
        {passo < TOTAL_PASSOS ? (
          <Button onClick={avancar} dataCy="ciclo-wizard-avancar">
            Avançar
          </Button>
        ) : (
          <Button onClick={salvar} disabled={enviando} dataCy="ciclo-enviar">
            {enviando ? 'Salvando…' : 'Salvar registro'}
          </Button>
        )}
      </>
    )

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Novo registro"
      dataCy="ciclo-registro-modal"
      rodape={rodapeWizard}
    >
      <div className="ciclo-registro__wizard">
        <p className="ciclo-registro__passo" data-cy="ciclo-wizard-passo">
          Passo {passo} de {TOTAL_PASSOS}
        </p>

        {passo === 1 ? (
          <div className="ciclo-registro__etapa">
            <h3 className="ciclo-registro__titulo">
              O que você quer registrar?
            </h3>
            <div className="ciclo-registro__opcoes">
              {OPCOES_PASSO1.map((opcao) => (
                <button
                  key={opcao.dataCy}
                  type="button"
                  className="ciclo-registro__opcao"
                  onClick={() => escolherNoPasso1(opcao.etapa)}
                  data-cy={opcao.dataCy}
                >
                  <span className="ciclo-registro__opcao-titulo">
                    {opcao.titulo}
                  </span>
                  <span className="ciclo-registro__opcao-descricao">
                    {opcao.descricao}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {passo === 2 ? (
          <div className="ciclo-registro__etapa">
            <h3 className="ciclo-registro__titulo">Qual dia?</h3>
            <p className="ciclo-registro__ajuda">
              Escolha o dia em que isso aconteceu. Por padrão, hoje.
            </p>
            <InputField
              id="ciclo-data"
              name="data"
              label="Data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              dataCy="ciclo-data"
            />
            {mensagemErro}
          </div>
        ) : null}

        {passo === 3 ? (
          <div className="ciclo-registro__etapa">
            <h3 className="ciclo-registro__titulo">
              Como você está se sentindo?
            </h3>
            <p className="ciclo-registro__ajuda">
              Pode anotar o que quiser — fluxo, cólica, humor. É opcional.
            </p>
            <div className="ciclo-registro__campo">
              <label
                className="ciclo-registro__label"
                htmlFor="ciclo-observacoes"
              >
                Observações (opcional)
              </label>
              <textarea
                id="ciclo-observacoes"
                className="ciclo-registro__textarea"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Ex.: fluxo intenso, cólica, humor."
                data-cy="ciclo-observacoes"
              />
            </div>
          </div>
        ) : null}

        {passo === 4 ? (
          <div className="ciclo-registro__etapa">
            <h3 className="ciclo-registro__titulo">Tudo certo?</h3>
            <p className="ciclo-registro__ajuda">
              Confira antes de salvar. Você pode editar depois.
            </p>
            <dl className="ciclo-registro__resumo" data-cy="ciclo-wizard-resumo">
              <div>
                <dt>O que</dt>
                <dd>{rotuloEtapa(etapa)}</dd>
              </div>
              <div>
                <dt>Dia</dt>
                <dd>{formatarData(data)}</dd>
              </div>
              <div>
                <dt>Anotação</dt>
                <dd>{observacoes.trim() || 'Sem observações.'}</dd>
              </div>
            </dl>
            {mensagemErro}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export default RegistroCicloModal
