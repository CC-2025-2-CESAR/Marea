import { useMemo, useState } from 'react'
import './CalendarioMes.css'

const NOMES_MES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const DIAS_SEMANA_CURTOS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']

// Rótulos das marcações do ciclo (menstruação/fértil/ovulação/previsão).
const ROTULO_CICLO = {
  menstruacao: 'Menstruação',
  fertil: 'Período fértil',
  ovulacao: 'Ovulação',
  previsto: 'Próxima menstruação (previsão)',
}

// Chave dia-a-dia (mês 0-based) tolerante a Date e a string ISO 'YYYY-MM-DD'.
function chaveData(valor) {
  if (valor instanceof Date) {
    return `${valor.getFullYear()}-${valor.getMonth()}-${valor.getDate()}`
  }
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-').map(Number)
  return `${ano}-${mes - 1}-${dia}`
}

function mesmoDia(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function gerarCelulas(ano, mes) {
  const primeiroDiaMes = new Date(ano, mes, 1)
  const diaSemanaInicio = primeiroDiaMes.getDay()
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate()
  const totalDiasMesAnterior = new Date(ano, mes, 0).getDate()

  const celulas = []

  for (let i = diaSemanaInicio - 1; i >= 0; i -= 1) {
    const dia = totalDiasMesAnterior - i
    celulas.push({
      dia,
      tipo: 'anterior',
      data: new Date(ano, mes - 1, dia),
    })
  }

  for (let dia = 1; dia <= totalDiasMes; dia += 1) {
    celulas.push({
      dia,
      tipo: 'atual',
      data: new Date(ano, mes, dia),
    })
  }

  let diaSeguinte = 1
  while (celulas.length < 42) {
    celulas.push({
      dia: diaSeguinte,
      tipo: 'proximo',
      data: new Date(ano, mes + 1, diaSeguinte),
    })
    diaSeguinte += 1
  }

  return celulas
}

function rotuloDoDia(consultas) {
  if (consultas.length === 0) return ''
  if (consultas.length > 1) return `${consultas.length} consultas`
  return consultas[0].especialidade_nome
    ? `${consultas[0].especialidade_nome}`
    : 'Consulta'
}

function rotuloEventos(eventos) {
  if (eventos.length === 0) return ''
  if (eventos.length > 1) return `${eventos.length} eventos`
  return eventos[0].titulo || 'Evento'
}

function agruparPorData(itens) {
  const mapa = new Map()
  itens.forEach((item) => {
    if (!item?.data_horario) return
    const data = new Date(item.data_horario)
    const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`
    const lista = mapa.get(chave) || []
    lista.push(item)
    mapa.set(chave, lista)
  })
  return mapa
}

function CalendarioMes({
  consultas = [],
  eventos = [],
  marcacoes = [],
  mesInicial,
}) {
  const inicial = useMemo(() => {
    if (mesInicial instanceof Date) {
      return new Date(mesInicial.getFullYear(), mesInicial.getMonth(), 1)
    }
    const agora = new Date()
    return new Date(agora.getFullYear(), agora.getMonth(), 1)
  }, [mesInicial])

  const [mesVisivel, setMesVisivel] = useState(inicial)

  const ano = mesVisivel.getFullYear()
  const mes = mesVisivel.getMonth()
  const hoje = new Date()
  const celulas = useMemo(() => gerarCelulas(ano, mes), [ano, mes])

  const consultasPorData = useMemo(
    () => agruparPorData(consultas),
    [consultas],
  )
  const eventosPorData = useMemo(() => agruparPorData(eventos), [eventos])

  const marcacoesPorData = useMemo(() => {
    const mapa = new Map()
    marcacoes.forEach((mc) => {
      if (!mc?.data) return
      const chave = chaveData(mc.data)
      // Marcações reais (menstruação) vêm primeiro e têm prioridade no dia.
      if (!mapa.has(chave)) mapa.set(chave, mc.tipo)
    })
    return mapa
  }, [marcacoes])

  function cicloNoDia(data) {
    return marcacoesPorData.get(chaveData(data)) || ''
  }

  function consultasNoDia(data) {
    const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`
    return consultasPorData.get(chave) || []
  }

  function eventosNoDia(data) {
    const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`
    return eventosPorData.get(chave) || []
  }

  function irParaMesAnterior() {
    setMesVisivel(new Date(ano, mes - 1, 1))
  }

  function irParaProximoMes() {
    setMesVisivel(new Date(ano, mes + 1, 1))
  }

  function irParaHoje() {
    setMesVisivel(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  }

  const tituloMes = `${NOMES_MES[mes]} de ${ano}`

  return (
    <div className="calendario-mes" data-cy="calendario-mes">
      <header className="calendario-mes__cabecalho">
        <h2 className="calendario-mes__titulo" data-cy="calendario-mes-titulo">
          {tituloMes}
        </h2>
        <div className="calendario-mes__navegacao">
          <button
            type="button"
            className="calendario-mes__botao"
            onClick={irParaMesAnterior}
            aria-label="Mês anterior"
            data-cy="calendario-mes-anterior"
          >
            &lt;
          </button>
          <button
            type="button"
            className="calendario-mes__botao calendario-mes__botao--hoje"
            onClick={irParaHoje}
            data-cy="calendario-mes-hoje"
          >
            Hoje
          </button>
          <button
            type="button"
            className="calendario-mes__botao"
            onClick={irParaProximoMes}
            aria-label="Próximo mês"
            data-cy="calendario-mes-proximo"
          >
            &gt;
          </button>
        </div>
      </header>

      <div className="calendario-mes__semana" aria-hidden="true">
        {DIAS_SEMANA_CURTOS.map((dia) => (
          <span key={dia} className="calendario-mes__semana-rotulo">
            {dia}
          </span>
        ))}
      </div>

      <ul
        className="calendario-mes__grade"
        role="grid"
        aria-label={`Calendário de ${tituloMes}`}
      >
        {celulas.map((celula, indice) => {
          const consultasDoDia =
            celula.tipo === 'atual' ? consultasNoDia(celula.data) : []
          const eventosDoDia =
            celula.tipo === 'atual' ? eventosNoDia(celula.data) : []
          const ehHoje = mesmoDia(celula.data, hoje)
          const temConsulta = consultasDoDia.length > 0
          const temEvento = eventosDoDia.length > 0
          const cicloTipo = cicloNoDia(celula.data)
          const classes = [
            'calendario-mes__celula',
            `calendario-mes__celula--${celula.tipo}`,
            ehHoje && 'calendario-mes__celula--hoje',
            temConsulta && 'calendario-mes__celula--com-consulta',
            temEvento && 'calendario-mes__celula--com-evento',
            cicloTipo && `calendario-mes__celula--ciclo-${cicloTipo}`,
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <li
              key={indice}
              className={classes}
              role="gridcell"
              data-cy="calendario-mes-dia"
              data-dia={celula.tipo === 'atual' ? celula.dia : ''}
              data-com-consulta={temConsulta ? 'true' : 'false'}
              data-com-evento={temEvento ? 'true' : 'false'}
            >
              <span className="calendario-mes__numero">{celula.dia}</span>
              {temConsulta ? (
                <span
                  className="calendario-mes__marcador"
                  data-cy="calendario-mes-marcador"
                  title={consultasDoDia
                    .map((c) => c.especialidade_nome || 'Consulta')
                    .join(', ')}
                >
                  {rotuloDoDia(consultasDoDia)}
                </span>
              ) : null}
              {temEvento ? (
                <span
                  className="calendario-mes__marcador calendario-mes__marcador--evento"
                  data-cy="calendario-mes-marcador-evento"
                  title={eventosDoDia.map((e) => e.titulo).join(', ')}
                >
                  {rotuloEventos(eventosDoDia)}
                </span>
              ) : null}
              {cicloTipo ? (
                <span
                  className={`calendario-mes__ponto calendario-mes__ponto--${cicloTipo}`}
                  data-cy="calendario-mes-ciclo"
                  data-ciclo={cicloTipo}
                  title={ROTULO_CICLO[cicloTipo] || ''}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CalendarioMes
