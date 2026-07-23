<script setup lang="ts">
import type { Product, ProductCategory, ProductCondition } from '~/types'
import { useCartStore } from '~/stores/cart'

interface Props {
  product: Product
}

const props = defineProps<Props>()

const cart = useCartStore()
const toast = useToast()

const isSold = computed(() => props.product.status === 'sold')

// Contrat de composant US-096 (spec design §0.1) : booléen dérivé, jamais un
// statut figé en dur — que le modèle DB évolue un jour vers une vraie colonne
// ou reste une dérivation pure, seul ce calcul change, aucun composant
// consommateur n'a besoin d'être réécrit. Toujours `false` pour une pièce en
// consignation (pièce unique, pas de notion de stock — axe orthogonal).
const isOutOfStock = computed(
  () => !props.product.isConsignment && props.product.stock === 0 && props.product.status !== 'sold',
)

// isPurchasable étendu (US-096) : un produit non-consigné en rupture n'est
// plus achetable même si son status reste "active" en base.
const isPurchasable = computed(() => props.product.status === 'active' && !isOutOfStock.value)

const isLowStock = computed(
  () => !props.product.isConsignment && props.product.stock > 0 && props.product.stock <= 3,
)

const stockUrgencyLabel = computed(() => {
  const stock = props.product.stock
  // Évite l'élision maladroite "Plus qu'1 en stock" (spec design §1.2).
  return stock === 1 ? 'Dernier exemplaire en stock' : `Plus que ${stock} en stock`
})

// Sélecteur de quantité affiché uniquement pour un produit non-consigné
// réellement achetable — masqué en rupture (CTA remplacé, préparation
// US-097) et masqué pour toute pièce de consignation (§1.3, non-régression
// explicite : comportement pièce unique strictement inchangé).
const showQuantitySelector = computed(() => !props.product.isConsignment && isPurchasable.value)
const quantityMax = computed(() => Math.min(props.product.stock, 10))
const quantity = ref(1)

// Un produit dont le stock/la disponibilité change entre deux navigations
// (le composant n'est pas garanti d'être démonté par Nuxt entre deux slugs)
// réinitialise la quantité choisie à 1.
watch(
  () => props.product.id,
  () => {
    quantity.value = 1
  },
)

// US-070 — feedback d'ajout, étendu US-096 (achat multiple, remplacement de
// quantité). Décision produit actée (spec design §7.3) : revenir sur la fiche
// et choisir une nouvelle quantité REMPLACE le total de la ligne panier, ne
// s'additionne jamais à l'existante.
function addToCart(): void {
  const wasInCart = cart.isInCart(props.product.id)
  const added = cart.add(props.product, quantity.value)

  if (!added) {
    toast.add({
      title: 'Déjà dans votre panier',
      description: props.product.isConsignment
        ? 'Cet article est une pièce unique — un seul exemplaire par commande.'
        : 'Vous avez déjà cette quantité dans votre panier.',
      icon: 'i-lucide-info',
      color: 'neutral',
    })
    return
  }

  if (wasInCart) {
    toast.add({
      title: 'Quantité mise à jour',
      description: `${quantity.value} exemplaire${quantity.value > 1 ? 's' : ''} — ${props.product.title}`,
      icon: 'i-lucide-shopping-basket',
      color: 'success',
    })
    return
  }

  toast.add({
    title: 'Ajouté au panier',
    description: props.product.title,
    icon: 'i-lucide-shopping-basket',
    color: 'success',
  })
}

const conditionBadgeVariant = computed((): 'sold' | 'out-of-stock' | 'reserved' | 'new' | 'occasion' => {
  // Priorité explicite (spec design §1.8) : sold > out-of-stock > reserved > new/occasion.
  if (isSold.value) return 'sold'
  if (isOutOfStock.value) return 'out-of-stock'
  if (props.product.status === 'reserved') return 'reserved'
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
  isSold.value ? 'text-cgws-ink-soft' : 'text-cgws-accent',
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
      class="product-info-title font-serif font-bold text-[24px] sm:text-[28px] lg:text-[36px] text-cgws-ink leading-tight mt-1"
    >
      {{ product.title }}
    </h1>

    <!-- Marque · Catégorie -->
    <p class="product-info-meta font-sans text-sm text-cgws-ink-soft flex items-center gap-2">
      <span>{{ product.brand }}</span>
      <span aria-hidden="true">·</span>
      <span>{{ categoryLabel[product.category] }}</span>
    </p>

    <!-- Séparateur -->
    <hr class="border-t border-cgws-hairline my-1" aria-hidden="true">

    <!-- Prix -->
    <p class="product-info-price font-display text-[48px] tabular-nums leading-none mt-1" :class="priceColorClass">
      <span class="sr-only">Prix : </span>
      <span :aria-label="`${product.price.toFixed(0)} euros`">
        {{ product.price.toFixed(0) }} €
      </span>
    </p>

    <!-- État + Taille -->
    <div class="product-info-details flex flex-col gap-1.5">
      <!-- Condition -->
      <p class="font-sans font-medium text-sm text-cgws-ink-soft flex items-center gap-1.5">
        <UIcon name="i-lucide-tag" class="w-3.5 h-3.5 text-cgws-accent/70 flex-shrink-0" aria-hidden="true" />
        {{ conditionLabel[product.condition] }}
      </p>

      <!-- Taille (conditionnelle) -->
      <p
        v-if="product.size"
        class="font-sans text-sm text-cgws-ink-soft flex items-center gap-1.5"
      >
        <UIcon name="i-lucide-ruler" class="w-3.5 h-3.5 text-cgws-ink-soft/50 flex-shrink-0" aria-hidden="true" />
        <span class="sr-only">Taille : </span>Taille : {{ product.size }}
      </p>

      <!-- Quantité restante (US-096) — masquée en consignation (pièce unique)
           et en rupture (remplacée par le badge "Épuisé" ci-dessus). -->
      <p
        v-if="!product.isConsignment && !isOutOfStock && !isLowStock"
        class="font-sans text-sm text-cgws-ink-soft flex items-center gap-1.5"
      >
        <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-cgws-ink-soft/60 flex-shrink-0" aria-hidden="true" />
        {{ product.stock }} en stock
      </p>
      <p
        v-else-if="isLowStock"
        class="font-sans font-medium text-sm text-cgws-accent flex items-center gap-2"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-cgws-accent flex-shrink-0" aria-hidden="true" />
        {{ stockUrgencyLabel }}
      </p>
    </div>

    <!-- Séparateur -->
    <hr class="border-t border-cgws-hairline my-1" aria-hidden="true">

    <!-- Description complète -->
    <p
      class="product-info-description font-sans text-base text-cgws-ink leading-relaxed whitespace-pre-wrap"
    >
      {{ product.description }}
    </p>

    <!-- Encart consignation -->
    <div
      v-if="product.isConsignment && !isSold"
      class="product-info-consignment bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4 flex flex-col gap-3"
      role="note"
      aria-label="Information consignation"
    >
      <div class="self-start">
        <CgwsBadge variant="consignment" />
      </div>
      <p class="font-sans text-[13px] text-cgws-ink-soft leading-relaxed">
        Cet article est proposé en consignation par un particulier. Son prix a été convenu avec CGWS.
      </p>
      <!-- eslint-disable link-checker/valid-route, link-checker/valid-sitemap-link -->
      <NuxtLink
        to="/consignation"
        class="font-sans font-medium text-[13px] text-cgws-accent hover:text-cgws-ink-soft transition-colors duration-150 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-accent rounded-sm self-start"
      >
        En savoir plus sur la consignation
      </NuxtLink>
      <!-- eslint-enable link-checker/valid-route, link-checker/valid-sitemap-link -->
    </div>

    <!-- CTA zone -->
    <div class="product-info-cta flex flex-col gap-3 mt-2">
      <!-- État actif : achat en ligne (US-070) + téléphone + message -->
      <template v-if="!isSold">
        <!-- Sélecteur de quantité (US-096) — non-consignation uniquement, masqué en rupture -->
        <div v-if="showQuantitySelector" class="product-info-quantity flex items-center gap-3">
          <span class="font-sans font-medium text-sm text-cgws-ink">Quantité</span>
          <QuantitySelector v-model="quantity" :max="quantityMax" />
        </div>

        <CgwsButton
          v-if="isPurchasable"
          variant="primary"
          size="md"
          class="w-full justify-center"
          :aria-label="`Ajouter ${quantity > 1 ? `${quantity} exemplaires de ` : ''}${product.title} au panier`"
          @click="addToCart"
        >
          <UIcon name="i-lucide-shopping-basket" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
          Ajouter au panier
        </CgwsButton>

        <!-- Rupture de stock (US-097) : le CTA d'achat est remplacé par le
             formulaire d'alerte retour en stock — jamais affiché pour une
             pièce de consignation (isOutOfStock est toujours false dans ce
             cas, cf. contrat §0.1). -->
        <RestockNotifyForm
          v-else-if="isOutOfStock"
          :product-id="product.id"
          :product-title="product.title"
        />

        <div class="flex flex-col sm:flex-row gap-3">
          <CgwsButton
            :variant="isPurchasable ? 'secondary' : 'primary'"
            size="md"
            as="a"
            href="tel:+33247561234"
            class="flex-1 justify-center"
            :aria-label="`Appeler CGWS pour acquérir ${product.title}`"
          >
            <UIcon name="i-lucide-phone" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
            Appeler la boutique
          </CgwsButton>

          <CgwsButton
            variant="secondary"
            size="md"
            as="NuxtLink"
            to="/contact"
            class="flex-1 justify-center"
            :aria-label="`Contacter CGWS par message pour ${product.title}`"
          >
            Contacter par message
          </CgwsButton>
        </div>
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
