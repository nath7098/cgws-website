<script setup lang="ts">
import type { ProductStatus } from '~/types'

interface Props {
  productId: string
  currentStatus: ProductStatus
  productTitle: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:status': [newStatus: ProductStatus]
  'sale-required': []
  'error': []
}>()

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Disponible',
  reserved: 'Réservé',
  sold: 'Vendu',
  inactive: 'Inactif',
}

const STATUS_OPTIONS: Array<{
  value: ProductStatus
  label: string
  dotClass: string
}> = [
  { value: 'active', label: 'Disponible', dotClass: 'bg-cgws-success' },
  { value: 'reserved', label: 'Réservé', dotClass: 'bg-cgws-ink-soft' },
  { value: 'sold', label: 'Vendu', dotClass: 'bg-cgws-accent' },
  { value: 'inactive', label: 'Inactif', dotClass: 'bg-cgws-ink-soft/40' },
]

// ─── Pill class (identical to US-032 for consistency) ─────────────────────────

const BASE_PILL = 'px-2.5 py-0.5 font-sans font-medium text-[11px] uppercase tracking-wider rounded-full'

function statusPillClass(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    active: `${BASE_PILL} bg-cgws-success/15 text-cgws-success border border-cgws-success/40`,
    reserved: `${BASE_PILL} bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline`,
    sold: `${BASE_PILL} bg-cgws-accent text-cgws-on-accent`,
    inactive: `${BASE_PILL} bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline`,
  }
  return map[status]
}

// ─── Breakpoint ───────────────────────────────────────────────────────────────

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// ─── Open / close state ───────────────────────────────────────────────────────

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => {
  if (isOpen.value) close()
})

function close(): void {
  isOpen.value = false
  pendingStatus.value = null
  triggerRef.value?.focus()
}

// ─── Popover positioning (desktop) ────────────────────────────────────────────

const popoverStyle = ref<Record<string, string>>({})

function computePopoverPosition(): void {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  popoverStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
  }
}

function toggleDropdown(): void {
  if (isOpen.value) {
    close()
    return
  }
  if (!isMobile.value) computePopoverPosition()
  isOpen.value = true
  nextTick(() => {
    const firstOption = dropdownRef.value?.querySelector<HTMLElement>('button:not([disabled])')
    firstOption?.focus()
  })
}

// ─── API call ─────────────────────────────────────────────────────────────────

const { getAccessToken, buildAuthHeaders } = useAdminApi()
const isLoading = ref(false)
const pendingStatus = ref<ProductStatus | null>(null)

async function selectStatus(status: ProductStatus): Promise<void> {
  if (status === props.currentStatus || isLoading.value) return
  isLoading.value = true
  pendingStatus.value = status

  try {
    const token = await getAccessToken()
    await $fetch(`/api/admin/products/${props.productId}/status`, {
      method: 'PATCH',
      body: { status },
      headers: buildAuthHeaders(token),
    })
    emit('update:status', status)
    if (status === 'sold') emit('sale-required')
    close()
  }
  catch {
    emit('error')
    close()
  }
  finally {
    isLoading.value = false
    pendingStatus.value = null
  }
}
</script>

<template>
  <!-- Trigger badge -->
  <button
    ref="triggerRef"
    type="button"
    :aria-label="`Changer le statut de ${productTitle} — actuellement ${STATUS_LABELS[currentStatus]}`"
    aria-haspopup="listbox"
    :aria-expanded="isOpen"
    class="inline-flex items-center gap-1.5 cursor-pointer rounded-full
           transition-all duration-150 select-none
           focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-cgws-accent focus-visible:ring-offset-2"
    :class="[
      statusPillClass(currentStatus),
      isOpen
        ? 'ring-2 ring-cgws-accent ring-offset-1'
        : 'hover:ring-2 hover:ring-cgws-accent/50 hover:ring-offset-1',
    ]"
    @click="toggleDropdown"
  >
    <span>{{ STATUS_LABELS[currentStatus] }}</span>
    <UIcon
      name="i-lucide-chevron-down"
      class="w-3 h-3 transition-transform duration-150"
      :class="isOpen ? 'rotate-180' : ''"
      aria-hidden="true"
    />
  </button>

  <!-- Teleported dropdown / bottom-sheet -->
  <Teleport to="body">
    <Transition :name="isMobile ? 'sheet' : 'popover'">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40"
        @click.self="close"
        @keydown.esc="close"
      >
        <!-- Backdrop (mobile only) -->
        <div
          class="absolute inset-0 bg-cgws-ink/40"
          :class="isMobile ? 'block' : 'hidden'"
          aria-hidden="true"
          @click="close"
        />

        <!-- Desktop popover -->
        <div
          v-if="!isMobile"
          ref="dropdownRef"
          role="listbox"
          :aria-label="`Options de statut pour ${productTitle}`"
          :style="popoverStyle"
          class="absolute z-50 bg-cgws-surface border border-cgws-hairline
                 rounded-[4px] shadow-lg min-w-[180px] py-1
                 focus:outline-none"
          tabindex="-1"
        >
          <button
            v-for="option in STATUS_OPTIONS"
            :key="option.value"
            role="option"
            :aria-selected="option.value === currentStatus"
            :disabled="option.value === currentStatus || isLoading"
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2
                   font-sans text-sm text-left
                   transition-colors duration-100
                   focus-visible:outline-none focus-visible:bg-cgws-surface/50
                   disabled:cursor-default"
            :class="option.value === currentStatus
              ? 'text-cgws-ink-soft/50 cursor-default'
              : 'text-cgws-ink hover:bg-cgws-surface/40 cursor-pointer'"
            @click="selectStatus(option.value)"
          >
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :class="option.dotClass"
              aria-hidden="true"
            />
            <span class="flex-1">{{ option.label }}</span>
            <UIcon
              v-if="option.value === currentStatus"
              name="i-lucide-check"
              class="w-3.5 h-3.5 text-cgws-ink-soft/50"
              aria-hidden="true"
            />
            <span
              v-if="isLoading && pendingStatus === option.value"
              class="w-3.5 h-3.5 rounded-full border-2 border-cgws-accent
                     border-t-transparent animate-spin"
              aria-hidden="true"
            />
          </button>
        </div>

        <!-- Mobile bottom-sheet -->
        <div
          v-else
          ref="dropdownRef"
          role="listbox"
          :aria-label="`Options de statut pour ${productTitle}`"
          class="fixed bottom-0 left-0 right-0 z-50
                 bg-cgws-surface rounded-t-2xl border-t border-cgws-hairline
                 shadow-xl pb-safe"
        >
          <!-- Handle décoratif -->
          <div
            class="flex justify-center pt-3 pb-2"
            aria-hidden="true"
          >
            <div class="w-10 h-1 bg-cgws-hairline rounded-full" />
          </div>

          <!-- Titre -->
          <div class="px-4 pb-3 border-b border-cgws-hairline">
            <p class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft mb-0.5">
              Changer le statut
            </p>
            <p class="font-sans text-sm font-medium text-cgws-ink line-clamp-1">
              {{ productTitle }}
            </p>
          </div>

          <!-- Options -->
          <div class="py-2">
            <button
              v-for="option in STATUS_OPTIONS"
              :key="option.value"
              role="option"
              :aria-selected="option.value === currentStatus"
              :disabled="option.value === currentStatus || isLoading"
              type="button"
              class="w-full flex items-center gap-4 px-4 py-3.5
                     font-sans text-sm text-left
                     transition-colors duration-100
                     focus-visible:outline-none focus-visible:bg-cgws-surface/50"
              :class="option.value === currentStatus
                ? 'text-cgws-ink-soft/50 cursor-default'
                : 'text-cgws-ink active:bg-cgws-surface/40'"
              @click="selectStatus(option.value)"
            >
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                :class="option.dotClass"
                aria-hidden="true"
              />
              <span class="flex-1 text-base">{{ option.label }}</span>
              <UIcon
                v-if="option.value === currentStatus"
                name="i-lucide-check"
                class="w-4 h-4 text-cgws-ink-soft/50"
                aria-hidden="true"
              />
              <span
                v-if="isLoading && pendingStatus === option.value"
                class="w-4 h-4 rounded-full border-2 border-cgws-accent
                       border-t-transparent animate-spin"
                aria-hidden="true"
              />
            </button>
          </div>

          <!-- Bouton Annuler (mobile) -->
          <div class="px-4 pb-5 pt-1">
            <button
              type="button"
              class="w-full py-3 rounded-[4px] border border-cgws-hairline
                     font-sans text-sm font-medium text-cgws-ink
                     hover:bg-cgws-surface/40 transition-colors
                     focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none"
              @click="close"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Popover desktop — fade + translateY léger */
.popover-enter-active,
.popover-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Bottom-sheet mobile — slide from bottom */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active .fixed.bottom-0,
.sheet-leave-active .fixed.bottom-0 {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from .fixed.bottom-0,
.sheet-leave-to .fixed.bottom-0 {
  transform: translateY(100%);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
</style>
