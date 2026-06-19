import type { MembroEquipe } from '../../types'
import './PerfilMedica.css'

interface PerfilMedicaProps {
  medica: MembroEquipe
  /** Mostra as areas de atuacao (especialidades) como chips. */
  mostrarAreas?: boolean
  dataCy?: string
}

/**
 * Cartao com o perfil publico de uma medica: nome, especialidade, registros
 * profissionais (CRM/RQE) e apresentacao. Reusado no detalhe da especialidade
 * e na pagina da equipe medica.
 */
function PerfilMedica({
  medica,
  mostrarAreas = false,
  dataCy = 'perfil-medica',
}: PerfilMedicaProps) {
  const registros = [
    medica.crm,
    medica.rqe ? `RQE ${medica.rqe}` : '',
  ].filter(Boolean)
  const areas = medica.especialidades ?? []

  return (
    <article className="perfil-medica" data-cy={dataCy}>
      <h3 className="perfil-medica__nome">{medica.nome}</h3>
      {medica.especialidade ? (
        <p className="perfil-medica__especialidade">{medica.especialidade}</p>
      ) : null}
      {registros.length > 0 ? (
        <p className="perfil-medica__registros">{registros.join(' · ')}</p>
      ) : null}
      {medica.bio ? <p className="perfil-medica__bio">{medica.bio}</p> : null}
      {mostrarAreas && areas.length > 0 ? (
        <ul className="perfil-medica__areas" aria-label="Áreas de atuação">
          {areas.map((area) => (
            <li key={area.id} className="perfil-medica__area">
              {area.nome}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export default PerfilMedica
