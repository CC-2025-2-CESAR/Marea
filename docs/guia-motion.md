# Guia da Motion

A biblioteca [Motion](https://motion.dev/) (sucessora do `framer-motion`) é usada no frontend
do Maréa para microinterações e transições suaves. Este guia explica como ela é usada
no projeto.

## Instalação

```bash
cd frontend
npm install motion
```

A dependência fica registrada em `frontend/package.json`.

## Como importar

O bundle para React é exposto em `motion/react`:

```jsx
import { motion, AnimatePresence } from 'motion/react'
```

- `motion.*`: versões animáveis dos elementos HTML/SVG (ex.: `motion.div`,
  `motion.button`, `motion.section`).
- `AnimatePresence`: cuida das animações de entrada e saída de elementos que
  aparecem/desaparecem no JSX.

## Onde está sendo usada hoje

- `src/pages/Login/Login.jsx`:
  - `motion.section` no card do login (fade + slide curto na entrada).
  - `motion.img` no logo (fade + slide leve, com pequeno atraso).
  - `motion.p` dentro de `AnimatePresence` no bloco de feedback de erro/sucesso.
- `src/components/Button/Button.jsx`:
  - `motion.button` com `whileHover` (escala 1.02) e `whileTap` (escala 0.98).

## Padrões adotados

- Durações curtas: entre 0,15 s e 0,35 s.
- `ease: 'easeOut'` para entradas (sensação acolhedora).
- `initial → animate → exit` quando o elemento entra e sai do DOM.
- Desligar microinterações de botão quando `disabled` é verdadeiro.

Exemplo de bloco condicional com `AnimatePresence`:

```jsx
<AnimatePresence>
  {mensagem ? (
    <motion.p
      key={mensagem}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {mensagem}
    </motion.p>
  ) : null}
</AnimatePresence>
```

Exemplo de microinteração em botão:

```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
  Entrar
</motion.button>
```

## Onde evitar

- Animações longas (acima de 0,5 s) em fluxos de uso frequente.
- Movimento grande em campos de formulário — atrapalha leitura e foco.
- Animações redundantes em listas longas, sem `staggerChildren` controlado.
- Animar cor de texto em estados de erro — prefira mudar a cor sem transição.

## Cuidado com testes

A Motion não altera o DOM final, então seletores `data-cy` continuam valendo. Mas
componentes envolvidos em `AnimatePresence` ficam montados durante a saída — em
testes, prefira asserções que aguardem a estabilização (`should('not.exist')`
ao invés de checar invisibilidade imediata).
