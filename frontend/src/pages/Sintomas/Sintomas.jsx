import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'
import SelectField from '../../components/SelectField/SelectField'
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog'
import { useToast } from '../../components/ui/Toast/useToast'
import {
  atualizarSintoma,
  criarSintoma,
  excluirSintoma,
  listarSintomas,
} from '../../services/sintomasService'
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
  const [editandoId, setEditandoId] = useState(null)

  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  const { mostrarToast } = useToast()
  const formRef = useRef(null)

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

  function limparFormulario() {
    setEditandoId(null)
    setData(hojeISO())
    setTipo('')
    setDescricao('')
    setIntensidade('')
    setErroEnvio(null)
  }

  function iniciarEdicao(registro) {
    setEditandoId(registro.id)
    setData(registro.data)
    setTipo(registro.tipo || '')
    setDescricao(registro.descricao || '')
    setIntensidade(registro.intensidade ? String(registro.intensidade) : '')
    setErroEnvio(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErroEnvio(null)

    if (!data || !tipo.trim() || !descricao.trim()) {
      setErroEnvio('Preencha a data, o tipo e a descrição.')
      return
    }

    const payload = {
      data,
      tipo: tipo.trim(),
      descricao: descricao.trim(),
      intensidade: intensidade ? Number(intensidade) : null,
    }

    setEnviando(true)
    try {
      if (editandoId) {
        const atualizado = await atualizarSintoma(editandoId, payload)
        setRegistros((atuais) =>
          atuais.map((r) => (r.id === editandoId ? atualizado : r)),
        )
        mostrarToast('Registro atualizado.', 'sucesso')
      } else {
        const criado = await criarSintoma(payload)
        setRegistros((atuais) => [criado, ...atuais])
        mostrarToast('Registro salvo.', 'sucesso')
      }
      limparFormulario()
    } catch {
      setErroEnvio('Não foi possível salvar o registro. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function confirmarExclusao(id) {
    setExcluindo(true)
    try {
      await excluirSintoma(id)
      setRegistros((atuais) => atuais.filter((r) => r.id !== id))
      setConfirmandoId(null)
      if (editandoId === id) {
        limparFormulario()
      }
      mostrarToast('Registro excluído.', 'sucesso')
    } catch {
      setConfirmandoId(null)
      mostrarToast(
        'Não foi possível excluir o registro. Tente novamente.',
        'erro',
      )
    } finally {
      setExcluindo(false)
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

      <form
        className="sintomas-form"
        onSubmit={handleSubmit}
        data-cy="sintomas-form"
        ref={formRef}
      >
        <h2 className="sintomas-form__titulo">
          {editandoId ? 'Editar registro' : 'Novo registro'}
        </h2>
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
        <div className="sintomas-form__acoes">
          <Button type="submit" disabled={enviando} dataCy="sintomas-enviar">
            {enviando
              ? 'Salvando...'
              : editandoId
                ? 'Salvar alterações'
                : 'Salvar registro'}
          </Button>
          {editandoId ? (
            <Button
              type="button"
              variant="secondary"
              onClick={limparFormulario}
              dataCy="sintomas-cancelar-edicao"
            >
              Cancelar
            </Button>
          ) : null}
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

              <div className="sintomas-item__acoes">
                <button
                  type="button"
                  className="sintomas-item__botao"
                  onClick={() => iniciarEdicao(registro)}
                  data-cy="sintomas-item-editar"
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="sintomas-item__botao sintomas-item__botao--perigo"
                  onClick={() => setConfirmandoId(registro.id)}
                  data-cy="sintomas-item-excluir"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        aberto={confirmandoId !== null}
        titulo="Excluir registro?"
        descricao="Esta ação não pode ser desfeita. O registro sai do seu histórico."
        rotuloConfirmar="Sim, excluir"
        rotuloCancelar="Cancelar"
        perigo
        carregando={excluindo}
        onConfirmar={() =>
          confirmandoId !== null && confirmarExclusao(confirmandoId)
        }
        onCancelar={() => setConfirmandoId(null)}
        dataCy="sintomas-confirmar-exclusao"
        dataCyConfirmar="sintomas-confirmar-sim"
        dataCyCancelar="sintomas-confirmar-nao"
      />
    </section>
  )
}

export default Sintomas
