<script setup lang="ts">

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline-light' | 'destructive'
  size?: 'md' | 'sm'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  as?: 'button' | 'a' | 'NuxtLink'
  href?: string
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  as: 'button',
  href: undefined,
  to: undefined,
})

const baseClasses =
  'inline-flex items-center justify-center transition-colors duration-150 ease-in-out rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed'

// NOTE US-070 (migration v2 -> v3) : le variant "secondary" reposait en v2 sur
// cgws-denim, qui n'est désormais défini que pour la peau Rugueux (§2.1/§2.4
// DESIGN_SYSTEM_v3.md — "denim: contre-accent, Rugueux uniquement"). Ce
// composant est utilisé en Élégante (contact.vue, ProductInfo.vue,
// OurStorySection.vue...) où --cgws-denim n'existe pas. Décision prise ici,
// à confirmer avec product-owner (cf. US-070-design-system-v3.md §6, ligne
// cgws-denim) : "secondary" devient un outline accent, fonctionnel dans les
// 3 rendus. Le re-skin définitif du bouton (spacing, motif) est couvert par
// US-072, pas cette US.
// Re-skin US-072 §5 : le couple accent/on-accent est conçu AA dans les 3 rendus
// (doc maître §2.6, 5.6–6.9:1), donc plus de correction ad hoc v2 — hover/active
// = simples opacités de `accent`. `destructive` (nouveau) = danger/on-danger,
// AA garanti (§2.6, ≥5.0:1) — réutilisable par toute action irréversible
// (RejectModal US-075, suppression admin) plutôt que des classes en dur.
const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-cgws-accent text-cgws-on-accent font-display uppercase tracking-widest hover:bg-cgws-accent/90 active:bg-cgws-accent/80 focus-visible:ring-cgws-accent',
  secondary:
    'bg-transparent text-cgws-accent border-2 border-cgws-accent font-sans font-semibold uppercase tracking-wide hover:bg-cgws-accent/10 active:bg-cgws-accent/20 focus-visible:ring-cgws-accent',
  destructive:
    'bg-cgws-danger text-cgws-on-danger font-sans font-semibold uppercase tracking-wide hover:bg-cgws-danger/90 active:bg-cgws-danger/80 focus-visible:ring-cgws-danger',
  ghost:
    'bg-transparent text-cgws-ink-soft font-sans font-medium underline-offset-4 hover:text-cgws-accent hover:underline focus-visible:ring-cgws-accent px-2 py-1 text-sm',
  'outline-light':
    'bg-transparent text-cgws-brand-cream border-2 border-cgws-brand-cream/70 font-sans font-semibold uppercase tracking-wide hover:bg-cgws-brand-cream/10 active:bg-cgws-brand-cream/20 focus-visible:ring-cgws-brand-cream',
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  md: 'px-6 py-3 text-[18px]',
  sm: 'px-4 py-2 text-[14px]',
}

const computedClasses = computed(() => {
  const variant = props.variant ?? 'primary'
  const size = props.size ?? 'md'
  const sizeClass = variant === 'ghost' ? '' : sizeClasses[size]
  return [baseClasses, variantClasses[variant], sizeClass]
})
</script>

<template>
  <component
    :is="as === 'NuxtLink' ? defineNuxtLink({}) : as"
    :type="as === 'button' ? type : undefined"
    :href="as === 'a' ? href : undefined"
    :to="as === 'NuxtLink' ? to : undefined"
    :disabled="as === 'button' ? (disabled || loading) : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :class="computedClasses"
  >
    <span
      v-if="loading"
      class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
