import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { buscarGlobal } from '../../services/buscaService'
import './Busca.css'

// Ordem fixa das seções por tipo, com o rótulo plural mostrado na tela. A
// busca devolve uma lista achatada; aqui agrupamos por tipo para exibir.
const GRUPOS = [
  { tipo: 'termo', titulo: 'Dicionário' },
  { tipo: 'tratamento', titulo: 'Tratamentos' },
  { tipo: 'orientacao', titulo: 'Orientações' },
  { tipo: 'especialidade', titulo: 'Especialidades' },
]

function Busca() {
  // O termo vive na URL (?q=...), preenchido pela SearchBar do cabeçalho.
  const [searchParams] = useSearchParams()
  const termo = searchParams.get('q') || ''

  const [resultados, setResultados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // Refaz a busca sempre que o termo da URL muda.
  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setCarregando(true)
      setErro(null)
      try {
        const dados = await buscarGlobal(termo)
        if (!cancelado) {
          setResultados(dados)
        }
      } catch {
        if (!cancelado) {
          setResultados([])
          setErro('Não foi possível buscar no momento.')
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [termo])

  return (
    <section className="busca-pagina" data-cy="page-busca">
      <header className="busca-cabecalho">
        <h1>Busca</h1>
        {termo ? (
          <p>
            Resultados para <strong>“{termo}”</strong>.
          </p>
        ) : (
          <p>
            Use a busca no topo da página para procurar em todo o conteúdo da
            Amare: dicionário, tratamentos, orientações e especialidades.
          </p>
        )}
      </header>

      {carregando ? (
        <p className="busca-mensagem" data-cy="busca-carregando">
          Buscando...
        </p>
      ) : erro ? (
        <p
          className="busca-mensagem busca-mensagem--erro"
          role="alert"
          data-cy="busca-erro"
        >
          {erro}
        </p>
      ) : resultados.length === 0 ? (
        <p className="busca-mensagem" data-cy="busca-vazia">
          {termo
            ? 'Nada encontrado para a sua busca.'
            : 'Nenhum termo buscado ainda.'}
        </p>
      ) : (
        <div className="busca-resultados" data-cy="busca-resultados">
          {GRUPOS.map((grupo) => {
            const itens = resultados.filter((r) => r.tipo === grupo.tipo)
            if (itens.length === 0) {
              return null
            }
            return (
              <section
                key={grupo.tipo}
                className="busca-grupo"
                data-cy="busca-grupo"
                data-tipo={grupo.tipo}
              >
                <h2 className="busca-grupo__titulo">{grupo.titulo}</h2>
                <ul className="busca-grupo__lista">
                  {itens.map((item) => (
                    <li
                      key={`${item.tipo}-${item.id}`}
                      className="busca-item"
                      data-cy="busca-item"
                      data-tipo={item.tipo}
                    >
                      <Link className="busca-item__link" to={item.url}>
                        <span className="busca-item__tag">
                          {item.tipo_label}
                        </span>
                        <h3 className="busca-item__titulo">{item.titulo}</h3>
                        {item.descricao ? (
                          <p className="busca-item__descricao">
                            {item.descricao}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Busca
