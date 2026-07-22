<script setup lang="ts">
import type { PaymentMethod, Product, QuickSalePayload } from '~/types'

interface ClientSelection {
  clientId: string | null
  clientName: string
}

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submitted: [payload: QuickSalePayload]
}>()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── Products list ────────────────────────────────────────────────────────────

const availableProducts = ref<Product[]>([])
const isLoadingProducts = ref(false)

async function loadProducts(): Promise<void> {
  isLoadingProducts.value = true
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ items: Product[] }>('/api/admin/products', {
      query: { status: 'active', limit: 200 },
      headers: buildAuthHeaders(token),
    })
    availableProducts.value = [...data.items].sort((a, b) =>
      a.title.localeCompare(b.title, 'fr'),
    )
  }
  catch {
    availableProducts.value = []
  }
  finally {
    isLoadingProducts.value = false
  }
}

// ─── Form state ───────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]!

const selectedProductId = ref('')
const clientSelection = ref<ClientSelection | null>(null)
const form = reactive({
  saleDate: today,
  salePrice: 0,
  paymentMethod: 'cash' as PaymentMethod,
  notes: '',
})

const errors = reactive({
  productId: '',
  salePrice: '',
  saleDate: '',
})

const isSubmitting = ref(false)

// ─── Derived: selected product ────────────────────────────────────────────────

const selectedProduct = computed<Product | null>(() =>
  availableProducts.value.find(p => p.id === selectedProductId.value) ?? null,
)

watch(selectedProduct, (product) => {
  if (product) {
    form.salePrice = product.price
  }
})

// ─── Commission calculation ───────────────────────────────────────────────────

const agreedPrice = ref<number | null>(null)
const isLoadingAgreedPrice = ref(false)

async function fetchAgreedPrice(consignmentId: string): Promise<void> {
  isLoadingAgreedPrice.value = true
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ consignment: { agreedPrice: number | null } }>(
      `/api/admin/consignments/${consignmentId}`,
      { headers: buildAuthHeaders(token) },
    )
    agreedPrice.value = data.consignment.agreedPrice ?? null
  }
  catch {
    agreedPrice.value = null
  }
  finally {
    isLoadingAgreedPrice.value = false
  }
}

watch(selectedProductId, async (newId) => {
  agreedPrice.value = null
  if (!newId) return
  const product = availableProducts.value.find(p => p.id === newId)
  if (product?.isConsignment && product.consignmentId) {
    await fetchAgreedPrice(product.consignmentId)
  }
})

const commissionAmount = computed<number | null>(() => {
  if (!selectedProduct.value?.isConsignment) return null
  if (agreedPrice.value === null) return null
  return form.salePrice - agreedPrice.value
})

const netToDepositor = computed<number | null>(() => agreedPrice.value)

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetForm(): void {
  selectedProductId.value = ''
  clientSelection.value = null
  form.saleDate = new Date().toISOString().split('T')[0]!
  form.salePrice = 0
  form.paymentMethod = 'cash'
  form.notes = ''
  errors.productId = ''
  errors.salePrice = ''
  errors.saleDate = ''
  isSubmitting.value = false
  agreedPrice.value = null
  isLoadingAgreedPrice.value = false
}

// ─── Watch open ───────────────────────────────────────────────────────────────

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      resetForm()
      loadProducts()
      nextTick(() => {
        const firstInput = modalBoxRef.value?.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        )
        firstInput?.focus()
      })
    }
    else {
      isSubmitting.value = false
    }
  },
)

// ─── Validation & submit ──────────────────────────────────────────────────────

function validate(): boolean {
  errors.productId = ''
  errors.salePrice = ''
  errors.saleDate = ''

  let valid = true

  if (!selectedProductId.value) {
    errors.productId = 'Sélectionnez un article à vendre.'
    valid = false
  }
  if (!form.salePrice || form.salePrice <= 0) {
    errors.salePrice = 'Le prix de vente doit être supérieur à 0.'
    valid = false
  }
  if (!form.saleDate) {
    errors.saleDate = 'Saisissez une date valide.'
    valid = false
  }

  return valid
}

function submitSale(): void {
  if (!validate()) return

  isSubmitting.value = true

  const payload: QuickSalePayload = {
    productId: selectedProductId.value,
    salePrice: form.salePrice,
    saleDate: form.saleDate,
    paymentMethod: form.paymentMethod,
    clientId: clientSelection.value?.clientId ?? undefined,
    clientName: clientSelection.value?.clientName.trim() || undefined,
    notes: form.notes.trim() || undefined,
  }

  emit('submitted', payload)
}

// ─── Focus trap ───────────────────────────────────────────────────────────────

const modalBoxRef = ref<HTMLElement | null>(null)

function handleModalKeydown(event: KeyboardEvent): void {
  if (!modalBoxRef.value) return
  const focusables = Array.from(
    modalBoxRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
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
    }
    else {
      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  'selles': 'Selles',
  'brides-licols': 'Brides & licols',
  'bottes-chaussures': 'Bottes & chaussures',
  'vetements': 'Vêtements',
  'accessoires': 'Accessoires',
  'protections': 'Protections',
}

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatCategory(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-form-title"
        @keydown.esc="$emit('close')"
        @keydown="handleModalKeydown"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-cgws-ink/60 backdrop-blur-sm"
          aria-hidden="true"
          @click="$emit('close')"
        />

        <!-- Modal box -->
        <div
          ref="modalBoxRef"
          class="modal-box relative bg-cgws-surface border-2 border-cgws-ink rounded-sm shadow-xl
                 w-full max-w-lg flex flex-col max-h-[90dvh] sm:max-h-[80vh] overflow-hidden"
          tabindex="-1"
        >
          <!-- Header -->
          <div class="flex items-start gap-3 p-5 border-b border-cgws-hairline flex-shrink-0">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-accent/10
                     flex items-center justify-center"
              aria-hidden="true"
            >
              <UIcon
                name="i-lucide-receipt"
                class="w-5 h-5 text-cgws-accent"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                id="sale-form-title"
                class="font-serif font-bold text-lg text-cgws-ink"
              >
                Enregistrer une vente
              </h3>
              <p class="font-sans text-xs text-cgws-ink-soft mt-0.5">
                Sélectionnez l'article vendu et renseignez les détails.
              </p>
            </div>
            <!-- Close button -->
            <button
              type="button"
              class="flex-shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-sm
                     text-cgws-ink-soft hover:text-cgws-ink hover:bg-cgws-surface/40
                     transition-colors focus-visible:ring-2 focus-visible:ring-cgws-accent
                     focus-visible:outline-none"
              aria-label="Fermer sans enregistrer"
              @click="$emit('close')"
            >
              <UIcon
                name="i-lucide-x"
                class="w-4 h-4"
                aria-hidden="true"
              />
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <!-- Sélecteur produit -->
            <div>
              <label
                for="sale-product"
                class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Produit <span class="text-cgws-danger" aria-hidden="true">*</span>
              </label>
              <div class="relative">
                <select
                  id="sale-product"
                  v-model="selectedProductId"
                  :disabled="isLoadingProducts || isSubmitting"
                  required
                  class="w-full px-3 py-2 pr-9 bg-cgws-ground border border-cgws-hairline rounded-sm
                         font-sans text-sm text-cgws-ink appearance-none
                         focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none
                         disabled:opacity-50"
                  :class="errors.productId ? 'border-cgws-danger' : ''"
                  aria-required="true"
                  :aria-describedby="errors.productId ? 'sale-product-error' : undefined"
                >
                  <option value="">
                    {{ isLoadingProducts ? 'Chargement des produits…' : 'Sélectionner un article…' }}
                  </option>
                  <option
                    v-for="product in availableProducts"
                    :key="product.id"
                    :value="product.id"
                  >
                    {{ product.title }} — {{ product.brand }} ({{ formatCategory(product.category) }}) · {{ formatPrice(product.price) }}
                  </option>
                </select>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-ink-soft/60"
                  aria-hidden="true"
                />
              </div>
              <p
                v-if="errors.productId"
                id="sale-product-error"
                role="alert"
                class="mt-1 font-sans text-xs text-cgws-danger"
              >
                {{ errors.productId }}
              </p>
            </div>

            <!-- Récap produit sélectionné -->
            <Transition name="recap">
              <div
                v-if="selectedProduct"
                class="p-3 bg-cgws-surface/40 border border-cgws-hairline rounded-sm"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="font-sans text-sm font-medium text-cgws-ink">
                      {{ selectedProduct.title }}
                    </p>
                    <p class="font-sans text-xs text-cgws-ink-soft mt-0.5">
                      {{ selectedProduct.brand }} · {{ formatCategory(selectedProduct.category) }}
                    </p>
                    <p class="font-display text-sm text-cgws-ink mt-1">
                      Prix catalogue : {{ formatPrice(selectedProduct.price) }}
                    </p>
                  </div>
                  <span
                    class="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full
                           font-sans font-medium text-[11px] uppercase tracking-wider"
                    :class="selectedProduct.isConsignment
                      ? 'bg-cgws-accent/20 text-cgws-accent'
                      : 'bg-cgws-success/15 text-cgws-success'"
                  >
                    {{ selectedProduct.isConsignment ? 'Consignation' : 'Propre' }}
                  </span>
                </div>
              </div>
            </Transition>

            <!-- Date + Prix — grille 2 colonnes sm+ -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Date de vente -->
              <div>
                <label
                  for="sale-date"
                  class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
                >
                  Date de vente <span class="text-cgws-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="sale-date"
                  v-model="form.saleDate"
                  type="date"
                  required
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm
                         font-sans text-sm text-cgws-ink
                         focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none
                         disabled:opacity-50"
                  :class="errors.saleDate ? 'border-cgws-danger' : ''"
                  aria-required="true"
                  :aria-describedby="errors.saleDate ? 'sale-date-error' : undefined"
                >
                <p
                  v-if="errors.saleDate"
                  id="sale-date-error"
                  role="alert"
                  class="mt-1 font-sans text-xs text-cgws-danger"
                >
                  {{ errors.saleDate }}
                </p>
              </div>

              <!-- Prix de vente -->
              <div>
                <label
                  for="sale-price"
                  class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
                >
                  Prix de vente (€) <span class="text-cgws-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="sale-price"
                  v-model.number="form.salePrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm
                         font-display text-base text-cgws-accent
                         focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none
                         disabled:opacity-50"
                  :class="errors.salePrice ? 'border-cgws-danger' : ''"
                  aria-required="true"
                  :aria-describedby="errors.salePrice ? 'sale-price-error' : undefined"
                >
                <p
                  v-if="errors.salePrice"
                  id="sale-price-error"
                  role="alert"
                  class="mt-1 font-sans text-xs text-cgws-danger"
                >
                  {{ errors.salePrice }}
                </p>
              </div>
            </div>

            <!-- Panel commission consignation -->
            <Transition name="commission-panel">
              <div
                v-if="selectedProduct?.isConsignment"
                class="p-3 bg-cgws-surface/60 border border-cgws-accent/20 rounded-sm space-y-1.5"
              >
                <p class="font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-2">
                  Calcul de commission
                </p>

                <!-- Loading skeleton -->
                <template v-if="isLoadingAgreedPrice">
                  <div
                    v-for="n in 3"
                    :key="n"
                    class="flex items-center justify-between"
                  >
                    <div class="animate-pulse h-4 w-36 rounded bg-cgws-hairline" />
                    <div class="animate-pulse h-4 w-20 rounded bg-cgws-hairline" />
                  </div>
                </template>

                <!-- Values resolved -->
                <template v-else>
                  <div class="flex items-center justify-between font-sans text-sm">
                    <span class="text-cgws-ink-soft">Prix accordé au déposant</span>
                    <span
                      v-if="agreedPrice !== null"
                      class="font-medium text-cgws-ink"
                    >
                      {{ formatPrice(agreedPrice) }}
                    </span>
                    <span
                      v-else
                      class="text-cgws-ink-soft/60"
                    >—</span>
                  </div>
                  <div class="flex items-center justify-between font-sans text-sm">
                    <span class="text-cgws-ink-soft">Commission boutique</span>
                    <span
                      v-if="commissionAmount !== null"
                      class="font-semibold text-cgws-accent"
                    >
                      {{ formatPrice(commissionAmount) }}
                    </span>
                    <span
                      v-else
                      class="text-cgws-ink-soft/60"
                    >—</span>
                  </div>
                  <div class="border-t border-cgws-hairline mt-1 pt-1 flex items-center justify-between font-sans text-sm">
                    <span class="font-semibold text-cgws-ink">Net à reverser</span>
                    <span
                      v-if="netToDepositor !== null"
                      class="font-semibold text-cgws-ink"
                    >
                      {{ formatPrice(netToDepositor) }}
                    </span>
                    <span
                      v-else
                      class="text-cgws-ink-soft/60"
                    >—</span>
                  </div>
                  <p
                    v-if="agreedPrice === null"
                    class="mt-1 font-sans text-xs italic text-cgws-ink-soft"
                  >
                    Prix accordé non défini — vérifiez la fiche de consignation.
                  </p>
                </template>
              </div>
            </Transition>

            <!-- Moyen de paiement -->
            <div>
              <label
                for="sale-payment"
                class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Moyen de paiement <span class="text-cgws-danger" aria-hidden="true">*</span>
              </label>
              <div class="relative">
                <select
                  id="sale-payment"
                  v-model="form.paymentMethod"
                  required
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 pr-9 bg-cgws-ground border border-cgws-hairline rounded-sm
                         font-sans text-sm text-cgws-ink appearance-none
                         focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none
                         disabled:opacity-50"
                >
                  <option value="cash">
                    Espèces
                  </option>
                  <option value="card">
                    Carte bancaire
                  </option>
                  <option value="transfer">
                    Virement
                  </option>
                  <option value="check">
                    Chèque
                  </option>
                </select>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-ink-soft/60"
                  aria-hidden="true"
                />
              </div>
            </div>

            <!-- Client (optionnel) -->
            <div>
              <label
                for="sale-client"
                class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Client
                <span class="font-normal normal-case tracking-normal text-cgws-ink-soft/70">(optionnel)</span>
              </label>
              <ClientAutocomplete
                v-model="clientSelection"
                input-id="sale-client"
                :disabled="isSubmitting"
                placeholder="Rechercher ou créer un client…"
              />
            </div>

            <!-- Notes internes (optionnel) -->
            <div>
              <label
                for="sale-notes"
                class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Notes internes
                <span class="font-normal normal-case tracking-normal text-cgws-ink-soft/70">(optionnel)</span>
              </label>
              <textarea
                id="sale-notes"
                v-model="form.notes"
                :rows="2"
                placeholder="Observations, conditions particulières…"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm
                       font-sans text-sm text-cgws-ink placeholder:text-cgws-ink-soft resize-none
                       focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none
                       disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col-reverse sm:flex-row items-center justify-between
                   gap-3 p-5 border-t border-cgws-hairline flex-shrink-0"
          >
            <button
              type="button"
              :disabled="isSubmitting"
              class="w-full sm:w-auto px-4 py-2 rounded-sm border border-cgws-hairline
                     font-sans text-sm font-medium text-cgws-ink-soft
                     hover:bg-cgws-surface/40 hover:text-cgws-ink transition-colors
                     focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none
                     disabled:opacity-40 disabled:cursor-not-allowed"
              @click="$emit('close')"
            >
              Annuler
            </button>

            <CgwsButton
              variant="primary"
              size="sm"
              type="button"
              :loading="isSubmitting"
              :disabled="isLoadingProducts"
              class="w-full sm:w-auto"
              @click="submitSale"
            >
              {{ isSubmitting ? 'Enregistrement…' : 'Enregistrer la vente' }}
              <UIcon
                v-if="!isSubmitting"
                name="i-lucide-arrow-right"
                class="w-4 h-4 ml-2"
                aria-hidden="true"
              />
            </CgwsButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-box {
  transform: scale(0.96) translateY(8px);
}

.recap-enter-active,
.recap-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.recap-enter-from,
.recap-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.commission-panel-enter-active,
.commission-panel-leave-active {
  transition: opacity 0.25s ease, max-height 0.25s ease;
  max-height: 160px;
  overflow: hidden;
}
.commission-panel-enter-from,
.commission-panel-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
