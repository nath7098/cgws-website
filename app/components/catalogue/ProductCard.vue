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

// Contrat de composant US-096 (spec design §0.1 / §5.4) — identique à celui
// de ProductInfo.vue : booléen dérivé, jamais un statut figé. Toujours
// `false` pour une pièce de consignation (axe orthogonal, pas de notion de
// stock pour une pièce unique).
const isOutOfStock = computed(
  () => !props.product.isConsignment && props.product.stock === 0 && !isSold.value,
)
const isLowStock = computed(
  () => !props.product.isConsignment && props.product.stock > 0 && props.product.stock <= 3,
)

const badgeVariant = computed(() => {
  if (isSold.value) return 'sold' as const
  if (isOutOfStock.value) return 'out-of-stock' as const
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

// Computed image attrs (src + optional provider) for use with v-bind on NuxtImg
const primaryImageData = computed(() =>
  primaryImage.value !== null ? imageProps(primaryImage.value) : null,
)

// US-110 — le sceau `sm` en coin d'image est décoratif (aria-hidden via son
// role="img" imbriqué dans un lien serait un anti-pattern a11y) : le sens
// « approuvé » est porté par le libellé accessible de la carte, comme
// « — Produit vendu ». Masqué sur une carte vendue (une pièce vendue n'a plus
// à afficher la caution d'achat, spec §7.1).
const showApprovedSeal = computed(() => props.product.camilleApproved && !isSold.value)

const ariaLabel = computed(() => {
  let label = `${props.product.title} — ${props.product.brand} — ${formattedPrice.value} €`
  if (isSold.value) label += ' — Produit vendu'
  if (isReserved.value) label += ' — Produit réservé'
  if (isOutOfStock.value) label += ' — Actuellement épuisé'
  if (isLowStock.value) label += ` — Plus que ${props.product.stock} en stock`
  if (showApprovedSeal.value) label += ' — Sélection Camille, testé et approuvé'
  return label
})

const cardContent = computed(() => ({
  borderClass: isSold.value ? 'border-cgws-hairline' : 'border-cgws-accent',
  titleClass: isSold.value ? 'text-cgws-ink/60' : 'text-cgws-ink',
  priceClass: isSold.value ? 'text-cgws-ink-soft' : 'text-cgws-accent',
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
      class="relative flex flex-col bg-cgws-surface border-2 border-cgws-edge rounded-[6px] overflow-hidden cursor-default"
    >
      <!-- Perforation hole -->
      <div
        class="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cgws-ground border border-cgws-edge z-10"
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
          class="w-full h-full bg-cgws-hairline flex items-center justify-center"
          aria-hidden="true"
        >
          <svg class="w-12 h-12 text-cgws-ink-soft/30" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
            <path d="M8 20c0-7 7-13 16-13s16 6 16 13c0 4-2 7.5-6 9.5V36H14v-6.5C10 27.5 8 24 8 20zm14 18h4v2h-4v-2z" opacity="0.5" />
          </svg>
        </div>

        <!-- Sold overlay -->
        <div class="absolute inset-0 bg-cgws-ink/30" aria-hidden="true" />

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
        <p class="font-sans text-[13px] text-cgws-ink-soft">{{ product.brand }}</p>
        <p v-if="product.size" class="font-sans text-[12px] text-cgws-ink-soft/70 italic">
          Taille : {{ product.size }}
        </p>
        <p class="product-price font-display text-2xl tabular-nums text-right mt-auto" :class="cardContent.priceClass">
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
    class="product-card group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2 rounded-[6px]"
  >
    <article
      class="relative flex flex-col bg-cgws-surface border-2 border-cgws-edge rounded-[6px] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-in-out"
      :class="isActive ? 'group-hover:-translate-y-[4px] group-hover:shadow-xl group-hover:shadow-cgws-edge/25 group-hover:border-cgws-accent' : ''"
    >
      <!-- Perforation hole -->
      <div
        class="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cgws-ground border border-cgws-edge z-10"
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
          class="w-full h-full object-cover"
          :class="isOutOfStock
            ? 'grayscale-[70%] opacity-90'
            : ['transition-transform duration-300', isActive ? 'group-hover:scale-105' : '']"
        />
        <div
          v-else
          class="w-full h-full bg-cgws-hairline flex items-center justify-center"
          aria-hidden="true"
        >
          <svg class="w-12 h-12 text-cgws-ink-soft/30" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
            <path d="M8 20c0-7 7-13 16-13s16 6 16 13c0 4-2 7.5-6 9.5V36H14v-6.5C10 27.5 8 24 8 20zm14 18h4v2h-4v-2z" opacity="0.5" />
          </svg>
        </div>

        <!-- Hover overlay (active only) -->
        <div
          v-if="isActive"
          class="absolute inset-0 bg-cgws-brand-espresso/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-hidden="true"
        >
          <span class="font-display text-[16px] text-cgws-brand-cream uppercase tracking-widest">
            Voir le produit
          </span>
        </div>

        <!-- US-110 — sceau « Testé et approuvé par Camille » (sm), symétrique du
             badge « Vendu » (top-3 left-3). Décoratif ici : le sens est porté
             par l'aria-label de la carte, d'où aria-hidden pour éviter la double
             lecture. -->
        <div
          v-if="showApprovedSeal"
          class="absolute top-3 right-3 z-10 pointer-events-none"
          aria-hidden="true"
        >
          <CgwsApprovedBadge size="sm" />
        </div>
      </div>

      <!-- Reserved diagonal banner (jamais simultané avec "Épuisé" — priorité
           au badge neutre "Épuisé", cf. spec design §1.8) -->
      <div
        v-if="isReserved && !isOutOfStock"
        class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-20"
        aria-hidden="true"
      >
        <span
          class="rotate-[-25deg] bg-cgws-ink-soft/90 px-8 py-1.5 w-[200%] font-sans font-bold text-[11px] uppercase tracking-widest text-cgws-ground text-center"
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
        <p class="font-sans text-[13px] text-cgws-ink-soft">{{ product.brand }}</p>
        <p v-if="product.size" class="font-sans text-[12px] text-cgws-ink-soft/70 italic">
          Taille : {{ product.size }}
        </p>
        <p
          v-if="isLowStock"
          class="font-sans font-medium text-[11px] text-cgws-accent flex items-center gap-1.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-cgws-accent flex-shrink-0" aria-hidden="true" />
          Plus que {{ product.stock }} en stock
        </p>
        <p
          class="product-price font-display text-2xl tabular-nums text-right mt-auto"
          :class="cardContent.priceClass"
        >
          <span class="sr-only">Prix : </span>{{ formattedPrice }} €
        </p>
      </div>
    </article>
  </NuxtLink>
</template>
