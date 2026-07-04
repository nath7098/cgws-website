<script setup lang="ts">
// StarDivider — motif signature v3 "étoile-boussole 8 branches".
// Remplace ConchoDivider (variant="divider") et ConchoStat (variant="stat").
// Cf. docs/design-specs/US-072-signature-components.md §2 et DESIGN_SYSTEM_v3.md §4.
// L'étoile (fill accent-deco) est purement décorative ; seule la valeur numérique
// du variant "stat" porte du texte lisible et utilise donc `accent` (AA ≥4.5:1).
import { compassStarPoints, compassStarCenterRadius } from '~/utils/compassStar'

// Géométrie canonique unique, partagée par les deux variantes (Bug #4).
const STAR_POINTS = compassStarPoints() // calcul statique pour viewBox 100
const STAR_CENTER_R = compassStarCenterRadius() // 4.5 pour viewBox 100

interface Props {
  variant?: 'divider' | 'stat'
  // — actifs uniquement si variant === 'stat' —
  value?: number | string
  label?: string
  suffix?: string
  animateOnVisible?: boolean
  // — commun —
  bgClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'divider',
  value: undefined,
  label: undefined,
  suffix: undefined,
  animateOnVisible: false,
  bgClass: 'bg-cgws-ground',
})

const isStat = computed(() => props.variant === 'stat')

// État "sans valeur" → skeleton (variant stat uniquement)
const hasValue = computed(
  () => props.value !== undefined && props.value !== '',
)

const displayValue = ref<string | number>(props.value ?? '')

watch(
  () => props.value,
  (v) => {
    if (v !== undefined) displayValue.value = v
  },
)

const ariaLabel = computed(
  () => `${props.value ?? ''}${props.suffix ?? ''} ${props.label ?? ''}`.trim(),
)

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (!isStat.value) return
  if (!props.animateOnVisible) return
  if (typeof props.value !== 'number') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    const obj = { val: 0 }
    gsap.to(obj, {
      val: props.value as number,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.star-stat-root',
        start: 'top 85%',
        once: true,
      },
      onUpdate() {
        displayValue.value = Math.round(obj.val)
      },
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <!-- ─── Variant divider : ligne fine interrompue par l'étoile-boussole ─── -->
  <div
    v-if="!isStat"
    :class="['py-6 md:py-8', props.bgClass]"
    aria-hidden="true"
  >
    <div
      class="flex items-center gap-4 max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]"
    >
      <div class="flex-1 border-t border-cgws-hairline" />

      <!-- Étoile-boussole 8 branches — géométrie canonique via compassStarPoints() -->
      <svg
        class="w-5 h-5 flex-shrink-0"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon class="fill-cgws-accent-deco" :points="STAR_POINTS" />
        <!-- Centre poinçonné : disque découpé, r = 0.09c, sans bordure -->
        <circle cx="50" cy="50" :r="STAR_CENTER_R" class="fill-cgws-ground" />
      </svg>

      <div class="flex-1 border-t border-cgws-hairline" />
    </div>
  </div>

  <!-- ─── Variant stat : étoile-boussole décorative, nombre + label dessous ─── -->
  <div
    v-else
    class="star-stat-root flex flex-col items-center gap-2 md:gap-3"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- Skeleton si sans valeur (état de chargement transitoire) -->
    <div
      v-if="!hasValue"
      class="w-14 h-14 md:w-[72px] md:h-[72px] rounded-full bg-cgws-surface-2 animate-pulse"
      aria-hidden="true"
    />

    <template v-else>
      <!-- Étoile-boussole solide, décorative — même géométrie que le divider -->
      <svg
        class="w-14 h-14 md:w-[72px] md:h-[72px] flex-shrink-0"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon class="fill-cgws-accent-deco" :points="STAR_POINTS" />
        <circle cx="50" cy="50" :r="STAR_CENTER_R" class="fill-cgws-ground" />
      </svg>

      <!-- Nombre + label, texte lisible en flux, SOUS l'étoile -->
      <div class="flex flex-col items-center gap-0.5" aria-hidden="true">
        <span
          class="font-display text-3xl md:text-[32px] tabular-nums text-cgws-accent leading-none"
        >
          {{ displayValue }}{{ suffix ?? '' }}
        </span>
        <span
          v-if="label"
          class="font-eyebrow text-[10px] md:text-[11px] uppercase tracking-wider text-cgws-ink-soft text-center"
        >
          {{ label }}
        </span>
      </div>
    </template>
  </div>
</template>
