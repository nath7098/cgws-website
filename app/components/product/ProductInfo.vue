<script setup lang="ts">
import type { Product, ProductCategory, ProductCondition } from '~/types'

interface Props {
  product: Product
}

const props = defineProps<Props>()

const isSold = computed(() => props.product.status === 'sold')

const conditionBadgeVariant = computed((): 'sold' | 'new' | 'occasion' => {
  if (isSold.value) return 'sold'
  return props.product.condition === 'new' ? 'new' : 'occasion'
})

const showConsignmentBadge = computed(
  () => props.product.isConsignment && !isSold.value,
)

const conditionLabel: Record<ProductCondition, string> = {
  new: 'Article neuf — jamais utilisé',
  excellent: 'Excellent état — très légèrement utilisé',
  good: "Bon état — légères marques d'usage",
  fair: "État correct — marques d'usure visibles",
}

const categoryLabel: Record<ProductCategory, string> = {
  selles: 'Selles',
  'brides-licols': 'Brides & Licols',
  'bottes-chaussures': 'Bottes & Chaussures',
  vetements: 'Vêtements',
  accessoires: 'Accessoires',
  protections: 'Protections',
}

const priceColorClass = computed(() =>
  isSold.value ? 'text-cgws-leather' : 'text-cgws-copper',
)

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')

  ctx = gsap.context(() => {
    gsap.from([
      '.product-info-badges',
      '.product-info-title',
      '.product-info-meta',
      '.product-info-price',
      '.product-info-details',
      '.product-info-description',
      '.product-info-consignment',
      '.product-info-cta',
    ], {
      opacity: 0,
      x: 16,
      duration: 0.45,
      ease: 'power2.out',
      stagger: 0.07,
      delay: 0.2,
      clearProps: 'all',
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Badges row -->
    <div class="product-info-badges flex flex-wrap items-center gap-2">
      <CgwsBadge :variant="conditionBadgeVariant" />
      <CgwsBadge v-if="showConsignmentBadge" variant="consignment" />
    </div>

    <!-- H1 — unique sur la page -->
    <h1
      class="product-info-title font-serif font-bold text-[24px] sm:text-[28px] lg:text-[36px] text-cgws-charcoal leading-tight mt-1"
    >
      {{ product.title }}
    </h1>

    <!-- Marque · Catégorie -->
    <p class="product-info-meta font-sans text-sm text-cgws-leather flex items-center gap-2">
      <span>{{ product.brand }}</span>
      <span aria-hidden="true">·</span>
      <span>{{ categoryLabel[product.category] }}</span>
    </p>

    <!-- Séparateur -->
    <hr class="border-t border-cgws-leather/20 my-1" aria-hidden="true">

    <!-- Prix -->
    <p class="product-info-price font-display text-[48px] leading-none mt-1" :class="priceColorClass">
      <span class="sr-only">Prix : </span>
      <span :aria-label="`${product.price.toFixed(0)} euros`">
        {{ product.price.toFixed(0) }} €
      </span>
    </p>

    <!-- État + Taille -->
    <div class="product-info-details flex flex-col gap-1.5">
      <!-- Condition -->
      <p class="font-sans font-medium text-sm text-cgws-leather flex items-center gap-1.5">
        <UIcon name="i-lucide-tag" class="w-3.5 h-3.5 text-cgws-copper/70 flex-shrink-0" aria-hidden="true" />
        {{ conditionLabel[product.condition] }}
      </p>

      <!-- Taille (conditionnelle) -->
      <p
        v-if="product.size"
        class="font-sans text-sm text-cgws-leather flex items-center gap-1.5"
      >
        <UIcon name="i-lucide-ruler" class="w-3.5 h-3.5 text-cgws-leather/50 flex-shrink-0" aria-hidden="true" />
        <span class="sr-only">Taille : </span>Taille : {{ product.size }}
      </p>
    </div>

    <!-- Séparateur -->
    <hr class="border-t border-cgws-leather/10 my-1" aria-hidden="true">

    <!-- Description complète -->
    <p
      class="product-info-description font-sans text-base text-cgws-charcoal leading-relaxed whitespace-pre-wrap"
    >
      {{ product.description }}
    </p>

    <!-- Encart consignation -->
    <div
      v-if="product.isConsignment && !isSold"
      class="product-info-consignment bg-cgws-parchment border border-cgws-leather/30 rounded-[4px] p-4 flex flex-col gap-3"
      role="note"
      aria-label="Information consignation"
    >
      <div class="self-start">
        <CgwsBadge variant="consignment" />
      </div>
      <p class="font-sans text-[13px] text-cgws-leather leading-relaxed">
        Cet article est proposé en consignation par un particulier. Son prix a été convenu avec CGWS.
      </p>
      <!-- eslint-disable link-checker/valid-route, link-checker/valid-sitemap-link -->
      <NuxtLink
        to="/consignation"
        class="font-sans font-medium text-[13px] text-cgws-copper hover:text-cgws-leather transition-colors duration-150 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-copper rounded-sm self-start"
      >
        En savoir plus sur la consignation
      </NuxtLink>
      <!-- eslint-enable link-checker/valid-route, link-checker/valid-sitemap-link -->
    </div>

    <!-- CTA zone -->
    <div class="product-info-cta flex flex-col sm:flex-row gap-3 mt-2">
      <!-- État actif : boutons téléphone + message -->
      <template v-if="!isSold">
        <CgwsButton
          variant="primary"
          size="md"
          as="a"
          href="tel:+33247561234"
          class="flex-1 sm:flex-none"
          :aria-label="`Appeler CGWS pour acquérir ${product.title}`"
        >
          <UIcon name="i-lucide-phone" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
          Appeler pour acquérir
        </CgwsButton>

        <CgwsButton
          variant="secondary"
          size="md"
          as="NuxtLink"
          to="/contact"
          class="flex-1 sm:flex-none"
          :aria-label="`Contacter CGWS par message pour ${product.title}`"
        >
          Contacter par message
        </CgwsButton>
      </template>

      <!-- État vendu : bouton désactivé -->
      <CgwsButton
        v-else
        variant="primary"
        size="md"
        disabled
        class="w-full cursor-not-allowed"
        aria-disabled="true"
      >
        Article vendu
      </CgwsButton>
    </div>
  </div>
</template>
