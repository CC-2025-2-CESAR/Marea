import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixa a porta do dev server em 5173 (a mesma que o backend libera no CORS
  // e que o Cypress espera em `baseUrl`). `strictPort: true` faz o Vite
  // falhar em vez de pular para 5174/5175 quando a porta estiver ocupada —
  // isso evita o cenário em que o frontend sobe em outra porta e o login
  // quebra silenciosamente por CORS.
  server: {
    port: 5173,
    strictPort: true,
  },
})
