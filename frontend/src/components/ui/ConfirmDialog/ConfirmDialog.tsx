import type { ReactNode } from 'react'
import Button from '../../Button/Button'
import Modal from '../Modal/Modal'
import './ConfirmDialog.css'

interface Props {
  aberto: boolean
  titulo: string
  /** Texto explicativo da consequência da ação. */
  descricao?: ReactNode
  rotuloConfirmar?: string
  rotuloCancelar?: string
  onConfirmar: () => void
  onCancelar: () => void
  /** Dá ao botão de confirmar o tom destrutivo (vermelho). */
  perigo?: boolean
  /** Desabilita os botões enquanto a ação está em andamento. */
  carregando?: boolean
  dataCy?: string
  dataCyConfirmar?: string
  dataCyCancelar?: string
}

/**
 * Confirmação sim/não construída sobre o `Modal`. Usada principalmente em
 * ações destrutivas, onde o botão de confirmar assume o tom de perigo.
 */
function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  perigo = false,
  carregando = false,
  dataCy,
  dataCyConfirmar,
  dataCyCancelar,
}: Props) {
  return (
    <Modal
      aberto={aberto}
      onFechar={onCancelar}
      titulo={titulo}
      mostrarFechar={false}
      dataCy={dataCy}
      rodape={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancelar}
            disabled={carregando}
            dataCy={dataCyCancelar}
          >
            {rotuloCancelar}
          </Button>
          <Button
            type="button"
            variant={perigo ? 'perigo' : 'primary'}
            onClick={onConfirmar}
            disabled={carregando}
            dataCy={dataCyConfirmar}
          >
            {carregando ? 'Aguarde…' : rotuloConfirmar}
          </Button>
        </>
      }
    >
      {descricao ? (
        <p className="confirm-dialog__descricao">{descricao}</p>
      ) : null}
    </Modal>
  )
}

export default ConfirmDialog
