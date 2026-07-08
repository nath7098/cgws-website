<script setup lang="ts">
import StarDivider from '../ui/StarDivider.vue'
import FiligreeCorner from '../ui/FiligreeCorner.vue'

interface Stat {
  value: number | string
  suffix: string | undefined
  label: string
  animateOnVisible: boolean
}

const stats: Stat[] = [
  { value: 250,    suffix: '+',       label: 'articles en stock',        animateOnVisible: true  },
  { value: 15,     suffix: '+',       label: 'marques référencées',      animateOnVisible: true  },
  { value: '100%', suffix: undefined, label: 'passion équestre',         animateOnVisible: false },
  { value: 37,     suffix: '',        label: 'Brèches · Indre-et-Loire', animateOnVisible: true  },
]

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    gsap.from('.star-stat-root', {
      opacity: 0,
      y: 24,
      scale: 0.85,
      duration: 0.55,
      ease: 'power2.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: 'section[aria-label="Chiffres clés CGWS"]',
        start: 'top 80%',
        once: true,
      },
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section
    class="relative bg-cgws-ground py-12 md:py-16"
    aria-label="Chiffres clés CGWS"
  >
    <!-- Filigranes discrets — 2 max/viewport, coins diagonalement opposés (US-072 §3) -->
    <FiligreeCorner
      class="absolute top-4 left-4 md:top-6 md:left-6 w-12 h-12 md:w-16 md:h-16"
      :opacity="40"
    />
    <FiligreeCorner
      class="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-16 md:h-16 rotate-180"
      :opacity="40"
    />

    <div class="relative max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 lg:gap-8">
        <StarDivider
          v-for="stat in stats"
          :key="stat.label"
          variant="stat"
          :value="stat.value"
          :suffix="stat.suffix"
          :label="stat.label"
          :animate-on-visible="stat.animateOnVisible"
        />
      </div>
    </div>
  </section>
</template>
