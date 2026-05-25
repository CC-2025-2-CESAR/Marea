/**
 * Ícone hambúrguer usado no botão de abrir o menu lateral em telas mobile.
 * Mantém o padrão dos demais ícones inline (props `tamanho` e `className`).
 */

function IconeMenu({ tamanho = 24, className }) {
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
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default IconeMenu
