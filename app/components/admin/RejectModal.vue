<script setup lang="ts">
import type { Consignment } from '~/types'

interface Props {
  consignment: Pick<Consignment, 'depositorName' | 'depositorEmail' | 'itemDescription'>
  open: boolean
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: [reason: string]
}>()

// ─── Form state ────────────────────────────────────────────────────────────────

const rejectForm = reactive({ reason: '' })
const rejectErrors = reactive({ reason: '' })

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const rejectModalRef = ref<HTMLElement | null>(null)
const rejectReasonRef = ref<HTMLTextAreaElement | null>(null)

// ─── Focus management ─────────────────────────────────────────────────────────

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      rejectForm.reason = ''
      rejectErrors.reason = ''
      await nextTick()
      rejectReasonRef.value?.focus()
    }
  },
)

function handleRejectModalKeydown(event: KeyboardEvent): void {
  if (!rejectModalRef.value) return

  const focusables = Array.from(
    rejectModalRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

// ─── Actions ──────────────────────────────────────────────────────────────────

function closeModal(): void {
  if (props.loading) return
  emit('close')
}

function handleConfirm(): void {
  rejectErrors.reason = ''

  if (!rejectForm.reason.trim()) {
    rejectErrors.reason = 'Le motif de refus est obligatoire.'
    rejectReasonRef.value?.focus()
    return
  }

  emit('confirm', rejectForm.reason.trim())
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-modal-title"
        @keydown.esc="closeModal"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-cgws-ink/60 backdrop-blur-sm"
          aria-hidden="true"
          @click="closeModal"
        />

        <!-- Modal box -->
        <div
          ref="rejectModalRef"
          class="relative bg-cgws-surface border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-md flex flex-col max-h-[90dvh]"
          tabindex="-1"
          @keydown="handleRejectModalKeydown"
        >
          <!-- Header -->
          <div class="flex items-start gap-4 p-5 border-b border-cgws-hairline flex-shrink-0">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-danger/10 flex items-center justify-center">
              <UIcon
                name="i-lucide-ban"
                class="w-5 h-5 text-cgws-danger"
                aria-hidden="true"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                id="reject-modal-title"
                class="font-serif font-bold text-lg text-cgws-ink"
              >
                Refuser la demande
              </h3>
              <p class="font-sans text-sm text-cgws-ink-soft mt-0.5 line-clamp-1">
                {{ consignment.depositorName }} — {{ consignment.itemDescription }}
              </p>
            </div>
            <button
              type="button"
              :disabled="loading"
              class="flex-shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-ink hover:bg-cgws-surface/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none"
              aria-label="Fermer sans refuser"
              @click="closeModal"
            >
              <UIcon
                name="i-lucide-x"
                class="w-4 h-4"
                aria-hidden="true"
              />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <p class="font-sans text-sm text-cgws-ink-soft">
              Un email sera automatiquement envoyé à
              <strong class="text-cgws-ink">{{ consignment.depositorEmail }}</strong>
              avec le motif de refus.
            </p>
            <div>
              <label
                for="reject-reason"
                class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
              >
                Motif de refus <span class="text-cgws-danger">*</span>
              </label>
              <textarea
                id="reject-reason"
                ref="rejectReasonRef"
                v-model="rejectForm.reason"
                :rows="4"
                placeholder="Ex. : L'état de l'article ne correspond pas à nos critères de dépôt…"
                required
                :disabled="loading"
                class="w-full px-3 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm font-sans text-sm text-cgws-ink placeholder:text-cgws-ink-soft resize-none focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20 focus:outline-none disabled:opacity-50"
                :class="rejectErrors.reason ? 'border-cgws-danger' : ''"
                aria-required="true"
                :aria-describedby="rejectErrors.reason ? 'reject-reason-error' : undefined"
              />
              <p
                v-if="rejectErrors.reason"
                id="reject-reason-error"
                role="alert"
                class="mt-1 font-sans text-xs text-cgws-danger"
              >
                {{ rejectErrors.reason }}
              </p>
              <p
                v-else
                class="mt-1 font-sans text-xs text-cgws-ink-soft/70"
              >
                Ce message sera repris tel quel dans l'email envoyé au déposant.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-5 border-t border-cgws-hairline flex-shrink-0">
            <button
              type="button"
              :disabled="loading"
              class="w-full sm:w-auto px-4 py-2 rounded-sm border border-cgws-hairline text-cgws-ink-soft font-sans text-sm font-medium hover:bg-cgws-surface/40 hover:text-cgws-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none"
              @click="closeModal"
            >
              Annuler
            </button>
            <CgwsButton
              variant="destructive"
              size="sm"
              class="w-full sm:w-auto"
              :loading="loading"
              :disabled="loading || !rejectForm.reason.trim()"
              @click="handleConfirm"
            >
              {{ loading ? 'Envoi…' : 'Confirmer le refus' }}
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
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
