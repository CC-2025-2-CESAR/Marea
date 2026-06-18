/**
 * Ícone de logout (seta saindo de uma porta). Inspirado na imagem do Figma
 * de perfil, onde o botão fica no canto inferior esquerdo da sidebar.
 * Mantém o padrão dos demais ícones inline (props `tamanho` e `className`).
 */

interface IconeProps {
  tamanho?: number
  className?: string
}

function IconeLogout({ tamanho = 20, className }: IconeProps) {
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
        d="M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m17 16 4-4-4-4M21 12H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default IconeLogout
