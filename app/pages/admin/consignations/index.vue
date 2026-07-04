<script setup lang="ts">
import type { Consignment, ConsignmentStatus } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

useSeoMeta({
  title: 'Consignations — CGWS Administration',
  robots: 'noindex, nofollow',
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── State ────────────────────────────────────────────────────────────────────
const consignments = ref<Consignment[]>([])
const totalCount = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pendingCount = ref(0)
const isLoading = ref(false)

const searchQuery = ref('')
const filterStatus = ref<ConsignmentStatus | ''>('')

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  pending: 'En attente',
  accepted: 'En vente',
  rejected: 'Refusée',
  sold: 'Vendue',
  returned: 'Retournée',
}

const BASE_PILL = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 font-sans font-medium text-[11px] uppercase tracking-wider rounded-full'

function consignmentPillClass(status: ConsignmentStatus): string {
  const map: Record<ConsignmentStatus, string> = {
    pending: `${BASE_PILL} bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline`,
    accepted: `${BASE_PILL} bg-cgws-success/15 text-cgws-success border border-cgws-success/40`,
    rejected: `${BASE_PILL} bg-cgws-danger text-cgws-on-danger`,
    sold: `${BASE_PILL} bg-cgws-accent text-cgws-on-accent`,
    returned: `${BASE_PILL} bg-cgws-danger text-cgws-on-danger`,
  }
  return map[status]
}

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
  fetchConsignments()
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchConsignments(): Promise<void> {
  isLoading.value = true
  try {
    const token = await getAccessToken()
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: 20,
    }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (filterStatus.value) params.status = filterStatus.value

    const data = await $fetch<{
      items: Consignment[]
      total: number
      totalPages: number
      page: number
      pendingCount: number
    }>('/api/admin/consignments', {
      params,
      headers: buildAuthHeaders(token),
    })

    consignments.value = data.items
    totalCount.value = data.total
    totalPages.value = data.totalPages
    currentPage.value = data.page
    pendingCount.value = data.pendingCount
  }
  catch {
    showToast('error', 'Erreur lors du chargement des consignations')
  }
  finally {
    isLoading.value = false
  }
}

// ─── Debounced search ─────────────────────────────────────────────────────────

let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchConsignments()
  }, 300)
})

watch(filterStatus, () => {
  currentPage.value = 1
  fetchConsignments()
})

function resetFilters(): void {
  searchQuery.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  fetchConsignments()
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { type: 'success' | 'error', message: string }
const toast = ref<Toast | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(type: 'success' | 'error', message: string): void {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { type, message }
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchConsignments()
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="font-serif font-bold text-2xl text-cgws-ink">
          Consignations
        </h2>
        <p
          class="font-sans text-sm mt-0.5"
          :class="pendingCount > 0 ? 'text-cgws-accent font-medium' : 'text-cgws-ink-soft'"
        >
          <template v-if="pendingCount > 0">
            {{ pendingCount }} demande{{ pendingCount > 1 ? 's' : '' }} en attente de traitement
          </template>
          <template v-else>
            {{ totalCount }} demande{{ totalCount !== 1 ? 's' : '' }} au total
          </template>
        </p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-3 flex flex-col sm:flex-row gap-3 mb-4">
      <!-- Search -->
      <div class="relative flex-1 min-w-0">
        <UIcon
          name="i-lucide-search"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-ink-soft pointer-events-none"
          aria-hidden="true"
        />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Rechercher un déposant…"
          class="w-full pl-9 pr-3 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm font-sans text-sm text-cgws-ink placeholder:text-cgws-ink-soft outline-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20"
          aria-label="Rechercher par nom de déposant"
        >
      </div>

      <!-- Status filter -->
      <div class="relative min-w-[180px]">
        <select
          v-model="filterStatus"
          class="w-full py-2 px-3 pr-9 bg-cgws-ground border border-cgws-hairline rounded-sm font-sans text-sm text-cgws-ink appearance-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 outline-none"
          aria-label="Filtrer par statut"
        >
          <option value="">
            Tous les statuts
          </option>
          <option value="pending">
            En attente
          </option>
          <option value="accepted">
            En vente
          </option>
          <option value="rejected">
            Refusées
          </option>
          <option value="sold">
            Vendues
          </option>
          <option value="returned">
            Retournées
          </option>
        </select>
        <UIcon
          name="i-lucide-chevron-down"
          class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-ink-soft/60"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Mobile cards (< sm) -->
    <div class="block sm:hidden space-y-2">
      <template v-if="isLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-3 animate-pulse"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="h-4 w-32 bg-cgws-hairline rounded" />
            <div class="h-5 w-20 bg-cgws-hairline rounded-full" />
          </div>
          <div class="h-3 w-48 bg-cgws-hairline rounded mb-3" />
          <div class="h-5 w-24 bg-cgws-hairline rounded mb-3" />
          <div class="h-8 w-full bg-cgws-hairline rounded" />
        </div>
      </template>
      <div
        v-else-if="consignments.length === 0"
        class="py-12 text-center"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
          aria-hidden="true"
        />
        <p class="font-sans text-sm text-cgws-ink-soft italic">
          Aucune demande de consignation.
        </p>
        <button
          v-if="filterStatus || searchQuery"
          type="button"
          class="mt-3 font-sans text-xs text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          @click="resetFilters"
        >
          Réinitialiser les filtres
        </button>
      </div>
      <div
        v-for="item in consignments"
        v-else
        :key="item.id"
        class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4"
        :class="item.status === 'pending' ? 'bg-cgws-accent/5 border-cgws-accent/30' : ''"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <p class="font-sans text-sm font-medium text-cgws-ink">
            {{ item.depositorName }}
          </p>
          <span :class="consignmentPillClass(item.status)" class="flex-shrink-0">
            <span
              v-if="item.status === 'pending'"
              class="w-1.5 h-1.5 rounded-full bg-cgws-accent animate-pulse flex-shrink-0"
              aria-hidden="true"
            />
            {{ CONSIGNMENT_STATUS_LABELS[item.status] }}
          </span>
        </div>
        <p class="font-sans text-xs text-cgws-ink-soft line-clamp-1 mb-1">
          {{ item.itemDescription }}
        </p>
        <p class="font-display text-base text-cgws-accent mb-1">
          {{ formatPrice(item.askingPrice) }}
        </p>
        <p class="font-sans text-xs text-cgws-ink-soft mb-3">
          {{ formatDate(item.createdAt) }}
        </p>
        <NuxtLink
          :to="`/admin/consignations/${item.id}`"
          class="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-sm bg-cgws-accent/10 text-cgws-accent text-xs font-semibold hover:bg-cgws-accent hover:text-cgws-on-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          :aria-label="`Voir la demande de ${item.depositorName}`"
        >
          Voir la demande
          <UIcon
            name="i-lucide-arrow-right"
            class="w-3.5 h-3.5"
            aria-hidden="true"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Table (sm+) -->
    <div class="hidden sm:block">
      <div class="bg-cgws-surface border border-cgws-hairline rounded-[4px] overflow-hidden">
        <table
          class="w-full text-sm font-sans"
          aria-label="Liste des consignations"
        >
          <caption class="sr-only">
            {{ totalCount }} demande{{ totalCount !== 1 ? 's' : '' }}, demandes en attente affichées en premier
          </caption>
          <thead class="border-b border-cgws-hairline bg-cgws-surface/40">
            <tr>
              <th
                scope="col"
                class="py-3 pl-4 pr-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Déposant
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Article décrit
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Px demandé
              </th>
              <th
                scope="col"
                class="hidden md:table-cell py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Px vente
              </th>
              <th
                scope="col"
                class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Date
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Statut
              </th>
              <th
                scope="col"
                class="py-3 pl-3 pr-4 text-right"
              >
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cgws-hairline">
            <!-- Loading skeleton -->
            <template v-if="isLoading">
              <tr
                v-for="i in 8"
                :key="i"
                class="border-b border-cgws-hairline bg-cgws-surface"
              >
                <td class="py-3 pl-4 pr-3">
                  <div class="h-4 w-32 bg-cgws-hairline rounded animate-pulse mb-1" />
                  <div class="h-3 w-44 bg-cgws-hairline rounded animate-pulse" />
                </td>
                <td class="py-3 px-3">
                  <div class="h-4 w-40 bg-cgws-hairline rounded animate-pulse mb-1" />
                  <div class="h-3 w-20 bg-cgws-hairline rounded animate-pulse" />
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="h-5 w-20 bg-cgws-hairline rounded animate-pulse ml-auto" />
                </td>
                <td class="hidden md:table-cell py-3 px-3 text-right">
                  <div class="h-5 w-16 bg-cgws-hairline rounded animate-pulse ml-auto" />
                </td>
                <td class="hidden lg:table-cell py-3 px-3">
                  <div class="h-4 w-14 bg-cgws-hairline rounded animate-pulse" />
                </td>
                <td class="py-3 px-3">
                  <div class="h-5 w-20 bg-cgws-hairline rounded-full animate-pulse" />
                </td>
                <td class="py-3 pl-3 pr-4 text-right">
                  <div class="h-7 w-16 bg-cgws-hairline rounded animate-pulse ml-auto" />
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="consignments.length === 0">
              <td
                colspan="7"
                class="py-16 text-center"
              >
                <UIcon
                  name="i-lucide-inbox"
                  class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
                  aria-hidden="true"
                />
                <p class="font-sans text-sm text-cgws-ink-soft italic">
                  Aucune demande de consignation.
                </p>
                <button
                  v-if="filterStatus || searchQuery"
                  type="button"
                  class="mt-3 font-sans text-xs text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                  @click="resetFilters"
                >
                  Réinitialiser les filtres
                </button>
              </td>
            </tr>

            <!-- Data rows -->
            <tr
              v-for="item in consignments"
              v-else
              :key="item.id"
              :class="[
                'transition-colors duration-100',
                item.status === 'pending'
                  ? 'bg-cgws-accent/5 hover:bg-cgws-accent/10'
                  : 'bg-cgws-surface hover:bg-cgws-surface-2/60',
              ]"
            >
              <!-- Déposant -->
              <td class="py-3 pl-4 pr-3">
                <span class="font-sans text-sm font-medium text-cgws-ink">
                  {{ item.depositorName }}
                </span>
                <br>
                <span class="font-sans text-xs text-cgws-ink-soft">
                  {{ item.depositorEmail }}
                </span>
              </td>

              <!-- Article -->
              <td class="py-3 px-3 max-w-[220px]">
                <span class="font-sans text-sm text-cgws-ink-soft line-clamp-2">
                  {{ item.itemDescription }}
                </span>
                <span
                  v-if="item.brand"
                  class="font-sans text-xs text-cgws-ink-soft/70 block"
                >
                  {{ item.brand }}
                </span>
              </td>

              <!-- Prix demandé -->
              <td class="py-3 px-3 text-right font-display text-base text-cgws-ink whitespace-nowrap">
                {{ formatPrice(item.askingPrice) }}
              </td>

              <!-- Prix vente (md+) -->
              <td
                class="hidden md:table-cell py-3 px-3 text-right font-display text-base whitespace-nowrap"
                :class="item.agreedPrice ? 'text-cgws-accent' : 'text-cgws-ink-soft/40'"
              >
                {{ item.agreedPrice ? formatPrice(item.agreedPrice) : '—' }}
              </td>

              <!-- Date (lg+) -->
              <td class="hidden lg:table-cell py-3 px-3 font-sans text-xs text-cgws-ink-soft whitespace-nowrap">
                {{ formatDate(item.createdAt) }}
              </td>

              <!-- Statut -->
              <td class="py-3 px-3">
                <span :class="consignmentPillClass(item.status)">
                  <span
                    v-if="item.status === 'pending'"
                    class="w-1.5 h-1.5 rounded-full bg-cgws-accent animate-pulse flex-shrink-0"
                    aria-hidden="true"
                  />
                  {{ CONSIGNMENT_STATUS_LABELS[item.status] }}
                </span>
              </td>

              <!-- Action -->
              <td class="py-3 pl-3 pr-4 text-right">
                <NuxtLink
                  :to="`/admin/consignations/${item.id}`"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-cgws-accent/10 text-cgws-accent text-xs font-semibold hover:bg-cgws-accent hover:text-cgws-on-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                  :aria-label="`Voir la demande de ${item.depositorName}`"
                >
                  Voir
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-3.5 h-3.5"
                    aria-hidden="true"
                  />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="!isLoading && totalPages > 1"
      class="flex items-center justify-between mt-4 flex-wrap gap-3"
    >
      <p class="font-sans text-xs text-cgws-ink-soft">
        {{ totalCount }} demande{{ totalCount !== 1 ? 's' : '' }} · page {{ currentPage }} de {{ totalPages }}
      </p>
      <nav
        aria-label="Pagination des consignations"
        class="inline-flex items-center gap-1"
      >
        <button
          type="button"
          :disabled="currentPage === 1"
          class="p-1.5 rounded-sm text-cgws-ink-soft disabled:opacity-30 hover:bg-cgws-hairline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
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
          class="p-1.5 rounded-sm text-cgws-ink-soft disabled:opacity-30 hover:bg-cgws-hairline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
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

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
          class="fixed top-4 right-4 z-[60] flex items-center gap-3 bg-cgws-brand-espresso text-cgws-brand-cream px-4 py-3 rounded-sm shadow-lg border-l-4 transition-all duration-300"
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
