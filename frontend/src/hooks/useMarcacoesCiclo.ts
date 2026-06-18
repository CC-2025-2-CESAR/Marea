import { useEffect, useState } from 'react'
import {
  listarRegistrosCiclo,
  obterPrevisoesCiclo,
} from '../services/cicloService'
import type { MarcacaoCiclo, PrevisoesCiclo, RegistroCiclo } from '../types'

/**
 * Enumera as datas (ISO `YYYY-MM-DD`) entre início e fim, inclusive — usado
 * para marcar a janela fértil dia a dia no calendário. Tem uma trava de 60
 * iterações para nunca entrar em laço infinito com datas inconsistentes.
 */
function intervaloISO(inicioISO?: string | null, fimISO?: string | null): string[] {
  const datas: string[] = []
  if (!inicioISO || !fimISO) return datas
  const [ai, mi, di] = inicioISO.split('-').map(Number)
  const [af, mf, df] = fimISO.split('-').map(Number)
  const atual = new Date(ai, mi - 1, di)
  const fim = new Date(af, mf - 1, df)
  let guarda = 0
  while (atual <= fim && guarda < 60) {
    const y = atual.getFullYear()
    const m = String(atual.getMonth() + 1).padStart(2, '0')
    const d = String(atual.getDate()).padStart(2, '0')
    datas.push(`${y}-${m}-${d}`)
    atual.setDate(atual.getDate() + 1)
    guarda += 1
  }
  return datas
}

/**
 * Deriva as marcações do calendário a partir dos registros (menstruação real) e
 * das previsões (janela fértil, ovulação e próxima menstruação estimadas).
 * Função pura — fácil de testar e reusar entre o Ciclo e o Calendário.
 */
export function calcularMarcacoesCiclo(
  registros: RegistroCiclo[],
  previsoes: PrevisoesCiclo | null,
): MarcacaoCiclo[] {
  const lista: MarcacaoCiclo[] = []

  registros.forEach((r) => {
    if (r.etapa === 'menstruacao' && r.data) {
      lista.push({ data: r.data, tipo: 'menstruacao' })
    }
  })

  if (previsoes?.tem_dados) {
    intervaloISO(
      previsoes.janela_fertil_inicio,
      previsoes.janela_fertil_fim,
    ).forEach((dataFertil) => lista.push({ data: dataFertil, tipo: 'fertil' }))
    if (previsoes.ovulacao_estimada) {
      lista.push({ data: previsoes.ovulacao_estimada, tipo: 'ovulacao' })
    }
    if (previsoes.proxima_menstruacao) {
      lista.push({ data: previsoes.proxima_menstruacao, tipo: 'previsto' })
    }
  }

  return lista
}

/**
 * Busca o ciclo da paciente (registros + previsões) e devolve as marcações
 * prontas para o `CalendarioMes`. O ciclo é secundário no calendário: se a
 * busca falhar (ex.: usuária sem perfil de paciente), degrada para `[]` sem
 * travar a página.
 */
export function useMarcacoesCiclo(): { marcacoes: MarcacaoCiclo[] } {
  const [marcacoes, setMarcacoes] = useState<MarcacaoCiclo[]>([])

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const [registros, previsoes] = await Promise.all([
          listarRegistrosCiclo(),
          obterPrevisoesCiclo(),
        ])
        if (!cancelado) {
          setMarcacoes(
            calcularMarcacoesCiclo(
              Array.isArray(registros) ? registros : [],
              previsoes ?? null,
            ),
          )
        }
      } catch {
        if (!cancelado) setMarcacoes([])
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  return { marcacoes }
}
