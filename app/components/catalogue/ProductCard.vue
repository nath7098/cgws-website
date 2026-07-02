<script setup lang="ts">
import type { Product } from '~/types'
import CgwsBadge from '../ui/CgwsBadge.vue';

interface Props {
  product: Product
}

const props = defineProps<Props>()

const { imageProps } = useProductImage()

const isSold = computed(() => props.product.status === 'sold')
const isReserved = computed(() => props.product.status === 'reserved')
const isActive = computed(() => props.product.status === 'active')

const badgeVariant = computed(() => {
  if (isSold.value) return 'sold' as const
  if (props.product.isConsignment) return 'consignment' as const
  if (props.product.condition === 'new') return 'new' as const
  return 'occasion' as const
})

const formattedPrice = computed(() =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(props.product.price),
)

const primaryImage = computed(() => props.product.images[0] ?? null)

console.log(primaryImage)

// Computed image attrs (src + optional provider) for use with v-bind on NuxtImg
const primaryImageData = computed(() =>
  primaryImage.value !== null ? imageProps(primaryImage.value) : null,
)

const ariaLabel = computed(() => {
  let label = `${props.product.title} — ${props.product.brand} — ${formattedPrice.value} €`
  if (isSold.value) label += ' — Produit vendu'
  if (isReserved.value) label += ' — Produit réservé'
  return label
})

const cardContent = computed(() => ({
  borderClass: isSold.value ? 'border-cgws-leather/30' : 'border-cgws-copper',
  titleClass: isSold.value ? 'text-cgws-charcoal/60' : 'text-cgws-charcoal',
  priceClass: isSold.value ? 'text-cgws-leather' : 'text-cgws-copper',
}))
</script>

<template>
  <!-- Sold: non-navigable div -->
  <div
    v-if="isSold"
    :aria-label="ariaLabel"
    class="product-card block rounded-[6px]"
  >
    <article
      class="relative flex flex-col bg-cgws-parchment border-2 border-cgws-leather rounded-[6px] overflow-hidden cursor-default"
    >
      <!-- Perforation hole -->
      <div
        class="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cgws-cream border border-cgws-leather z-10"
        aria-hidden="true"
      />

      <!-- Image zone -->
      <div class="relative aspect-[4/3] overflow-hidden rounded-t-[4px]">
        <NuxtImg
          v-if="primaryImageData"
          v-bind="primaryImageData"
          :alt="`${product.title}, ${product.brand}`"
          loading="lazy"
          format="webp"
          sizes="xs:100vw sm:50vw md:33vw lg:25vw"
          class="w-full h-full object-cover grayscale"
        />
        <div
          v-else
          class="w-full h-full bg-cgws-leather/10 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg class="w-12 h-12 text-cgws-leather/30" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
            <path d="M8 20c0-7 7-13 16-13s16 6 16 13c0 4-2 7.5-6 9.5V36H14v-6.5C10 27.5 8 24 8 20zm14 18h4v2h-4v-2z" opacity="0.5" />
          </svg>
        </div>

        <!-- Sold overlay -->
        <div class="absolute inset-0 bg-cgws-charcoal/30" aria-hidden="true" />

        <!-- Sold badge -->
        <div class="absolute top-3 left-3 z-10">
          <CgwsBadge variant="sold" />
        </div>
      </div>

      <!-- Content block with stitching -->
      <div
        class="stitching-block m-2 p-3 border border-dashed rounded-sm flex flex-col gap-1.5"
        :class="cardContent.borderClass"
      >
        <p
          class="product-title font-serif font-semibold text-base leading-snug line-clamp-2 mt-1"
          :class="cardContent.titleClass"
        >
          {{ product.title }}
        </p>
        <p class="font-sans text-[13px] text-cgws-leather">{{ product.brand }}</p>
        <p v-if="product.size" class="font-sans text-[12px] text-cgws-leather/70 italic">
          Taille : {{ product.size }}
        </p>
        <p class="product-price font-display text-2xl text-right mt-auto" :class="cardContent.priceClass">
          <span class="sr-only">Prix : </span>{{ formattedPrice }} €
        </p>
      </div>
    </article>
  </div>

  <!-- Active / Reserved: navigable link -->
  <NuxtLink
    v-else
    :to="`/catalogue/${product.slug}`"
    :aria-label="ariaLabel"
    class="product-card group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2 rounded-[6px]"
  >
    <article
      class="relative flex flex-col bg-cgws-parchment border-2 border-cgws-leather rounded-[6px] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-in-out"
      :class="isActive ? 'group-hover:-translate-y-[4px] group-hover:shadow-xl group-hover:shadow-cgws-leather/25 group-hover:border-cgws-copper' : ''"
    >
      <!-- Perforation hole -->
      <div
        class="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cgws-cream border border-cgws-leather z-10"
        aria-hidden="true"
      />

      <!-- Image zone -->
      <div class="relative aspect-[4/3] overflow-hidden rounded-t-[4px]">
        <NuxtImg
          v-if="primaryImageData"
          v-bind="primaryImageData"
          :alt="`${product.title}, ${product.brand}`"
          loading="lazy"
          format="webp"
          sizes="xs:100vw sm:50vw md:33vw lg:25vw"
          class="w-full h-full object-cover transition-transform duration-300"
          :class="isActive ? 'group-hover:scale-105' : ''"
        />
        <div
          v-else
          class="w-full h-full bg-cgws-leather/10 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg class="w-12 h-12 text-cgws-leather/30" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
            <path d="M8 20c0-7 7-13 16-13s16 6 16 13c0 4-2 7.5-6 9.5V36H14v-6.5C10 27.5 8 24 8 20zm14 18h4v2h-4v-2z" opacity="0.5" />
          </svg>
        </div>

        <!-- Hover overlay (active only) -->
        <div
          v-if="isActive"
          class="absolute inset-0 bg-cgws-tack/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-hidden="true"
        >
          <span class="font-display text-[16px] text-cgws-parchment uppercase tracking-widest">
            Voir le produit
          </span>
        </div>
      </div>

      <!-- Reserved diagonal banner -->
      <div
        v-if="isReserved"
        class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-20"
        aria-hidden="true"
      >
        <span
          class="rotate-[-25deg] bg-cgws-rust/90 px-8 py-1.5 w-[200%] font-sans font-bold text-[11px] uppercase tracking-widest text-white text-center"
        >
          Réservé
        </span>
      </div>

      <!-- Content block with stitching -->
      <div
        class="stitching-block m-2 p-3 border border-dashed rounded-sm flex flex-col gap-1.5"
        :class="cardContent.borderClass"
      >
        <div class="self-start">
          <CgwsBadge :variant="badgeVariant" />
        </div>

        <p
          class="product-title font-serif font-semibold text-base leading-snug line-clamp-2 mt-1"
          :class="cardContent.titleClass"
        >
          {{ product.title }}
        </p>
        <p class="font-sans text-[13px] text-cgws-leather">{{ product.brand }}</p>
        <p v-if="product.size" class="font-sans text-[12px] text-cgws-leather/70 italic">
          Taille : {{ product.size }}
        </p>
        <p
          class="product-price font-display text-2xl text-right mt-auto"
          :class="cardContent.priceClass"
        >
          <span class="sr-only">Prix : </span>{{ formattedPrice }} €
        </p>
      </div>
    </article>
  </NuxtLink>
</template>
