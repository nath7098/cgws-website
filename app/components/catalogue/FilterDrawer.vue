<script setup lang="ts">
import type { ProductCategory } from '~/types'
import { CATALOGUE_CONTEXT_KEY, CATEGORY_LABELS } from '~/composables/useCatalogue'

// Inject shared catalogue context — no prop mutation needed
const ctx = inject(CATALOGUE_CONTEXT_KEY)
if (!ctx) throw new Error('[FilterDrawer] must be used inside a catalogue page that provides CATALOGUE_CONTEXT_KEY')

const {
  filters,
  maxPrice,
  availableBrands,
  hasActiveFilters,
  activeFilterCount,
  totalCount,
  resetFilters,
} = ctx

// Section open/close state
const openSections = reactive({
  categories: true,
  conditions: false,
  brands: false,
  price: true,
  availability: true,
})

// Brand display
const BRAND_LIMIT = 8
const showAllBrands = ref(false)
const visibleBrands = computed(() =>
  showAllBrands.value
    ? availableBrands.value
    : availableBrands.value.slice(0, BRAND_LIMIT),
)

// Price range computed for USlider range mode
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
</script>

<template>
  <UDrawer
    direction="bottom"
    :snap-points="['85%']"
    :handle="true"
    :overlay="true"
    :ui="{
      content: 'bg-cgws-cream rounded-t-[12px] max-h-[85vh] flex flex-col',
      overlay: 'bg-cgws-charcoal/40 backdrop-blur-sm',
    }"
  >
    <!-- Trigger button (default slot = drawer trigger) -->
    <button
      class="flex items-center gap-2 bg-cgws-cream border border-cgws-leather/30 rounded-sm px-3 py-2 font-sans font-medium text-sm text-cgws-charcoal hover:border-cgws-copper hover:text-cgws-copper transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper w-full"
      aria-label="Ouvrir les filtres"
    >
      <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 flex-shrink-0" />
      <span class="flex-1 text-left">Filtrer</span>
      <span
        v-if="activeFilterCount > 0"
        class="font-sans font-semibold text-[11px] text-cgws-copper bg-cgws-copper/10 rounded-full px-2 py-0.5"
      >
        {{ activeFilterCount }}
      </span>
    </button>

    <!-- Drawer header -->
    <template #header>
      <div class="flex items-center justify-between px-4 py-3 border-b border-cgws-leather/20 flex-shrink-0">
        <span class="font-eyebrow text-[11px] text-cgws-leather uppercase tracking-[0.2em]">
          Filtres
        </span>
      </div>
    </template>

    <!-- Drawer body: filter sections -->
    <template #body>
      <div class="overflow-y-auto flex-1">

        <!-- Section: Catégorie -->
        <div class="border-b border-cgws-leather/10">
          <button
            class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-charcoal hover:text-cgws-copper transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-copper"
            :aria-expanded="openSections.categories"
            @click="openSections.categories = !openSections.categories"
          >
            <span>Catégorie</span>
            <span class="flex items-center gap-2">
              <span
                v-if="filters.categories.length > 0"
                class="font-sans font-semibold text-[11px] text-cgws-copper bg-cgws-copper/10 rounded-full px-2 py-0.5"
              >
                {{ filters.categories.length }}
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="w-4 h-4 text-cgws-leather/60 transition-transform duration-200"
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
            <div v-if="openSections.categories" class="px-4 pb-3 space-y-2">
              <label
                v-for="cat in ALL_CATEGORIES"
                :key="cat"
                class="flex items-center gap-3 cursor-pointer hover:text-cgws-copper transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  :checked="filters.categories.includes(cat)"
                  class="w-4 h-4 rounded-[2px] border border-cgws-leather/40 cursor-pointer accent-cgws-copper"
                  :aria-label="CATEGORY_LABELS[cat]"
                  @change="toggleCategory(cat)"
                >
                <span class="font-sans text-sm text-cgws-charcoal flex-1">
                  {{ CATEGORY_LABELS[cat] }}
                </span>
              </label>
            </div>
          </Transition>
        </div>

        <!-- Section: État -->
        <div class="border-b border-cgws-leather/10">
          <button
            class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-charcoal hover:text-cgws-copper transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-copper"
            :aria-expanded="openSections.conditions"
            @click="openSections.conditions = !openSections.conditions"
          >
            <span>État</span>
            <span class="flex items-center gap-2">
              <span
                v-if="filters.conditions.length > 0"
                class="font-sans font-semibold text-[11px] text-cgws-copper bg-cgws-copper/10 rounded-full px-2 py-0.5"
              >
                {{ filters.conditions.length }}
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="w-4 h-4 text-cgws-leather/60 transition-transform duration-200"
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
            <div v-if="openSections.conditions" class="px-4 pb-3 space-y-2">
              <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-copper transition-colors duration-150">
                <input
                  type="checkbox"
                  :checked="filters.conditions.includes('new')"
                  class="w-4 h-4 rounded-[2px] border border-cgws-leather/40 cursor-pointer accent-cgws-copper"
                  aria-label="Neuf"
                  @change="toggleCondition('new')"
                >
                <span class="font-sans text-sm text-cgws-charcoal flex-1">Neuf</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-copper transition-colors duration-150">
                <input
                  type="checkbox"
                  :checked="filters.conditions.includes('occasion')"
                  class="w-4 h-4 rounded-[2px] border border-cgws-leather/40 cursor-pointer accent-cgws-copper"
                  aria-label="Occasion"
                  @change="toggleCondition('occasion')"
                >
                <span class="font-sans text-sm text-cgws-charcoal flex-1">Occasion</span>
              </label>
            </div>
          </Transition>
        </div>

        <!-- Section: Marque -->
        <div v-if="availableBrands.length > 0" class="border-b border-cgws-leather/10">
          <button
            class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-charcoal hover:text-cgws-copper transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-copper"
            :aria-expanded="openSections.brands"
            @click="openSections.brands = !openSections.brands"
          >
            <span>Marque</span>
            <span class="flex items-center gap-2">
              <span
                v-if="filters.brands.length > 0"
                class="font-sans font-semibold text-[11px] text-cgws-copper bg-cgws-copper/10 rounded-full px-2 py-0.5"
              >
                {{ filters.brands.length }}
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="w-4 h-4 text-cgws-leather/60 transition-transform duration-200"
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
            <div v-if="openSections.brands" class="px-4 pb-3 space-y-2">
              <label
                v-for="brand in visibleBrands"
                :key="brand"
                class="flex items-center gap-3 cursor-pointer hover:text-cgws-copper transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  :checked="filters.brands.includes(brand)"
                  class="w-4 h-4 rounded-[2px] border border-cgws-leather/40 cursor-pointer accent-cgws-copper"
                  :aria-label="brand"
                  @change="toggleBrand(brand)"
                >
                <span class="font-sans text-sm text-cgws-charcoal flex-1">{{ brand }}</span>
              </label>
              <button
                v-if="availableBrands.length > BRAND_LIMIT"
                class="font-sans text-xs text-cgws-copper hover:underline cursor-pointer mt-1"
                @click="showAllBrands = !showAllBrands"
              >
                {{ showAllBrands ? 'Voir moins' : `Voir ${availableBrands.length - BRAND_LIMIT} de plus` }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Section: Prix -->
        <div class="border-b border-cgws-leather/10">
          <button
            class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-charcoal hover:text-cgws-copper transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-copper"
            :aria-expanded="openSections.price"
            @click="openSections.price = !openSections.price"
          >
            <span>Prix</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-4 h-4 text-cgws-leather/60 transition-transform duration-200"
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
            <div v-if="openSections.price" class="px-4 pb-4">
              <USlider
                v-model="priceRange"
                :min="0"
                :max="maxPrice"
                :step="10"
                :min-steps-between-thumbs="50"
                aria-label="Fourchette de prix"
                class="mt-2 mb-4"
              />
              <div class="flex gap-2">
                <div class="flex-1">
                  <label for="price-min-drawer" class="font-sans text-[11px] text-cgws-leather/70 block mb-1">
                    Min (€)
                  </label>
                  <input
                    id="price-min-drawer"
                    type="number"
                    :value="filters.priceMin"
                    :min="0"
                    :max="filters.priceMax"
                    class="w-full bg-cgws-cream border border-cgws-leather/40 rounded-sm px-2 py-1 font-sans text-sm text-cgws-charcoal text-right focus:outline-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20"
                    @change="(e) => { const v = Number((e.target as HTMLInputElement).value); filters.priceMin = Math.max(0, Math.min(v, filters.priceMax - 10)) }"
                  >
                </div>
                <div class="flex-1">
                  <label for="price-max-drawer" class="font-sans text-[11px] text-cgws-leather/70 block mb-1">
                    Max (€)
                  </label>
                  <input
                    id="price-max-drawer"
                    type="number"
                    :value="filters.priceMax"
                    :min="filters.priceMin"
                    :max="maxPrice"
                    class="w-full bg-cgws-cream border border-cgws-leather/40 rounded-sm px-2 py-1 font-sans text-sm text-cgws-charcoal text-right focus:outline-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20"
                    @change="(e) => { const v = Number((e.target as HTMLInputElement).value); filters.priceMax = Math.min(maxPrice, Math.max(v, filters.priceMin + 10)) }"
                  >
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Section: Disponibilité -->
        <div>
          <button
            class="flex items-center justify-between w-full px-4 py-3 font-serif font-semibold text-sm text-cgws-charcoal hover:text-cgws-copper transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-copper"
            :aria-expanded="openSections.availability"
            @click="openSections.availability = !openSections.availability"
          >
            <span>Disponibilité</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-4 h-4 text-cgws-leather/60 transition-transform duration-200"
              :class="{ 'rotate-180': openSections.availability }"
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
            <div v-if="openSections.availability" class="px-4 pb-3 space-y-2">
              <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-copper transition-colors duration-150">
                <input
                  type="checkbox"
                  :checked="filters.includeReserved"
                  class="w-4 h-4 rounded-[2px] border border-cgws-leather/40 cursor-pointer accent-cgws-copper"
                  aria-label="Inclure les réservés"
                  @change="filters.includeReserved = !filters.includeReserved"
                >
                <span class="font-sans text-sm text-cgws-charcoal flex-1">Inclure les réservés</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer hover:text-cgws-copper transition-colors duration-150">
                <input
                  type="checkbox"
                  :checked="filters.isConsignment === true"
                  class="w-4 h-4 rounded-[2px] border border-cgws-leather/40 cursor-pointer accent-cgws-copper"
                  aria-label="Articles en consignation uniquement"
                  @change="filters.isConsignment = filters.isConsignment === true ? null : true"
                >
                <span class="font-sans text-sm text-cgws-charcoal flex-1">Articles en consignation</span>
              </label>
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <!-- Drawer footer -->
    <template #footer>
      <div class="flex-shrink-0 px-4 py-4 border-t border-cgws-leather/20 flex gap-3">
        <CgwsButton
          variant="ghost"
          class="flex-1"
          :disabled="!hasActiveFilters"
          @click="resetFilters()"
        >
          Réinitialiser
        </CgwsButton>
        <CgwsButton variant="primary" size="sm" class="flex-1">
          Voir {{ totalCount }}&nbsp;produit{{ totalCount !== 1 ? 's' : '' }}
        </CgwsButton>
      </div>
    </template>
  </UDrawer>
</template>
