import { motion } from 'motion/react'
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
    <motion.button
      type={type}
      className={`botao botao--${variant}`}
      onClick={onClick}
      disabled={disabled}
      data-cy={dataCy}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </motion.button>
  )
}

export default Button
