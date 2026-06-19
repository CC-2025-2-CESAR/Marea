/**
 * Mapas de apresentação do status de acesso da médica a uma paciente.
 *
 * O backend já devolve `permissao = { papel, pode_editar, rotulo }`; aqui só
 * traduzimos o `papel` para o tom do selo e para um rótulo curto (usado na
 * lista, onde o rótulo completo do backend ficaria longo).
 */

import type { TomBadge } from '../../components/ui/StatusBadge/StatusBadge'
import type { PapelNoCuidado } from '../../types'

// Tom do StatusBadge por papel de acesso.
const TOM_POR_PAPEL: Record<PapelNoCuidado, TomBadge> = {
  responsavel: 'sucesso',
  assumido: 'info',
  visualizacao: 'aviso',
  admin: 'neutro',
}

// Rótulo enxuto para a lista de pacientes.
export const ROTULO_CURTO_PAPEL: Record<PapelNoCuidado, string> = {
  responsavel: 'Responsável',
  assumido: 'Assumido',
  visualizacao: 'Só leitura',
  admin: 'Admin',
}

export function tomDoPapel(papel: PapelNoCuidado): TomBadge {
  return TOM_POR_PAPEL[papel] ?? 'neutro'
}
