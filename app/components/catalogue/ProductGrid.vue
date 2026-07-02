<script setup lang="ts">
import type { Product } from '~/types'
import ProductCardSkeleton from '../ui/ProductCardSkeleton.vue'
import ProductCard from './ProductCard.vue'
import ConchoDivider from '../ui/ConchoDivider.vue'
import EmptyState from './EmptyState.vue'

interface Props {
  products: Product[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  total: number
}

interface Emits {
  'load-more': []
  reset: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const SKELETON_COUNT = 12

// Sentinel element for IntersectionObserver
const sentinel = ref<HTMLElement | null>(null)

// Prevent double-firing
const canLoadMore = computed(() => props.hasMore && !props.isFetchingMore && !props.isLoading)

useInfiniteScroll(sentinel, () => {
  if (canLoadMore.value) {
    emit('load-more')
  }
})

// GSAP animations
let ctx: { revert: () => void } | undefined
const prevProductCount = ref(0)

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')

  ctx = gsap.context(() => {
    // Animate initial product cards
    if (props.products.length > 0) {
      gsap.from('.product-card', {
        opacity: 0,
        y: 20,
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.07,
        clearProps: 'all',
      })
    }
  })
})

// Animate newly loaded cards (infinite scroll)
watch(
  () => props.products.length,
  async (newCount, oldCount) => {
    if (newCount <= oldCount) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    await nextTick()
    const { gsap } = await import('gsap')

    const allCards = document.querySelectorAll('.product-card')
    const newCards = Array.from(allCards).slice(oldCount)

    if (newCards.length > 0) {
      gsap.from(newCards, {
        opacity: 0,
        y: 16,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.05,
        clearProps: 'all',
      })
    }

    prevProductCount.value = newCount
  },
)

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <div>
    <!-- Product grid -->
    <div
      :aria-busy="isLoading"
      :aria-label="isLoading ? 'Chargement des produits' : `${total} produit${total !== 1 ? 's' : ''} affiché${total !== 1 ? 's' : ''}`"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
    >
      <!-- Loading skeletons -->
      <template v-if="isLoading">
        <ProductCardSkeleton
          v-for="n in SKELETON_COUNT"
          :key="`skeleton-${n}`"
        />
      </template>

      <!-- Product cards -->
      <template v-else>
        <!-- Empty state -->
        <EmptyState
          v-if="products.length === 0"
          @reset="$emit('reset')"
        />

        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />

        <!-- Load more sentinel (IntersectionObserver target) -->
        <div
          ref="sentinel"
          class="col-span-full h-4"
          aria-hidden="true"
        />

        <!-- Loading more indicator -->
        <div
          v-if="isFetchingMore"
          class="col-span-full flex flex-col items-center gap-4 py-8"
          aria-live="polite"
        >
          <div
            class="w-8 h-8 rounded-full border-2 border-cgws-copper border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <span class="font-sans text-sm text-cgws-leather">
            Chargement des articles...
          </span>
        </div>

        <!-- End of list -->
        <div
          v-if="!hasMore && products.length > 0"
          class="col-span-full text-center py-8"
        >
          <ConchoDivider />
          <p class="font-serif italic text-cgws-leather text-sm mt-2">
            Tous les produits ont été chargés · {{ total }} article{{ total !== 1 ? 's' : '' }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
