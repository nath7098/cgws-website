<script setup lang="ts">
import type { ProductCategory } from '~/types'
import { CATALOGUE_CONTEXT_KEY, CATEGORY_LABELS } from '~/composables/useCatalogue'

// Inject shared catalogue context — no prop mutation needed
const ctx = inject(CATALOGUE_CONTEXT_KEY)
if (!ctx) throw new Error('[FilterPanel] must be used inside a catalogue page that provides CATALOGUE_CONTEXT_KEY')

const { filters, maxPrice, availableBrands, hasActiveFilters, resetFilters } = ctx

// Section open/close state
const openSections = reactive({
  categories: true,
  conditions: false,
  brands: false,
  price: true,
  availability: true,
})

// Brand display: show max 8 by default
const BRAND_LIMIT = 8
const showAllBrands = ref(false)
const visibleBrands = computed(() =>
  showAllBrands.value
    ? availableBrands.value
    : availableBrands.value.slice(0, BRAND_LIMIT),
)

// Price range computed getter/setter for USlider range mode
const priceRange = computed({
  get: (): number[] => [filters.priceMin, filters.priceMax],
  set: (val: number[] | undefined) => {
    if (!val) return
    filters.priceMin = val[0] ?? 0
    filters.priceMax = val[1] ?? maxPrice.value
  },
})

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

function toggleCategory(cat: ProductCategory): void {
  const idx = filters.categories.indexOf(cat)
  if (idx >= 0) filters.categories.splice(idx, 1)
  else filters.categories.push(cat)
}

function toggleCondition(cond: 'new' | 'occasion'): void {
  const idx = filters.conditions.indexOf(cond)
  if (idx >= 0) filters.conditions.splice(idx, 1)
  else filters.conditions.push(cond)
}

function toggleBrand(brand: string): void {
  const idx = filters.brands.indexOf(brand)
  if (idx >= 0) filters.brands.splice(idx, 1)
  else filters.brands.push(brand)
}

function categoryActiveCount(): number {
  return filters.categories.length
}

function conditionActiveCount(): number {
  return filters.conditions.length
}

function brandActiveCount(): number {
  return filters.brands.length
}

function availabilityActiveCount(): number {
  let c = 0
  if (filters.includeReserved) c++
  if (filters.isConsignment === true) c++
  return c
}
</script>

<template>
  <aside
    aria-label="Filtres du catalogue"
    class="hidden lg:flex lg:flex-col w-[260px] flex-shrink-0 bg-cgws-ground border border-cgws-hairline rounded-[4px] sticky top-[calc(4rem+1px)] max-h-[calc(100vh-5rem)] overflow-y-auto"
  >
    <!-- Sidebar header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-cgws-hairline">
      <span class="font-eyebrow text-[11px] text-cgws-ink-soft uppercase tracking-[0.2em]">
        Filtres
      </span>
      <button
        class="font-sans text-xs text-cgws-accent hover:text-cgws-ink-soft transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-1 disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="!hasActiveFilters"
        @click="resetFilters()"
      >
        Réinitialiser
      </button>
    </div>

    <!-- Section: Catégorie -->
    <div class="border-b border-cgws-hairline">
      <button
        class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-ink hover:text-cgws-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-accent"
        :aria-expanded="openSections.categories"
        aria-controls="filter-section-categories"
        @click="openSections.categories = !openSections.categories"
      >
        <span>Catégorie</span>
        <span class="flex items-center gap-2">
          <span
            v-if="categoryActiveCount() > 0"
            class="font-sans font-semibold text-[11px] text-cgws-accent bg-cgws-accent/10 rounded-full px-2 py-0.5"
          >
            {{ categoryActiveCount() }}
          </span>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-4 h-4 text-cgws-ink-soft/60 transition-transform duration-200"
            :class="{ 'rotate-180': openSections.categories }"
          />
        </span>
      </button>
      <Transition
        enter-active-class="transition-[opacity,transform] duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="openSections.categories"
          id="filter-section-categories"
          role="region"
          class="px-4 pb-3 space-y-2"
        >
          <label
            v-for="cat in ALL_CATEGORIES"
            :key="cat"
            class="flex items-center gap-3 cursor-pointer hover:text-cgws-accent transition-colors duration-150"
          >
            <input
              type="checkbox"
              :checked="filters.categories.includes(cat)"
              class="w-4 h-4 rounded-[2px] border border-cgws-hairline cursor-pointer accent-cgws-accent"
              :aria-label="CATEGORY_LABELS[cat]"
              @change="toggleCategory(cat)"
            >
            <span class="font-sans text-sm text-cgws-ink flex-1">
              {{ CATEGORY_LABELS[cat] }}
            </span>
          </label>
        </div>
      </Transition>
    </div>

    <!-- Section: État -->
    <div class="border-b border-cgws-hairline">
      <button
        class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-ink hover:text-cgws-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-accent"
        :aria-expanded="openSections.conditions"
        aria-controls="filter-section-conditions"
        @click="openSections.conditions = !openSections.conditions"
      >
        <span>État</span>
        <span class="flex items-center gap-2">
          <span
            v-if="conditionActiveCount() > 0"
            class="font-sans font-semibold text-[11px] text-cgws-accent bg-cgws-accent/10 rounded-full px-2 py-0.5"
          >
            {{ conditionActiveCount() }}
          </span>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-4 h-4 text-cgws-ink-soft/60 transition-transform duration-200"
            :class="{ 'rotate-180': openSections.conditions }"
          />
        </span>
      </button>
      <Transition
        enter-active-class="transition-[opacity,transform] duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="openSections.conditions"
          id="filter-section-conditions"
          role="region"
          class="px-4 pb-3 space-y-2"
        >
          <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-accent transition-colors duration-150">
            <input
              type="checkbox"
              :checked="filters.conditions.includes('new')"
              class="w-4 h-4 rounded-[2px] border border-cgws-hairline cursor-pointer accent-cgws-accent"
              aria-label="Neuf"
              @change="toggleCondition('new')"
            >
            <span class="font-sans text-sm text-cgws-ink flex-1">Neuf</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-accent transition-colors duration-150">
            <input
              type="checkbox"
              :checked="filters.conditions.includes('occasion')"
              class="w-4 h-4 rounded-[2px] border border-cgws-hairline cursor-pointer accent-cgws-accent"
              aria-label="Occasion"
              @change="toggleCondition('occasion')"
            >
            <span class="font-sans text-sm text-cgws-ink flex-1">Occasion</span>
          </label>
        </div>
      </Transition>
    </div>

    <!-- Section: Marque -->
    <div
      v-if="availableBrands.length > 0"
      class="border-b border-cgws-hairline"
    >
      <button
        class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-ink hover:text-cgws-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-accent"
        :aria-expanded="openSections.brands"
        aria-controls="filter-section-brands"
        @click="openSections.brands = !openSections.brands"
      >
        <span>Marque</span>
        <span class="flex items-center gap-2">
          <span
            v-if="brandActiveCount() > 0"
            class="font-sans font-semibold text-[11px] text-cgws-accent bg-cgws-accent/10 rounded-full px-2 py-0.5"
          >
            {{ brandActiveCount() }}
          </span>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-4 h-4 text-cgws-ink-soft/60 transition-transform duration-200"
            :class="{ 'rotate-180': openSections.brands }"
          />
        </span>
      </button>
      <Transition
        enter-active-class="transition-[opacity,transform] duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="openSections.brands"
          id="filter-section-brands"
          role="region"
          class="px-4 pb-3 space-y-2"
        >
          <label
            v-for="brand in visibleBrands"
            :key="brand"
            class="flex items-center gap-3 cursor-pointer hover:text-cgws-accent transition-colors duration-150"
          >
            <input
              type="checkbox"
              :checked="filters.brands.includes(brand)"
              class="w-4 h-4 rounded-[2px] border border-cgws-hairline cursor-pointer accent-cgws-accent"
              :aria-label="brand"
              @change="toggleBrand(brand)"
            >
            <span class="font-sans text-sm text-cgws-ink flex-1">{{ brand }}</span>
          </label>
          <button
            v-if="availableBrands.length > BRAND_LIMIT"
            class="font-sans text-xs text-cgws-accent hover:underline cursor-pointer mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-accent"
            @click="showAllBrands = !showAllBrands"
          >
            {{ showAllBrands ? 'Voir moins' : `Voir ${availableBrands.length - BRAND_LIMIT} de plus` }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Section: Prix -->
    <div class="border-b border-cgws-hairline">
      <button
        class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-ink hover:text-cgws-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-accent"
        :aria-expanded="openSections.price"
        aria-controls="filter-section-price"
        @click="openSections.price = !openSections.price"
      >
        <span>Prix</span>
        <UIcon
          name="i-lucide-chevron-down"
          class="w-4 h-4 text-cgws-ink-soft/60 transition-transform duration-200"
          :class="{ 'rotate-180': openSections.price }"
        />
      </button>
      <Transition
        enter-active-class="transition-[opacity,transform] duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="openSections.price"
          id="filter-section-price"
          role="region"
          class="px-4 pb-4"
        >
          <USlider
            v-model="priceRange"
            :min="0"
            :max="maxPrice"
            :step="10"
            :min-steps-between-thumbs="50"
            aria-label="Fourchette de prix"
            class="mt-2 mb-4"
            :ui="{
              track: 'bg-cgws-hairline',
              range: 'bg-cgws-accent',
              thumb: 'bg-cgws-surface ring-cgws-accent focus-visible:outline-cgws-accent',
            }"
          />
          <div class="flex gap-2">
            <div class="flex-1">
              <label for="price-min-panel" class="font-sans text-[11px] text-cgws-ink-soft/70 block mb-1">
                Min (€)
              </label>
              <input
                id="price-min-panel"
                type="number"
                :value="filters.priceMin"
                :min="0"
                :max="filters.priceMax"
                class="w-full bg-cgws-ground border border-cgws-hairline rounded-sm px-2 py-1 font-sans text-sm text-cgws-ink text-right focus:outline-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20"
                @change="(e) => { const v = Number((e.target as HTMLInputElement).value); filters.priceMin = Math.max(0, Math.min(v, filters.priceMax - 10)) }"
              >
            </div>
            <div class="flex-1">
              <label for="price-max-panel" class="font-sans text-[11px] text-cgws-ink-soft/70 block mb-1">
                Max (€)
              </label>
              <input
                id="price-max-panel"
                type="number"
                :value="filters.priceMax"
                :min="filters.priceMin"
                :max="maxPrice"
                class="w-full bg-cgws-ground border border-cgws-hairline rounded-sm px-2 py-1 font-sans text-sm text-cgws-ink text-right focus:outline-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20"
                @change="(e) => { const v = Number((e.target as HTMLInputElement).value); filters.priceMax = Math.min(maxPrice, Math.max(v, filters.priceMin + 10)) }"
              >
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Section: Disponibilité -->
    <div class="last:border-b-0">
      <button
        class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-ink hover:text-cgws-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-accent"
        :aria-expanded="openSections.availability"
        aria-controls="filter-section-availability"
        @click="openSections.availability = !openSections.availability"
      >
        <span>Disponibilité</span>
        <span class="flex items-center gap-2">
          <span
            v-if="availabilityActiveCount() > 0"
            class="font-sans font-semibold text-[11px] text-cgws-accent bg-cgws-accent/10 rounded-full px-2 py-0.5"
          >
            {{ availabilityActiveCount() }}
          </span>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-4 h-4 text-cgws-ink-soft/60 transition-transform duration-200"
            :class="{ 'rotate-180': openSections.availability }"
          />
        </span>
      </button>
      <Transition
        enter-active-class="transition-[opacity,transform] duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="openSections.availability"
          id="filter-section-availability"
          role="region"
          class="px-4 pb-3 space-y-2"
        >
          <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-accent transition-colors duration-150">
            <input
              type="checkbox"
              :checked="filters.includeReserved"
              class="w-4 h-4 rounded-[2px] border border-cgws-hairline cursor-pointer accent-cgws-accent"
              aria-label="Inclure les réservés"
              @change="filters.includeReserved = !filters.includeReserved"
            >
            <span class="font-sans text-sm text-cgws-ink flex-1">Inclure les réservés</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-accent transition-colors duration-150">
            <input
              type="checkbox"
              :checked="filters.isConsignment === true"
              class="w-4 h-4 rounded-[2px] border border-cgws-hairline cursor-pointer accent-cgws-accent"
              aria-label="Articles en consignation uniquement"
              @change="filters.isConsignment = filters.isConsignment === true ? null : true"
            >
            <span class="font-sans text-sm text-cgws-ink flex-1">Articles en consignation</span>
          </label>
        </div>
      </Transition>
    </div>
  </aside>
</template>
