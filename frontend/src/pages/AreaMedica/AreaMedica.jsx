/**
 * Pacientes — "casa" das usuárias com papel de médica.
 *
 * Antes era uma tela autônoma; agora vive dentro do mesmo shell da paciente
 * (header, busca, rodapé, transição, drawer), com a navegação por papel na
 * Sidebar. Mostra as pacientes da clínica em abas (Minhas / Compartilhadas /
 * Todas) e, ao selecionar uma, o painel de detalhe com o status de acesso.
 *
 * O escopo (quais pacientes aparecem) e a permissão de escrita são sempre
 * decididos pelo backend; aqui as abas só organizam o que ele já devolveu.
 */

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/useAuth'
import { listarPacientes } from '../../services/medicaService'
import Tabs from '../../components/ui/Tabs/Tabs'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import DetalhePaciente from './DetalhePaciente'
import NovaPaciente from './NovaPaciente'
import { ROTULO_CURTO_PAPEL, tomDoPapel } from './permissaoUi'
import './AreaMedica.css'

// Abas: cada uma é um filtro sobre o papel de acesso da médica à paciente.
const ABA_MINHAS = 'minhas'
const ABA_COMPARTILHADAS = 'compartilhadas'
const ABA_TODAS = 'todas'

function pertenceAAba(paciente, aba) {
  const papel = paciente.permissao?.papel
  if (aba === ABA_MINHAS) return papel === 'responsavel'
  if (aba === ABA_COMPARTILHADAS) return papel === 'assumido'
  return true
}

function AreaMedica() {
  const { usuario } = useAuth()

  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [selecionadaId, setSelecionadaId] = useState(null)
  const [aba, setAba] = useState(ABA_MINHAS)
  const [recarregarLista, setRecarregarLista] = useState(0)

  const nome = usuario?.nome_completo?.trim() || 'médica'

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const dados = await listarPacientes()
        if (!cancelado) {
          setPacientes(dados)
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
  }, [recarregarLista])

  const contagens = useMemo(
    () => ({
      [ABA_MINHAS]: pacientes.filter((p) => pertenceAAba(p, ABA_MINHAS)).length,
      [ABA_COMPARTILHADAS]: pacientes.filter((p) =>
        pertenceAAba(p, ABA_COMPARTILHADAS),
      ).length,
      [ABA_TODAS]: pacientes.length,
    }),
    [pacientes],
  )

  const visiveis = useMemo(
    () => pacientes.filter((p) => pertenceAAba(p, aba)),
    [pacientes, aba],
  )

  const abas = [
    { id: ABA_MINHAS, rotulo: `Minhas (${contagens[ABA_MINHAS]})`, dataCy: 'aba-minhas' },
    {
      id: ABA_COMPARTILHADAS,
      rotulo: `Compartilhadas (${contagens[ABA_COMPARTILHADAS]})`,
      dataCy: 'aba-compartilhadas',
    },
    { id: ABA_TODAS, rotulo: `Todas (${contagens[ABA_TODAS]})`, dataCy: 'aba-todas' },
  ]

  const semPacientes = !carregando && !erro && visiveis.length === 0

  return (
    <div className="area-medica" data-cy="page-area-medica">
      <header className="area-medica__cabecalho">
        <h1 className="area-medica__titulo">Pacientes</h1>
        <p className="area-medica__saudacao">Olá, {nome}.</p>
      </header>

      <div className="area-medica__conteudo">
        <aside className="area-medica__lista" data-cy="lista-pacientes">
          <NovaPaciente aoCadastrar={() => setRecarregarLista((n) => n + 1)} />

          <Tabs
            abas={abas}
            ativa={aba}
            onMudar={setAba}
            rotuloLista="Filtrar pacientes por vínculo"
            dataCy="abas-pacientes"
          />

          <div
            className="area-medica__painel"
            id={`painel-${aba}`}
            role="tabpanel"
            aria-labelledby={`tab-${aba}`}
          >
            {carregando && <p className="area-medica__estado">Carregando…</p>}
            {erro && (
              <p className="area-medica__estado">
                Não foi possível carregar as pacientes.
              </p>
            )}
            {semPacientes && (
              <p className="area-medica__estado" data-cy="lista-vazia">
                {aba === ABA_TODAS
                  ? 'Nenhuma paciente na clínica ainda.'
                  : 'Nenhuma paciente nesta aba.'}
              </p>
            )}

            <ul>
              {visiveis.map((paciente) => (
                <li key={paciente.id}>
                  <button
                    type="button"
                    className={
                      'area-medica__paciente' +
                      (selecionadaId === paciente.id ? ' is-ativa' : '')
                    }
                    onClick={() => setSelecionadaId(paciente.id)}
                    data-cy={`paciente-${paciente.id}`}
                  >
                    <span className="area-medica__paciente-topo">
                      <span className="area-medica__paciente-nome">
                        {paciente.nome_completo}
                      </span>
                      {paciente.permissao ? (
                        <StatusBadge
                          tom={tomDoPapel(paciente.permissao.papel)}
                          dataCy={`paciente-${paciente.id}-selo`}
                        >
                          {ROTULO_CURTO_PAPEL[paciente.permissao.papel] ??
                            'Acesso'}
                        </StatusBadge>
                      ) : null}
                    </span>
                    <span className="area-medica__paciente-meta">
                      {paciente.total_consultas ?? 0} consulta(s) ·{' '}
                      {paciente.total_medicamentos ?? 0} medicamento(s)
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="area-medica__detalhe">
          {selecionadaId ? (
            <DetalhePaciente
              key={selecionadaId}
              pacienteId={selecionadaId}
              aoAtualizarResumo={() => setRecarregarLista((n) => n + 1)}
            />
          ) : (
            <p className="area-medica__placeholder">
              Selecione uma paciente à esquerda para ver e gerenciar consultas e
              medicamentos.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default AreaMedica
