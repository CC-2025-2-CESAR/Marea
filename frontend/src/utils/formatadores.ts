/**
 * Utilitários de formatação reutilizáveis pelo frontend.
 *
 * Hoje cobrem apenas telefone, mas o arquivo serve como ponto central
 * para próximos formatadores (CEP, data, etc.) entrarem no mesmo padrão.
 */

/**
 * Devolve apenas os dígitos do valor recebido.
 * Exemplo: somenteNumeros("(81) abc 99999-8888") -> "81999998888"
 */
function somenteNumeros(valor: string): string {
  return (valor || '').replace(/\D/g, '')
}

/**
 * Aplica a máscara brasileira de telefone ao valor recebido.
 * Aceita qualquer entrada — extrai os dígitos, limita a 11 e devolve
 * a máscara apropriada para 10 ou 11 dígitos.
 *
 * Exemplos:
 * formatarTelefone("81999998888") -> "(81) 99999-8888"
 * formatarTelefone("8133334444")  -> "(81) 3333-4444"
 * formatarTelefone("abc")         -> ""
 * formatarTelefone("81")          -> "(81"
 */
function formatarTelefone(valor: string): string {
  const digitos = somenteNumeros(valor).slice(0, 11)
  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`
  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  }
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

/**
 * Devolve só os dígitos do telefone — útil se algum dia for preciso
 * enviar ao backend sem máscara.
 */
function normalizarTelefone(valor: string): string {
  return somenteNumeros(valor)
}

/**
 * Aceita vazio (campo opcional) ou exatamente 10 ou 11 dígitos
 * (telefone fixo ou celular brasileiro). Qualquer outro tamanho é
 * considerado inválido.
 */
function telefoneValido(valor: string): boolean {
  const digitos = somenteNumeros(valor)
  return digitos.length === 0 || digitos.length === 10 || digitos.length === 11
}

export { somenteNumeros, formatarTelefone, normalizarTelefone, telefoneValido }
