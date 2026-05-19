import './Button.css'

function Button({
  children,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'primary',
  dataCy,
}) {
  return (
    <button
      type={type}
      className={`botao botao--${variant}`}
      onClick={onClick}
      disabled={disabled}
      data-cy={dataCy}
    >
      {children}
    </button>
  )
}

export default Button
