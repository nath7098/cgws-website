<script setup lang="ts">
// StarDivider — motif signature v3 "étoile-boussole 8 branches".
// Remplace ConchoDivider (variant="divider") et ConchoStat (variant="stat").
// Cf. docs/design-specs/US-072-signature-components.md §2 et DESIGN_SYSTEM_v3.md §4.
// L'étoile (fill accent-deco) est purement décorative ; seule la valeur numérique
// du variant "stat" porte du texte lisible et utilise donc `accent` (AA ≥4.5:1).
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

      <!-- Étoile-boussole 8 branches (16 sommets, longues cardinales / courtes diagonales) -->
      <svg
        class="w-5 h-5 flex-shrink-0"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon
          class="fill-cgws-accent-deco"
          points="50,3 54.6,38.9 71.2,28.8 61.1,45.4 97,50 61.1,54.6 71.2,71.2 54.6,61.1 50,97 45.4,61.1 28.8,71.2 38.9,54.6 3,50 38.9,45.4 28.8,28.8 45.4,38.9"
        />
        <!-- Centre poinçonné : disque métal découpé -->
        <circle
          cx="50"
          cy="50"
          r="9"
          class="fill-cgws-ground stroke-cgws-edge"
          stroke-width="2"
        />
      </svg>

      <div class="flex-1 border-t border-cgws-hairline" />
    </div>
  </div>

  <!-- ─── Variant stat : médaillon-étoile, valeur + label au centre ─── -->
  <div
    v-else
    class="star-stat-root flex flex-col items-center gap-3"
    role="img"
    :aria-label="ariaLabel"
  >
    <div
      class="relative inline-flex items-center justify-center w-20 h-20 md:w-[100px] md:h-[100px]"
    >
      <!-- Skeleton pulse si aucune valeur -->
      <template v-if="!hasValue">
        <div
          class="absolute inset-0 rounded-full bg-cgws-surface-2 animate-pulse"
          aria-hidden="true"
        />
      </template>

      <template v-else>
        <!-- Cercle extérieur -->
        <div
          class="absolute inset-0 rounded-full border-2 border-cgws-accent-deco"
          aria-hidden="true"
        />
        <!-- Anneau intérieur pointillé -->
        <div
          class="absolute inset-[6px] rounded-full border border-dashed border-cgws-accent-deco/50"
          aria-hidden="true"
        />

        <!-- 8 branches rayonnantes (fill accent-deco, décoratif) -->
        <svg
          class="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Longues cardinales -->
          <polygon class="fill-cgws-accent-deco" points="50,-6 55,10 45,10" />
          <polygon class="fill-cgws-accent-deco" points="50,106 55,90 45,90" />
          <polygon class="fill-cgws-accent-deco" points="106,50 90,55 90,45" />
          <polygon class="fill-cgws-accent-deco" points="-6,50 10,55 10,45" />
          <!-- Courtes diagonales -->
          <polygon class="fill-cgws-accent-deco" points="92.4,7.6 78.9,14.3 85.7,21.1" />
          <polygon class="fill-cgws-accent-deco" points="92.4,92.4 85.7,78.9 78.9,85.7" />
          <polygon class="fill-cgws-accent-deco" points="7.6,92.4 21.1,85.7 14.3,78.9" />
          <polygon class="fill-cgws-accent-deco" points="7.6,7.6 14.3,21.1 21.1,14.3" />
        </svg>

        <!-- Contenu central : valeur (accent, lisible) + label -->
        <div
          class="relative z-10 flex flex-col items-center justify-center px-1 text-center"
          aria-hidden="true"
        >
          <span
            class="font-display text-3xl md:text-[32px] tabular-nums text-cgws-accent leading-none"
          >
            {{ displayValue }}{{ suffix ?? '' }}
          </span>
        </div>
      </template>
    </div>

    <!-- Label sous le médaillon -->
    <span
      v-if="hasValue && label"
      class="font-eyebrow text-[10px] md:text-[11px] uppercase tracking-wider leading-tight text-center text-cgws-ink-soft"
      aria-hidden="true"
    >
      {{ label }}
    </span>
  </div>
</template>
