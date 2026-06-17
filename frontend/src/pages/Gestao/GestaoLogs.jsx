/**
 * Logs de auditoria (/gestao/logs): leitura, pela administração, da trilha de
 * acessos e edições sensíveis sobre dados de pacientes (LogAtividade). Só leitura
 * — a trilha é de acréscimo e nunca é editada pela aplicação.
 */

import { useEffect, useState } from 'react'
import { listarLogs } from '../../services/adminService'
import './Gestao.css'

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

function GestaoLogs() {
  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let cancelado = false
    listarLogs()
      .then((dados) => {
        if (!cancelado) {
          setLogs(dados)
          setErro(false)
        }
      })
      .catch(() => {
        if (!cancelado) setErro(true)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="gestao" data-cy="page-gestao-logs">
      <header className="gestao__cabecalho">
        <h1 className="gestao__titulo">Logs de auditoria</h1>
        <p className="gestao__saudacao">
          Acessos e edições sensíveis sobre dados de pacientes.
        </p>
      </header>

      {carregando && <p className="gestao__estado">Carregando…</p>}
      {erro && (
        <p className="gestao__estado">Não foi possível carregar os logs.</p>
      )}
      {!carregando && !erro && logs.length === 0 && (
        <p className="gestao__estado" data-cy="logs-vazio">
          Nenhum evento registrado ainda.
        </p>
      )}

      {logs.length > 0 && (
        <ul className="gestao__logs" data-cy="logs-lista">
          {logs.map((log) => (
            <li key={log.id} className="gestao__log">
              <div className="gestao__log-topo">
                <strong>{log.acao_display}</strong>
                <span className="gestao__log-data">
                  {formatarDataHora(log.data_hora)}
                </span>
              </div>
              <span className="gestao__log-meta">
                {log.usuario_nome}
                {log.paciente_nome ? ` → ${log.paciente_nome}` : ''}
              </span>
              {log.motivo && (
                <span className="gestao__log-motivo">{log.motivo}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default GestaoLogs
