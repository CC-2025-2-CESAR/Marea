import './LegendaCiclo.css'

interface Props {
  /** data-cy da `<ul>` (default `ciclo-legenda`, contrato do spec do Ciclo). */
  dataCy?: string
}

/**
 * Legenda das marcações do ciclo no calendário (menstruação / período fértil /
 * ovulação / previsão). Compartilhada entre a página do Ciclo e o Calendário,
 * para que as cores tenham o mesmo significado nos dois lugares.
 */
function LegendaCiclo({ dataCy = 'ciclo-legenda' }: Props) {
  return (
    <ul className="legenda-ciclo" data-cy={dataCy}>
      <li>
        <span className="legenda-ciclo__cor legenda-ciclo__cor--menstruacao" />
        Menstruação
      </li>
      <li>
        <span className="legenda-ciclo__cor legenda-ciclo__cor--fertil" />
        Período fértil
      </li>
      <li>
        <span className="legenda-ciclo__cor legenda-ciclo__cor--ovulacao" />
        Ovulação
      </li>
      <li>
        <span className="legenda-ciclo__cor legenda-ciclo__cor--previsto" />
        Previsão
      </li>
    </ul>
  )
}

export default LegendaCiclo
