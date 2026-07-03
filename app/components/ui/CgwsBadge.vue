<script setup lang="ts">
type BadgeVariant = 'new' | 'occasion' | 'consignment' | 'sold'

const props = defineProps<{ variant: BadgeVariant }>()

const labels: Record<BadgeVariant, string> = {
  new: 'Neuf',
  occasion: 'Occasion',
  consignment: 'Consignation',
  sold: 'Vendu',
}

// Mapping conforme à DESIGN_SYSTEM_v3.md §4 "Badge statut v3" :
// Neuf = outline ink · Occasion = neutre surface-2 · Consignation = accent
// signature (fond brand-blush + bordure accent-deco) · Vendu = accent plein.
const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-transparent border border-cgws-ink text-cgws-ink',
  occasion: 'bg-cgws-surface-2 text-cgws-ink-soft',
  consignment: 'bg-cgws-brand-blush text-cgws-accent border border-cgws-accent-deco',
  sold: 'bg-cgws-accent text-cgws-on-accent',
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
