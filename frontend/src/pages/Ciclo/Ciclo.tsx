import { useEffect, useState } from 'react'
import AnelCiclo from '../../components/AnelCiclo/AnelCiclo'
import Button from '../../components/Button/Button'
import RegistroCicloModal from '../../components/RegistroCicloModal/RegistroCicloModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import { useToast } from '../../components/ui/Toast/useToast'
import {
  excluirRegistroCiclo,
  listarRegistrosCiclo,
  obterPrevisoesCiclo,
} from '../../services/cicloService'
import type {
  ChanceGravidez,
  PrevisoesCiclo,
  RegistroCiclo,
  StatusCiclo,
} from '../../types'
import './Ciclo.css'

// Cor do selo de status na lista de registros.
const TOM_STATUS: Record<StatusCiclo, 'info' | 'aviso' | 'sucesso'> = {
  registrado: 'info',
  em_andamento: 'aviso',
  concluido: 'sucesso',
}

const CHANCE_TEXTO: Record<ChanceGravidez, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

// A previsão é apenas uma estimativa — nunca substitui orientação médica.
const AVISO_PREVISAO =
  'Estimativa baseada nos seus registros. Não substitui a orientação da equipe médica.'

function formatarData(iso?: string | null) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function textoEmDias(dias?: number, atrasada?: boolean) {
  if (dias === null || dias === undefined) return ''
  if (atrasada) {
    const n = Math.abs(dias)
    return `há ${n} ${n === 1 ? 'dia' : 'dias'}`
  }
  if (dias <= 0) return 'hoje'
  return `em ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

function Ciclo() {
  const [registros, setRegistros] = useState<RegistroCiclo[]>([])
  const [previsoes, setPrevisoes] = useState<PrevisoesCiclo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [registroEmEdicao, setRegistroEmEdicao] = useState<RegistroCiclo | null>(
    null,
  )
  // Muda a cada abertura para remontar o modal com estado limpo (via `key`).
  const [aberturaSeq, setAberturaSeq] = useState(0)

  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const { mostrarToast } = useToast()

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

  function abrirNovoRegistro() {
    setRegistroEmEdicao(null)
    setAberturaSeq((n) => n + 1)
    setModalAberto(true)
  }

  function abrirEdicao(registro: RegistroCiclo) {
    setRegistroEmEdicao(registro)
    setAberturaSeq((n) => n + 1)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setRegistroEmEdicao(null)
  }

  function aoSalvar(registro: RegistroCiclo, modo: 'criar' | 'editar') {
    if (modo === 'editar') {
      setRegistros((atuais) =>
        atuais.map((r) => (r.id === registro.id ? registro : r)),
      )
    } else {
      setRegistros((atuais) => [registro, ...atuais])
    }
    recarregarPrevisoes()
  }

  async function confirmarExclusao(id: number) {
    setExcluindo(true)
    try {
      await excluirRegistroCiclo(id)
      setRegistros((atuais) => atuais.filter((r) => r.id !== id))
      setConfirmandoId(null)
      mostrarToast('Registro excluído.', 'sucesso')
      recarregarPrevisoes()
    } catch {
      setConfirmandoId(null)
      mostrarToast(
        'Não foi possível excluir o registro. Tente novamente.',
        'erro',
      )
    } finally {
      setExcluindo(false)
    }
  }

  const temPrevisao = Boolean(previsoes && previsoes.tem_dados)

  return (
    <section className="ciclo-pagina" data-cy="page-ciclo">
      <header className="ciclo-cabecalho">
        <h1>Meu ciclo</h1>
        <p>
          Acompanhe a fase atual, registre o que sentir e veja uma estimativa
          dos próximos dias. Só você vê os seus registros.
        </p>
      </header>

      <section className="ciclo-painel" aria-label="Resumo do ciclo">
        <div className="ciclo-painel__anel">
          {temPrevisao && previsoes ? (
            <AnelCiclo
              etapa={previsoes.etapa_atual}
              etapaDisplay={previsoes.etapa_atual_display}
              diaDoCiclo={previsoes.dia_do_ciclo}
              totalDoCiclo={previsoes.total_do_ciclo}
              diasParaProxima={previsoes.dias_para_proxima}
              atrasada={previsoes.atrasada}
            />
          ) : (
            <div className="ciclo-anel-vazio" data-cy="ciclo-anel-vazio">
              <span className="ciclo-anel-vazio__titulo">
                Seu ciclo aparece aqui
              </span>
              <p>
                Registre pelo menos dois inícios de menstruação para ver a fase
                atual e as estimativas.
              </p>
            </div>
          )}
        </div>

        <div
          className="ciclo-cards"
          data-cy="ciclo-previsoes"
          aria-label="Previsões do ciclo"
        >
          {temPrevisao && previsoes ? (
            <div className="ciclo-cards__grade">
              <article className="ciclo-card" data-cy="ciclo-previsao-proxima">
                <span className="ciclo-card__rotulo">Próxima menstruação</span>
                <strong className="ciclo-card__valor">
                  {formatarData(previsoes.proxima_menstruacao)}
                </strong>
                <span className="ciclo-card__detalhe">
                  {textoEmDias(previsoes.dias_para_proxima, previsoes.atrasada)}
                </span>
              </article>

              <article
                className={`ciclo-card ciclo-card--chance-${previsoes.chance_gravidez}`}
                data-cy="ciclo-chance"
                data-chance={previsoes.chance_gravidez}
              >
                <span className="ciclo-card__rotulo">Chances de gravidez</span>
                <strong className="ciclo-card__valor">
                  {(previsoes.chance_gravidez &&
                    CHANCE_TEXTO[previsoes.chance_gravidez]) ||
                    '—'}
                </strong>
                <span
                  className="ciclo-card__detalhe"
                  data-cy="ciclo-previsao-fertil"
                >
                  Período fértil: {formatarData(previsoes.janela_fertil_inicio)}{' '}
                  a {formatarData(previsoes.janela_fertil_fim)}
                </span>
              </article>

              <article className="ciclo-card">
                <span className="ciclo-card__rotulo">Sobre o seu ciclo</span>
                <strong className="ciclo-card__valor">
                  {previsoes.ciclo_medio_dias} dias
                </strong>
                <span className="ciclo-card__detalhe">
                  duração média estimada
                </span>
              </article>
            </div>
          ) : (
            <p className="ciclo-cards__vazia" data-cy="ciclo-previsao-vazia">
              {previsoes?.mensagem ||
                'Registre pelo menos dois inícios de menstruação para ver as previsões.'}
            </p>
          )}
          <p className="ciclo-cards__aviso" data-cy="ciclo-aviso">
            {AVISO_PREVISAO}
          </p>
        </div>
      </section>

      <div className="ciclo-acoes" data-cy="ciclo-acoes">
        <Button
          type="button"
          onClick={abrirNovoRegistro}
          dataCy="ciclo-novo-registro"
        >
          Novo registro
        </Button>
      </div>

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
          Você ainda não tem registros. Toque em “Novo registro” para criar o
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
              <div className="ciclo-item__status">
                <StatusBadge tom={TOM_STATUS[registro.status] || 'neutro'}>
                  {registro.status_display}
                </StatusBadge>
              </div>

              <div className="ciclo-item__acoes">
                <button
                  type="button"
                  className="ciclo-item__botao"
                  onClick={() => abrirEdicao(registro)}
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
            </li>
          ))}
        </ul>
      )}

      <RegistroCicloModal
        key={`${registroEmEdicao ? `edit-${registroEmEdicao.id}` : 'novo'}-${aberturaSeq}`}
        aberto={modalAberto}
        onFechar={fecharModal}
        onSalvo={aoSalvar}
        registroEmEdicao={registroEmEdicao}
        etapaSugerida={previsoes?.etapa_atual}
      />

      <ConfirmDialog
        aberto={confirmandoId !== null}
        titulo="Excluir registro?"
        descricao="Esta ação não pode ser desfeita. O registro sai do seu histórico e das estimativas."
        rotuloConfirmar="Sim, excluir"
        rotuloCancelar="Cancelar"
        perigo
        carregando={excluindo}
        onConfirmar={() =>
          confirmandoId !== null && confirmarExclusao(confirmandoId)
        }
        onCancelar={() => setConfirmandoId(null)}
        dataCy="ciclo-confirmar-exclusao"
        dataCyConfirmar="ciclo-confirmar-sim"
        dataCyCancelar="ciclo-confirmar-nao"
      />
    </section>
  )
}

export default Ciclo
