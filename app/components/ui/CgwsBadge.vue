<script setup lang="ts">
type BadgeVariant = 'new' | 'occasion' | 'consignment' | 'sold' | 'rejected'

const props = defineProps<{ variant: BadgeVariant }>()

const labels: Record<BadgeVariant, string> = {
  new: 'Neuf',
  occasion: 'Occasion',
  consignment: 'Consignation',
  sold: 'Vendu',
  rejected: 'Refusé',
}

// Mapping conforme à US-072 §6 / DESIGN_SYSTEM_v3.md §4 "Badge statut v3" :
// - Neuf = outline ink (border /60) · Occasion = neutre surface-2 (jamais danger).
// - Consignation = accent signature : brand-blush (littéral de marque, §2.5) en
//   Élégante, remplacé par accent/15 en Rugueux (incohérent en univers cuir/laiton,
//   §8.2). Texte en brand-espresso fixe (dark) sur le blush clair : `text-cgws-ink`
//   basculerait clair en Élégante Nuit et deviendrait illisible sur le blush
//   (littéral non theme-swappé) — brand-espresso garantit AA dans Jour ET Nuit
//   (10.26:1). En Rugueux, ink (clair) sur accent/15 (sombre) = 9.46:1.
// - Vendu = accent plein · Refusé = danger plein (on-danger sur danger, ≥5.0:1).
const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-transparent border border-cgws-ink/60 text-cgws-ink',
  occasion: 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline',
  consignment:
    'bg-cgws-brand-blush text-cgws-brand-espresso border border-cgws-accent-deco rugueux:bg-cgws-accent/15 rugueux:text-cgws-ink',
  sold: 'bg-cgws-accent text-cgws-on-accent',
  rejected: 'bg-cgws-danger text-cgws-on-danger',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans font-medium text-[11px] uppercase tracking-wider',
      variantClasses[props.variant],
    ]"
    :aria-label="`Statut : ${labels[props.variant]}`"
  >
    {{ labels[props.variant] }}
  </span>
</template>
