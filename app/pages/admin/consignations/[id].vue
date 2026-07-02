<script setup lang="ts">
import type { Consignment, ConsignmentStatus, ProductCondition, ProductStatus, PaymentMethod } from '~/types'

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
const consignationId = computed(() => route.params.id as string)

// ─── Data state ───────────────────────────────────────────────────────────────
const consignment = ref<Consignment | null>(null)
const linkedProduct = ref<{
  id: string
  title: string
  status: ProductStatus
  slug: string
} | null>(null)
const linkedSale = ref<{
  salePrice: number
  commissionAmount: number
  saleDate: string
  paymentMethod: PaymentMethod
} | null>(null)
const loadError = ref('')

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  agreedPrice: 0,
  notes: '',
})

const errors = reactive({
  agreedPrice: '',
})

// ─── Action state ─────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const pendingAction = ref<'accept' | 'reject' | null>(null)

// ─── Reject modal ─────────────────────────────────────────────────────────────
const showRejectModal = ref(false)
const rejectButtonRef = ref<HTMLButtonElement | null>(null)

function openRejectModal(): void {
  showRejectModal.value = true
}

function closeRejectModal(): void {
  showRejectModal.value = false
  nextTick(() => rejectButtonRef.value?.focus())
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

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  pending: 'En attente',
  accepted: 'En vente',
  rejected: 'Refusée',
  sold: 'Vendue',
  returned: 'Retournée',
}

const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: 'Neuf',
  excellent: 'Excellent état',
  good: 'Bon état',
  fair: 'État correct',
}

const BASE_PILL = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 font-sans font-medium text-[11px] uppercase tracking-wider rounded-full'

function consignmentPillClass(status: ConsignmentStatus): string {
  const map: Record<ConsignmentStatus, string> = {
    pending: `${BASE_PILL} bg-cgws-copper/20 text-cgws-copper`,
    accepted: `${BASE_PILL} bg-green-100 text-green-700`,
    rejected: `${BASE_PILL} bg-cgws-rust/15 text-cgws-rust`,
    sold: `${BASE_PILL} bg-cgws-charcoal/10 text-cgws-charcoal`,
    returned: `${BASE_PILL} bg-cgws-leather/15 text-cgws-leather`,
  }
  return map[status]
}

const COMMISSION_RATE = 0.20

const computedCommission = computed(() => {
  const price = linkedSale.value?.salePrice ?? consignment.value?.agreedPrice ?? 0
  return Math.round(price * COMMISSION_RATE * 100) / 100
})

const computedDepositorAmount = computed(() => {
  const price = linkedSale.value?.salePrice ?? consignment.value?.agreedPrice ?? 0
  return Math.round((price - computedCommission.value) * 100) / 100
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadConsignment(): Promise<void> {
  try {
    const token = await getAccessToken()
    const data = await $fetch<{
      consignment: Consignment
      linkedProduct?: { id: string; title: string; status: ProductStatus; slug: string }
      linkedSale?: { salePrice: number; commissionAmount: number; saleDate: string; paymentMethod: PaymentMethod }
    }>(`/api/admin/consignments/${consignationId.value}`, {
      headers: buildAuthHeaders(token),
    })

    consignment.value = data.consignment
    linkedProduct.value = data.linkedProduct ?? null
    linkedSale.value = data.linkedSale ?? null

    // Initialise form with consignment data
    form.agreedPrice = data.consignment.agreedPrice ?? data.consignment.askingPrice
    form.notes = data.consignment.notes ?? ''

    useSeoMeta({
      title: `Consignation — ${data.consignment.depositorName} — CGWS Administration`,
      robots: 'noindex, nofollow',
    })
  }
  catch {
    loadError.value = 'Consignation introuvable ou erreur de chargement.'
  }
}

// ─── Accept action ────────────────────────────────────────────────────────────

async function handleAccept(): Promise<void> {
  errors.agreedPrice = ''

  if (!form.agreedPrice || form.agreedPrice <= 0) {
    errors.agreedPrice = 'Le prix de mise en vente doit être supérieur à 0.'
    return
  }

  pendingAction.value = 'accept'
  isSubmitting.value = true

  try {
    const token = await getAccessToken()
    const data = await $fetch<{
      consignment: Consignment
      linkedProduct: { id: string; title: string; slug: string; status: ProductStatus }
    }>(`/api/admin/consignments/${consignationId.value}/accept`, {
      method: 'POST',
      body: {
        agreedPrice: form.agreedPrice,
        notes: form.notes || undefined,
      },
      headers: buildAuthHeaders(token),
    })

    consignment.value = data.consignment
    linkedProduct.value = data.linkedProduct
    showToast('success', 'Consignation acceptée — produit créé au catalogue.')
  }
  catch (err: unknown) {
    const httpErr = err as { data?: { statusCode?: number }, statusCode?: number }
    const code = httpErr?.data?.statusCode ?? httpErr?.statusCode
    if (code === 409) {
      showToast('error', 'Cette demande a déjà été traitée.')
      await loadConsignment()
    }
    else {
      showToast('error', 'Une erreur est survenue. Veuillez réessayer.')
    }
  }
  finally {
    isSubmitting.value = false
    pendingAction.value = null
  }
}

// ─── Reject action ────────────────────────────────────────────────────────────

async function handleReject(reason: string): Promise<void> {
  pendingAction.value = 'reject'
  isSubmitting.value = true

  try {
    const token = await getAccessToken()
    const data = await $fetch<{ consignment: Consignment }>(
      `/api/admin/consignments/${consignationId.value}/reject`,
      {
        method: 'POST',
        body: { reason },
        headers: buildAuthHeaders(token),
      },
    )

    consignment.value = data.consignment
    closeRejectModal()
    showToast('success', 'Demande refusée — email envoyé au déposant.')
  }
  catch (err: unknown) {
    const httpErr = err as { data?: { statusCode?: number }, statusCode?: number }
    const code = httpErr?.data?.statusCode ?? httpErr?.statusCode
    if (code === 409) {
      closeRejectModal()
      showToast('error', 'Cette demande a déjà été traitée.')
      await loadConsignment()
    }
    else {
      showToast('error', 'Une erreur est survenue. Veuillez réessayer.')
    }
  }
  finally {
    isSubmitting.value = false
    pendingAction.value = null
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

useSeoMeta({
  title: 'Consignation — CGWS Administration',
  robots: 'noindex, nofollow',
})

onMounted(() => {
  loadConsignment()
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6 gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <NuxtLink
          to="/admin/consignations"
          class="flex-shrink-0 p-1.5 rounded-sm text-cgws-leather hover:text-cgws-copper hover:bg-cgws-copper/10 transition-colors focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none"
          aria-label="Retour à la liste des consignations"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="w-5 h-5"
            aria-hidden="true"
          />
        </NuxtLink>
        <div class="min-w-0">
          <h2 class="font-serif font-bold text-2xl text-cgws-charcoal line-clamp-1">
            Demande de {{ consignment?.depositorName ?? '…' }}
          </h2>
          <p class="font-sans text-xs text-cgws-leather mt-0.5">
            Reçue le {{ formatDate(consignment?.createdAt) }}
          </p>
        </div>
      </div>
      <span
        v-if="consignment"
        :class="[consignmentPillClass(consignment.status as ConsignmentStatus), 'flex-shrink-0 mt-1']"
      >
        <span
          v-if="consignment.status === 'pending'"
          class="w-1.5 h-1.5 rounded-full bg-cgws-copper animate-pulse"
          aria-hidden="true"
        />
        {{ CONSIGNMENT_STATUS_LABELS[consignment.status as ConsignmentStatus] }}
      </span>
    </div>

    <!-- Load error -->
    <div
      v-if="loadError"
      class="bg-cgws-rust/5 border border-cgws-rust/30 rounded-[4px] p-5 flex items-center gap-3"
      role="alert"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="w-5 h-5 text-cgws-rust flex-shrink-0"
        aria-hidden="true"
      />
      <p class="font-sans text-sm text-cgws-charcoal">
        {{ loadError }}
      </p>
    </div>

    <!-- Skeleton -->
    <div
      v-else-if="!consignment"
      class="space-y-4 animate-pulse"
    >
      <div class="h-8 w-72 bg-cgws-leather/10 rounded" />
      <div class="h-48 bg-cgws-leather/10 rounded-[4px]" />
      <div class="h-64 bg-cgws-leather/10 rounded-[4px]" />
    </div>

    <!-- Content -->
    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start"
    >
      <!-- Photos column (sticky lg+, order-first on mobile) -->
      <div class="lg:col-span-1 lg:sticky lg:top-24 order-first lg:order-last">
        <section
          aria-labelledby="photos-heading"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h3
              id="photos-heading"
              class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper"
            >
              Photos
            </h3>
            <span class="font-sans text-xs text-cgws-leather">
              {{ consignment.images.length }} photo{{ consignment.images.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Empty -->
          <div
            v-if="consignment.images.length === 0"
            class="py-8 text-center border-2 border-dashed border-cgws-leather/20 rounded-sm"
          >
            <UIcon
              name="i-lucide-image-off"
              class="w-8 h-8 mx-auto mb-2 text-cgws-leather/30"
              aria-hidden="true"
            />
            <p class="font-sans text-xs text-cgws-leather italic">
              Aucune photo fournie par le déposant.
            </p>
          </div>

          <!-- Image grid -->
          <div
            v-else
            class="grid grid-cols-2 gap-2"
            role="list"
            aria-label="Photos de l'article soumises par le déposant"
          >
            <div
              v-for="(url, index) in consignment.images"
              :key="url"
              role="listitem"
              class="relative aspect-square rounded-sm overflow-hidden bg-cgws-parchment border border-cgws-leather/20"
            >
              <NuxtImg
                :src="url"
                :alt="`Photo ${index + 1} de l'article — ${consignment.itemDescription}`"
                class="w-full h-full object-cover"
                width="200"
                height="200"
                format="webp"
                loading="lazy"
              />
              <div
                v-if="index === 0"
                class="absolute bottom-0 left-0 right-0 bg-cgws-copper/85 text-cgws-charcoal font-sans font-semibold text-[9px] uppercase tracking-wider py-0.5 text-center"
              >
                Principale
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Info + Actions column (2/3) -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Depositor card -->
        <section
          aria-labelledby="depositor-heading"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-5"
        >
          <h3
            id="depositor-heading"
            class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper mb-4"
          >
            Déposant
          </h3>
          <dl class="space-y-3">
            <div class="flex items-center gap-3">
              <dt class="sr-only">
                Nom
              </dt>
              <UIcon
                name="i-lucide-user"
                class="w-4 h-4 text-cgws-leather/60 flex-shrink-0"
                aria-hidden="true"
              />
              <dd class="font-sans text-sm font-medium text-cgws-charcoal">
                {{ consignment.depositorName }}
              </dd>
            </div>
            <div class="flex items-center gap-3">
              <dt class="sr-only">
                Email
              </dt>
              <UIcon
                name="i-lucide-mail"
                class="w-4 h-4 text-cgws-leather/60 flex-shrink-0"
                aria-hidden="true"
              />
              <dd>
                <a
                  :href="`mailto:${consignment.depositorEmail}`"
                  class="font-sans text-sm text-cgws-copper hover:underline focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none rounded-sm"
                >
                  {{ consignment.depositorEmail }}
                </a>
              </dd>
            </div>
            <div
              v-if="consignment.depositorPhone"
              class="flex items-center gap-3"
            >
              <dt class="sr-only">
                Téléphone
              </dt>
              <UIcon
                name="i-lucide-phone"
                class="w-4 h-4 text-cgws-leather/60 flex-shrink-0"
                aria-hidden="true"
              />
              <dd>
                <a
                  :href="`tel:${consignment.depositorPhone}`"
                  class="font-sans text-sm text-cgws-charcoal hover:text-cgws-copper focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none rounded-sm"
                >
                  {{ consignment.depositorPhone }}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <!-- Article + form card -->
        <section
          aria-labelledby="item-heading"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-5 space-y-5"
        >
          <h3
            id="item-heading"
            class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper"
          >
            Article proposé
          </h3>

          <!-- Description + metadata -->
          <div class="space-y-3">
            <p class="font-sans text-sm text-cgws-charcoal leading-relaxed">
              {{ consignment.itemDescription }}
            </p>
            <dl class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div v-if="consignment.brand">
                <dt class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-0.5">
                  Marque
                </dt>
                <dd class="font-sans text-sm font-medium text-cgws-charcoal">
                  {{ consignment.brand }}
                </dd>
              </div>
              <div>
                <dt class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-0.5">
                  État
                </dt>
                <dd class="font-sans text-sm font-medium text-cgws-charcoal">
                  {{ CONDITION_LABELS[consignment.condition as ProductCondition] ?? consignment.condition }}
                </dd>
              </div>
              <div>
                <dt class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-0.5">
                  Prix demandé
                </dt>
                <dd class="font-display text-base text-cgws-charcoal">
                  {{ formatPrice(consignment.askingPrice) }}
                </dd>
              </div>
            </dl>
          </div>

          <hr class="border-cgws-leather/15">

          <!-- Agreed price field -->
          <div>
            <label
              for="field-agreed-price"
              class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-leather mb-1.5"
            >
              Prix de mise en vente (€)
              <span
                v-if="consignment.status === 'pending'"
                class="text-cgws-rust ml-0.5"
              >*</span>
            </label>
            <div class="relative">
              <input
                id="field-agreed-price"
                v-model.number="form.agreedPrice"
                type="number"
                min="0"
                step="0.01"
                :disabled="consignment.status !== 'pending' || isSubmitting"
                class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40 rounded-sm font-display text-xl text-cgws-copper focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 focus:outline-none disabled:opacity-60 disabled:bg-cgws-leather/5 disabled:cursor-default"
                :class="errors.agreedPrice ? 'border-cgws-rust' : ''"
                aria-required="true"
                :aria-describedby="errors.agreedPrice ? 'agreed-price-error' : 'agreed-price-hint'"
              >
            </div>
            <p
              v-if="errors.agreedPrice"
              id="agreed-price-error"
              role="alert"
              class="mt-1 font-sans text-xs text-cgws-rust"
            >
              {{ errors.agreedPrice }}
            </p>
            <p
              v-else
              id="agreed-price-hint"
              class="mt-1 font-sans text-xs text-cgws-leather"
            >
              <template v-if="consignment.status === 'pending'">
                Le déposant demande {{ formatPrice(consignment.askingPrice) }}.
                Ajustez si vous avez convenu d'un prix différent.
              </template>
              <template v-else>
                Prix convenu lors de l'acceptation.
              </template>
            </p>
          </div>

          <!-- Notes (editable if pending, read-only otherwise) -->
          <div v-if="consignment.status === 'pending'">
            <label
              for="field-notes"
              class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-leather mb-1.5"
            >
              Notes internes
              <span class="font-normal normal-case tracking-normal text-cgws-leather/70">(optionnel)</span>
            </label>
            <textarea
              id="field-notes"
              v-model="form.notes"
              :rows="3"
              placeholder="Observations sur l'état, historique de contact…"
              :disabled="isSubmitting"
              class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40 rounded-sm font-sans text-sm text-cgws-charcoal placeholder:text-cgws-rope resize-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 focus:outline-none disabled:opacity-50"
            />
          </div>
          <div
            v-else-if="consignment.notes"
            class="bg-cgws-parchment/50 border border-cgws-leather/20 rounded-sm p-3"
          >
            <p class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-1">
              Notes
            </p>
            <p class="font-sans text-sm text-cgws-charcoal">
              {{ consignment.notes }}
            </p>
          </div>
        </section>

        <!-- Actions panel — conditional on status -->

        <!-- pending: Accept / Reject -->
        <section
          v-if="consignment.status === 'pending'"
          aria-labelledby="actions-heading"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-5"
        >
          <h3
            id="actions-heading"
            class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper mb-4"
          >
            Décision
          </h3>
          <p class="font-sans text-sm text-cgws-leather mb-5">
            En acceptant, un produit sera automatiquement créé au catalogue avec le prix de mise en vente
            indiqué ci-dessus. Un email de confirmation sera envoyé à
            <strong class="text-cgws-charcoal">{{ consignment.depositorEmail }}</strong>.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <!-- Accept button -->
            <button
              type="button"
              :disabled="isSubmitting"
              class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-cgws-copper text-white font-sans text-sm font-semibold hover:bg-cgws-leather transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-describedby="accept-hint"
              @click="handleAccept"
            >
              <span
                v-if="isSubmitting && pendingAction === 'accept'"
                class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                aria-hidden="true"
              />
              <UIcon
                v-else
                name="i-lucide-check-circle"
                class="w-4 h-4"
                aria-hidden="true"
              />
              {{ isSubmitting && pendingAction === 'accept' ? 'Validation…' : 'Accepter la consignation' }}
            </button>

            <!-- Reject button -->
            <button
              ref="rejectButtonRef"
              type="button"
              :disabled="isSubmitting"
              class="sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-cgws-rust/50 text-cgws-rust bg-transparent font-sans text-sm font-semibold hover:bg-cgws-rust/10 hover:border-cgws-rust transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none"
              @click="openRejectModal"
            >
              <UIcon
                name="i-lucide-x-circle"
                class="w-4 h-4"
                aria-hidden="true"
              />
              Refuser
            </button>
          </div>
          <p
            id="accept-hint"
            class="mt-3 font-sans text-xs text-cgws-leather/70"
          >
            Assurez-vous que le prix de mise en vente est correct avant d'accepter.
          </p>
        </section>

        <!-- accepted: Info + product link -->
        <section
          v-else-if="consignment.status === 'accepted'"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-5"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <UIcon
                name="i-lucide-shopping-bag"
                class="w-5 h-5 text-green-700"
                aria-hidden="true"
              />
            </div>
            <div>
              <p class="font-sans text-sm font-semibold text-cgws-charcoal mb-1">
                Consignation acceptée — article en vente
              </p>
              <p class="font-sans text-sm text-cgws-leather">
                Un produit a été créé automatiquement au catalogue
                avec un prix de mise en vente de
                <strong class="font-display text-base text-cgws-copper">
                  {{ formatPrice(consignment.agreedPrice ?? 0) }}
                </strong>.
              </p>
              <p class="font-sans text-xs text-cgws-leather/70 mt-1">
                Pensez à vérifier la catégorie du produit créé (défaut : Accessoires).
              </p>
              <NuxtLink
                v-if="linkedProduct"
                :to="`/admin/produits/${linkedProduct.id}`"
                class="mt-3 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-cgws-copper hover:underline focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none"
              >
                Voir le produit au catalogue
                <UIcon
                  name="i-lucide-external-link"
                  class="w-3.5 h-3.5"
                  aria-hidden="true"
                />
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- rejected: Info + reason -->
        <section
          v-else-if="consignment.status === 'rejected'"
          class="bg-cgws-rust/5 border border-cgws-rust/30 rounded-[4px] p-5"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-rust/15 flex items-center justify-center">
              <UIcon
                name="i-lucide-ban"
                class="w-5 h-5 text-cgws-rust"
                aria-hidden="true"
              />
            </div>
            <div>
              <p class="font-sans text-sm font-semibold text-cgws-charcoal mb-1">
                Consignation refusée
              </p>
              <p class="font-sans text-sm text-cgws-leather">
                Un email de refus a été envoyé à
                <strong class="text-cgws-charcoal">{{ consignment.depositorEmail }}</strong>
                avec le motif suivant :
              </p>
              <blockquote
                v-if="consignment.notes"
                class="mt-2 pl-3 border-l-2 border-cgws-rust/40 font-sans text-sm text-cgws-charcoal italic"
              >
                {{ consignment.notes }}
              </blockquote>
            </div>
          </div>
        </section>

        <!-- sold: Commission details -->
        <section
          v-else-if="consignment.status === 'sold'"
          class="bg-white border border-cgws-leather/30 rounded-[4px] p-5 space-y-4"
        >
          <h3 class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper">
            Détail de la vente
          </h3>

          <dl class="space-y-2">
            <div class="flex items-center justify-between py-2 border-b border-cgws-leather/10">
              <dt class="font-sans text-sm text-cgws-leather">
                Prix de vente
              </dt>
              <dd class="font-display text-lg text-cgws-charcoal">
                {{ formatPrice(linkedSale?.salePrice ?? consignment.agreedPrice ?? 0) }}
              </dd>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-cgws-leather/10">
              <dt class="font-sans text-sm text-cgws-leather">
                Commission CGWS
                <span class="text-xs text-cgws-leather/60">(20 %)</span>
              </dt>
              <dd class="font-display text-lg text-cgws-rust">
                − {{ formatPrice(computedCommission) }}
              </dd>
            </div>
            <div class="flex items-center justify-between pt-3">
              <dt class="font-sans text-sm font-semibold text-cgws-charcoal">
                Montant à reverser au déposant
              </dt>
              <dd class="font-display text-2xl text-cgws-copper">
                {{ formatPrice(computedDepositorAmount) }}
              </dd>
            </div>
          </dl>

          <p class="font-sans text-xs text-cgws-leather/70">
            Taux de commission CGWS fixe : 20 % du prix de vente effectif.
          </p>
        </section>

        <!-- returned -->
        <section
          v-else-if="consignment.status === 'returned'"
          class="bg-cgws-leather/5 border border-cgws-leather/20 rounded-[4px] p-5"
        >
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-undo-2"
              class="w-5 h-5 text-cgws-leather"
              aria-hidden="true"
            />
            <p class="font-sans text-sm text-cgws-leather">
              Cet article a été retourné au déposant.
            </p>
          </div>
        </section>
      </div>
    </div>

    <!-- Reject modal -->
    <AdminRejectModal
      v-if="consignment"
      :consignment="consignment"
      :open="showRejectModal"
      :loading="isSubmitting && pendingAction === 'reject'"
      @close="closeRejectModal"
      @confirm="handleReject"
    />

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
