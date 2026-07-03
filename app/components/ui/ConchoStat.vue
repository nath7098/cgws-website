<script setup lang="ts">
interface Props {
  value: number | string
  label: string
  suffix?: string
  animateOnVisible?: boolean
  onDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animateOnVisible: false,
  suffix: undefined,
  onDark: false,
})

const displayValue = ref<string | number>(props.value)

const ariaLabel = computed(
  () => `${props.value}${props.suffix ?? ''} ${props.label}`,
)

let ctx: { revert: () => void } | undefined

onMounted(async () => {
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
        trigger: '.concho-stat-root',
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
  <div
    class="concho-stat-root flex flex-col items-center gap-3"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- Medallion -->
    <div class="relative inline-flex items-center justify-center w-20 h-20 md:w-[100px] md:h-[100px]">
      <!-- Outer ring -->
      <div class="absolute inset-0 rounded-full border-2 border-cgws-accent" />
      <!-- Inner dashed ring -->
      <div class="absolute inset-[6px] rounded-full border border-dashed border-cgws-accent-deco/50" />

      <!-- Cardinal points SVG -->
      <svg
        class="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- North -->
        <polygon points="50,-4 54,8 46,8" class="fill-cgws-accent" />
        <!-- South -->
        <polygon points="50,104 54,92 46,92" class="fill-cgws-accent" />
        <!-- West -->
        <polygon points="-4,50 8,54 8,46" class="fill-cgws-accent" />
        <!-- East -->
        <polygon points="104,50 92,54 92,46" class="fill-cgws-accent" />
      </svg>

      <!-- Center content -->
      <div class="relative z-10 flex flex-col items-center justify-center" aria-hidden="true">
        <span class="font-display text-3xl md:text-[32px] text-cgws-accent leading-none">
          {{ displayValue }}{{ suffix ?? '' }}
        </span>
      </div>
    </div>

    <!-- Label below medallion -->
    <span
      :class="[
        'font-eyebrow text-[10px] md:text-[11px] uppercase tracking-wider leading-tight text-center',
        onDark ? 'text-cgws-ink-soft' : 'text-cgws-ink-soft',
      ]"
      aria-hidden="true"
    >
      {{ label }}
    </span>
  </div>
</template>
