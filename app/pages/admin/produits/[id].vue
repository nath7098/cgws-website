<script setup lang="ts">
import type { Product, ProductFormPayload, ProductStatus, ProductStatusHistory } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Modifier le produit',
})

useSeoMeta({
  title: 'Modifier le produit — CGWS Administration',
  robots: 'noindex, nofollow',
})

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

const route = useRoute()
const productId = computed(() => route.params.id as string)

// ─── Load product ─────────────────────────────────────────────────────────────
const product = ref<Product | null>(null)
const loadError = ref('')

onMounted(async () => {
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ product: Product }>(`/api/admin/products/${productId.value}`, {
      headers: buildAuthHeaders(token),
    })
    product.value = data.product
    useSeoMeta({ title: `Modifier : ${data.product.title} — CGWS Administration` })
  }
  catch {
    loadError.value = 'Produit introuvable ou erreur de chargement.'
  }
  // Load status history independently — non-blocking
  fetchStatusHistory()
})

// ─── Status history ───────────────────────────────────────────────────────────

const statusHistory = ref<ProductStatusHistory[]>([])
const isLoadingHistory = ref(true)

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Disponible',
  reserved: 'Réservé',
  sold: 'Vendu',
  inactive: 'Inactif',
}

function statusDotClass(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-cgws-success border-cgws-success/40',
    reserved: 'bg-cgws-accent border-cgws-accent/40',
    sold: 'bg-cgws-ink border-cgws-ink/30',
    inactive: 'bg-cgws-hairline border-cgws-hairline',
  }
  return map[status] ?? 'bg-cgws-hairline border-cgws-hairline'
}

function formatHistoryDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

async function fetchStatusHistory(): Promise<void> {
  isLoadingHistory.value = true
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ history: ProductStatusHistory[] }>(
      `/api/admin/products/${productId.value}/status-history`,
      { headers: buildAuthHeaders(token) },
    )
    statusHistory.value = data.history
  }
  catch {
    statusHistory.value = []
  }
  finally {
    isLoadingHistory.value = false
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const formRef = ref<{ setServerError: (msg: string) => void } | null>(null)


async function handleUpdate(payload: ProductFormPayload) {
  isSubmitting.value = true
  try {
    const token = await getAccessToken()
    const formData = new FormData()

    // Text fields
    formData.append('title', payload.fields.title)
    formData.append('category', payload.fields.category)
    formData.append('brand', payload.fields.brand)
    formData.append('description', payload.fields.description)
    formData.append('price', String(payload.fields.price))
    formData.append('condition', payload.fields.condition)
    formData.append('size', payload.fields.size)
    formData.append('stock', String(payload.fields.stock))
    formData.append('isConsignment', String(payload.fields.isConsignment))
    if (payload.fields.consignmentId) {
      formData.append('consignmentId', payload.fields.consignmentId)
    }
    if (payload.fields.status) {
      formData.append('status', payload.fields.status)
    }

    // Image management
    for (const url of payload.keptImages) {
      formData.append('keptImages', url)
    }
    for (const url of payload.removedImages) {
      formData.append('removedImages', url)
    }
    for (const file of payload.newImages) {
      formData.append('newImages', file, file.name)
    }

    await $fetch(`/api/admin/products/${productId.value}`, {
      method: 'PUT',
      body: formData,
      headers: buildAuthHeaders(token),
    })

    await navigateTo('/admin/produits?success=updated')
  }
  catch (err: unknown) {
    const apiErr = err as { data?: { errors?: Record<string, string>, statusMessage?: string }, statusMessage?: string }
    const msg = apiErr?.data?.statusMessage
      ?? apiErr?.statusMessage
      ?? 'Erreur lors de la sauvegarde. Veuillez réessayer.'
    formRef.value?.setServerError(msg)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/admin/produits"
        class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
        aria-label="Retour à la liste des produits"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-5 h-5"
          aria-hidden="true"
        />
      </NuxtLink>
      <h2 class="font-serif font-bold text-2xl text-cgws-ink line-clamp-1">
        Modifier : {{ product?.title ?? '…' }}
      </h2>
    </div>

    <!-- Load error -->
    <div
      v-if="loadError"
      role="alert"
      class="bg-cgws-danger/10 border border-cgws-danger rounded-sm p-4 flex items-center gap-3"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="w-5 h-5 text-cgws-danger flex-shrink-0"
        aria-hidden="true"
      />
      <p class="font-sans text-sm text-cgws-danger">
        {{ loadError }}
      </p>
    </div>

    <!-- Form (rendered once product is loaded) -->
    <ProductForm
      v-if="product"
      ref="formRef"
      mode="edit"
      :initial-data="product"
      :is-submitting="isSubmitting"
      @submit="handleUpdate"
      @cancel="navigateTo('/admin/produits')"
    />

    <!-- Skeleton while loading -->
    <div
      v-else-if="!loadError"
      class="space-y-4 animate-pulse"
    >
      <div class="h-48 bg-cgws-hairline rounded-[4px]" />
      <div class="h-32 bg-cgws-hairline rounded-[4px]" />
      <div class="h-24 bg-cgws-hairline rounded-[4px]" />
    </div>

    <!-- Status history section -->
    <section
      v-if="product || !loadError"
      aria-labelledby="status-history-title"
      class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5"
    >
      <h3
        id="status-history-title"
        class="font-sans font-semibold text-xs uppercase tracking-widest
               text-cgws-accent mb-4"
      >
        Historique des statuts
      </h3>

      <!-- Skeleton -->
      <div
        v-if="isLoadingHistory"
        aria-busy="true"
        aria-label="Chargement de l'historique"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="flex items-center gap-3 mb-4 last:mb-0 animate-pulse"
        >
          <div class="w-3 h-3 rounded-full bg-cgws-hairline flex-shrink-0" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3.5 w-28 bg-cgws-hairline rounded" />
            <div class="h-3 w-44 bg-cgws-hairline rounded" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="statusHistory.length === 0"
        class="flex items-center gap-3 py-2"
      >
        <UIcon
          name="i-lucide-clock"
          class="w-4 h-4 text-cgws-ink-soft/40 flex-shrink-0"
          aria-hidden="true"
        />
        <p class="font-sans text-sm text-cgws-ink-soft italic">
          Aucun changement de statut enregistré.
        </p>
      </div>

      <!-- Timeline -->
      <ol
        v-else
        class="relative"
        aria-label="Historique des changements de statut"
      >
        <li
          v-for="(entry, index) in statusHistory"
          :key="entry.id"
          class="flex gap-3 pb-4 last:pb-0 relative"
        >
          <!-- Vertical connector line -->
          <div
            v-if="index < statusHistory.length - 1"
            class="absolute left-[5px] top-4 bottom-0 w-px bg-cgws-hairline"
            aria-hidden="true"
          />

          <!-- Colored dot -->
          <div
            class="flex-shrink-0 w-3 h-3 rounded-full mt-1 border-2"
            :class="statusDotClass(entry.newStatus)"
            aria-hidden="true"
          />

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="font-sans text-sm font-semibold text-cgws-ink">
                {{ STATUS_LABELS[entry.newStatus] }}
              </span>
              <span
                v-if="entry.oldStatus"
                class="font-sans text-xs text-cgws-ink-soft"
              >
                ← {{ STATUS_LABELS[entry.oldStatus] }}
              </span>
              <span
                v-else
                class="font-sans text-xs text-cgws-ink-soft italic"
              >
                (statut initial)
              </span>
            </div>
            <p class="font-sans text-xs text-cgws-ink-soft mt-0.5">
              {{ formatHistoryDate(entry.changedAt) }} · {{ entry.changedBy }}
            </p>
          </div>
        </li>
      </ol>
    </section>

  </div>
</template>
