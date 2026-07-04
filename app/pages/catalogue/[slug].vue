<script setup lang="ts">
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
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

const route = useRoute()
const slug = route.params.slug as string
const supabase = useSupabase()
const config = useRuntimeConfig()

// ── Fetch du produit ────────────────────────────────────────────────────────
const { data: product, error } = await useAsyncData(`product-${slug}`, async () => {
  const { data, error: dbError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (dbError || !data) return null
  return mapProductRow(data)
})

if (error.value || !product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
}

// ── Fetch produits similaires ────────────────────────────────────────────────
const { data: relatedProducts, pending: relatedPending } = await useAsyncData(
  `related-${slug}`,
  async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', product.value!.category)
      .neq('id', product.value!.id)
      .eq('status', 'active')
      .limit(4)

    return (data ?? []).map(mapProductRow)
  },
)

// ── SEO dynamique ────────────────────────────────────────────────────────────
useSeoMeta({
  title: `${product.value!.title} — ${product.value!.brand} | CGWS`,
  description: product.value!.description.slice(0, 160),
  ogTitle: `${product.value!.title} — CGWS`,
  ogDescription: product.value!.description.slice(0, 160),
  ogImage: product.value!.images[0] ?? undefined,
  ogType: 'product',
  twitterCard: 'summary_large_image',
})

// ── JSON-LD Product schema ────────────────────────────────────────────────────
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.value!.title,
        description: product.value!.description,
        brand: { '@type': 'Brand', name: product.value!.brand },
        image: product.value!.images,
        offers: {
          '@type': 'Offer',
          price: product.value!.price,
          priceCurrency: 'EUR',
          availability:
            product.value!.status === 'active'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/SoldOut',
          url: `${config.public.siteUrl}/catalogue/${product.value!.slug}`,
        },
      }),
    },
  ],
})
</script>

<template>
  <div>
    <!-- ── Breadcrumb ───────────────────────────────────────────────────────── -->
    <nav
      aria-label="Fil d'Ariane"
      class="bg-cgws-ground border-b border-cgws-hairline"
    >
      <ol
        class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] py-3 flex items-center gap-2 flex-wrap"
        itemscope
        itemtype="https://schema.org/BreadcrumbList"
      >
        <!-- Accueil (masqué sur mobile) -->
        <li
          class="hidden sm:flex items-center gap-2"
          itemprop="itemListElement"
          itemscope
          itemtype="https://schema.org/ListItem"
        >
          <NuxtLink
            itemprop="item"
            to="/"
            class="font-sans text-xs text-cgws-ink-soft/70 hover:text-cgws-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-accent rounded-sm"
          >
            <span itemprop="name">Accueil</span>
          </NuxtLink>
          <meta itemprop="position" content="1">
          <span class="font-sans text-xs text-cgws-ink-soft/40 select-none" aria-hidden="true">›</span>
        </li>

        <!-- Catalogue -->
        <li
          class="flex items-center gap-2"
          itemprop="itemListElement"
          itemscope
          itemtype="https://schema.org/ListItem"
        >
          <NuxtLink
            itemprop="item"
            to="/catalogue"
            class="font-sans text-xs text-cgws-ink-soft/70 hover:text-cgws-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-accent rounded-sm"
          >
            <span itemprop="name">Catalogue</span>
          </NuxtLink>
          <meta itemprop="position" content="2">
          <span class="font-sans text-xs text-cgws-ink-soft/40 select-none" aria-hidden="true">›</span>
        </li>

        <!-- Produit courant -->
        <li
          itemprop="itemListElement"
          itemscope
          itemtype="https://schema.org/ListItem"
        >
          <span
            itemprop="name"
            class="font-sans text-xs text-cgws-ink-soft truncate max-w-[200px] sm:max-w-none"
            aria-current="page"
          >
            {{ product!.title }}
          </span>
          <meta itemprop="position" content="3">
        </li>
      </ol>
    </nav>

    <!-- ── Section principale ─────────────────────────────────────────────── -->
    <section
      class="bg-cgws-ground py-8 md:py-12"
      aria-label="Détail du produit"
    >
      <div
        class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] flex flex-col lg:flex-row gap-8 lg:gap-12 items-start"
      >
        <!-- Galerie -->
        <ProductGallery
          :images="product!.images"
          :alt="`${product!.title}, ${product!.brand}`"
          :sold="product!.status === 'sold'"
          class="w-full lg:w-[55%] flex-shrink-0"
        />

        <!-- Informations produit -->
        <ProductInfo
          :product="product!"
          class="flex-1 min-w-0 lg:sticky lg:top-[calc(4rem+2rem)]"
        />
      </div>
    </section>

    <!-- ── Diviseur étoile-boussole ───────────────────────────────────────── -->
    <StarDivider />

    <!-- ── Produits similaires ───────────────────────────────────────────── -->
    <RelatedProducts
      :products="relatedProducts ?? []"
      :category="product!.category"
      :is-loading="relatedPending"
    />
  </div>
</template>
