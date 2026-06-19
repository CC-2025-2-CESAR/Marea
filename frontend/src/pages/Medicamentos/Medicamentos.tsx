import ChecklistMedicamentos from '../../components/ChecklistMedicamentos/ChecklistMedicamentos'
import './Medicamentos.css'

function Medicamentos() {
  return (
    <section className="medicamentos-pagina" data-cy="page-medicamentos">
      <header className="medicamentos-cabecalho">
        <h1>Medicamentos</h1>
        <p>
          Acompanhe a rotina de remédios prescritos para o seu tratamento e
          marque os que já tomou hoje. A lista volta ao estado inicial a cada
          novo dia.
        </p>
      </header>

      <ChecklistMedicamentos modo="completo" />
    </section>
  )
}

export default Medicamentos
