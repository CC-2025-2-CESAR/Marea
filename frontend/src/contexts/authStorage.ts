/**
 * Constante da chave do `localStorage` usada para guardar a sessão da Amare.
 *
 * Fica em arquivo próprio (sem componente) para ser importada tanto pelo
 * `AuthContext` quanto pelo wrapper de API (lado de serviço) sem violar a
 * regra `react-refresh/only-export-components`.
 */

export const CHAVE_STORAGE = 'marea_auth'
