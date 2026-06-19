import { useEffect, useState } from 'react'
import PerfilMedica from '../../components/PerfilMedica/PerfilMedica'
import { listarEquipeMedica } from '../../services/equipeService'
import type { MembroEquipe } from '../../types'
import './EquipeMedica.css'

/**
 * Pagina publica da equipe medica (`/equipe-medica`): lista as medicas da
 * clinica com nome, especialidade, registros profissionais (CRM/RQE),
 * apresentacao e areas de atuacao.
 */
function EquipeMedica() {
  const [equipe, setEquipe] = useState<MembroEquipe[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarEquipeMedica()
        if (!cancelado) setEquipe(dados)
      } catch {
        if (!cancelado) {
          setEquipe([])
          setErro(true)
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <section className="equipe-medica-pagina" data-cy="page-equipe-medica">
      <header className="equipe-medica-cabecalho">
        <h1>Equipe médica</h1>
        <p>
          Conheça as médicas que cuidam de você na clínica, com a especialidade
          e os registros profissionais de cada uma.
        </p>
      </header>

      {carregando ? (
        <p
          className="equipe-medica-mensagem"
          data-cy="equipe-medica-mensagem-carregando"
        >
          Carregando a equipe...
        </p>
      ) : erro ? (
        <p
          className="equipe-medica-mensagem equipe-medica-mensagem--erro"
          role="alert"
          data-cy="equipe-medica-mensagem-erro"
        >
          Não foi possível carregar a equipe médica no momento.
        </p>
      ) : equipe.length === 0 ? (
        <p
          className="equipe-medica-mensagem"
          data-cy="equipe-medica-mensagem-vazia"
        >
          Nenhuma médica cadastrada no momento.
        </p>
      ) : (
        <div className="equipe-medica-grid" data-cy="equipe-medica-grid">
          {equipe.map((medica) => (
            <PerfilMedica
              key={medica.id}
              medica={medica}
              mostrarAreas
              dataCy="equipe-medica-card"
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default EquipeMedica
