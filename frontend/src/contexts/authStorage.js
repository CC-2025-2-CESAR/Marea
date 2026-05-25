/**
 * Constante da chave do `localStorage` usada para guardar a sessão da Amare.
 *
 * Fica em arquivo `.js` próprio para ser importada tanto pelo `AuthContext`
 * (componente) quanto pelo wrapper de API (lado de serviço) sem violar a
 * regra `react-refresh/only-export-components`.
 */

export const CHAVE_STORAGE = 'marea_auth'
