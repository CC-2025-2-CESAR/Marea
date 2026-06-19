/**
 * Ícone "chevron" (seta para baixo). Usado no botão raiz do SelectField
 * para indicar que ele abre uma lista. Mantém o padrão dos demais ícones
 * inline (props `tamanho` e `className`).
 */

interface IconeChevronProps {
  tamanho?: number
  className?: string
}

function IconeChevron({ tamanho = 18, className }: IconeChevronProps) {
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
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default IconeChevron
