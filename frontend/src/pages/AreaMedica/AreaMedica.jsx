/**
 * Área da médica — "casa" das usuárias com papel de médica.
 *
 * Tela autônoma (não usa o AppLayout/sidebar da paciente). Mostra a lista de
 * pacientes vinculadas à médica e, ao selecionar uma, o painel de detalhe com
 * consultas, medicamentos e os formulários de escrita (ver DetalhePaciente).
 *
 * O escopo (quais pacientes aparecem) é sempre decidido pelo backend.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoAmare from '../../assets/amare-logo.png'
import { useAuth } from '../../contexts/useAuth'
import { listarPacientes } from '../../services/medicaService'
import DetalhePaciente from './DetalhePaciente'
import NovaPaciente from './NovaPaciente'
import './AreaMedica.css'

function AreaMedica() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()

  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [selecionadaId, setSelecionadaId] = useState(null)

  const nome = usuario?.nome_completo?.trim() || 'médica'

  const [recarregarLista, setRecarregarLista] = useState(0)

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

  function handleSair() {
    logout()
    navegar('/login', { replace: true })
  }

  const semPacientes =
    !carregando && !erro && pacientes.length === 0

  return (
    <main className="area-medica" data-cy="page-area-medica">
      <header className="area-medica__topo">
        <img src={logoAmare} alt="Amare" className="area-medica__logo" />
        <div className="area-medica__cabecalho-texto">
          <h1 className="area-medica__titulo">Área da médica</h1>
          <p className="area-medica__saudacao">Olá, {nome}.</p>
        </div>
        <button
          type="button"
          className="area-medica__sair"
          onClick={handleSair}
          data-cy="area-medica-logout"
        >
          Sair
        </button>
      </header>

      <div className="area-medica__conteudo">
        <aside className="area-medica__lista" data-cy="lista-pacientes">
          <NovaPaciente
            aoCadastrar={() => setRecarregarLista((n) => n + 1)}
          />

          <h2>Suas pacientes</h2>

          {carregando && <p className="area-medica__estado">Carregando…</p>}
          {erro && (
            <p className="area-medica__estado">
              Não foi possível carregar as pacientes.
            </p>
          )}
          {semPacientes && (
            <p className="area-medica__estado">
              Nenhuma paciente vinculada a você ainda.
            </p>
          )}

          <ul>
            {pacientes.map((paciente) => (
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
                  <span className="area-medica__paciente-nome">
                    {paciente.nome_completo}
                  </span>
                  <span className="area-medica__paciente-meta">
                    {paciente.total_consultas} consulta(s) ·{' '}
                    {paciente.total_medicamentos} medicamento(s)
                  </span>
                </button>
              </li>
            ))}
          </ul>
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
    </main>
  )
}

export default AreaMedica
