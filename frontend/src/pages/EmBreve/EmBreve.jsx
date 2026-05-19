import './EmBreve.css'

function EmBreve({
  titulo,
  descricao = 'Esta página será desenvolvida em uma próxima etapa.',
}) {
  return (
    <section className="em-breve" data-cy="placeholder-page">
      <span className="em-breve__marcador">Em breve</span>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
    </section>
  )
}

export default EmBreve
