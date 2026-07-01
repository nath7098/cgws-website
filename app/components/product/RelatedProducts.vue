<script setup lang="ts">
import type { Product } from '~/types'

interface Props {
  products: Product[]
  category: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const shouldShow = computed(
  () => props.isLoading || props.products.length > 0,
)

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (!shouldShow.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    gsap.from('.related-product-card', {
      opacity: 0,
      y: 24,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.09,
      scrollTrigger: {
        trigger: '.related-products-grid',
        start: 'top 85%',
        once: true,
      },
      clearProps: 'all',
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section
    v-if="shouldShow"
    class="bg-cgws-cream py-12 md:py-16"
    aria-labelledby="related-products-heading"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <!-- Eyebrow -->
      <p class="font-eyebrow text-[12px] text-cgws-copper uppercase tracking-[0.2em] mb-2">
        Vous pourriez aussi aimer
      </p>

      <!-- Titre -->
      <h2
        id="related-products-heading"
        class="font-serif font-bold text-[28px] md:text-[32px] text-cgws-charcoal leading-tight mb-8"
      >
        Articles similaires
      </h2>

      <!-- Grille de produits -->
      <div
        class="related-products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        :aria-busy="isLoading ? 'true' : undefined"
      >
        <!-- Skeletons pendant le chargement -->
        <template v-if="isLoading">
          <ProductCardSkeleton
            v-for="n in 4"
            :key="`skeleton-${n}`"
          />
        </template>

        <!-- Cartes produits -->
        <template v-else>
          <div
            v-for="product in products"
            :key="product.id"
            class="related-product-card"
          >
            <ProductCard :product="product" />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
