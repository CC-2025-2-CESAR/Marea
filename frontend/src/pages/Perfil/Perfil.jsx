/**
 * Página de Perfil da paciente.
 *
 * Layout em duas colunas (desktop): card creme à esquerda com avatar e botões
 * secundários, card azul à direita com formulário de dados pessoais e
 * acompanhamento clínico (somente leitura por enquanto).
 *
 * Os botões "Editar foto", "Alterar senha", "Notificações", "Editar plano" e
 * as opções extras ficam desabilitados nesta etapa — viram funcionalidades
 * em uma próxima rodada.
 *
 * Os dados de medicamentos e observações vêm do backend mas são editáveis
 * apenas pelo Django Admin. Aqui aparecem como visualização.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Button from '../../components/Button/Button'
import SelectField from '../../components/SelectField/SelectField'
import { atualizarPerfil, obterPerfil } from '../../services/perfilService'
import { formatarTelefone, telefoneValido } from '../../utils/formatadores'
import './Perfil.css'

const TIPOS_SANGUINEOS = [
  { valor: 'desconhecido', rotulo: 'Desconhecido' },
  { valor: 'A+', rotulo: 'A+' },
  { valor: 'A-', rotulo: 'A-' },
  { valor: 'B+', rotulo: 'B+' },
  { valor: 'B-', rotulo: 'B-' },
  { valor: 'AB+', rotulo: 'AB+' },
  { valor: 'AB-', rotulo: 'AB-' },
  { valor: 'O+', rotulo: 'O+' },
  { valor: 'O-', rotulo: 'O-' },
]

const BOTOES_SECUNDARIOS = [
  'Editar foto',
  'Alterar senha',
  'Notificações',
  'Editar plano',
  'Opção',
  'Opção',
]

function calcularIniciais(nome, username) {
  const base = (nome || username || '').trim()
  if (!base) return 'AM'
  const partes = base.split(/\s+/).filter(Boolean)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase() || 'AM'
}

function Perfil() {
  const [perfil, setPerfil] = useState(null)
  const [formulario, setFormulario] = useState({
    nome_completo: '',
    telefone: '',
    data_nascimento: '',
    tipo_sanguineo: 'desconhecido',
  })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const dados = await obterPerfil()
        if (cancelado) return
        setPerfil(dados)
        setFormulario({
          nome_completo: dados.nome_completo ?? '',
          telefone: formatarTelefone(dados.telefone ?? ''),
          data_nascimento: dados.data_nascimento ?? '',
          tipo_sanguineo: dados.tipo_sanguineo || 'desconhecido',
        })
      } catch {
        if (!cancelado) {
          setErro('Não foi possível carregar seu perfil no momento.')
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

  const iniciais = useMemo(
    () => calcularIniciais(perfil?.nome_completo, perfil?.username),
    [perfil?.nome_completo, perfil?.username],
  )

  const telefoneTemErro = !telefoneValido(formulario.telefone)

  function atualizarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    setFeedback(null)
  }

  async function handleSalvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    setFeedback(null)

    const carga = {
      nome_completo: formulario.nome_completo.trim(),
      telefone: formulario.telefone.trim(),
      data_nascimento: formulario.data_nascimento || null,
      tipo_sanguineo: formulario.tipo_sanguineo,
    }

    try {
      const atualizado = await atualizarPerfil(carga)
      setPerfil(atualizado)
      setFeedback({
        tipo: 'sucesso',
        texto: 'Perfil atualizado com sucesso.',
      })
    } catch {
      setFeedback({
        tipo: 'erro',
        texto: 'Não foi possível salvar agora. Tente novamente em instantes.',
      })
    } finally {
      setSalvando(false)
    }
  }

  const cabecalho = (
    <header className="perfil-cabecalho">
      <h1>Perfil</h1>
      <p>Acompanhe e atualize seus dados na Amare.</p>
    </header>
  )

  if (carregando) {
    return (
      <section data-cy="page-perfil" className="perfil-pagina">
        {cabecalho}
        <div className="perfil-estado">
          <p data-cy="perfil-mensagem-carregando" className="perfil-mensagem">
            Carregando seu perfil…
          </p>
        </div>
      </section>
    )
  }

  if (erro) {
    return (
      <section data-cy="page-perfil" className="perfil-pagina">
        {cabecalho}
        <div className="perfil-estado">
          <p
            data-cy="perfil-mensagem-erro"
            className="perfil-mensagem perfil-mensagem--erro"
          >
            {erro}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section data-cy="page-perfil" className="perfil-pagina">
      {cabecalho}

      <div className="perfil-grade">
        <aside
          className="perfil-cartao perfil-cartao--foto"
          data-cy="perfil-botoes-secundarios"
        >
          <div className="perfil-avatar" data-cy="perfil-avatar">
            {iniciais}
          </div>
          <div className="perfil-botoes">
            {BOTOES_SECUNDARIOS.map((rotulo, indice) => (
              <button
                key={`${rotulo}-${indice}`}
                type="button"
                className="perfil-botao-secundario"
                disabled
                title="Em breve"
              >
                {rotulo}
              </button>
            ))}
          </div>
        </aside>

        <div className="perfil-direita">
          <form
            className="perfil-cartao perfil-cartao--dados"
            onSubmit={handleSalvar}
            noValidate
          >
            <h2>Dados pessoais</h2>

            <label className="perfil-campo">
              <span>Nome completo</span>
              <input
                type="text"
                value={formulario.nome_completo}
                onChange={(e) => atualizarCampo('nome_completo', e.target.value)}
                data-cy="perfil-nome"
                autoComplete="name"
              />
            </label>

            <div className="perfil-grupo">
              <label className="perfil-campo">
                <span>Data de nascimento</span>
                <input
                  type="date"
                  value={formulario.data_nascimento || ''}
                  onChange={(e) =>
                    atualizarCampo('data_nascimento', e.target.value)
                  }
                  data-cy="perfil-data-nascimento"
                />
              </label>
              <SelectField
                id="perfil-tipo-sanguineo"
                label="Tipo sanguíneo"
                value={formulario.tipo_sanguineo}
                onChange={(novo) => atualizarCampo('tipo_sanguineo', novo)}
                opcoes={TIPOS_SANGUINEOS.map((tipo) => ({
                  valor: tipo.valor,
                  rotulo: tipo.rotulo,
                }))}
                dataCy="perfil-tipo-sanguineo"
              />
            </div>

            <label className="perfil-campo">
              <span>Telefone</span>
              <input
                type="tel"
                inputMode="tel"
                value={formulario.telefone}
                onChange={(e) =>
                  atualizarCampo('telefone', formatarTelefone(e.target.value))
                }
                data-cy="perfil-telefone"
                autoComplete="tel"
                aria-invalid={telefoneTemErro ? 'true' : 'false'}
                aria-describedby={
                  telefoneTemErro ? 'perfil-telefone-erro' : undefined
                }
                placeholder="(81) 99999-8888"
              />
              {telefoneTemErro ? (
                <small
                  id="perfil-telefone-erro"
                  className="perfil-campo-erro"
                  data-cy="perfil-telefone-erro"
                >
                  Informe um telefone com 10 ou 11 dígitos.
                </small>
              ) : null}
            </label>

            <label className="perfil-campo">
              <span>E-mail</span>
              <input
                type="email"
                value={perfil.email || ''}
                readOnly
                data-cy="perfil-email"
              />
              <small className="perfil-dica">
                Para alterar o e-mail, fale com a equipe da clínica.
              </small>
            </label>

            <AnimatePresence>
              {feedback ? (
                <motion.p
                  key={feedback.texto}
                  className={`perfil-feedback perfil-feedback--${feedback.tipo}`}
                  role="status"
                  data-cy="perfil-feedback"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {feedback.texto}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <div className="perfil-acoes">
              <Button type="submit" dataCy="perfil-salvar" disabled={salvando}>
                {salvando ? (
                  <span className="perfil-salvando-texto">Salvando…</span>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </div>
          </form>

          <section className="perfil-cartao perfil-cartao--clinico">
            <h2>Acompanhamento clínico</h2>
            <div className="perfil-clinico">
              <p className="perfil-rotulo">Medicamentos em uso</p>
              <p data-cy="perfil-medicamentos">
                {perfil.medicamentos_em_uso ||
                  'Nenhum medicamento registrado.'}
              </p>
            </div>
            <div className="perfil-clinico">
              <p className="perfil-rotulo">Observações médicas</p>
              <p data-cy="perfil-observacoes">
                {perfil.observacoes_medicas || 'Sem observações registradas.'}
              </p>
            </div>
            <p className="perfil-clinico-aviso">
              Esses dados são gerenciados pela equipe da clínica.
            </p>
          </section>
        </div>
      </div>
    </section>
  )
}

export default Perfil
