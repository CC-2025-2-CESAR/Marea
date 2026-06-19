/**
 * Gestão do dicionário (/gestao/dicionario): CRUD in-app dos termos pela
 * administração. Lista todos (inclusive os ocultos), cria/edita por formulário
 * e exclui com confirmação. O backend (IsAdminClinica) é a barreira real.
 */

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../components/Button/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog'
import {
  atualizarTermo,
  criarTermo,
  excluirTermo,
  listarTermos,
} from '../../services/adminService'
import type { ErroRequisicao } from '../../services/api'
import type { TermoAdmin } from '../../types'
import './Gestao.css'

const FORM_VAZIO = {
  termo: '',
  definicao: '',
  categoria: '',
  exemplo: '',
  ativo: true,
}

interface Feedback {
  tipo: 'erro' | 'sucesso'
  texto: string
}

interface DetalheTermo {
  termo?: string[]
}

function GestaoDicionario() {
  const [termos, setTermos] = useState<TermoAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [excluindo, setExcluindo] = useState<TermoAdmin | null>(null)
  const [removendo, setRemovendo] = useState(false)

  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    let cancelado = false
    listarTermos()
      .then((dados) => {
        if (!cancelado) {
          setTermos(dados)
          setErro(false)
        }
      })
      .catch(() => {
        if (!cancelado) setErro(true)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [recarregar])

  function iniciarCriacao() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setFeedback(null)
  }

  function iniciarEdicao(termo: TermoAdmin) {
    setEditandoId(termo.id)
    setForm({
      termo: termo.termo,
      definicao: termo.definicao,
      categoria: termo.categoria || '',
      exemplo: termo.exemplo || '',
      ativo: termo.ativo,
    })
    setFeedback(null)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!form.termo.trim() || !form.definicao.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe o termo e a definição.' })
      return
    }
    setEnviando(true)
    setFeedback(null)
    try {
      if (editandoId) {
        await atualizarTermo(editandoId, form)
        setFeedback({ tipo: 'sucesso', texto: 'Termo atualizado.' })
      } else {
        await criarTermo(form)
        setFeedback({ tipo: 'sucesso', texto: 'Termo criado.' })
      }
      setForm(FORM_VAZIO)
      setEditandoId(null)
      setRecarregar((n) => n + 1)
    } catch (erroReq) {
      // Mostra a mensagem do backend quando houver (ex.: termo duplicado).
      const detalhe = (erroReq as ErroRequisicao)?.detalhe as
        | DetalheTermo
        | undefined
      setFeedback({
        tipo: 'erro',
        texto: detalhe?.termo?.[0] || 'Não foi possível salvar o termo.',
      })
    } finally {
      setEnviando(false)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    setRemovendo(true)
    try {
      await excluirTermo(excluindo.id)
      setFeedback({ tipo: 'sucesso', texto: 'Termo excluído.' })
      if (editandoId === excluindo.id) {
        setEditandoId(null)
        setForm(FORM_VAZIO)
      }
      setExcluindo(null)
      setRecarregar((n) => n + 1)
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Não foi possível excluir o termo.' })
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="gestao" data-cy="page-gestao-dicionario">
      <header className="gestao__cabecalho">
        <h1 className="gestao__titulo">Dicionário</h1>
        <p className="gestao__saudacao">
          Conteúdo público consultado pelas pacientes.
        </p>
      </header>

      {feedback && (
        <p
          className={`gestao__feedback gestao__feedback--${feedback.tipo}`}
          role="alert"
          data-cy="gestao-feedback"
        >
          {feedback.texto}
        </p>
      )}

      <form className="gestao__form" onSubmit={enviar} data-cy="termo-form">
        <h2>{editandoId ? 'Editar termo' : 'Novo termo'}</h2>
        <label>
          Termo
          <input
            type="text"
            value={form.termo}
            onChange={(e) => setForm({ ...form, termo: e.target.value })}
            data-cy="termo-termo"
            required
          />
        </label>
        <label>
          Definição
          <textarea
            value={form.definicao}
            onChange={(e) => setForm({ ...form, definicao: e.target.value })}
            rows={3}
            data-cy="termo-definicao"
            required
          />
        </label>
        <label>
          Categoria
          <input
            type="text"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            data-cy="termo-categoria"
          />
        </label>
        <label>
          Exemplo de uso
          <textarea
            value={form.exemplo}
            onChange={(e) => setForm({ ...form, exemplo: e.target.value })}
            rows={2}
            data-cy="termo-exemplo"
          />
        </label>
        <label className="gestao__check">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            data-cy="termo-ativo"
          />
          Publicado (visível para as pacientes)
        </label>
        <div className="gestao__form-acoes">
          <Button type="submit" dataCy="termo-salvar" disabled={enviando}>
            {enviando
              ? 'Salvando…'
              : editandoId
                ? 'Salvar alterações'
                : 'Criar termo'}
          </Button>
          {editandoId && (
            <Button
              type="button"
              variant="secondary"
              onClick={iniciarCriacao}
              dataCy="termo-cancelar"
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {carregando && <p className="gestao__estado">Carregando…</p>}
      {erro && (
        <p className="gestao__estado">Não foi possível carregar os termos.</p>
      )}
      {!carregando && !erro && termos.length === 0 && (
        <p className="gestao__estado" data-cy="termo-vazio">
          Nenhum termo cadastrado.
        </p>
      )}

      <ul className="gestao__lista" data-cy="termo-lista">
        {termos.map((termo) => (
          <li key={termo.id} className="gestao__item" data-cy={`termo-item-${termo.id}`}>
            <div className="gestao__item-texto">
              <strong>
                {termo.termo}
                {!termo.ativo && <span className="gestao__rascunho"> · oculto</span>}
              </strong>
              <span>{termo.categoria}</span>
            </div>
            <div className="gestao__item-acoes">
              <button
                type="button"
                className="gestao__acao"
                onClick={() => iniciarEdicao(termo)}
                data-cy={`termo-editar-${termo.id}`}
              >
                Editar
              </button>
              <button
                type="button"
                className="gestao__acao gestao__acao--perigo"
                onClick={() => setExcluindo(termo)}
                data-cy={`termo-excluir-${termo.id}`}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        aberto={excluindo !== null}
        titulo="Excluir termo"
        descricao={
          excluindo
            ? `Excluir "${excluindo.termo}"? Esta ação não pode ser desfeita.`
            : ''
        }
        rotuloConfirmar="Excluir"
        perigo
        carregando={removendo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setExcluindo(null)}
        dataCy="termo-confirm-excluir"
        dataCyConfirmar="termo-confirm-excluir-sim"
        dataCyCancelar="termo-confirm-excluir-nao"
      />
    </div>
  )
}

export default GestaoDicionario
