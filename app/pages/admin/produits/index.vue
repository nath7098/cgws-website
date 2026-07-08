<script setup lang="ts">
import type { Product, ProductCategory, ProductStatus, QuickSalePayload } from '~/types'

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

// Scoped view of a freshly-imported batch (US-063 — "Voir les produits importés")
const route = useRoute()
const importedIds = ref<string>(typeof route.query.ids === 'string' ? route.query.ids : '')

// Sale modal
const saleModalOpen = ref(false)
const saleTargetProduct = ref<Product | null>(null)

function openSaleModal(product: Product): void {
  saleTargetProduct.value = product
  saleModalOpen.value = true
}

function closeSaleModal(): void {
  saleModalOpen.value = false
  saleTargetProduct.value = null
}

async function handleSaleSubmit(payload: QuickSalePayload): Promise<void> {
  try {
    const token = await getAccessToken()
    await $fetch('/api/admin/sales', {
      method: 'POST',
      body: payload,
      headers: buildAuthHeaders(token),
    })
    showToast('success', 'Vente enregistrée.')
    closeSaleModal()
  }
  catch {
    showToast('error', 'Erreur lors de l\'enregistrement de la vente.')
    closeSaleModal()
  }
}

function updateProductStatus(product: Product, newStatus: ProductStatus): void {
  const index = products.value.findIndex(p => p.id === product.id)
  if (index !== -1) {
    products.value[index] = { ...products.value[index]!, status: newStatus }
  }
}

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
    if (importedIds.value) {
      params.ids = importedIds.value
      params.limit = Math.min(100, importedIds.value.split(',').filter(Boolean).length || 20)
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
    importedIds.value = ''
    currentPage.value = 1
    fetchProducts()
  }, 300)
})

watch([filterCategory, filterStatus], () => {
  importedIds.value = ''
  currentPage.value = 1
  fetchProducts()
})

function resetFilters() {
  searchQuery.value = ''
  filterCategory.value = ''
  filterStatus.value = ''
  importedIds.value = ''
  currentPage.value = 1
  fetchProducts()
}

function clearImportedFilter() {
  importedIds.value = ''
  currentPage.value = 1
  void navigateTo({ path: '/admin/produits', query: {} })
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
        <h2 class="font-serif font-bold text-2xl text-cgws-ink">
          Produits
        </h2>
        <p class="font-sans text-sm text-cgws-ink-soft mt-0.5">
          {{ totalCount }} produit{{ totalCount !== 1 ? 's' : '' }} au catalogue
        </p>
      </div>
      <div class="flex items-center gap-2">
        <CgwsButton
          variant="secondary"
          size="sm"
          as="NuxtLink"
          to="/admin/produits/import"
        >
          <UIcon
            name="i-lucide-upload"
            class="w-4 h-4 mr-1.5"
            aria-hidden="true"
          />
          Importer CSV
        </CgwsButton>
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
    </div>

    <!-- Imported batch banner (US-063) -->
    <div
      v-if="importedIds"
      class="bg-cgws-accent/10 border border-cgws-accent/40 rounded-[4px] p-3 flex items-center justify-between gap-3 flex-wrap"
    >
      <p class="font-sans text-sm text-cgws-ink">
        <UIcon
          name="i-lucide-list-checks"
          class="w-4 h-4 inline-block mr-1 -mt-0.5 text-cgws-accent"
          aria-hidden="true"
        />
        Affichage des produits importés récemment.
      </p>
      <button
        type="button"
        class="font-sans text-sm text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
        @click="clearImportedFilter"
      >
        Voir tous les produits
      </button>
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
          placeholder="Rechercher par nom ou marque…"
          class="w-full pl-9 pr-3 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm font-sans text-sm text-cgws-ink placeholder:text-cgws-ink-soft outline-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20"
          aria-label="Rechercher un produit par nom ou marque"
        >
      </div>

      <!-- Category filter -->
      <select
        v-model="filterCategory"
        class="py-2 px-3 pr-8 bg-cgws-ground border border-cgws-hairline rounded-sm font-sans text-sm text-cgws-ink appearance-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 outline-none min-w-[160px]"
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
        class="py-2 px-3 pr-8 bg-cgws-ground border border-cgws-hairline rounded-sm font-sans text-sm text-cgws-ink appearance-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 outline-none min-w-[140px]"
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
          class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-3 animate-pulse"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-sm bg-cgws-hairline flex-shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 bg-cgws-hairline rounded" />
              <div class="h-3 w-1/2 bg-cgws-hairline rounded" />
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
          class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
          aria-hidden="true"
        />
        <p class="font-sans text-sm text-cgws-ink-soft italic">
          Aucun produit ne correspond à votre recherche.
        </p>
        <button
          type="button"
          class="mt-3 font-sans text-xs text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          @click="resetFilters"
        >
          Réinitialiser les filtres
        </button>
      </div>
      <div v-else>
        <div
          v-for="product in products"
          :key="product.id"
          class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-3 flex items-start gap-3"
        >
          <!-- Thumbnail -->
          <div class="w-12 h-12 rounded-sm overflow-hidden bg-cgws-surface border border-cgws-hairline flex-shrink-0">
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
                class="w-4 h-4 text-cgws-ink-soft/40"
                aria-hidden="true"
              />
            </div>
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-sans text-sm font-medium text-cgws-ink line-clamp-1">
              {{ product.title }}
            </p>
            <p
              v-if="product.brand"
              class="font-sans text-xs text-cgws-ink-soft"
            >
              {{ product.brand }}
            </p>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
              <span class="font-display text-sm text-cgws-accent">{{ formatPrice(product.price) }}</span>
              <StatusDropdown
                :product-id="product.id"
                :current-status="product.status"
                :product-title="product.title"
                @update:status="updateProductStatus(product, $event)"
                @sale-required="openSaleModal(product)"
                @error="showToast('error', 'Impossible de modifier le statut.')"
              />
            </div>
          </div>
          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <NuxtLink
              :to="`/admin/produits/${product.id}`"
              class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
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
              class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-danger hover:bg-cgws-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
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
    <div class="bg-cgws-surface border border-cgws-hairline rounded-[4px] overflow-hidden">
      <table
        class="w-full text-sm font-sans"
        aria-label="Liste des produits"
      >
        <caption class="sr-only">
          {{ totalCount }} produits, triés par date d'ajout décroissante
        </caption>
        <thead class="border-b border-cgws-hairline bg-cgws-surface/40">
          <tr>
            <th
              scope="col"
              class="w-12 py-3 pl-4 pr-2 text-left"
            >
              <span class="sr-only">Image</span>
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Nom
            </th>
            <th
              scope="col"
              class="hidden sm:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Catégorie
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Prix
            </th>
            <th
              scope="col"
              class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Statut
            </th>
            <th
              scope="col"
              class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
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
        <tbody class="divide-y divide-cgws-hairline">
          <!-- Loading skeleton -->
          <template v-if="isLoading">
            <tr
              v-for="i in 8"
              :key="i"
              class="border-b border-cgws-hairline"
            >
              <td class="py-3 pl-4 pr-2">
                <div class="w-10 h-10 rounded-sm bg-cgws-hairline animate-pulse" />
              </td>
              <td class="py-3 px-3">
                <div class="h-4 w-40 bg-cgws-hairline rounded animate-pulse mb-1" />
                <div class="h-3 w-24 bg-cgws-hairline rounded animate-pulse" />
              </td>
              <td class="hidden sm:table-cell py-3 px-3">
                <div class="h-4 w-24 bg-cgws-hairline rounded animate-pulse" />
              </td>
              <td class="py-3 px-3">
                <div class="h-4 w-16 bg-cgws-hairline rounded animate-pulse ml-auto" />
              </td>
              <td class="py-3 px-3">
                <div class="h-5 w-20 bg-cgws-hairline rounded-full animate-pulse" />
              </td>
              <td class="hidden lg:table-cell py-3 px-3">
                <div class="h-4 w-16 bg-cgws-hairline rounded animate-pulse" />
              </td>
              <td class="py-3 pl-3 pr-4">
                <div class="h-7 w-16 bg-cgws-hairline rounded animate-pulse ml-auto" />
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
                class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
                aria-hidden="true"
              />
              <p class="font-sans text-sm text-cgws-ink-soft italic">
                Aucun produit ne correspond à votre recherche.
              </p>
              <button
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
            v-for="product in products"
            v-else
            :key="product.id"
            class="hover:bg-cgws-surface/20 transition-colors duration-100"
          >
            <!-- Thumbnail -->
            <td class="py-2.5 pl-4 pr-2 w-12">
              <div class="w-10 h-10 rounded-sm overflow-hidden bg-cgws-surface border border-cgws-hairline flex-shrink-0">
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
                    class="w-4 h-4 text-cgws-ink-soft/40"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </td>

            <!-- Name + brand -->
            <td class="py-2.5 px-3">
              <span class="font-sans text-sm font-medium text-cgws-ink line-clamp-1 block">
                {{ product.title }}
              </span>
              <span
                v-if="product.brand"
                class="font-sans text-xs text-cgws-ink-soft"
              >
                {{ product.brand }}
              </span>
            </td>

            <!-- Category (sm+) -->
            <td class="hidden sm:table-cell py-2.5 px-3 font-sans text-sm text-cgws-ink-soft">
              {{ CATEGORY_LABELS[product.category] ?? product.category }}
            </td>

            <!-- Price -->
            <td class="py-2.5 px-3 text-right font-display text-base text-cgws-accent whitespace-nowrap">
              {{ formatPrice(product.price) }}
            </td>

            <!-- Status badge -->
            <td class="py-2.5 px-3">
              <StatusDropdown
                :product-id="product.id"
                :current-status="product.status"
                :product-title="product.title"
                @update:status="updateProductStatus(product, $event)"
                @sale-required="openSaleModal(product)"
                @error="showToast('error', 'Impossible de modifier le statut.')"
              />
            </td>

            <!-- Date (lg+) -->
            <td class="hidden lg:table-cell py-2.5 px-3 font-sans text-xs text-cgws-ink-soft whitespace-nowrap">
              {{ formatDate(product.createdAt) }}
            </td>

            <!-- Actions -->
            <td class="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1">
                <NuxtLink
                  :to="`/admin/produits/${product.id}`"
                  class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-accent/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
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
                  class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-danger hover:bg-cgws-danger/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
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
      <p class="font-sans text-xs text-cgws-ink-soft">
        {{ totalCount }} produit{{ totalCount !== 1 ? 's' : '' }} · page {{ currentPage }} de {{ totalPages }}
      </p>
      <nav
        aria-label="Pagination"
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
          v-for="page in visiblePages"
          :key="page"
          type="button"
          :aria-current="page === currentPage ? 'page' : undefined"
          :class="[
            'w-8 h-8 rounded-sm font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent',
            page === currentPage
              ? 'bg-cgws-accent text-cgws-on-accent font-semibold'
              : 'text-cgws-ink-soft hover:bg-cgws-hairline',
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
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

    <!-- Sale modal -->
    <SaleModal
      v-if="saleTargetProduct"
      :product="saleTargetProduct"
      :is-open="saleModalOpen"
      @close="closeSaleModal"
      @submitted="handleSaleSubmit"
    />

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
            class="absolute inset-0 bg-cgws-ink/60 backdrop-blur-sm"
            aria-hidden="true"
            @click="closeDeleteModal()"
          />

          <!-- Modal box -->
          <div
            ref="modalBoxRef"
            class="relative bg-cgws-surface border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-md p-6 space-y-4"
            tabindex="-1"
            @keydown="handleModalKeydown"
          >
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-danger/10 flex items-center justify-center">
                <UIcon
                  name="i-lucide-triangle-alert"
                  class="w-5 h-5 text-cgws-danger"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3
                  id="delete-modal-title"
                  class="font-serif font-bold text-lg text-cgws-ink"
                >
                  Supprimer ce produit ?
                </h3>
                <p class="font-sans text-sm text-cgws-ink-soft mt-1">
                  <strong class="text-cgws-ink">{{ deleteTarget.title }}</strong>
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
                class="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-cgws-danger text-cgws-on-danger font-sans text-sm font-semibold hover:bg-cgws-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                @click="confirmDelete()"
              >
                <span
                  v-if="isDeleting"
                  class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
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
