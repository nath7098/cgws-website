<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline-light'
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

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-cgws-copper text-cgws-charcoal font-display uppercase tracking-widest active:bg-cgws-tack active:text-cgws-rope hover:bg-cgws-leather focus-visible:ring-cgws-copper',
  secondary:
    'bg-transparent text-cgws-denim border-2 border-cgws-denim font-sans font-semibold uppercase tracking-wide hover:bg-cgws-denim/10 active:bg-cgws-denim/20 focus-visible:ring-cgws-copper',
  ghost:
    'bg-transparent text-cgws-leather font-sans font-medium underline-offset-4 hover:text-cgws-copper hover:underline focus-visible:ring-cgws-copper px-2 py-1 text-sm',
  'outline-light':
    'bg-transparent text-cgws-rope border-2 border-cgws-rope font-sans font-semibold uppercase tracking-wide hover:bg-cgws-rope/10 hover:text-cgws-cream active:bg-cgws-rope/20 focus-visible:ring-cgws-copper',
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
    :is="as === 'NuxtLink' ? resolveComponent('NuxtLink') : as"
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
