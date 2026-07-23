<script setup lang="ts">
import type { BadgeVariant } from '~/types'

const props = defineProps<{
  variant: BadgeVariant
  /** Override du libellé affiché ET de l'aria-label. Requis pour les statuts de
   *  consignation accordés au féminin (US-066 §3.4) — les libellés internes ci-dessous
   *  restent accordés pour le contexte produit ("Vendu", "Refusé"). */
  label?: string
}>()

const labels: Record<BadgeVariant, string> = {
  new: 'Neuf',
  occasion: 'Occasion',
  consignment: 'Consignation',
  sold: 'Vendu',
  rejected: 'Refusé',
  reserved: 'Réservé',
  pending: 'En attente',
  accepted: 'Accepté',
  'out-of-stock': 'Épuisé',
}

const displayLabel = computed<string>(() => props.label ?? labels[props.variant])

// Mapping conforme à US-072 §6 / DESIGN_SYSTEM_v3.md §4 "Badge statut v3" :
// - Neuf = outline ink (border /60) · Occasion = neutre surface-2 (jamais danger).
// - Consignation = accent signature : brand-blush (littéral de marque, §2.5) en
//   Élégante, remplacé par accent/15 en Rugueux (incohérent en univers cuir/laiton,
//   §8.2). Texte en brand-espresso fixe (dark) sur le blush clair : `text-cgws-ink`
//   basculerait clair en Élégante Nuit et deviendrait illisible sur le blush
//   (littéral non theme-swappé) — brand-espresso garantit AA dans Jour ET Nuit
//   (10.26:1). En Rugueux, ink (clair) sur accent/15 (sombre) = 9.46:1.
// - Vendu = accent plein · Refusé = danger plein (on-danger sur danger, ≥5.0:1).
// - Réservé = neutre surface-2/ink-soft, identique à Occasion (taxonomie §4.1 :
//   reserved = neutre, jamais danger — un état normal du cycle de vente, pas une
//   alerte). Réutilise la paire ink-soft/surface-2 déjà mesurée AA (§2.6).
const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-transparent border border-cgws-ink/60 text-cgws-ink',
  occasion: 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline',
  consignment:
    'bg-cgws-brand-blush text-cgws-brand-espresso border border-cgws-accent-deco rugueux:bg-cgws-accent/15 rugueux:text-cgws-ink',
  sold: 'bg-cgws-accent text-cgws-on-accent',
  rejected: 'bg-cgws-danger text-cgws-on-danger',
  reserved: 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline',
  // US-066 §3.4 — statuts consignation :
  // - pending = neutre (identique à occasion/reserved, paire ink-soft/surface-2 déjà mesurée AA §2.6).
  // - accepted = pilule success translucide (success/15 + text-success, §4.1 doc maître).
  pending: 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline',
  accepted: 'bg-cgws-success/15 text-cgws-success border border-cgws-success/40',
  // out-of-stock (US-096/097, spec §4) = neutre — état "provisoire/en pause"
  // (comme reserved/pending), jamais une couleur chaude : ce n'est ni un
  // succès ni un échec ni une transaction, juste une disponibilité à zéro,
  // réversible dès réapprovisionnement. Réutilise la paire ink-soft/surface-2
  // déjà mesurée AA (§2.6) — aucune nouvelle mesure de contraste nécessaire.
  'out-of-stock': 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans font-medium text-[11px] uppercase tracking-wider',
      variantClasses[props.variant],
    ]"
    :aria-label="`Statut : ${displayLabel}`"
  >
    {{ displayLabel }}
  </span>
</template>
