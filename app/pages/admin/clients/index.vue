<script setup lang="ts">
import gsap from 'gsap'
import type { ClientWithStats } from '~/types'

// ─── Page meta ────────────────────────────────────────────────────────────────

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

useSeoMeta({
  title: 'Clients — CGWS Administration',
  robots: 'noindex, nofollow',
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── State ────────────────────────────────────────────────────────────────────

const clients = ref<ClientWithStats[]>([])
const totalCount = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const isLoading = ref(false)
const hasError = ref(false)

const searchInput = ref('')
const searchQuery = ref('')

// ─── Debounced search ─────────────────────────────────────────────────────────

let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = val.trim()
    currentPage.value = 1
    fetchClients()
  }, 300)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
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
  fetchClients()
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchClients(): Promise<void> {
  isLoading.value = true
  hasError.value = false
  try {
    const token = await getAccessToken()
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: 20,
    }
    if (searchQuery.value) params.search = searchQuery.value

    const data = await $fetch<{ clients: ClientWithStats[]; total: number }>(
      '/api/admin/clients',
      { params, headers: buildAuthHeaders(token) },
    )

    clients.value = data.clients
    totalCount.value = data.total
    totalPages.value = Math.ceil(data.total / 20) || 1
  }
  catch {
    hasError.value = true
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
        gsap.from('.client-row', {
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

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchClients()
})

onUnmounted(() => {
  clearTimeout(searchTimer)
  if (gsapCtx) gsapCtx.revert()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="font-serif font-bold text-2xl text-cgws-charcoal">
          Clients
        </h2>
        <p
          v-if="isLoading"
          class="h-3 w-24 bg-cgws-leather/10 rounded animate-pulse mt-1"
        />
        <p
          v-else
          class="font-sans text-sm mt-0.5 text-cgws-leather"
        >
          {{ totalCount }} client{{ totalCount !== 1 ? 's' : '' }}
        </p>
      </div>

      <NuxtLink
        to="/admin/clients/nouveau"
        class="px-4 py-2 rounded-sm bg-cgws-copper text-white font-sans text-sm
               font-semibold inline-flex items-center gap-2 hover:bg-cgws-leather
               transition-colors duration-150
               focus-visible:ring-2 focus-visible:ring-cgws-copper
               focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label="Créer un nouveau client"
      >
        <UIcon
          name="i-lucide-plus"
          class="w-4 h-4"
          aria-hidden="true"
        />
        <span class="hidden sm:inline">+ Nouveau client</span>
        <span class="sm:hidden">+ Nouveau</span>
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="relative mb-4">
      <UIcon
        name="i-lucide-search"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-leather/50 pointer-events-none"
        aria-hidden="true"
      />
      <input
        v-model="searchInput"
        type="text"
        role="searchbox"
        aria-label="Rechercher un client par nom ou email"
        placeholder="Rechercher un client (nom ou email)…"
        class="w-full pl-9 pr-3 py-2 bg-cgws-cream border border-cgws-leather/40
               rounded-sm font-sans text-sm text-cgws-charcoal
               placeholder:text-cgws-rope
               focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
               focus:outline-none"
      >
    </div>

    <!-- Error state -->
    <div
      v-if="hasError"
      class="py-16 text-center"
    >
      <UIcon
        name="i-lucide-alert-triangle"
        class="w-10 h-10 mx-auto mb-3 text-cgws-rust"
        aria-hidden="true"
      />
      <p class="font-sans text-sm text-cgws-leather italic mb-4">
        Erreur lors du chargement des clients.
      </p>
      <button
        type="button"
        class="px-4 py-2 rounded-sm bg-cgws-copper text-white
               font-sans text-sm font-semibold inline-flex items-center gap-2
               hover:bg-cgws-leather transition-colors
               focus-visible:ring-2 focus-visible:ring-cgws-copper
               focus-visible:ring-offset-2 focus-visible:outline-none"
        @click="fetchClients"
      >
        Réessayer
      </button>
    </div>

    <template v-else>
      <!-- Table (sm+) -->
      <div class="hidden sm:block bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden">
        <table
          class="w-full text-sm font-sans"
          aria-label="Liste des clients"
        >
          <caption class="sr-only">
            {{ totalCount }} client{{ totalCount !== 1 ? 's' : '' }}, triés par date de dernier achat décroissante
          </caption>
          <thead class="bg-cgws-parchment/40 border-b border-cgws-leather/20">
            <tr>
              <th
                scope="col"
                class="py-3 pl-4 pr-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
              >
                Nom
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
              >
                Email
              </th>
              <th
                scope="col"
                class="hidden md:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
              >
                Tél.
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
              >
                Achats
              </th>
              <th
                scope="col"
                class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
              >
                Dernier achat
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-right pr-4 font-sans text-[10px] uppercase tracking-widest text-cgws-leather"
              >
                Voir
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cgws-leather/10">
            <!-- Skeleton -->
            <template v-if="isLoading">
              <tr
                v-for="i in 8"
                :key="i"
              >
                <td class="py-3 pl-4 pr-3">
                  <div class="h-4 bg-cgws-leather/10 rounded animate-pulse w-32" />
                </td>
                <td class="py-3 px-3">
                  <div class="h-4 bg-cgws-leather/10 rounded animate-pulse w-40" />
                </td>
                <td class="hidden md:table-cell py-3 px-3">
                  <div class="h-4 bg-cgws-leather/10 rounded animate-pulse w-24" />
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="h-4 bg-cgws-leather/10 rounded animate-pulse w-8 ml-auto" />
                </td>
                <td class="hidden lg:table-cell py-3 px-3">
                  <div class="h-4 bg-cgws-leather/10 rounded animate-pulse w-20" />
                </td>
                <td class="py-3 px-3 pr-4 text-right">
                  <div class="h-4 bg-cgws-leather/10 rounded animate-pulse w-6 ml-auto" />
                </td>
              </tr>
            </template>

            <!-- Empty: search no result -->
            <tr v-else-if="clients.length === 0 && searchQuery">
              <td
                colspan="6"
                class="py-16 text-center"
              >
                <UIcon
                  name="i-lucide-users"
                  class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30"
                  aria-hidden="true"
                />
                <p class="font-sans text-sm text-cgws-leather italic">
                  Aucun client ne correspond à «&nbsp;{{ searchQuery }}&nbsp;».
                </p>
                <button
                  type="button"
                  class="mt-2 font-sans text-xs text-cgws-copper hover:underline
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                  @click="searchInput = ''"
                >
                  Effacer la recherche
                </button>
              </td>
            </tr>

            <!-- Empty: no clients at all -->
            <tr v-else-if="clients.length === 0">
              <td
                colspan="6"
                class="py-16 text-center"
              >
                <UIcon
                  name="i-lucide-users"
                  class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30"
                  aria-hidden="true"
                />
                <p class="font-sans text-sm text-cgws-leather italic mb-4">
                  Aucun client enregistré.
                </p>
                <NuxtLink
                  to="/admin/clients/nouveau"
                  class="px-4 py-2 rounded-sm bg-cgws-copper text-white
                         font-sans text-sm font-semibold inline-flex items-center gap-2
                         hover:bg-cgws-leather transition-colors
                         focus-visible:ring-2 focus-visible:ring-cgws-copper
                         focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <UIcon
                    name="i-lucide-plus"
                    class="w-4 h-4"
                    aria-hidden="true"
                  />
                  + Nouveau client
                </NuxtLink>
              </td>
            </tr>

            <!-- Data rows -->
            <tr
              v-for="client in clients"
              v-else
              :key="client.id"
              class="client-row transition-colors duration-100 hover:bg-cgws-parchment/20"
            >
              <td class="py-3 pl-4 pr-3 max-w-[200px]">
                <NuxtLink
                  :to="`/admin/clients/${client.id}`"
                  class="font-sans text-sm font-medium text-cgws-charcoal hover:text-cgws-copper
                         transition-colors truncate block
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                >
                  {{ client.name }}
                </NuxtLink>
              </td>
              <td class="py-3 px-3 text-sm text-cgws-leather">
                {{ client.email ?? '—' }}
              </td>
              <td class="hidden md:table-cell py-3 px-3 text-sm text-cgws-leather whitespace-nowrap">
                {{ client.phone ?? '—' }}
              </td>
              <td class="py-3 px-3 text-right font-display text-base text-cgws-copper">
                {{ client.purchaseCount }}
              </td>
              <td class="hidden lg:table-cell py-3 px-3 text-sm text-cgws-leather whitespace-nowrap">
                {{ formatDate(client.lastPurchaseDate) }}
              </td>
              <td class="py-3 px-3 pr-4 text-right">
                <NuxtLink
                  :to="`/admin/clients/${client.id}`"
                  class="text-cgws-copper hover:text-cgws-leather transition-colors inline-block
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                  :aria-label="`Voir la fiche de ${client.name}`"
                  tabindex="-1"
                >
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-4 h-4"
                    aria-hidden="true"
                  />
                </NuxtLink>
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
            class="bg-white border border-cgws-leather/30 rounded-[4px] p-4 animate-pulse"
          >
            <div class="h-4 w-32 bg-cgws-leather/10 rounded mb-2" />
            <div class="h-3 w-48 bg-cgws-leather/10 rounded mb-2" />
            <div class="h-3 w-20 bg-cgws-leather/10 rounded" />
          </div>
        </template>

        <div
          v-else-if="clients.length === 0 && searchQuery"
          class="py-12 text-center"
        >
          <UIcon
            name="i-lucide-users"
            class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30"
            aria-hidden="true"
          />
          <p class="font-sans text-sm text-cgws-leather italic">
            Aucun client ne correspond à «&nbsp;{{ searchQuery }}&nbsp;».
          </p>
          <button
            type="button"
            class="mt-2 font-sans text-xs text-cgws-copper hover:underline
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
            @click="searchInput = ''"
          >
            Effacer la recherche
          </button>
        </div>

        <div
          v-else-if="clients.length === 0"
          class="py-12 text-center"
        >
          <UIcon
            name="i-lucide-users"
            class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30"
            aria-hidden="true"
          />
          <p class="font-sans text-sm text-cgws-leather italic mb-4">
            Aucun client enregistré.
          </p>
          <NuxtLink
            to="/admin/clients/nouveau"
            class="px-4 py-2 rounded-sm bg-cgws-copper text-white
                   font-sans text-sm font-semibold inline-flex items-center gap-2
                   hover:bg-cgws-leather transition-colors
                   focus-visible:ring-2 focus-visible:ring-cgws-copper
                   focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            + Nouveau client
          </NuxtLink>
        </div>

        <ClientCard
          v-for="client in clients"
          v-else
          :key="client.id"
          :client="client"
        />
      </div>

      <!-- Pagination -->
      <div
        v-if="!isLoading && totalPages > 1"
        class="flex items-center justify-between mt-4 flex-wrap gap-3"
      >
        <p class="font-sans text-xs text-cgws-leather">
          {{ totalCount }} client{{ totalCount !== 1 ? 's' : '' }} · page {{ currentPage }} de {{ totalPages }}
        </p>
        <nav
          aria-label="Pagination des clients"
          class="inline-flex items-center gap-1"
        >
          <button
            type="button"
            :disabled="currentPage === 1"
            class="p-1.5 rounded-sm text-cgws-leather disabled:opacity-30
                   hover:bg-cgws-leather/10 transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
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
              'w-8 h-8 rounded-sm font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper',
              p === currentPage
                ? 'bg-cgws-copper text-white font-semibold'
                : 'text-cgws-leather hover:bg-cgws-leather/10',
            ]"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>

          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="p-1.5 rounded-sm text-cgws-leather disabled:opacity-30
                   hover:bg-cgws-leather/10 transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
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
    </template>
  </div>
</template>
