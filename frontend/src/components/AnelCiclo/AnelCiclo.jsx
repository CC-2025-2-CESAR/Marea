import './AnelCiclo.css'

// Anel de fase do ciclo: mostra a etapa estimada, o dia atual e quanto falta
// para a próxima menstruação. É um resumo visual de uma estimativa — o aviso
// de que não substitui orientação médica fica sempre visível na página.

const RAIO = 52
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

function textoRestante(diasParaProxima, atrasada) {
  if (atrasada) {
    const dias = Math.abs(diasParaProxima)
    return `menstruação prevista há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  }
  if (diasParaProxima <= 0) return 'menstruação prevista para hoje'
  return `${diasParaProxima} ${
    diasParaProxima === 1 ? 'dia restante' : 'dias restantes'
  } nesse ciclo`
}

function AnelCiclo({
  etapa = 'menstruacao',
  etapaDisplay = '',
  diaDoCiclo = 1,
  totalDoCiclo = 28,
  diasParaProxima = 0,
  atrasada = false,
}) {
  const fracao = Math.min(1, Math.max(0, diaDoCiclo / (totalDoCiclo || 1)))
  const preenchido = fracao * CIRCUNFERENCIA

  return (
    <div className="anel-ciclo" data-cy="ciclo-anel" data-etapa={etapa}>
      <svg
        className="anel-ciclo__svg"
        viewBox="0 0 120 120"
        role="img"
        aria-label={`${etapaDisplay || 'Ciclo'}. Dia ${diaDoCiclo} de ${totalDoCiclo}.`}
      >
        <circle className="anel-ciclo__trilha" cx="60" cy="60" r={RAIO} />
        <circle
          className="anel-ciclo__progresso"
          cx="60"
          cy="60"
          r={RAIO}
          strokeDasharray={`${preenchido} ${CIRCUNFERENCIA}`}
          transform="rotate(-90 60 60)"
        />
      </svg>

      <div className="anel-ciclo__centro">
        <span className="anel-ciclo__rotulo">Etapa do ciclo</span>
        <strong className="anel-ciclo__fase" data-cy="ciclo-fase">
          {etapaDisplay}
        </strong>
        <span className="anel-ciclo__restante">
          {textoRestante(diasParaProxima, atrasada)}
        </span>
      </div>

      <span className="anel-ciclo__dia" data-cy="ciclo-dia">
        dia {diaDoCiclo}
      </span>
    </div>
  )
}

export default AnelCiclo
