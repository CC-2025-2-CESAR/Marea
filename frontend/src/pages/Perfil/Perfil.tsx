/**
 * Página de Perfil da paciente.
 *
 * Reúne, em seções claras: dados pessoais editáveis, acompanhamento clínico
 * (leitura, gerenciado pela clínica), "Meus registros" (sintomas e ciclo que a
 * própria paciente registrou) e um bloco de privacidade com atalhos para
 * "Meus dados" e a política. As ações de conta (alterar senha etc.) chegam em
 * etapas seguintes — aqui não há mais botões "em breve" sem função.
 */

import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Button from '../../components/Button/Button'
import Tabs from '../../components/ui/Tabs/Tabs'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { atualizarPerfil, obterPerfil } from '../../services/perfilService'
import { listarSintomas } from '../../services/sintomasService'
import { listarRegistrosCiclo } from '../../services/cicloService'
import { useToast } from '../../components/ui/Toast/useToast'
import { iniciais as calcularIniciais } from '../../utils/iniciais'
import { formatarTelefone, telefoneValido } from '../../utils/formatadores'
import type { Perfil as PerfilTipo, RegistroCiclo, RegistroSintoma } from '../../types'
import './Perfil.css'

type AbaRegistros = 'sintomas' | 'ciclo'

interface FormularioPerfil {
  nome_completo: string
  telefone: string
  data_nascimento: string
}

interface Feedback {
  tipo: 'erro' | 'sucesso'
  texto: string
}

/** Converte uma data ISO (YYYY-MM-DD) para DD/MM/AAAA sem cair em fuso. */
function formatarData(iso?: string): string {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return iso
  return `${dia}/${mes}/${ano}`
}

function Perfil() {
  const [perfil, setPerfil] = useState<PerfilTipo | null>(null)
  const [formulario, setFormulario] = useState<FormularioPerfil>({
    nome_completo: '',
    telefone: '',
    data_nascimento: '',
  })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [sintomas, setSintomas] = useState<RegistroSintoma[]>([])
  const [registrosCiclo, setRegistrosCiclo] = useState<RegistroCiclo[]>([])
  const [carregandoRegistros, setCarregandoRegistros] = useState(true)
  const [abaRegistros, setAbaRegistros] = useState<AbaRegistros>('sintomas')

  const { mostrarToast } = useToast()

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

  // "Meus registros" carrega à parte: se falhar ou vier vazio, a seção mostra
  // um estado vazio acolhedor — nunca derruba a página nem o restante do perfil.
  useEffect(() => {
    let cancelado = false

    async function carregarRegistros() {
      const [resSintomas, resCiclo] = await Promise.allSettled([
        listarSintomas(),
        listarRegistrosCiclo(),
      ])
      if (cancelado) return
      if (resSintomas.status === 'fulfilled') {
        setSintomas(resSintomas.value)
      }
      if (resCiclo.status === 'fulfilled') {
        setRegistrosCiclo(resCiclo.value)
      }
      setCarregandoRegistros(false)
    }

    carregarRegistros()
    return () => {
      cancelado = true
    }
  }, [])

  const iniciais = useMemo(
    () => calcularIniciais(perfil?.nome_completo, perfil?.username),
    [perfil?.nome_completo, perfil?.username],
  )

  const sintomasRecentes = useMemo(() => sintomas.slice(0, 5), [sintomas])
  const cicloRecentes = useMemo(
    () => registrosCiclo.slice(0, 5),
    [registrosCiclo],
  )

  const telefoneTemErro = !telefoneValido(formulario.telefone)

  function atualizarCampo(campo: keyof FormularioPerfil, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    setFeedback(null)
  }

  async function handleSalvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setSalvando(true)
    setFeedback(null)

    const carga: Partial<PerfilTipo> = {
      nome_completo: formulario.nome_completo.trim(),
      telefone: formulario.telefone.trim(),
      data_nascimento: formulario.data_nascimento || null,
    }

    try {
      const atualizado = await atualizarPerfil(carga)
      setPerfil(atualizado)
      mostrarToast('Perfil atualizado com sucesso.', 'sucesso')
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

  if (erro || !perfil) {
    return (
      <section data-cy="page-perfil" className="perfil-pagina">
        {cabecalho}
        <div className="perfil-estado">
          <p
            data-cy="perfil-mensagem-erro"
            className="perfil-mensagem perfil-mensagem--erro"
          >
            {erro ?? 'Não foi possível carregar seu perfil no momento.'}
          </p>
        </div>
      </section>
    )
  }

  function renderPainelRegistros() {
    if (carregandoRegistros) {
      return (
        <p className="perfil-mensagem" data-cy="perfil-registros-carregando">
          Carregando seus registros…
        </p>
      )
    }

    if (abaRegistros === 'sintomas') {
      if (sintomasRecentes.length === 0) {
        return (
          <EmptyState
            titulo="Nenhum sintoma registrado"
            descricao="Quando você registrar como está se sentindo, os últimos aparecem aqui."
            acao={
              <Link
                to="/sintomas"
                className="perfil-link"
                data-cy="perfil-registros-ir-sintomas"
              >
                Registrar um sintoma
              </Link>
            }
          />
        )
      }
      return (
        <ul className="perfil-registros-lista">
          {sintomasRecentes.map((registro) => (
            <li
              key={registro.id}
              className="perfil-registro-item"
              data-cy="perfil-registro-item"
            >
              <span className="perfil-registro-data">
                {formatarData(registro.data)}
              </span>
              <span className="perfil-registro-titulo">
                {registro.tipo || 'Sintoma'}
              </span>
              {registro.descricao ? (
                <p className="perfil-registro-desc">{registro.descricao}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )
    }

    if (cicloRecentes.length === 0) {
      return (
        <EmptyState
          titulo="Nenhum registro de ciclo"
          descricao="Os registros do seu ciclo aparecem aqui assim que você começar."
          acao={
            <Link
              to="/ciclo"
              className="perfil-link"
              data-cy="perfil-registros-ir-ciclo"
            >
              Ir para o ciclo
            </Link>
          }
        />
      )
    }
    return (
      <ul className="perfil-registros-lista">
        {cicloRecentes.map((registro) => (
          <li
            key={registro.id}
            className="perfil-registro-item"
            data-cy="perfil-registro-item"
          >
            <span className="perfil-registro-data">
              {formatarData(registro.data)}
            </span>
            <span className="perfil-registro-titulo">
              {registro.etapa_display || registro.etapa}
            </span>
            {registro.observacoes ? (
              <p className="perfil-registro-desc">{registro.observacoes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section data-cy="page-perfil" className="perfil-pagina">
      {cabecalho}

      <div className="perfil-grade">
        <aside className="perfil-cartao perfil-cartao--foto">
          <div className="perfil-avatar" data-cy="perfil-avatar">
            {iniciais}
          </div>
          <div className="perfil-identidade">
            <p className="perfil-identidade-nome" data-cy="perfil-identidade-nome">
              {perfil.nome_completo || perfil.username}
            </p>
            {perfil.email ? (
              <p className="perfil-identidade-email">{perfil.email}</p>
            ) : null}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  atualizarCampo('nome_completo', e.target.value)
                }
                data-cy="perfil-nome"
                autoComplete="name"
              />
            </label>

            <label className="perfil-campo">
              <span>Data de nascimento</span>
              <input
                type="date"
                value={formulario.data_nascimento || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  atualizarCampo('data_nascimento', e.target.value)
                }
                data-cy="perfil-data-nascimento"
              />
            </label>

            <label className="perfil-campo">
              <span>Telefone</span>
              <input
                type="tel"
                inputMode="tel"
                value={formulario.telefone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
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

          <section
            className="perfil-cartao perfil-cartao--registros"
            data-cy="perfil-registros"
          >
            <h2>Meus registros</h2>
            <p className="perfil-secao-intro">
              Um resumo do que você mesma registrou na Amare.
            </p>
            <Tabs
              abas={[
                {
                  id: 'sintomas',
                  rotulo: 'Sintomas',
                  dataCy: 'perfil-registros-aba-sintomas',
                },
                {
                  id: 'ciclo',
                  rotulo: 'Ciclo',
                  dataCy: 'perfil-registros-aba-ciclo',
                },
              ]}
              ativa={abaRegistros}
              onMudar={(id) => setAbaRegistros(id as AbaRegistros)}
              rotuloLista="Tipos de registro"
              dataCy="perfil-registros-abas"
            />
            <div
              role="tabpanel"
              id={`painel-${abaRegistros}`}
              aria-labelledby={`tab-${abaRegistros}`}
              className="perfil-registros-painel"
            >
              {renderPainelRegistros()}
            </div>
          </section>

          <section
            className="perfil-cartao perfil-cartao--privacidade"
            data-cy="perfil-privacidade"
          >
            <h2>Privacidade e dados</h2>
            <p>
              Você controla os seus dados na Amare. Veja o que guardamos, baixe
              uma cópia ou peça correção e exclusão quando quiser.
            </p>
            <div className="perfil-privacidade-acoes">
              <Link
                to="/meus-dados"
                className="perfil-link"
                data-cy="perfil-link-meus-dados"
              >
                Meus dados
              </Link>
              <Link
                to="/privacidade"
                className="perfil-link perfil-link--secundario"
                data-cy="perfil-link-privacidade"
              >
                Política de privacidade
              </Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default Perfil
