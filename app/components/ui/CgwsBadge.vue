<script setup lang="ts">
type BadgeVariant = 'new' | 'occasion' | 'consignment' | 'sold'

const props = defineProps<{ variant: BadgeVariant }>()

const labels: Record<BadgeVariant, string> = {
  new: 'Neuf',
  occasion: 'Occasion',
  consignment: 'Consignation',
  sold: 'Vendu',
}

const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-cgws-denim text-white',
  occasion: 'bg-cgws-rust text-white',
  consignment: 'bg-cgws-copper text-cgws-charcoal',
  sold: 'bg-cgws-charcoal text-cgws-rope',
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
