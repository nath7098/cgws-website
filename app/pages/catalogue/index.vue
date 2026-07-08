<script setup lang="ts">

import { CATALOGUE_CONTEXT_KEY } from '~/composables/useCatalogue'

useSeoMeta({
  title: 'Catalogue — Selles, brides, bottes & accessoires western | CGWS',
  description:
    'Parcourez notre sélection complète d\'équipements équestres western : selles, brides & licols, bottes, vêtements, accessoires et protections — neufs et occasion, dont articles en consignation.',
  ogTitle: 'Catalogue CGWS — Équipements western neufs & occasion',
  ogDescription:
    'Selles, brides, bottes et accessoires western. Filtrez par catégorie, marque et prix. Livraison disponible.',
  ogType: 'website',
  ogImage: DEFAULT_OG_IMAGE,
  twitterCard: 'summary_large_image',
  twitterImage: DEFAULT_OG_IMAGE,
})

const catalogue = useCatalogue()
const {
  filters,
  sort,
  products,
  totalCount,
  isLoading,
  isFetchingMore,
  hasMore,
  availableBrands,
  maxPrice,
  hasActiveFilters,
  activeFilterCount,
  init,
  loadMore,
  resetFilters,
} = catalogue

// Provide context to child filter components
provide(CATALOGUE_CONTEXT_KEY, {
  filters,
  maxPrice,
  availableBrands,
  hasActiveFilters,
  activeFilterCount,
  totalCount,
  resetFilters,
})

onMounted(async () => {
  await init()
})
</script>

<template>
  <div>
    <!-- Skip link for keyboard/screen reader users -->
    <a
      href="#catalogue-results"
      class="sr-only focus:not-sr-only focus:fixed focus:top-20 focus:left-4 focus:z-50 focus:bg-cgws-accent focus:text-cgws-on-accent focus:font-sans focus:font-semibold focus:text-sm focus:px-4 focus:py-2 focus:rounded-sm"
    >
      Aller aux résultats
    </a>

    <!-- Page header -->
    <CatalogueHeader
      :total-count="totalCount"
      :is-filtered="hasActiveFilters"
    />

    <!-- Star divider -->
    <StarDivider />

    <!-- Main content -->
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] py-8">

      <!-- Mobile: filter trigger + sort bar -->
      <div class="lg:hidden flex items-center gap-3 mb-4">
        <div class="flex-1 min-w-0">
          <FilterDrawer />
        </div>
        <SortSelect v-model="sort" />
      </div>

      <!-- Desktop layout: sidebar + results -->
      <div class="flex items-start gap-8">

        <!-- Sidebar filters (self-hides below lg via CSS) -->
        <FilterPanel />

        <!-- Results area -->
        <div
          id="catalogue-results"
          class="flex-1 min-w-0"
          tabindex="-1"
        >
          <!-- Desktop sort bar -->
          <div class="hidden lg:flex items-center justify-between mb-6">
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              class="font-sans text-sm text-cgws-ink-soft"
            >
              {{ totalCount }} produit{{ totalCount !== 1 ? 's' : '' }}
            </span>
            <SortSelect v-model="sort" />
          </div>

          <!-- Product grid -->
          <ProductGrid
            :products="products"
            :is-loading="isLoading"
            :is-fetching-more="isFetchingMore"
            :has-more="hasMore"
            :total="totalCount"
            @load-more="loadMore"
            @reset="resetFilters"
          />
        </div>
      </div>
    </div>
  </div>
</template>
