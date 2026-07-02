<script setup lang="ts">
import type { Product } from '~/types'
import CgwsBadge from './CgwsBadge.vue';

interface Props {
  product: Product
}

const props = defineProps<Props>()
const emit = defineEmits<{ click: [product: Product] }>()

type BadgeVariant = 'new' | 'occasion' | 'consignment' | 'sold'

const badgeVariant = computed<BadgeVariant>(() => {
  if (props.product.status === 'sold') return 'sold'
  if (props.product.isConsignment) return 'consignment'
  if (props.product.condition === 'new') return 'new'
  return 'occasion'
})

const isSold = computed(() => props.product.status === 'sold')

const ariaLabel = computed(
  () =>
    `Produit : ${props.product.title}, ${props.product.brand}, Prix : ${props.product.price.toFixed(0)} €`,
)

function handleClick() {
  emit('click', props.product)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('click', props.product)
  }
}

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    gsap.from('.tag-card-inner', {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.tag-card-inner',
        start: 'top 90%',
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
  <article
    role="article"
    :aria-label="ariaLabel"
    tabindex="0"
    :class="[
      'tag-card-inner relative flex flex-col',
      'bg-cgws-parchment border-2 border-cgws-leather rounded-[6px]',
      'overflow-hidden cursor-pointer',
      'transition-transform transition-shadow duration-200 ease-in-out',
      'hover:-translate-y-1 hover:shadow-lg hover:shadow-cgws-leather/20',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper',
    ]"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Perforation hole -->
    <div
      class="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cgws-cream border border-cgws-leather z-10"
      aria-hidden="true"
    />

    <!-- Image -->
    <div
      :class="[
        'aspect-[4/3] overflow-hidden rounded-t-[4px]',
        isSold ? 'grayscale' : '',
      ]"
    >
      <NuxtImg
        v-if="product.images.length > 0"
        :src="product.images[0]"
        :alt="`${product.title} — ${product.brand}`"
        class="h-full w-full object-cover"
        loading="lazy"
        format="webp"
      />
      <div
        v-else
        class="flex h-full items-center justify-center bg-cgws-leather/10"
        aria-hidden="true"
      >
        <svg
          class="w-12 h-12 text-cgws-leather/30"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 36 C8 20 16 12 24 12 C32 12 40 20 40 36"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            fill="none"
          />
          <ellipse cx="24" cy="36" rx="8" ry="4" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
    </div>

    <!-- Sold overlay -->
    <div
      v-if="isSold"
      class="absolute inset-0 bg-cgws-charcoal/20 pointer-events-none"
      aria-hidden="true"
    />

    <!-- Stitching block -->
    <div class="m-2 p-3 border border-dashed border-cgws-copper rounded-sm flex flex-col gap-1.5">
      <div>
        <span class="sr-only">Statut : </span>
        <CgwsBadge :variant="badgeVariant" />
      </div>

      <h3 class="font-serif font-semibold text-base text-cgws-charcoal leading-snug line-clamp-2 mt-1.5">
        {{ product.title }}
      </h3>

      <p class="font-sans text-[13px] text-cgws-leather">{{ product.brand }}</p>

      <p class="font-display text-2xl text-cgws-copper text-right mt-auto">
        <span class="sr-only">Prix : </span>
        {{ product.price.toFixed(0) }} €
      </p>
    </div>
  </article>
</template>
