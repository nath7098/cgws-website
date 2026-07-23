<script setup lang="ts">
// FeaturedProducts — mise en avant catalogue « coups de cœur / nouveautés »
// (US-108). Positionnée AVANT la consignation : la homepage mène désormais au
// catalogue en premier (BRAND_DIRECTION §1). Réutilise ProductCard tel quel —
// le sceau « Testé et approuvé par Camille » (US-110) est porté par ProductCard
// via `product.camilleApproved`. Intégration SOFT : un produit non approuvé
// n'affiche pas de sceau, et la section fonctionne même sans aucun produit
// approuvé (ou sans aucun produit du tout, cf. état vide ci-dessous).
import type { Database } from '~/types/database.types'
import type { Product, ProductCategory, ProductCondition, ProductStatus } from '~/types'

type ProductRow = Database['public']['Tables']['products']['Row']

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    price: Number(row.price),
    category: row.category as ProductCategory,
    brand: row.brand ?? '',
    size: row.size ?? undefined,
    condition: row.condition as ProductCondition,
    isConsignment: row.is_consignment ?? false,
    consignmentId: row.consignment_id ?? undefined,
    status: (row.status ?? 'active') as ProductStatus,
    images: row.images ?? [],
    stock: row.stock ?? 1,
    camilleApproved: row.camille_approved ?? false,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

const supabase = useSupabase()

// SSR-friendly (useAsyncData, MCP Nuxt 4) : les cartes sont dans le HTML initial
// (SEO + pas de layout shift), sans bloquer le LCP du hero (requête légère,
// `limit(4)`, hors du fold). Les produits approuvés remontent en tête pour
// surfacer la curation, puis les plus récents (« nouveautés »).
const { data: products } = await useAsyncData<Product[]>(
  'home-featured-products',
  async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('camille_approved', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) return []
    return (data ?? []).map(mapProductRow)
  },
  { default: () => [] },
)

const hasProducts = computed(() => (products.value?.length ?? 0) > 0)

const sectionRef = ref<HTMLElement | null>(null)
let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!hasProducts.value) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  // Scope au `<section>` pour ne pas capturer d'éventuelles `.product-card`
  // ailleurs (le sélecteur est identique à celui du catalogue).
  ctx = gsap.context(() => {
    gsap.from('.product-card', {
      opacity: 0,
      y: 24,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.08,
      clearProps: 'all',
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 80%',
        once: true,
      },
    })
  }, sectionRef.value ?? undefined)
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section
    ref="sectionRef"
    class="featured-section bg-cgws-ground pt-[clamp(3rem,8vw,6rem)] pb-10 md:pb-14"
    aria-labelledby="featured-heading"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

      <!-- En-tête de section -->
      <div class="text-center mb-8 md:mb-12">
        <p class="inline-flex items-center gap-3 mb-3">
          <span class="block w-6 h-px bg-cgws-accent-deco flex-shrink-0" aria-hidden="true" />
          <span class="font-eyebrow text-[13px] text-cgws-accent uppercase tracking-[0.2em]">
            <!-- PLACEHOLDER — libellé à valider par Camille avant mise en ligne -->
            La sélection
          </span>
          <span class="block w-6 h-px bg-cgws-accent-deco flex-shrink-0" aria-hidden="true" />
        </p>

        <h2
          id="featured-heading"
          class="font-serif font-bold text-cgws-ink leading-tight
                 text-[28px] md:text-[36px] lg:text-[44px] mb-3 md:mb-4"
        >
          <!-- PLACEHOLDER — titre à valider par Camille -->
          Coups de cœur &amp; nouveautés
        </h2>

        <p class="font-serif italic text-cgws-ink-soft text-base md:text-lg max-w-2xl mx-auto">
          <!-- PLACEHOLDER — accroche à valider par Camille -->
          Une sélection courte et défendable — chaque pièce a sa place dans le catalogue.
        </p>
      </div>

      <!-- Grille produits — réutilise ProductCard (sceau US-110 soft) -->
      <div
        v-if="hasProducts"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- État vide — la section reste fonctionnelle sans produit -->
      <div
        v-else
        class="text-center py-8"
      >
        <p class="font-sans text-cgws-ink-soft">
          Le catalogue arrive très bientôt. Revenez vite&nbsp;!
        </p>
      </div>

      <!-- CTA vers le catalogue complet -->
      <div class="text-center mt-8 md:mt-12">
        <CgwsButton
          as="NuxtLink"
          to="/catalogue"
          variant="primary"
          size="md"
          class="w-full sm:w-auto"
        >
          Voir tout le catalogue
        </CgwsButton>
      </div>

    </div>
  </section>
</template>
