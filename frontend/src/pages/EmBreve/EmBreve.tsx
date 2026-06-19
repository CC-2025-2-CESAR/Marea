import './EmBreve.css'

interface Props {
  titulo: string
  descricao?: string
}

function EmBreve({
  titulo,
  descricao = 'Esta página será desenvolvida em uma próxima etapa.',
}: Props) {
  return (
    <section className="em-breve" data-cy="placeholder-page">
      <span className="em-breve__marcador">Em breve</span>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
    </section>
  )
}

export default EmBreve
