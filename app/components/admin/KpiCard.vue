<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  icon?: string
  variant?: 'default' | 'warning'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  icon: undefined,
  loading: false,
})

const containerClasses = computed<string>(() => {
  const base = 'rounded-[4px] shadow-sm p-5 flex flex-col gap-1'
  if (props.variant === 'warning') {
    // Variante "besoin d'attention" — accent (pas danger, cf. US-075 §C.7) :
    // une file à traiter n'est ni une erreur ni un état destructif.
    return `bg-cgws-surface border border-cgws-hairline border-l-4 border-l-cgws-accent ${base}`
  }
  return `bg-cgws-surface border border-cgws-hairline ${base}`
})

const valueClasses = computed<string>(() => {
  const base = 'font-display text-5xl leading-none tabular-nums'
  if (props.variant === 'warning') return `${base} text-cgws-accent`
  return `${base} text-cgws-ink`
})

const iconClasses = computed<string>(() => 'w-5 h-5 text-cgws-accent flex-shrink-0')

const ariaLabel = computed<string>(() => `${props.label} : ${props.value}`)
</script>

<template>
  <div
    :class="containerClasses"
    :aria-label="ariaLabel"
    role="region"
  >
    <!-- Skeleton state -->
    <template v-if="loading">
      <div class="h-10 w-24 bg-cgws-hairline rounded animate-pulse mb-3" />
      <div class="h-3 w-20 bg-cgws-hairline rounded animate-pulse" />
    </template>

    <!-- Loaded state -->
    <template v-else>
      <div class="flex items-start justify-between">
        <span :class="valueClasses">{{ value }}</span>
        <UIcon
          v-if="icon"
          :name="icon"
          :class="iconClasses"
          aria-hidden="true"
        />
      </div>
      <p class="font-sans text-[11px] uppercase tracking-widest text-cgws-ink-soft mt-1">
        {{ label }}
      </p>
    </template>
  </div>
</template>
