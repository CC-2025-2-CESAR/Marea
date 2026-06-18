import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import IconeChevron from '../IconeChevron/IconeChevron'
import type { EtapaJornada } from '../../types'
import './TreatmentTimeline.css'

export interface AcaoTimeline {
  to: string
  rotulo: string
  cy?: string
}

interface Props {
  etapas: EtapaJornada[]
  /** Atalhos mostrados só na etapa atual ("o que fazer agora"). */
  acoesEtapaAtual?: AcaoTimeline[]
  acoesTitulo?: string
  acoesTexto?: string
}

function textoPrevisao(dias: number) {
  return `Faltam aproximadamente ${dias} ${
    dias === 1 ? 'dia' : 'dias'
  } para a próxima etapa.`
}

/**
 * Linha do tempo do tratamento, na horizontal: as etapas viram uma trilha que
 * rola lado a lado no celular (scroll-snap) e se alinha numa linha no desktop.
 * Cada etapa é um cartão com um cabeçalho clicável que abre/fecha os detalhes
 * (descrição, observação e, na etapa atual, o painel "o que fazer agora"). A
 * etapa atual começa aberta e mostra a previsão estimada de dias até a próxima;
 * as concluídas e futuras começam recolhidas, deixando o foco no presente.
 *
 * É um componente de leitura, reutilizável — a paciente vê a própria jornada e,
 * mais adiante, a visão da médica pode reusar o mesmo desenho.
 */
function TreatmentTimeline({
  etapas,
  acoesEtapaAtual = [],
  acoesTitulo = 'O que fazer agora',
  acoesTexto = 'Atalhos para cuidar desta etapa do seu tratamento.',
}: Props) {
  const reduzir = useReducedMotion()
  const [expandidas, setExpandidas] = useState<Record<number, boolean>>(() => {
    const inicial: Record<number, boolean> = {}
    for (const etapa of etapas) {
      inicial[etapa.id] = etapa.status === 'atual'
    }
    return inicial
  })

  function alternar(id: number) {
    setExpandidas((atual) => ({ ...atual, [id]: !atual[id] }))
  }

  return (
    <ol className="treatment-timeline" data-cy="linha-do-tempo-lista">
      {etapas.map((etapa, indice) => {
        const aberta = expandidas[etapa.id] ?? false
        const ehAtual = etapa.status === 'atual'
        const ehUltima = indice === etapas.length - 1
        const temAcoes = ehAtual && acoesEtapaAtual.length > 0
        const temDetalhe =
          Boolean(etapa.etapa_descricao) || Boolean(etapa.observacao) || temAcoes
        const mostrarPrevisao =
          ehAtual && !ehUltima && etapa.dias_para_proxima != null
        const regiaoId = `treatment-timeline-detalhe-${etapa.id}`
        return (
          <li
            key={etapa.id}
            className={`treatment-timeline__item treatment-timeline__item--${etapa.status}`}
            data-cy="linha-do-tempo-item"
            data-status={etapa.status}
            aria-current={ehAtual ? 'step' : undefined}
          >
            <div className="treatment-timeline__trilha" aria-hidden="true">
              <span className="treatment-timeline__marcador" />
            </div>
            <div className="treatment-timeline__conteudo">
              <button
                type="button"
                className="treatment-timeline__cabecalho"
                onClick={() => alternar(etapa.id)}
                aria-expanded={aberta}
                aria-controls={regiaoId}
                data-cy="linha-do-tempo-item-toggle"
              >
                <span className="treatment-timeline__titulo-area">
                  <span className="treatment-timeline__titulo">
                    {etapa.etapa_titulo}
                  </span>
                  <span
                    className="treatment-timeline__status"
                    data-cy="linha-do-tempo-item-status"
                  >
                    {etapa.status_label}
                  </span>
                </span>
                <span className="treatment-timeline__ver">
                  {aberta ? 'Ocultar' : 'Ver detalhes'}
                  <IconeChevron
                    className={`treatment-timeline__chevron${
                      aberta ? ' treatment-timeline__chevron--aberto' : ''
                    }`}
                  />
                </span>
              </button>

              {mostrarPrevisao ? (
                <p
                  className="treatment-timeline__previsao"
                  data-cy="linha-do-tempo-previsao"
                >
                  {textoPrevisao(etapa.dias_para_proxima as number)}
                </p>
              ) : null}

              <AnimatePresence initial={false}>
                {aberta && temDetalhe ? (
                  <motion.div
                    key="detalhe"
                    id={regiaoId}
                    className="treatment-timeline__detalhe"
                    initial={reduzir ? false : { height: 0, opacity: 0 }}
                    animate={reduzir ? undefined : { height: 'auto', opacity: 1 }}
                    exit={reduzir ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="treatment-timeline__detalhe-interno">
                      {etapa.etapa_descricao ? (
                        <p className="treatment-timeline__descricao">
                          {etapa.etapa_descricao}
                        </p>
                      ) : null}
                      {etapa.observacao ? (
                        <p className="treatment-timeline__observacao">
                          {etapa.observacao}
                        </p>
                      ) : null}
                      {temAcoes ? (
                        <div
                          className="treatment-timeline__acoes"
                          data-cy="linha-do-tempo-acoes"
                        >
                          <h3 className="treatment-timeline__acoes-titulo">
                            {acoesTitulo}
                          </h3>
                          <p className="treatment-timeline__acoes-texto">
                            {acoesTexto}
                          </p>
                          <div className="treatment-timeline__acoes-grade">
                            {acoesEtapaAtual.map((acao) => (
                              <Link
                                key={acao.to}
                                className="treatment-timeline__acao"
                                to={acao.to}
                                data-cy={acao.cy}
                              >
                                {acao.rotulo}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default TreatmentTimeline
