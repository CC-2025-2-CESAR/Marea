import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'
import SelectField from '../../components/SelectField/SelectField'
import { criarSintoma, listarSintomas } from '../../services/sintomasService'
import './Sintomas.css'

const OPCOES_INTENSIDADE = [
  { valor: '', rotulo: 'Não informar' },
  { valor: '1', rotulo: '1 - Leve' },
  { valor: '2', rotulo: '2' },
  { valor: '3', rotulo: '3 - Moderada' },
  { valor: '4', rotulo: '4' },
  { valor: '5', rotulo: '5 - Intensa' },
]

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatarData(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function Sintomas() {
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [data, setData] = useState(hojeISO())
  const [tipo, setTipo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [intensidade, setIntensidade] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarSintomas()
        if (!cancelado) {
          setRegistros(Array.isArray(dados) ? dados : [])
        }
      } catch {
        if (!cancelado) {
          setRegistros([])
          setErro('Não foi possível carregar seus registros no momento.')
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
  }, [])

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErroEnvio(null)
    setSucesso(false)

    if (!data || !tipo.trim() || !descricao.trim()) {
      setErroEnvio('Preencha a data, o tipo e a descrição.')
      return
    }

    const payload = { data, tipo: tipo.trim(), descricao: descricao.trim() }
    if (intensidade) {
      payload.intensidade = Number(intensidade)
    }

    setEnviando(true)
    try {
      const criado = await criarSintoma(payload)
      setRegistros((atuais) => [criado, ...atuais])
      setTipo('')
      setDescricao('')
      setIntensidade('')
      setData(hojeISO())
      setSucesso(true)
    } catch {
      setErroEnvio('Não foi possível salvar o registro. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="sintomas-pagina" data-cy="page-sintomas">
      <header className="sintomas-cabecalho">
        <h1>Sintomas e observações</h1>
        <p>
          Registre como você está se sentindo para acompanhar sua experiência e
          compartilhar com a equipe. Só você vê os seus registros.
        </p>
      </header>

      <form className="sintomas-form" onSubmit={handleSubmit} data-cy="sintomas-form">
        <div className="sintomas-form__linha">
          <InputField
            id="sintomas-data"
            name="data"
            label="Data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            dataCy="sintomas-data"
          />
          <InputField
            id="sintomas-tipo"
            name="tipo"
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="Ex.: enjoo, cólica, ansiedade"
            dataCy="sintomas-tipo"
          />
          <SelectField
            id="sintomas-intensidade"
            label="Intensidade (opcional)"
            value={intensidade}
            onChange={(valor) => setIntensidade(valor)}
            opcoes={OPCOES_INTENSIDADE}
            dataCy="sintomas-intensidade"
          />
        </div>

        <div className="sintomas-campo">
          <label className="sintomas-campo__label" htmlFor="sintomas-descricao">
            Descrição
          </label>
          <textarea
            id="sintomas-descricao"
            className="sintomas-textarea"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Conte com suas palavras o que você sentiu."
            data-cy="sintomas-descricao"
          />
        </div>

        {erroEnvio ? (
          <p className="sintomas-mensagem--erro" role="alert" data-cy="sintomas-erro-envio">
            {erroEnvio}
          </p>
        ) : null}
        {sucesso ? (
          <p className="sintomas-mensagem--sucesso" role="status" data-cy="sintomas-sucesso">
            Registro salvo.
          </p>
        ) : null}

        <div className="sintomas-form__acoes">
          <Button type="submit" disabled={enviando} dataCy="sintomas-enviar">
            {enviando ? 'Salvando...' : 'Salvar registro'}
          </Button>
        </div>
      </form>

      <h2 className="sintomas-lista-titulo">Seus registros</h2>

      {carregando ? (
        <p className="sintomas-mensagem" data-cy="sintomas-carregando">
          Carregando registros...
        </p>
      ) : erro ? (
        <p className="sintomas-mensagem--erro" role="alert" data-cy="sintomas-erro">
          {erro}
        </p>
      ) : registros.length === 0 ? (
        <p className="sintomas-mensagem" data-cy="sintomas-vazia">
          Você ainda não tem registros. Use o formulário acima para criar o
          primeiro.
        </p>
      ) : (
        <ul className="sintomas-lista" data-cy="sintomas-lista">
          {registros.map((registro) => (
            <li key={registro.id} className="sintomas-item" data-cy="sintomas-item">
              <div className="sintomas-item__cabecalho">
                <span className="sintomas-item__tipo">{registro.tipo}</span>
                <span className="sintomas-item__data">
                  {formatarData(registro.data)}
                </span>
              </div>
              <p className="sintomas-item__descricao">{registro.descricao}</p>
              {registro.intensidade ? (
                <span
                  className="sintomas-item__intensidade"
                  data-cy="sintomas-item-intensidade"
                >
                  Intensidade: {registro.intensidade}/5
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Sintomas
