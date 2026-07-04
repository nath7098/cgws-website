// app/utils/consignment.ts
// SOURCE UNIQUE DE VÉRITÉ pour les libellés FR de statut/état de consignation et
// leur mapping vers les variants de CgwsBadge. Auto-importé par Nuxt (app/utils/*).
// Les pages admin (US-040) définissent historiquement ces libellés en local — ce
// module les factorise pour le nouvel espace déposant (US-066) et toute future
// réutilisation. Ne jamais recopier ces libellés à la main ailleurs.

import type { BadgeVariant, ConsignmentStatus, ProductCondition } from '~/types'

/** Libellés FR des statuts de consignation (accordés au féminin — « une consignation »). */
export const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  pending: 'En attente',
  accepted: 'En vente',
  rejected: 'Refusée',
  sold: 'Vendue',
  returned: 'Retournée',
}

/** Libellés FR de l'état d'un article. */
export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: 'Neuf',
  excellent: 'Excellent état',
  good: 'Bon état',
  fair: 'État correct',
}

// Mapping statut → variant CgwsBadge (couleur uniquement ; le libellé est toujours
// fourni via la prop `label` pour garantir l'accord au féminin). Cf. US-066 §3.2 :
// `returned` reprend volontairement le traitement visuel de `rejected` (taxonomie
// §4.1 — différenciation par le libellé, pas par une nuance supplémentaire).
export const STATUS_BADGE_VARIANT: Record<ConsignmentStatus, BadgeVariant> = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected',
  sold: 'sold',
  returned: 'rejected',
}
