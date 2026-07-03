<script setup lang="ts">
import gsap from 'gsap'
import type { Client, ClientPurchase, Consignment, ConsignmentStatus, PaymentMethod } from '~/types'

// ─── Local types ──────────────────────────────────────────────────────────────

interface ClientDetailResponse {
  client: Client
  purchases: ClientPurchase[]
  consignments: Consignment[]
}

// ─── Page meta ────────────────────────────────────────────────────────────────

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── Route ────────────────────────────────────────────────────────────────────

const route = useRoute()
const clientId = computed(() => route.params.id as string)

// ─── State ────────────────────────────────────────────────────────────────────

const client = ref<Client | null>(null)
const purchases = ref<ClientPurchase[]>([])
const consignments = ref<Consignment[]>([])
const isLoading = ref(false)
const isNotFound = ref(false)
const hasError = ref(false)

// Notes
const notesEdit = ref('')
const isEditingNotes = ref(false)
const isSavingNotes = ref(false)

// Toast
interface Toast { type: 'success' | 'error'; message: string }
const toast = ref<Toast | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

// ─── SEO (dynamic) ────────────────────────────────────────────────────────────

useSeoMeta({
  title: computed(() => client.value ? `${client.value.name} — Clients CGWS` : 'Fiche client — CGWS'),
  robots: 'noindex, nofollow',
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatDateLong(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte CB',
  transfer: 'Virement',
  check: 'Chèque',
}

function paymentLabel(method: PaymentMethod | string): string {
  return PAYMENT_LABELS[method] ?? method
}

const CLIENT_INITIAL = computed(() =>
  client.value?.name?.charAt(0)?.toUpperCase() ?? '?',
)

// ─── Consignment badge mapping ────────────────────────────────────────────────

const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  pending: 'En attente',
  accepted: 'En vente',
  rejected: 'Refusée',
  sold: 'Vendue',
  returned: 'Retournée',
}

const CONSIGNMENT_STATUS_CLASSES: Record<ConsignmentStatus, string> = {
  pending: 'bg-cgws-surface text-cgws-ink-soft',
  accepted: 'bg-cgws-success/15 text-cgws-success border border-cgws-success/40',
  sold: 'bg-cgws-accent/15 text-cgws-accent',
  rejected: 'bg-cgws-danger/15 text-cgws-danger',
  returned: 'bg-cgws-hairline text-cgws-ink-soft',
}

function consignmentStatusLabel(status: ConsignmentStatus): string {
  return CONSIGNMENT_STATUS_LABELS[status] ?? status
}

function consignmentStatusClass(status: ConsignmentStatus): string {
  return CONSIGNMENT_STATUS_CLASSES[status] ?? 'bg-cgws-hairline text-cgws-ink-soft'
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchClient(): Promise<void> {
  isLoading.value = true
  hasError.value = false
  isNotFound.value = false

  try {
    const token = await getAccessToken()
    const data = await $fetch<ClientDetailResponse>(
      `/api/admin/clients/${clientId.value}`,
      { headers: buildAuthHeaders(token) },
    )
    client.value = data.client
    purchases.value = data.purchases
    consignments.value = data.consignments
    notesEdit.value = data.client.notes ?? ''
  }
  catch (err: unknown) {
    const fetchError = err as { statusCode?: number }
    if (fetchError?.statusCode === 404) {
      isNotFound.value = true
    }
    else {
      hasError.value = true
    }
  }
  finally {
    isLoading.value = false
  }
}

// ─── GSAP ─────────────────────────────────────────────────────────────────────

let gsapCtx: gsap.Context | undefined

watch(isLoading, (loading) => {
  if (!loading) {
    nextTick(() => {
      if (gsapCtx) gsapCtx.revert()
      gsapCtx = gsap.context(() => {
        gsap.from('.sale-history-row', {
          opacity: 0,
          y: 8,
          stagger: 0.035,
          duration: 0.25,
          ease: 'power2.out',
          clearProps: 'all',
        })
      })
    })
  }
})

// ─── Notes inline edit ────────────────────────────────────────────────────────

function startEditingNotes(): void {
  notesEdit.value = client.value?.notes ?? ''
  isEditingNotes.value = true
}

function cancelEditingNotes(): void {
  notesEdit.value = client.value?.notes ?? ''
  isEditingNotes.value = false
}

async function saveNotes(): Promise<void> {
  isSavingNotes.value = true
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ client: Client }>(
      `/api/admin/clients/${clientId.value}`,
      {
        method: 'PUT',
        body: { notes: notesEdit.value },
        headers: buildAuthHeaders(token),
      },
    )
    if (client.value) {
      client.value = { ...client.value, notes: data.client.notes }
    }
    isEditingNotes.value = false
    showToast('success', 'Notes enregistrées.')
  }
  catch {
    showToast('error', 'Erreur lors de la sauvegarde des notes.')
  }
  finally {
    isSavingNotes.value = false
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(type: 'success' | 'error', message: string): void {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { type, message }
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchClient()
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (gsapCtx) gsapCtx.revert()
})
</script>

<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/admin/clients"
      class="inline-flex items-center gap-1.5 font-sans text-sm text-cgws-ink-soft
             hover:text-cgws-accent transition-colors mb-4
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
      aria-label="Retour à la liste des clients"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="w-4 h-4"
        aria-hidden="true"
      />
      Retour aux clients
    </NuxtLink>

    <!-- Not found -->
    <div
      v-if="isNotFound"
      class="py-16 text-center"
    >
      <UIcon
        name="i-lucide-user-x"
        class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
        aria-hidden="true"
      />
      <p class="font-serif font-semibold text-lg text-cgws-ink mb-1">
        Client introuvable
      </p>
      <p class="font-sans text-sm text-cgws-ink-soft mb-4">
        Ce client n'existe pas ou a été supprimé.
      </p>
      <NuxtLink
        to="/admin/clients"
        class="px-4 py-2 rounded-sm bg-cgws-accent text-cgws-on-accent
               font-sans text-sm font-semibold inline-flex items-center gap-2
               hover:bg-cgws-edge transition-colors
               focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Retour à la liste
      </NuxtLink>
    </div>

    <!-- Network error -->
    <div
      v-else-if="hasError"
      class="py-16 text-center"
    >
      <UIcon
        name="i-lucide-alert-triangle"
        class="w-10 h-10 mx-auto mb-3 text-cgws-danger"
        aria-hidden="true"
      />
      <p class="font-sans text-sm text-cgws-ink-soft italic mb-4">
        Erreur de chargement
      </p>
      <button
        type="button"
        class="px-4 py-2 rounded-sm bg-cgws-accent text-cgws-on-accent
               font-sans text-sm font-semibold inline-flex items-center gap-2
               hover:bg-cgws-edge transition-colors
               focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 focus-visible:outline-none"
        @click="fetchClient"
      >
        Réessayer
      </button>
    </div>

    <template v-else>
      <!-- Loading: skeleton header -->
      <div
        v-if="isLoading"
        class="bg-white border border-cgws-hairline rounded-[4px] p-5 mb-4
               flex flex-col sm:flex-row gap-4 items-start"
      >
        <div class="w-12 h-12 rounded-full bg-cgws-hairline animate-pulse flex-shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-5 w-48 bg-cgws-hairline rounded animate-pulse" />
          <div class="h-3 w-64 bg-cgws-hairline rounded animate-pulse" />
          <div class="h-3 w-32 bg-cgws-hairline rounded animate-pulse" />
        </div>
      </div>

      <!-- Client header card -->
      <div
        v-else-if="client"
        class="bg-white border border-cgws-hairline rounded-[4px] p-5 mb-4
               flex flex-col sm:flex-row gap-4 items-start"
      >
        <!-- Avatar -->
        <div
          class="w-12 h-12 rounded-full bg-cgws-accent/15 flex items-center
                 justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <span class="font-display text-2xl text-cgws-accent">
            {{ CLIENT_INITIAL }}
          </span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <!-- Name + stats pills -->
          <div class="flex flex-wrap items-start gap-2 mb-1">
            <h2 class="font-serif font-bold text-xl text-cgws-ink">
              {{ client.name }}
            </h2>
            <!-- Stats pills (sm+) -->
            <div class="hidden sm:flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                       bg-cgws-accent/10 font-sans text-xs font-medium text-cgws-accent"
              >
                {{ purchases.length }} achat{{ purchases.length !== 1 ? 's' : '' }}
              </span>
              <span
                v-if="consignments.length > 0"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                       bg-cgws-accent/10 font-sans text-xs font-medium text-cgws-accent"
              >
                {{ consignments.length }} consignation{{ consignments.length !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- Contact lines -->
          <div class="space-y-0.5">
            <div
              v-if="client.email"
              class="flex items-center gap-1.5"
            >
              <UIcon
                name="i-lucide-mail"
                class="w-3.5 h-3.5 text-cgws-ink-soft/50 flex-shrink-0"
                aria-hidden="true"
              />
              <span class="font-sans text-sm text-cgws-ink-soft">{{ client.email }}</span>
            </div>
            <div
              v-if="client.phone"
              class="flex items-center gap-1.5"
            >
              <UIcon
                name="i-lucide-phone"
                class="w-3.5 h-3.5 text-cgws-ink-soft/50 flex-shrink-0"
                aria-hidden="true"
              />
              <span class="font-sans text-sm text-cgws-ink-soft">{{ client.phone }}</span>
            </div>
            <div
              v-if="client.address"
              class="flex items-center gap-1.5"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="w-3.5 h-3.5 text-cgws-ink-soft/50 flex-shrink-0"
                aria-hidden="true"
              />
              <span class="font-sans text-sm text-cgws-ink-soft">{{ client.address }}</span>
            </div>
          </div>

          <p class="font-sans text-xs italic text-cgws-ink-soft/70 mt-1">
            Client depuis {{ formatDateLong(client.createdAt) }}
          </p>
        </div>
      </div>

      <!-- Main grid -->
      <div class="lg:grid lg:grid-cols-3 lg:gap-6">
        <!-- Main column: purchases + consignments -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Purchases section -->
          <div
            v-if="!isLoading"
            class="bg-white border border-cgws-hairline rounded-[4px] overflow-hidden"
          >
            <div
              class="px-4 py-3 border-b border-cgws-hairline bg-cgws-surface/30
                     font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft
                     flex items-center justify-between"
            >
              <span>Achats passés ({{ purchases.length }})</span>
              <NuxtLink
                to="/admin/ventes"
                class="normal-case tracking-normal text-xs font-normal text-cgws-accent
                       hover:underline focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent"
              >
                Voir toutes les ventes
              </NuxtLink>
            </div>

            <!-- Empty purchases -->
            <div
              v-if="purchases.length === 0"
              class="py-10 text-center"
            >
              <UIcon
                name="i-lucide-shopping-bag"
                class="w-8 h-8 mx-auto mb-2 text-cgws-ink-soft/30"
                aria-hidden="true"
              />
              <p class="font-sans text-sm text-cgws-ink-soft italic">
                Aucun achat enregistré pour ce client.
              </p>
            </div>

            <!-- Purchase table -->
            <div
              v-else
              class="overflow-x-auto"
            >
              <table
                class="w-full text-sm font-sans"
                :aria-label="`Historique des achats de ${client?.name ?? ''}`"
              >
                <thead class="bg-cgws-surface/20 border-b border-cgws-hairline">
                  <tr>
                    <th
                      scope="col"
                      class="py-2 pl-4 pr-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      class="py-2 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
                    >
                      Produit
                    </th>
                    <th
                      scope="col"
                      class="py-2 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
                    >
                      Prix
                    </th>
                    <th
                      scope="col"
                      class="hidden md:table-cell py-2 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
                    >
                      Paiement
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-cgws-hairline">
                  <tr
                    v-for="purchase in purchases"
                    :key="purchase.id"
                    class="sale-history-row hover:bg-cgws-surface/20 transition-colors"
                  >
                    <td class="py-2.5 pl-4 pr-3 text-sm text-cgws-ink-soft whitespace-nowrap">
                      {{ formatDate(purchase.saleDate) }}
                    </td>
                    <td class="py-2.5 px-3 max-w-[180px]">
                      <span class="block font-sans text-sm text-cgws-ink truncate">
                        {{ purchase.productTitle }}
                      </span>
                      <span class="font-sans text-xs text-cgws-ink-soft/70">
                        {{ purchase.productBrand }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right font-display text-base text-cgws-accent whitespace-nowrap">
                      {{ formatPrice(purchase.salePrice) }}
                    </td>
                    <td class="hidden md:table-cell py-2.5 px-3 text-sm text-cgws-ink-soft">
                      {{ paymentLabel(purchase.paymentMethod) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Consignments section -->
          <div
            v-if="!isLoading && consignments.length > 0"
            class="bg-white border border-cgws-hairline rounded-[4px] overflow-hidden"
          >
            <div
              class="px-4 py-3 border-b border-cgws-hairline bg-cgws-surface/30
                     font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
            >
              Consignations déposées ({{ consignments.length }})
            </div>

            <div class="p-3 space-y-2">
              <div
                v-for="consignment in consignments"
                :key="consignment.id"
                class="bg-white border border-cgws-hairline rounded-[4px] p-3
                       flex items-start justify-between gap-3"
              >
                <div class="min-w-0 flex-1">
                  <!-- Status badge -->
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full
                           font-sans text-[10px] font-medium uppercase tracking-wider mb-1"
                    :class="consignmentStatusClass(consignment.status as ConsignmentStatus)"
                  >
                    {{ consignmentStatusLabel(consignment.status as ConsignmentStatus) }}
                  </span>
                  <p class="font-sans text-sm font-medium text-cgws-ink truncate">
                    {{ consignment.itemDescription }}
                  </p>
                  <p class="font-sans text-xs text-cgws-ink-soft">
                    {{ consignment.brand || '—' }}
                    · Demandé {{ formatPrice(consignment.askingPrice) }}
                    <template v-if="consignment.agreedPrice">
                      — Accordé {{ formatPrice(consignment.agreedPrice) }}
                    </template>
                  </p>
                </div>
                <NuxtLink
                  :to="`/admin/consignations/${consignment.id}`"
                  class="flex-shrink-0 text-cgws-accent hover:text-cgws-ink-soft transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                  :aria-label="`Voir la fiche de consignation : ${consignment.itemDescription}`"
                >
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-4 h-4"
                    aria-hidden="true"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar: notes -->
        <div class="mt-4 lg:mt-0 lg:col-span-1">
          <div
            v-if="!isLoading"
            class="bg-white border border-cgws-hairline rounded-[4px] overflow-hidden"
            aria-label="Notes sur le client"
          >
            <div
              class="px-4 py-3 border-b border-cgws-hairline bg-cgws-surface/30
                     font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft
                     flex items-center justify-between"
            >
              <span>Notes client</span>
              <button
                v-if="!isEditingNotes"
                type="button"
                class="normal-case tracking-normal text-xs font-normal text-cgws-accent
                       hover:underline focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent"
                :aria-label="`Modifier les notes de ce client`"
                :aria-expanded="isEditingNotes"
                @click="startEditingNotes"
              >
                Modifier
              </button>
            </div>

            <div class="p-4">
              <!-- Read mode -->
              <Transition name="notes">
                <div v-if="!isEditingNotes">
                  <p
                    v-if="client?.notes"
                    class="min-h-[80px] font-sans text-sm text-cgws-ink italic whitespace-pre-wrap"
                  >
                    {{ client.notes }}
                  </p>
                  <p
                    v-else
                    class="min-h-[80px] font-sans text-sm text-cgws-ink-soft/50 italic"
                  >
                    Aucune note pour ce client.
                  </p>
                </div>
              </Transition>

              <!-- Edit mode -->
              <Transition name="notes">
                <div v-if="isEditingNotes">
                  <label
                    for="client-notes"
                    class="sr-only"
                  >Notes client</label>
                  <textarea
                    id="client-notes"
                    v-model="notesEdit"
                    rows="5"
                    class="w-full min-h-[120px] px-3 py-2 bg-cgws-ground border border-cgws-hairline
                           rounded-sm font-sans text-sm text-cgws-ink resize-y
                           focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none"
                    :disabled="isSavingNotes"
                    placeholder="Notes sur ce client…"
                  />
                  <div class="flex items-center justify-end gap-2 mt-2">
                    <button
                      type="button"
                      :disabled="isSavingNotes"
                      class="px-3 py-1.5 rounded-sm border border-cgws-hairline
                             font-sans text-sm text-cgws-ink-soft
                             hover:bg-cgws-surface/40 transition-colors
                             focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none
                             disabled:opacity-40"
                      @click="cancelEditingNotes"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      :disabled="isSavingNotes"
                      class="px-3 py-1.5 rounded-sm bg-cgws-accent text-cgws-on-accent
                             font-sans text-sm font-semibold
                             hover:bg-cgws-edge transition-colors
                             focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none
                             disabled:opacity-40 inline-flex items-center gap-1.5"
                      @click="saveNotes"
                    >
                      <span
                        v-if="isSavingNotes"
                        class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"
                        aria-hidden="true"
                      />
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Notes skeleton -->
          <div
            v-else
            class="bg-white border border-cgws-hairline rounded-[4px] p-4"
          >
            <div class="h-3 w-24 bg-cgws-hairline rounded animate-pulse mb-4" />
            <div class="space-y-2">
              <div class="h-3 w-full bg-cgws-hairline rounded animate-pulse" />
              <div class="h-3 w-4/5 bg-cgws-hairline rounded animate-pulse" />
              <div class="h-3 w-3/5 bg-cgws-hairline rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </template>

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
.notes-enter-active,
.notes-leave-active {
  transition: opacity 0.15s ease;
}
.notes-enter-from,
.notes-leave-to {
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
