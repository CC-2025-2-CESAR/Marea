import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarProximasConsultas } from '../../services/consultasService'
import type { Consulta } from '../../types'
import './BannerProximaConsulta.css'

function formatarHorario(iso?: string) {
  if (!iso) return ''
  const data = new Date(iso)
  return data.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BannerProximaConsulta() {
  const [proxima, setProxima] = useState<Consulta | null>(null)
  const [restantes, setRestantes] = useState(0)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const dados = await listarProximasConsultas()
        if (cancelado) return
        const lista = Array.isArray(dados) ? dados : []
        setProxima(lista[0] || null)
        setRestantes(Math.max(lista.length - 1, 0))
      } catch {
        if (!cancelado) {
          setProxima(null)
          setRestantes(0)
        }
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  if (!proxima) return null

  const especialidade = proxima.especialidade_nome || 'sua próxima consulta'
  const medica = proxima.medica_nome ? `com ${proxima.medica_nome}` : ''

  return (
    <aside
      className="banner-proxima-consulta"
      data-cy="banner-proxima-consulta"
    >
      <span className="banner-proxima-consulta__rotulo">
        Próxima consulta
      </span>
      <p className="banner-proxima-consulta__principal">
        <strong>{formatarHorario(proxima.data_horario)}</strong>
        {' — '}
        {especialidade} {medica}
      </p>
      {proxima.local ? (
        <p className="banner-proxima-consulta__local">{proxima.local}</p>
      ) : null}
      <div className="banner-proxima-consulta__rodape">
        {restantes > 0 ? (
          <span
            className="banner-proxima-consulta__restantes"
            data-cy="banner-proxima-consulta-restantes"
          >
            +{restantes} {restantes === 1 ? 'outra consulta' : 'outras consultas'} nesta semana
          </span>
        ) : (
          <span />
        )}
        <Link
          to="/calendario"
          className="banner-proxima-consulta__link"
          data-cy="banner-proxima-consulta-link"
        >
          Ver calendário
        </Link>
      </div>
    </aside>
  )
}

export default BannerProximaConsulta
