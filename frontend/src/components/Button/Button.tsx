import { motion } from 'motion/react'
import type { MouseEventHandler, ReactNode } from 'react'
import './Button.css'

interface ButtonProps {
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  variant?: string
  dataCy?: string
}

function Button({
  children,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'primary',
  dataCy,
}: ButtonProps) {
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
