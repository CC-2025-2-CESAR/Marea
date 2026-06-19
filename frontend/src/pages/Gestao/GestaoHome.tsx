/**
 * Painel inicial da administração (/gestao). Mostra as contagens da clínica e
 * atalhos para as áreas de gestão. Acesso restrito ao papel "admin" (a barreira
 * real é o backend, via IsAdminClinica).
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { visaoGeral } from '../../services/adminService'
import type { VisaoGeralAdmin } from '../../types'
import './Gestao.css'

const CARDS: { chave: keyof VisaoGeralAdmin; rotulo: string }[] = [
  { chave: 'pacientes', rotulo: 'Pacientes' },
  { chave: 'medicas', rotulo: 'Médicas' },
  { chave: 'convites_pendentes', rotulo: 'Convites pendentes' },
  { chave: 'termos', rotulo: 'Termos do dicionário' },
  { chave: 'logs', rotulo: 'Eventos de auditoria' },
]

function GestaoHome() {
  const { usuario } = useAuth()
  const [dados, setDados] = useState<VisaoGeralAdmin | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let cancelado = false
    visaoGeral()
      .then((d) => {
        if (!cancelado) {
          setDados(d)
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

  const nome = usuario?.nome_completo?.trim() || 'administração'

  return (
    <div className="gestao" data-cy="page-gestao">
      <header className="gestao__cabecalho">
        <h1 className="gestao__titulo">Painel da administração</h1>
        <p className="gestao__saudacao">Olá, {nome}.</p>
      </header>

      {carregando && <p className="gestao__estado">Carregando…</p>}
      {erro && (
        <p className="gestao__estado">
          Não foi possível carregar a visão geral.
        </p>
      )}

      {dados && (
        <div className="gestao__cards">
          {CARDS.map((card) => (
            <div
              className="gestao__card"
              key={card.chave}
              data-cy={`gestao-card-${card.chave}`}
            >
              <span className="gestao__card-numero">{dados[card.chave] ?? 0}</span>
              <span className="gestao__card-rotulo">{card.rotulo}</span>
            </div>
          ))}
        </div>
      )}

      <nav className="gestao__atalhos">
        <Link
          className="gestao__atalho"
          to="/gestao/dicionario"
          data-cy="gestao-ir-dicionario"
        >
          Gerenciar dicionário
        </Link>
        <Link
          className="gestao__atalho"
          to="/gestao/logs"
          data-cy="gestao-ir-logs"
        >
          Ver logs de auditoria
        </Link>
      </nav>
    </div>
  )
}

export default GestaoHome
