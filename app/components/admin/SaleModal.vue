<script setup lang="ts">
import type { PaymentMethod, Product, QuickSalePayload } from '~/types'

interface Props {
  product: Product
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submitted: [sale: QuickSalePayload]
}>()

// ─── Form state ───────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]!

const form = reactive({
  saleDate: today,
  salePrice: props.product.price,
  paymentMethod: 'cash' as PaymentMethod,
  clientName: '',
  notes: '',
})

const errors = reactive({ salePrice: '' })
const isSubmitting = ref(false)

// ─── Reset form when modal opens ──────────────────────────────────────────────

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      form.saleDate = new Date().toISOString().split('T')[0]!
      form.salePrice = props.product.price
      form.paymentMethod = 'cash'
      form.clientName = ''
      form.notes = ''
      errors.salePrice = ''
      isSubmitting.value = false
      nextTick(() => {
        const firstInput = modalBoxRef.value?.querySelector<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
        )
        firstInput?.focus()
      })
    }
    else {
      isSubmitting.value = false
    }
  },
)

// ─── Submit ───────────────────────────────────────────────────────────────────

function submitSale(): void {
  errors.salePrice = ''
  if (!form.salePrice || form.salePrice <= 0) {
    errors.salePrice = 'Le prix de vente doit être supérieur à 0.'
    return
  }

  isSubmitting.value = true
  const payload: QuickSalePayload = {
    productId: props.product.id,
    salePrice: form.salePrice,
    saleDate: form.saleDate,
    paymentMethod: form.paymentMethod,
    clientName: form.clientName || undefined,
    notes: form.notes || undefined,
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
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4
               sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-modal-title"
        @keydown.esc="$emit('close')"
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
          class="relative bg-cgws-surface border-2 border-cgws-ink rounded-sm
                 shadow-xl w-full max-w-lg
                 flex flex-col max-h-[90dvh] sm:max-h-[80vh]"
          tabindex="-1"
          @keydown="handleModalKeydown"
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
                id="sale-modal-title"
                class="font-serif font-bold text-lg text-cgws-ink"
              >
                Enregistrer la vente
              </h3>
              <p class="font-sans text-sm text-cgws-ink-soft mt-0.5 truncate">
                {{ product.title }}
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
            <!-- Date + Prix — 2 cols sm+ -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Date de vente -->
              <div>
                <label
                  for="sale-date"
                  class="block font-sans text-xs font-semibold uppercase
                         tracking-wider text-cgws-ink-soft mb-1.5"
                >
                  Date de vente
                </label>
                <input
                  id="sale-date"
                  v-model="form.saleDate"
                  type="date"
                  required
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline
                         rounded-sm font-sans text-sm text-cgws-ink
                         focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20
                         focus:outline-none disabled:opacity-50"
                  aria-required="true"
                >
              </div>

              <!-- Prix de vente -->
              <div>
                <label
                  for="sale-price"
                  class="block font-sans text-xs font-semibold uppercase
                         tracking-wider text-cgws-ink-soft mb-1.5"
                >
                  Prix de vente (€)
                </label>
                <input
                  id="sale-price"
                  v-model.number="form.salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline
                         rounded-sm font-display text-base text-cgws-accent
                         focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20
                         focus:outline-none disabled:opacity-50"
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

            <!-- Moyen de paiement -->
            <div>
              <label
                for="payment-method"
                class="block font-sans text-xs font-semibold uppercase
                       tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Moyen de paiement
              </label>
              <div class="relative">
                <select
                  id="payment-method"
                  v-model="form.paymentMethod"
                  required
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 pr-9 bg-cgws-ground border border-cgws-hairline
                         rounded-sm font-sans text-sm text-cgws-ink appearance-none
                         focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20
                         focus:outline-none disabled:opacity-50"
                  aria-required="true"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte bancaire</option>
                  <option value="transfer">Virement</option>
                  <option value="check">Chèque</option>
                </select>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                         w-4 h-4 text-cgws-ink-soft/60"
                  aria-hidden="true"
                />
              </div>
            </div>

            <!-- Client (optionnel) -->
            <div>
              <label
                for="sale-client"
                class="block font-sans text-xs font-semibold uppercase
                       tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Client
                <span class="font-normal normal-case tracking-normal text-cgws-ink-soft/70">
                  (optionnel)
                </span>
              </label>
              <input
                id="sale-client"
                v-model="form.clientName"
                type="text"
                placeholder="Nom du client…"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline
                       rounded-sm font-sans text-sm text-cgws-ink
                       placeholder:text-cgws-ink-soft
                       focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20
                       focus:outline-none disabled:opacity-50"
              >
            </div>

            <!-- Notes internes (optionnel) -->
            <div>
              <label
                for="sale-notes"
                class="block font-sans text-xs font-semibold uppercase
                       tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Notes internes
                <span class="font-normal normal-case tracking-normal text-cgws-ink-soft/70">
                  (optionnel)
                </span>
              </label>
              <textarea
                id="sale-notes"
                v-model="form.notes"
                :rows="2"
                placeholder="Observations, conditions particulières…"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline
                       rounded-sm font-sans text-sm text-cgws-ink
                       placeholder:text-cgws-ink-soft resize-none
                       focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20
                       focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col-reverse sm:flex-row items-center justify-between
                   gap-3 p-5 border-t border-cgws-hairline flex-shrink-0"
          >
            <!-- Ignorer -->
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
              Ignorer
            </button>

            <!-- Enregistrer la vente -->
            <button
              type="button"
              :disabled="isSubmitting"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     px-5 py-2 rounded-sm bg-cgws-accent text-cgws-on-accent
                     font-sans text-sm font-semibold
                     hover:bg-cgws-edge transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed
                     focus-visible:ring-2 focus-visible:ring-cgws-accent
                     focus-visible:ring-offset-2 focus-visible:outline-none"
              @click="submitSale"
            >
              <span
                v-if="isSubmitting"
                class="w-4 h-4 rounded-full border-2 border-current
                       border-t-transparent animate-spin"
                aria-hidden="true"
              />
              {{ isSubmitting ? 'Enregistrement…' : 'Enregistrer la vente' }}
              <UIcon
                v-if="!isSubmitting"
                name="i-lucide-arrow-right"
                class="w-4 h-4"
                aria-hidden="true"
              />
            </button>
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
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.96) translateY(8px);
}
</style>
