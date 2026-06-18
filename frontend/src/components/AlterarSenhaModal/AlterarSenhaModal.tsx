import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../ui/Modal/Modal'
import Button from '../Button/Button'
import InputField from '../InputField/InputField'
import { alterarSenha } from '../../services/senhaService'
import { useToast } from '../ui/Toast/useToast'
import type { ErroRequisicao } from '../../services/api'
import './AlterarSenhaModal.css'

interface Props {
  aberto: boolean
  onFechar: () => void
}

interface DetalheErroSenha {
  detail?: string
  password?: string[]
}

function mensagemDoErro(erro: ErroRequisicao): string {
  const detalhe = erro?.detalhe as DetalheErroSenha | undefined
  if (detalhe?.detail) return detalhe.detail
  if (detalhe?.password?.length) return detalhe.password.join(' ')
  return 'Não foi possível alterar a senha agora. Tente novamente em instantes.'
}

/**
 * Modal de troca de senha (Segurança da conta). Pede a senha atual + a nova
 * (com confirmação). A validação forte fica no backend (reusa os validadores
 * do Django); aqui cuidamos do básico e mostramos a mensagem específica.
 */
function AlterarSenhaModal({ aberto, onFechar }: Props) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const { mostrarToast } = useToast()

  function fecharLimpo() {
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmar('')
    setErro(null)
    setSalvando(false)
    onFechar()
  }

  async function salvar() {
    if (!senhaAtual || !novaSenha || !confirmar) {
      setErro('Preencha todos os campos.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('A nova senha e a confirmação não conferem.')
      return
    }

    setSalvando(true)
    setErro(null)
    try {
      await alterarSenha({ senha_atual: senhaAtual, nova_senha: novaSenha })
      mostrarToast('Senha alterada com sucesso.', 'sucesso')
      fecharLimpo()
    } catch (e) {
      setErro(mensagemDoErro(e as ErroRequisicao))
      setSalvando(false)
    }
  }

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    salvar()
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fecharLimpo}
      titulo="Alterar senha"
      dataCy="alterar-senha"
      rodape={
        <>
          <button
            type="button"
            className="alterar-senha-cancelar"
            onClick={fecharLimpo}
            data-cy="alterar-senha-cancelar"
          >
            Cancelar
          </button>
          <Button
            onClick={() => salvar()}
            disabled={salvando}
            dataCy="alterar-senha-salvar"
          >
            {salvando ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </>
      }
    >
      <form className="alterar-senha-form" onSubmit={handleSubmit} noValidate>
        <InputField
          id="alterar-senha-atual"
          name="senha_atual"
          label="Senha atual"
          type="password"
          value={senhaAtual}
          onChange={(e) => {
            setSenhaAtual(e.target.value)
            setErro(null)
          }}
          autoComplete="current-password"
          dataCy="alterar-senha-atual"
        />
        <InputField
          id="alterar-senha-nova"
          name="nova_senha"
          label="Nova senha"
          type="password"
          value={novaSenha}
          onChange={(e) => {
            setNovaSenha(e.target.value)
            setErro(null)
          }}
          autoComplete="new-password"
          dataCy="alterar-senha-nova"
        />
        <InputField
          id="alterar-senha-confirmar"
          name="confirmar_senha"
          label="Confirmar nova senha"
          type="password"
          value={confirmar}
          onChange={(e) => {
            setConfirmar(e.target.value)
            setErro(null)
          }}
          autoComplete="new-password"
          dataCy="alterar-senha-confirmar"
        />
        {erro ? (
          <p className="alterar-senha-erro" role="alert" data-cy="alterar-senha-erro">
            {erro}
          </p>
        ) : null}
        <p className="alterar-senha-dica">
          Use ao menos 8 caracteres, com letras e números, evitando dados óbvios
          da sua conta.
        </p>
      </form>
    </Modal>
  )
}

export default AlterarSenhaModal
