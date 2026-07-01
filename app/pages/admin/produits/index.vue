<script setup lang="ts">
import type { Product, ProductCategory, ProductStatus } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Produits',
})

useSeoMeta({
  title: 'Produits — CGWS Administration',
  robots: 'noindex, nofollow',
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── State ────────────────────────────────────────────────────────────────────
const products = ref<Product[]>([])
const totalCount = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const isLoading = ref(false)

const searchQuery = ref('')
const filterCategory = ref<ProductCategory | ''>('')
const filterStatus = ref<ProductStatus | ''>('')

// Delete modal
const deleteTarget = ref<Product | null>(null)
const isDeleting = ref(false)
const deleteButtonRef = ref<HTMLButtonElement | null>(null)
const modalBoxRef = ref<HTMLElement | null>(null)

// Toast
interface Toast { type: 'success' | 'error', message: string }
const toast = ref<Toast | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  'selles': 'Selles',
  'brides-licols': 'Brides & Licols',
  'bottes-chaussures': 'Bottes & Chaussures',
  'vetements': 'Vêtements',
  'accessoires': 'Accessoires',
  'protections': 'Protections',
}

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Disponible',
  sold: 'Vendu',
  reserved: 'Réservé',
  inactive: 'Inactif',
}

const BASE_PILL = 'rounded-full px-2.5 py-0.5 font-sans font-medium text-[11px] uppercase tracking-wider'

function statusPillClass(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    active: `${BASE_PILL} bg-green-100 text-green-700`,
    sold: `${BASE_PILL} bg-cgws-charcoal/10 text-cgws-charcoal`,
    reserved: `${BASE_PILL} bg-cgws-copper/15 text-cgws-copper`,
    inactive: `${BASE_PILL} bg-cgws-leather/15 text-cgws-leather`,
  }
  return map[status] ?? BASE_PILL
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

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  fetchProducts()
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchProducts() {
  isLoading.value = true
  try {
    const token = await getAccessToken()
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: 20,
    }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (filterCategory.value) params.category = filterCategory.value
    if (filterStatus.value) params.status = filterStatus.value

    const data = await $fetch<{
      items: Product[]
      total: number
      totalPages: number
      page: number
    }>('/api/admin/products', {
      params,
      headers: buildAuthHeaders(token),
    })

    products.value = data.items
    totalCount.value = data.total
    totalPages.value = data.totalPages
    currentPage.value = data.page
  }
  catch {
    showToast('error', 'Erreur lors du chargement des produits')
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
    fetchProducts()
  }, 300)
})

watch([filterCategory, filterStatus], () => {
  currentPage.value = 1
  fetchProducts()
})

function resetFilters() {
  searchQuery.value = ''
  filterCategory.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  fetchProducts()
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function openDeleteModal(product: Product, triggerBtn?: HTMLButtonElement) {
  deleteTarget.value = product
  deleteButtonRef.value = triggerBtn ?? null
  nextTick(() => {
    const first = modalBoxRef.value?.querySelector<HTMLElement>('button:not([disabled])')
    first?.focus()
  })
}

function handleModalKeydown(event: KeyboardEvent) {
  if (!modalBoxRef.value) return
  const focusables = Array.from(
    modalBoxRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!

  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}

function closeDeleteModal() {
  deleteTarget.value = null
  deleteButtonRef.value?.focus()
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  const product = deleteTarget.value

  try {
    const token = await getAccessToken()
    await $fetch(`/api/admin/products/${product.id}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(token),
    })
    products.value = products.value.filter(p => p.id !== product.id)
    totalCount.value = Math.max(0, totalCount.value - 1)
    closeDeleteModal()
    showToast('success', `« ${product.title} » a été supprimé.`)
  }
  catch {
    closeDeleteModal()
    showToast('error', 'Erreur lors de la suppression. Veuillez réessayer.')
  }
  finally {
    isDeleting.value = false
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(type: 'success' | 'error', message: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { type, message }
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchProducts()
  const route = useRoute()
  if (route.query.success === 'created') showToast('success', 'Produit créé avec succès !')
  else if (route.query.success === 'updated') showToast('success', 'Produit enregistré avec succès !')
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
        <h2 class="font-serif font-bold text-2xl text-cgws-charcoal">
          Produits
        </h2>
        <p class="font-sans text-sm text-cgws-leather mt-0.5">
          {{ totalCount }} produit{{ totalCount !== 1 ? 's' : '' }} au catalogue
        </p>
      </div>
      <CgwsButton
        variant="primary"
        size="sm"
        as="NuxtLink"
        to="/admin/produits/nouveau"
      >
        <UIcon
          name="i-lucide-plus"
          class="w-4 h-4 mr-1.5"
          aria-hidden="true"
        />
        Ajouter un produit
      </CgwsButton>
    </div>

    <!-- Toolbar -->
    <div class="bg-white border border-cgws-leather/30 rounded-[4px] p-3 flex flex-col sm:flex-row gap-3 mb-4">
      <!-- Search -->
      <div class="relative flex-1 min-w-0">
        <UIcon
          name="i-lucide-search"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-rope pointer-events-none"
          aria-hidden="true"
        />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Rechercher par nom ou marque…"
          class="w-full pl-9 pr-3 py-2 bg-cgws-cream border border-cgws-leather/40 rounded-sm font-sans text-sm text-cgws-charcoal placeholder:text-cgws-rope outline-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20"
          aria-label="Rechercher un produit par nom ou marque"
        >
      </div>

      <!-- Category filter -->
      <select
        v-model="filterCategory"
        class="py-2 px-3 pr-8 bg-cgws-cream border border-cgws-leather/40 rounded-sm font-sans text-sm text-cgws-charcoal appearance-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 outline-none min-w-[160px]"
        aria-label="Filtrer par catégorie"
      >
        <option value="">
          Toutes catégories
        </option>
        <option value="selles">
          Selles
        </option>
        <option value="brides-licols">
          Brides &amp; Licols
        </option>
        <option value="bottes-chaussures">
          Bottes &amp; Chaussures
        </option>
        <option value="vetements">
          Vêtements
        </option>
        <option value="accessoires">
          Accessoires
        </option>
        <option value="protections">
          Protections
        </option>
      </select>

      <!-- Status filter -->
      <select
        v-model="filterStatus"
        class="py-2 px-3 pr-8 bg-cgws-cream border border-cgws-leather/40 rounded-sm font-sans text-sm text-cgws-charcoal appearance-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 outline-none min-w-[140px]"
        aria-label="Filtrer par statut"
      >
        <option value="">
          Tous statuts
        </option>
        <option value="active">
          Disponible
        </option>
        <option value="sold">
          Vendu
        </option>
        <option value="reserved">
          Réservé
        </option>
        <option value="inactive">
          Inactif
        </option>
      </select>
    </div>

    <!-- Mobile cards (< sm) -->
    <div class="block sm:hidden space-y-2">
      <template v-if="isLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-3 animate-pulse"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-sm bg-cgws-leather/10 flex-shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 bg-cgws-leather/10 rounded" />
              <div class="h-3 w-1/2 bg-cgws-leather/10 rounded" />
            </div>
          </div>
        </div>
      </template>
      <div
        v-else-if="products.length === 0"
        class="py-12 text-center"
      >
        <UIcon
          name="i-lucide-package-open"
          class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30"
          aria-hidden="true"
        />
        <p class="font-sans text-sm text-cgws-leather italic">
          Aucun produit ne correspond à votre recherche.
        </p>
        <button
          type="button"
          class="mt-3 font-sans text-xs text-cgws-copper hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
          @click="resetFilters"
        >
          Réinitialiser les filtres
        </button>
      </div>
      <div v-else>
        <div
          v-for="product in products"
          :key="product.id"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-3 flex items-start gap-3"
        >
          <!-- Thumbnail -->
          <div class="w-12 h-12 rounded-sm overflow-hidden bg-cgws-parchment border border-cgws-leather/20 flex-shrink-0">
            <NuxtImg
              v-if="product.images[0]"
              :src="product.images[0]"
              :alt="product.title"
              class="w-full h-full object-cover"
              width="48"
              height="48"
              format="webp"
              loading="lazy"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-image"
                class="w-4 h-4 text-cgws-leather/40"
                aria-hidden="true"
              />
            </div>
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-sans text-sm font-medium text-cgws-charcoal line-clamp-1">
              {{ product.title }}
            </p>
            <p
              v-if="product.brand"
              class="font-sans text-xs text-cgws-leather"
            >
              {{ product.brand }}
            </p>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
              <span class="font-display text-sm text-cgws-copper">{{ formatPrice(product.price) }}</span>
              <span :class="statusPillClass(product.status)">{{ STATUS_LABELS[product.status] }}</span>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <NuxtLink
              :to="`/admin/produits/${product.id}`"
              class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-copper hover:bg-cgws-copper/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
              :aria-label="`Modifier ${product.title}`"
            >
              <UIcon
                name="i-lucide-pencil"
                class="w-4 h-4"
                aria-hidden="true"
              />
            </NuxtLink>
            <button
              type="button"
              class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-rust hover:bg-cgws-rust/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
              :aria-label="`Supprimer ${product.title}`"
              @click="openDeleteModal(product, $event.currentTarget as HTMLButtonElement)"
            >
              <UIcon
                name="i-lucide-trash-2"
                class="w-4 h-4"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table (sm+) -->
    <div class="hidden sm:block">
    <div class="bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden">
      <table
        class="w-full text-sm font-sans"
        aria-label="Liste des produits"
      >
        <caption class="sr-only">
          {{ totalCount }} produits, triés par date d'ajout décroissante
        </caption>
        <thead class="border-b border-cgws-leather/20 bg-cgws-parchment/40">
          <tr>
            <th
              scope="col"
              class="w-12 py-3 pl-4 pr-2 text-left"
            >
              <span class="sr-only">Image</span>
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
            >
              Nom
            </th>
            <th
              scope="col"
              class="hidden sm:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
            >
              Catégorie
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
            >
              Prix
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
            >
              Statut
            </th>
            <th
              scope="col"
              class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
            >
              Ajouté le
            </th>
            <th
              scope="col"
              class="py-3 pl-3 pr-4 text-right"
            >
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-cgws-leather/10">
          <!-- Loading skeleton -->
          <template v-if="isLoading">
            <tr
              v-for="i in 8"
              :key="i"
              class="border-b border-cgws-leather/10"
            >
              <td class="py-3 pl-4 pr-2">
                <div class="w-10 h-10 rounded-sm bg-cgws-leather/10 animate-pulse" />
              </td>
              <td class="py-3 px-3">
                <div class="h-4 w-40 bg-cgws-leather/10 rounded animate-pulse mb-1" />
                <div class="h-3 w-24 bg-cgws-leather/10 rounded animate-pulse" />
              </td>
              <td class="hidden sm:table-cell py-3 px-3">
                <div class="h-4 w-24 bg-cgws-leather/10 rounded animate-pulse" />
              </td>
              <td class="py-3 px-3">
                <div class="h-4 w-16 bg-cgws-leather/10 rounded animate-pulse ml-auto" />
              </td>
              <td class="py-3 px-3">
                <div class="h-5 w-20 bg-cgws-leather/10 rounded-full animate-pulse" />
              </td>
              <td class="hidden lg:table-cell py-3 px-3">
                <div class="h-4 w-16 bg-cgws-leather/10 rounded animate-pulse" />
              </td>
              <td class="py-3 pl-3 pr-4">
                <div class="h-7 w-16 bg-cgws-leather/10 rounded animate-pulse ml-auto" />
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else-if="products.length === 0">
            <td
              colspan="7"
              class="py-16 text-center"
            >
              <UIcon
                name="i-lucide-package-open"
                class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30"
                aria-hidden="true"
              />
              <p class="font-sans text-sm text-cgws-leather italic">
                Aucun produit ne correspond à votre recherche.
              </p>
              <button
                type="button"
                class="mt-3 font-sans text-xs text-cgws-copper hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                @click="resetFilters"
              >
                Réinitialiser les filtres
              </button>
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-for="product in products"
            v-else
            :key="product.id"
            class="hover:bg-cgws-parchment/20 transition-colors duration-100"
          >
            <!-- Thumbnail -->
            <td class="py-2.5 pl-4 pr-2 w-12">
              <div class="w-10 h-10 rounded-sm overflow-hidden bg-cgws-parchment border border-cgws-leather/20 flex-shrink-0">
                <NuxtImg
                  v-if="product.images[0]"
                  :src="product.images[0]"
                  :alt="product.title"
                  class="w-full h-full object-cover"
                  width="40"
                  height="40"
                  format="webp"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-image"
                    class="w-4 h-4 text-cgws-leather/40"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </td>

            <!-- Name + brand -->
            <td class="py-2.5 px-3">
              <span class="font-sans text-sm font-medium text-cgws-charcoal line-clamp-1 block">
                {{ product.title }}
              </span>
              <span
                v-if="product.brand"
                class="font-sans text-xs text-cgws-leather"
              >
                {{ product.brand }}
              </span>
            </td>

            <!-- Category (sm+) -->
            <td class="hidden sm:table-cell py-2.5 px-3 font-sans text-sm text-cgws-leather">
              {{ CATEGORY_LABELS[product.category] ?? product.category }}
            </td>

            <!-- Price -->
            <td class="py-2.5 px-3 text-right font-display text-base text-cgws-copper whitespace-nowrap">
              {{ formatPrice(product.price) }}
            </td>

            <!-- Status badge -->
            <td class="py-2.5 px-3">
              <span :class="statusPillClass(product.status)">
                {{ STATUS_LABELS[product.status] ?? product.status }}
              </span>
            </td>

            <!-- Date (lg+) -->
            <td class="hidden lg:table-cell py-2.5 px-3 font-sans text-xs text-cgws-leather whitespace-nowrap">
              {{ formatDate(product.createdAt) }}
            </td>

            <!-- Actions -->
            <td class="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1">
                <NuxtLink
                  :to="`/admin/produits/${product.id}`"
                  class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-copper hover:bg-cgws-copper/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                  :aria-label="`Modifier ${product.title}`"
                >
                  <UIcon
                    name="i-lucide-pencil"
                    class="w-4 h-4"
                    aria-hidden="true"
                  />
                </NuxtLink>
                <button
                  type="button"
                  class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-rust hover:bg-cgws-rust/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                  :aria-label="`Supprimer ${product.title}`"
                  @click="openDeleteModal(product, $event.currentTarget as HTMLButtonElement)"
                >
                  <UIcon
                    name="i-lucide-trash-2"
                    class="w-4 h-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
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
      <p class="font-sans text-xs text-cgws-leather">
        {{ totalCount }} produit{{ totalCount !== 1 ? 's' : '' }} · page {{ currentPage }} de {{ totalPages }}
      </p>
      <nav
        aria-label="Pagination"
        class="inline-flex items-center gap-1"
      >
        <button
          type="button"
          :disabled="currentPage === 1"
          class="p-1.5 rounded-sm text-cgws-leather disabled:opacity-30 hover:bg-cgws-leather/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
          aria-label="Page précédente"
          @click="goToPage(currentPage - 1)"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="w-4 h-4"
          />
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          :aria-current="page === currentPage ? 'page' : undefined"
          :class="[
            'w-8 h-8 rounded-sm font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper',
            page === currentPage
              ? 'bg-cgws-copper text-cgws-charcoal font-semibold'
              : 'text-cgws-leather hover:bg-cgws-leather/10',
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="p-1.5 rounded-sm text-cgws-leather disabled:opacity-30 hover:bg-cgws-leather/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
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

    <!-- Delete modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="deleteTarget"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          tabindex="-1"
          @keydown.esc="closeDeleteModal()"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-cgws-charcoal/60 backdrop-blur-sm"
            aria-hidden="true"
            @click="closeDeleteModal()"
          />

          <!-- Modal box -->
          <div
            ref="modalBoxRef"
            class="relative bg-white border-2 border-cgws-charcoal rounded-sm shadow-xl w-full max-w-md p-6 space-y-4"
            tabindex="-1"
            @keydown="handleModalKeydown"
          >
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-rust/10 flex items-center justify-center">
                <UIcon
                  name="i-lucide-triangle-alert"
                  class="w-5 h-5 text-cgws-rust"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3
                  id="delete-modal-title"
                  class="font-serif font-bold text-lg text-cgws-charcoal"
                >
                  Supprimer ce produit ?
                </h3>
                <p class="font-sans text-sm text-cgws-leather mt-1">
                  <strong class="text-cgws-charcoal">{{ deleteTarget.title }}</strong>
                  sera définitivement supprimé du catalogue ainsi que toutes ses photos.
                  Cette action est irréversible.
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <CgwsButton
                variant="secondary"
                size="sm"
                type="button"
                @click="closeDeleteModal()"
              >
                Annuler
              </CgwsButton>
              <button
                type="button"
                :disabled="isDeleting"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-cgws-rust text-white font-sans text-sm font-semibold hover:bg-cgws-charcoal transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                @click="confirmDelete()"
              >
                <span
                  v-if="isDeleting"
                  class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
          class="fixed top-4 right-4 z-[60] flex items-center gap-3 bg-cgws-tack text-cgws-rope px-4 py-3 rounded-sm shadow-lg border-l-4 transition-all duration-300"
          :class="toast.type === 'error' ? 'border-cgws-rust' : 'border-cgws-copper'"
        >
          <UIcon
            :name="toast.type === 'error' ? 'i-lucide-x-circle' : 'i-lucide-check-circle'"
            class="w-5 h-5 flex-shrink-0"
            :class="toast.type === 'error' ? 'text-cgws-rust' : 'text-cgws-copper'"
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
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

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
