<script setup lang="ts">
import gsap from 'gsap'
import type { QuickSalePayload } from '~/types'

// ─── Local types ──────────────────────────────────────────────────────────────

interface SaleWithProduct {
  id: string
  productId: string
  productTitle: string
  productBrand: string
  isConsignment: boolean
  salePrice: number
  saleDate: string
  paymentMethod: string
  clientName: string | null
  commissionAmount: number | null
  notes: string | null
}

interface SalesSummary {
  caMonth: number
  caTotal: number
  salesMonth: number
  salesTotal: number
}

// ─── Page meta ────────────────────────────────────────────────────────────────

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

useSeoMeta({
  title: 'Ventes — CGWS Administration',
  robots: 'noindex, nofollow',
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── State ────────────────────────────────────────────────────────────────────

const sales = ref<SaleWithProduct[]>([])
const totalCount = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const summary = ref<SalesSummary>({ caMonth: 0, caTotal: 0, salesMonth: 0, salesTotal: 0 })
const isLoading = ref(false)

const filterMonth = ref('')
const filterType = ref<'' | 'own' | 'consignment'>('')

const showSaleForm = ref(false)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte CB',
  transfer: 'Virement',
  check: 'Chèque',
}

function paymentLabel(method: string): string {
  return PAYMENT_LABELS[method] ?? method
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const visiblePages = computed((): number[] => {
  const tp = totalPages.value
  const cp = currentPage.value
  const pages: number[] = []
  const start = Math.max(1, cp - 2)
  const end = Math.min(tp, cp + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  fetchSales()
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchSales(): Promise<void> {
  isLoading.value = true
  try {
    const token = await getAccessToken()
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: 20,
    }
    if (filterMonth.value) params.month = filterMonth.value
    if (filterType.value) params.type = filterType.value

    const data = await $fetch<{
      sales: SaleWithProduct[]
      total: number
      summary: SalesSummary
    }>('/api/admin/sales', {
      params,
      headers: buildAuthHeaders(token),
    })

    sales.value = data.sales
    totalCount.value = data.total
    totalPages.value = Math.ceil(data.total / 20) || 1
    summary.value = data.summary
  }
  catch {
    showToast('error', 'Erreur lors du chargement des ventes')
  }
  finally {
    isLoading.value = false
  }
}

// ─── GSAP animation after load ────────────────────────────────────────────────

let gsapCtx: gsap.Context | undefined

watch(isLoading, (loading) => {
  if (!loading) {
    nextTick(() => {
      if (gsapCtx) gsapCtx.revert()
      gsapCtx = gsap.context(() => {
        gsap.from('.sale-row', {
          opacity: 0,
          y: 12,
          stagger: 0.04,
          duration: 0.28,
          ease: 'power2.out',
          clearProps: 'all',
        })
      })
    })
  }
})

// ─── Filters ─────────────────────────────────────────────────────────────────

watch(filterMonth, () => {
  currentPage.value = 1
  fetchSales()
})

watch(filterType, () => {
  currentPage.value = 1
  fetchSales()
})

function resetFilters(): void {
  filterMonth.value = ''
  filterType.value = ''
  currentPage.value = 1
  fetchSales()
}

const hasActiveFilters = computed(() => !!filterMonth.value || !!filterType.value)

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { type: 'success' | 'error', message: string }
const toast = ref<Toast | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(type: 'success' | 'error', message: string): void {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { type, message }
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

// ─── Sale form handlers ───────────────────────────────────────────────────────

async function onSaleSubmitted(payload: QuickSalePayload): Promise<void> {
  try {
    const token = await getAccessToken()
    await $fetch('/api/admin/sales', {
      method: 'POST',
      body: payload,
      headers: buildAuthHeaders(token),
    })
    showSaleForm.value = false
    showToast('success', 'Vente enregistrée avec succès.')
    currentPage.value = 1
    await fetchSales()
  }
  catch {
    showSaleForm.value = false
    showToast('error', 'Erreur lors de l\'enregistrement de la vente.')
  }
}

// ─── KPI display values ───────────────────────────────────────────────────────

const kpiCards = computed(() => [
  {
    id: 'ca-month',
    label: 'CA ce mois',
    value: isLoading.value ? '' : formatPrice(summary.value.caMonth),
    icon: 'i-lucide-trending-up',
  },
  {
    id: 'ca-total',
    label: 'CA total',
    value: isLoading.value ? '' : formatPrice(summary.value.caTotal),
    icon: 'i-lucide-euro',
  },
  {
    id: 'sales-month',
    label: 'Ventes ce mois',
    value: isLoading.value ? '' : summary.value.salesMonth,
    icon: 'i-lucide-receipt',
  },
  {
    id: 'sales-total',
    label: 'Ventes au total',
    value: isLoading.value ? '' : summary.value.salesTotal,
    icon: 'i-lucide-bar-chart-2',
  },
])

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchSales()
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (gsapCtx) gsapCtx.revert()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="font-serif font-bold text-2xl text-cgws-ink">
          Ventes
        </h2>
        <p
          v-if="isLoading"
          class="h-3 w-48 bg-cgws-hairline rounded animate-pulse mt-1"
        />
        <p
          v-else
          class="font-sans text-sm mt-0.5 text-cgws-ink-soft"
        >
          {{ summary.salesMonth }} vente{{ summary.salesMonth !== 1 ? 's' : '' }} ce mois
          · CA mensuel : {{ formatPrice(summary.caMonth) }}
        </p>
      </div>

      <button
        type="button"
        data-open-sale-form
        class="px-4 py-2 rounded-sm bg-cgws-accent text-cgws-on-accent font-sans text-sm
               font-semibold inline-flex items-center gap-2 hover:bg-cgws-edge
               transition-colors duration-150
               focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 focus-visible:outline-none"
        @click="showSaleForm = true"
      >
        <UIcon
          name="i-lucide-plus"
          class="w-4 h-4"
          aria-hidden="true"
        />
        +<span class="hidden sm:inline"> Enregistrer une</span> vente
      </button>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <KpiCard
        v-for="(kpi, index) in kpiCards"
        :key="kpi.id"
        v-motion
        :initial="{ opacity: 0, y: 8 }"
        :visible-once="{ opacity: 1, y: 0, transition: { delay: index * 80, duration: 300 } }"
        :label="kpi.label"
        :value="kpi.value"
        :icon="kpi.icon"
        :loading="isLoading"
      />
    </div>

    <!-- Toolbar -->
    <div
      class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-3
             flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4"
    >
      <!-- Filtre mois -->
      <input
        id="filter-month"
        v-model="filterMonth"
        type="month"
        aria-label="Filtrer par mois"
        class="px-3 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm
               font-sans text-sm text-cgws-ink
               focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20
               focus:outline-none"
      >

      <!-- Filtre type -->
      <div class="relative min-w-[160px]">
        <select
          v-model="filterType"
          class="w-full py-2 px-3 pr-9 bg-cgws-ground border border-cgws-hairline rounded-sm
                 font-sans text-sm text-cgws-ink appearance-none
                 focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none"
          aria-label="Filtrer par type de vente"
        >
          <option value="">
            Tous les types
          </option>
          <option value="own">
            Propre
          </option>
          <option value="consignment">
            Dépôt-vente
          </option>
        </select>
        <UIcon
          name="i-lucide-chevron-down"
          class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-ink-soft/60"
          aria-hidden="true"
        />
      </div>

      <!-- Bouton reset -->
      <button
        v-if="hasActiveFilters"
        type="button"
        class="font-sans text-xs text-cgws-accent hover:underline
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
               self-start sm:self-center"
        aria-label="Réinitialiser les filtres"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </div>

    <!-- Table desktop (sm+) -->
    <div class="hidden sm:block bg-cgws-surface border border-cgws-hairline rounded-[4px] overflow-hidden">
      <table
        class="w-full text-sm font-sans"
        aria-label="Liste des ventes"
      >
        <caption class="sr-only">
          {{ totalCount }} vente{{ totalCount !== 1 ? 's' : '' }}, triées par date décroissante
        </caption>
        <thead class="bg-cgws-surface/40 border-b border-cgws-hairline">
          <tr>
            <th
              scope="col"
              class="py-3 pl-4 pr-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Article
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Date
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Type
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Prix vente
            </th>
            <th
              scope="col"
              class="hidden md:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Paiement
            </th>
            <th
              scope="col"
              class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Client
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-cgws-hairline">
          <!-- Skeleton -->
          <template v-if="isLoading">
            <tr
              v-for="i in 8"
              :key="i"
            >
              <td class="py-3 pl-4 pr-3">
                <div class="h-4 w-40 bg-cgws-hairline rounded animate-pulse mb-1" />
                <div class="h-3 w-20 bg-cgws-hairline rounded animate-pulse" />
              </td>
              <td class="py-3 px-3">
                <div class="h-4 w-16 bg-cgws-hairline rounded animate-pulse" />
              </td>
              <td class="py-3 px-3">
                <div class="h-5 w-20 bg-cgws-hairline rounded-full animate-pulse" />
              </td>
              <td class="py-3 px-3 text-right">
                <div class="h-5 w-20 bg-cgws-hairline rounded animate-pulse ml-auto" />
              </td>
              <td class="hidden md:table-cell py-3 px-3">
                <div class="h-4 w-14 bg-cgws-hairline rounded animate-pulse" />
              </td>
              <td class="hidden lg:table-cell py-3 px-3">
                <div class="h-4 w-24 bg-cgws-hairline rounded animate-pulse" />
              </td>
            </tr>
          </template>

          <!-- État vide -->
          <tr v-else-if="sales.length === 0">
            <td
              colspan="6"
              class="py-16 text-center"
            >
              <UIcon
                name="i-lucide-receipt"
                class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
                aria-hidden="true"
              />
              <p class="font-sans text-sm text-cgws-ink-soft italic">
                {{ hasActiveFilters ? 'Aucune vente pour cette période.' : 'Aucune vente enregistrée pour l\'instant.' }}
              </p>
              <button
                v-if="hasActiveFilters"
                type="button"
                class="mt-3 font-sans text-xs text-cgws-accent hover:underline
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                @click="resetFilters"
              >
                Réinitialiser les filtres
              </button>
              <button
                v-else
                type="button"
                class="mt-3 px-4 py-2 rounded-sm bg-cgws-accent text-cgws-on-accent
                       font-sans text-sm font-semibold inline-flex items-center gap-2
                       hover:bg-cgws-edge transition-colors
                       focus-visible:ring-2 focus-visible:ring-cgws-accent
                       focus-visible:ring-offset-2 focus-visible:outline-none"
                @click="showSaleForm = true"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="w-4 h-4"
                  aria-hidden="true"
                />
                Enregistrer la première vente
              </button>
            </td>
          </tr>

          <!-- Lignes de données -->
          <tr
            v-for="sale in sales"
            v-else
            :key="sale.id"
            class="sale-row transition-colors duration-100 hover:bg-cgws-surface/20"
          >
            <td class="py-3 pl-4 pr-3 max-w-[240px]">
              <span class="font-sans text-sm font-medium text-cgws-ink block truncate">
                {{ sale.productTitle }}
              </span>
              <span class="font-sans text-xs text-cgws-ink-soft/70">
                {{ sale.productBrand }}
              </span>
            </td>
            <td class="py-3 px-3 text-sm text-cgws-ink-soft whitespace-nowrap">
              {{ formatDate(sale.saleDate) }}
            </td>
            <td class="py-3 px-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full
                       font-sans font-medium text-[11px] uppercase tracking-wider"
                :class="sale.isConsignment
                  ? 'bg-cgws-accent/20 text-cgws-accent'
                  : 'bg-cgws-success/15 text-cgws-success'"
              >
                {{ sale.isConsignment ? 'Dépôt-vente' : 'Propre' }}
              </span>
            </td>
            <td class="py-3 px-3 text-right font-display text-base text-cgws-accent whitespace-nowrap">
              {{ formatPrice(sale.salePrice) }}
            </td>
            <td class="hidden md:table-cell py-3 px-3 text-sm text-cgws-ink-soft">
              {{ paymentLabel(sale.paymentMethod) }}
            </td>
            <td class="hidden lg:table-cell py-3 px-3 text-sm text-cgws-ink-soft">
              {{ sale.clientName ?? '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards (< sm) -->
    <div class="block sm:hidden space-y-2">
      <template v-if="isLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4 animate-pulse"
        >
          <div class="h-4 w-44 bg-cgws-hairline rounded mb-2" />
          <div class="flex justify-between mb-2">
            <div class="h-3 w-16 bg-cgws-hairline rounded" />
            <div class="h-5 w-20 bg-cgws-hairline rounded-full" />
          </div>
          <div class="h-5 w-24 bg-cgws-hairline rounded" />
        </div>
      </template>

      <div
        v-else-if="sales.length === 0"
        class="py-12 text-center"
      >
        <UIcon
          name="i-lucide-receipt"
          class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
          aria-hidden="true"
        />
        <p class="font-sans text-sm text-cgws-ink-soft italic">
          {{ hasActiveFilters ? 'Aucune vente pour cette période.' : 'Aucune vente enregistrée pour l\'instant.' }}
        </p>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="mt-3 font-sans text-xs text-cgws-accent hover:underline
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          @click="resetFilters"
        >
          Réinitialiser les filtres
        </button>
        <button
          v-else
          type="button"
          class="mt-3 px-4 py-2 rounded-sm bg-cgws-accent text-cgws-on-accent
                 font-sans text-sm font-semibold inline-flex items-center gap-2
                 hover:bg-cgws-edge transition-colors
                 focus-visible:ring-2 focus-visible:ring-cgws-accent
                 focus-visible:ring-offset-2 focus-visible:outline-none"
          @click="showSaleForm = true"
        >
          <UIcon
            name="i-lucide-plus"
            class="w-4 h-4"
            aria-hidden="true"
          />
          Enregistrer la première vente
        </button>
      </div>

      <div
        v-for="sale in sales"
        v-else
        :key="sale.id"
        class="sale-row bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4 space-y-1"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="font-sans text-sm font-medium text-cgws-ink">
            {{ sale.productTitle }}
          </p>
          <span
            class="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full
                   font-sans font-medium text-[11px] uppercase tracking-wider"
            :class="sale.isConsignment
              ? 'bg-cgws-accent/20 text-cgws-accent'
              : 'bg-cgws-success/15 text-cgws-success'"
          >
            {{ sale.isConsignment ? 'Dépôt-vente' : 'Propre' }}
          </span>
        </div>
        <p class="font-sans text-xs text-cgws-ink-soft">
          {{ formatDate(sale.saleDate) }}
        </p>
        <p class="font-display text-base text-cgws-accent">
          {{ formatPrice(sale.salePrice) }}
        </p>
        <p class="font-sans text-xs text-cgws-ink-soft">
          {{ paymentLabel(sale.paymentMethod) }}
        </p>
        <p
          v-if="sale.clientName"
          class="font-sans text-xs text-cgws-ink-soft italic"
        >
          Client : {{ sale.clientName }}
        </p>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="!isLoading && totalPages > 1"
      class="flex items-center justify-between mt-4 flex-wrap gap-3"
    >
      <p class="font-sans text-xs text-cgws-ink-soft">
        {{ totalCount }} vente{{ totalCount !== 1 ? 's' : '' }} au total · page {{ currentPage }} de {{ totalPages }}
      </p>
      <nav
        aria-label="Pagination des ventes"
        class="inline-flex items-center gap-1"
      >
        <button
          type="button"
          :disabled="currentPage === 1"
          class="p-1.5 rounded-sm text-cgws-ink-soft disabled:opacity-30
                 hover:bg-cgws-hairline transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          aria-label="Page précédente"
          @click="goToPage(currentPage - 1)"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="w-4 h-4"
          />
        </button>

        <button
          v-for="p in visiblePages"
          :key="p"
          type="button"
          :aria-current="p === currentPage ? 'page' : undefined"
          :class="[
            'w-8 h-8 rounded-sm font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent',
            p === currentPage
              ? 'bg-cgws-accent text-cgws-on-accent font-semibold'
              : 'text-cgws-ink-soft hover:bg-cgws-hairline',
          ]"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>

        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="p-1.5 rounded-sm text-cgws-ink-soft disabled:opacity-30
                 hover:bg-cgws-hairline transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          aria-label="Page suivante"
          @click="goToPage(currentPage + 1)"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="w-4 h-4"
          />
        </button>
      </nav>
    </div>

    <!-- SaleForm modal -->
    <SaleForm
      :is-open="showSaleForm"
      @close="showSaleForm = false"
      @submitted="onSaleSubmitted"
    />

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
          class="fixed top-4 right-4 z-[60] flex items-center gap-3 bg-cgws-brand-espresso text-cgws-brand-cream
                 px-4 py-3 rounded-sm shadow-lg border-l-4 transition-all duration-300"
          :class="toast.type === 'error' ? 'border-cgws-danger' : 'border-cgws-accent'"
        >
          <UIcon
            :name="toast.type === 'error' ? 'i-lucide-x-circle' : 'i-lucide-check-circle'"
            class="w-5 h-5 flex-shrink-0"
            :class="toast.type === 'error' ? 'text-cgws-danger' : 'text-cgws-accent'"
            aria-hidden="true"
          />
          <p class="font-sans text-sm">
            {{ toast.message }}
          </p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
