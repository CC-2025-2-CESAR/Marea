/**
 * Ícone "X" usado no botão de fechar o menu lateral em telas mobile.
 * Mantém o padrão dos demais ícones inline (props `tamanho` e `className`).
 */

function IconeFechar({ tamanho = 22, className }) {
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default IconeFechar
