/**
 * Helpers de nome para a interface — saudação e avatar por iniciais.
 *
 * Ficam centralizados aqui para o cabeçalho, a Home e o Perfil usarem a mesma
 * regra (o Perfil ainda tem uma cópia local que migra para cá ao virar `.tsx`).
 */

/**
 * Primeiro nome de um nome completo, com a primeira letra maiúscula.
 * Útil para uma saudação acolhedora ("Bem-vinda, Maria").
 *
 * primeiroNome("maria clara de souza") -> "Maria"
 * primeiroNome("  ") -> ""
 * primeiroNome(undefined) -> ""
 */
export function primeiroNome(nomeCompleto?: string | null): string {
  const base = (nomeCompleto ?? '').trim()
  if (!base) return ''
  const primeira = base.split(/\s+/)[0]
  return primeira.charAt(0).toLocaleUpperCase('pt-BR') + primeira.slice(1)
}

/**
 * Iniciais (primeira + última palavra) para o avatar. Cai em "AM" quando não
 * há nome nem username — evita um círculo vazio.
 *
 * iniciais("Maria Clara de Souza") -> "MS"
 * iniciais("", "maria.clara") -> "M"
 * iniciais("", "") -> "AM"
 */
export function iniciais(nomeCompleto?: string | null, username?: string | null): string {
  const base = (nomeCompleto || username || '').trim()
  if (!base) return 'AM'
  const partes = base.split(/\s+/).filter(Boolean)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toLocaleUpperCase('pt-BR') || 'AM'
}
