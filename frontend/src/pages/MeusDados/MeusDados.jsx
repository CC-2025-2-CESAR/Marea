import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button'
import SelectField from '../../components/SelectField/SelectField'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import { useToast } from '../../components/ui/Toast/useToast'
import {
  criarSolicitacao,
  listarSolicitacoes,
  obterMeusDados,
} from '../../services/privacidadeService'
import './MeusDados.css'

// Tipos de solicitacao oferecidos no formulario (espelham o backend).
const TIPOS = [
  { valor: 'correcao', rotulo: 'Correção de dados' },
  { valor: 'exclusao', rotulo: 'Exclusão / anonimização' },
]

// Status da solicitacao -> tom do selo.
const TOM_STATUS = {
  pendente: 'aviso',
  em_andamento: 'info',
  concluida: 'sucesso',
  recusada: 'perigo',
}

function formatarData(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR')
}

/**
 * Área "Meus dados" (LGPD na interface): a paciente vê o retrato dos próprios
 * dados, baixa uma cópia (portabilidade) e abre pedidos de correção ou
 * exclusão. O backend garante que tudo é escopo do próprio usuário.
 */
function MeusDados() {
  const [dados, setDados] = useState(null)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [erroDados, setErroDados] = useState(false)

  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregandoSolic, setCarregandoSolic] = useState(true)
  const [erroSolic, setErroSolic] = useState(false)
  const [recarregar, setRecarregar] = useState(0)

  const [tipo, setTipo] = useState('correcao')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const { mostrarToast } = useToast()

  useEffect(() => {
    let cancelado = false
    obterMeusDados()
      .then((resposta) => {
        if (!cancelado) {
          setDados(resposta)
          setErroDados(false)
        }
      })
      .catch(() => {
        if (!cancelado) setErroDados(true)
      })
      .finally(() => {
        if (!cancelado) setCarregandoDados(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    listarSolicitacoes()
      .then((lista) => {
        if (!cancelado) {
          setSolicitacoes(Array.isArray(lista) ? lista : [])
          setErroSolic(false)
        }
      })
      .catch(() => {
        if (!cancelado) setErroSolic(true)
      })
      .finally(() => {
        if (!cancelado) setCarregandoSolic(false)
      })
    return () => {
      cancelado = true
    }
  }, [recarregar])

  function baixarDados() {
    if (!dados) return
    const conteudo = JSON.stringify(dados, null, 2)
    const blob = new Blob([conteudo], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'meus-dados-amare.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    mostrarToast('Download da sua cópia iniciado.', 'sucesso')
  }

  async function enviarSolicitacao(evento) {
    evento.preventDefault()
    if (!mensagem.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Descreva a sua solicitação.' })
      return
    }
    setEnviando(true)
    setFeedback(null)
    try {
      await criarSolicitacao({ tipo, mensagem: mensagem.trim() })
      setMensagem('')
      setTipo('correcao')
      setFeedback({
        tipo: 'sucesso',
        texto: 'Solicitação enviada. A clínica vai analisar.',
      })
      mostrarToast('Solicitação enviada.', 'sucesso')
      setRecarregar((n) => n + 1)
    } catch (erroReq) {
      const detalhe =
        erroReq?.detalhe?.mensagem?.[0] || erroReq?.detalhe?.tipo?.[0]
      setFeedback({
        tipo: 'erro',
        texto: detalhe || 'Não foi possível enviar a solicitação.',
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="meus-dados" data-cy="page-meus-dados">
      <header className="meus-dados__cabecalho">
        <h1>Meus dados</h1>
        <p>
          Veja o que a Amare guarda sobre você, baixe uma cópia e solicite
          correção ou exclusão. Saiba mais na{' '}
          <Link to="/privacidade" data-cy="meus-dados-ir-privacidade">
            política de privacidade
          </Link>
          .
        </p>
      </header>

      <div className="meus-dados__bloco" data-cy="meus-dados-conteudo">
        <div className="meus-dados__bloco-topo">
          <h2>Seus dados na Amare</h2>
          <Button
            type="button"
            variant="secondary"
            onClick={baixarDados}
            disabled={!dados}
            dataCy="meus-dados-baixar"
          >
            Baixar (JSON)
          </Button>
        </div>

        {carregandoDados && <p className="meus-dados__estado">Carregando…</p>}
        {erroDados && (
          <p
            className="meus-dados__estado meus-dados__estado--erro"
            role="alert"
            data-cy="meus-dados-erro"
          >
            Não foi possível carregar os seus dados.
          </p>
        )}

        {dados && (
          <dl className="meus-dados__campos">
            <div>
              <dt>Usuária</dt>
              <dd>{dados.conta.usuario}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{dados.conta.email || '—'}</dd>
            </div>
            <div>
              <dt>Membro desde</dt>
              <dd>{formatarData(dados.conta.membro_desde)}</dd>
            </div>
            {dados.perfil && (
              <>
                <div>
                  <dt>Nome completo</dt>
                  <dd>{dados.perfil.nome_completo || '—'}</dd>
                </div>
                <div>
                  <dt>Tipo de perfil</dt>
                  <dd>{dados.perfil.tipo_usuario_display}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd>{dados.perfil.telefone || '—'}</dd>
                </div>
              </>
            )}
            {dados.paciente && (
              <>
                <div>
                  <dt>Data de nascimento</dt>
                  <dd>{formatarData(dados.paciente.data_nascimento)}</dd>
                </div>
                <div>
                  <dt>Tipo sanguíneo</dt>
                  <dd>{dados.paciente.tipo_sanguineo_display}</dd>
                </div>
                <div>
                  <dt>Médica responsável</dt>
                  <dd>{dados.paciente.medica_responsavel || '—'}</dd>
                </div>
              </>
            )}
          </dl>
        )}

        {dados && dados.resumo_registros.length > 0 && (
          <div className="meus-dados__resumo">
            <h3>Seus registros</h3>
            <ul data-cy="meus-dados-resumo">
              {dados.resumo_registros.map((registro) => (
                <li key={registro.area}>
                  <Link to={registro.rota}>{registro.area}</Link>
                  <span className="meus-dados__contador">
                    {registro.quantidade}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="meus-dados__bloco">
        <h2>Solicitações de privacidade</h2>
        <p className="meus-dados__ajuda">
          Peça a correção de um dado ou a exclusão/anonimização da sua conta. A
          exclusão é avaliada pela clínica, respeitando as obrigações legais de
          guarda do prontuário.
        </p>

        {feedback && (
          <p
            className={`meus-dados__feedback meus-dados__feedback--${feedback.tipo}`}
            role="alert"
            data-cy="meus-dados-feedback"
          >
            {feedback.texto}
          </p>
        )}

        <form
          className="meus-dados__form"
          onSubmit={enviarSolicitacao}
          data-cy="solicitacao-form"
        >
          <SelectField
            id="solicitacao-tipo"
            label="Tipo de solicitação"
            value={tipo}
            onChange={setTipo}
            opcoes={TIPOS}
            dataCy="solicitacao-tipo"
          />
          <label className="meus-dados__campo-texto">
            Mensagem
            <textarea
              value={mensagem}
              onChange={(evento) => setMensagem(evento.target.value)}
              rows={4}
              placeholder="Descreva o que deve ser corrigido ou o motivo do pedido."
              data-cy="solicitacao-mensagem"
            />
          </label>
          <Button type="submit" disabled={enviando} dataCy="solicitacao-enviar">
            {enviando ? 'Enviando…' : 'Enviar solicitação'}
          </Button>
        </form>

        <h3 className="meus-dados__subtitulo">Suas solicitações</h3>

        {carregandoSolic && <p className="meus-dados__estado">Carregando…</p>}
        {erroSolic && (
          <p
            className="meus-dados__estado meus-dados__estado--erro"
            role="alert"
          >
            Não foi possível carregar as solicitações.
          </p>
        )}
        {!carregandoSolic && !erroSolic && solicitacoes.length === 0 && (
          <div data-cy="solicitacao-vazio">
            <EmptyState
              titulo="Nenhuma solicitação"
              descricao="Você ainda não abriu pedidos de correção ou exclusão."
            />
          </div>
        )}

        {solicitacoes.length > 0 && (
          <ul className="meus-dados__solicitacoes" data-cy="solicitacao-lista">
            {solicitacoes.map((solicitacao) => (
              <li
                key={solicitacao.id}
                className="meus-dados__solicitacao"
                data-cy={`solicitacao-item-${solicitacao.id}`}
              >
                <div className="meus-dados__solicitacao-topo">
                  <strong>{solicitacao.tipo_display}</strong>
                  <StatusBadge
                    tom={TOM_STATUS[solicitacao.status] || 'neutro'}
                    dataCy={`solicitacao-status-${solicitacao.id}`}
                  >
                    {solicitacao.status_display}
                  </StatusBadge>
                </div>
                <p className="meus-dados__solicitacao-msg">
                  {solicitacao.mensagem}
                </p>
                {solicitacao.resposta ? (
                  <p className="meus-dados__solicitacao-resposta">
                    <strong>Resposta:</strong> {solicitacao.resposta}
                  </p>
                ) : null}
                <span className="meus-dados__solicitacao-data">
                  Aberta em {formatarData(solicitacao.criada_em)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default MeusDados
