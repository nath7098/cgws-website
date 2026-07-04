<script setup lang="ts">
import type { ClientWithStats } from '~/types'

interface ClientSelection {
  clientId: string | null
  clientName: string
}

interface Props {
  modelValue: ClientSelection | null
  disabled?: boolean
  placeholder?: string
  inputId?: string
  hasError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: 'Rechercher ou créer un client…',
  inputId: undefined,
  hasError: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: ClientSelection | null]
}>()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── State ───────────────────────────────────────────────────────────────────

const wrapperRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const inputText = ref('')
const results = ref<ClientWithStats[]>([])
const isLoading = ref(false)
const isOpen = ref(false)
const focusedIndex = ref(-1)

// Total options count = results + 1 "create" option
const totalOptions = computed(() => results.value.length + 1)
const createOptionIndex = computed(() => results.value.length)

// ─── Search ───────────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | undefined

async function searchClients(query: string): Promise<void> {
  isLoading.value = true
  isOpen.value = true
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ clients: ClientWithStats[]; total: number }>(
      '/api/admin/clients',
      {
        params: { search: query, limit: 8 },
        headers: buildAuthHeaders(token),
      },
    )
    results.value = data.clients
  }
  catch {
    results.value = []
  }
  finally {
    isLoading.value = false
    focusedIndex.value = -1
  }
}

watch(inputText, (val) => {
  clearTimeout(debounceTimer)
  // Emit null if text was cleared
  if (!val.trim()) {
    emit('update:modelValue', null)
  }
  if (val.length < 3) {
    isOpen.value = false
    results.value = []
    focusedIndex.value = -1
    return
  }
  isLoading.value = true
  isOpen.value = true
  debounceTimer = setTimeout(() => {
    searchClients(val)
  }, 300)
})

// ─── Sync modelValue → inputText (for external resets) ───────────────────────

watch(
  () => props.modelValue,
  (val) => {
    if (val === null) {
      inputText.value = ''
    }
  },
)

// ─── Selection ───────────────────────────────────────────────────────────────

function selectClient(client: ClientWithStats): void {
  inputText.value = client.name
  emit('update:modelValue', { clientId: client.id, clientName: client.name })
  closeDropdown()
}

function selectCreate(): void {
  const name = inputText.value.trim()
  emit('update:modelValue', { clientId: null, clientName: name })
  closeDropdown()
}

function clearSelection(): void {
  inputText.value = ''
  results.value = []
  emit('update:modelValue', null)
  isOpen.value = false
  focusedIndex.value = -1
  nextTick(() => inputRef.value?.focus())
}

function closeDropdown(): void {
  isOpen.value = false
  focusedIndex.value = -1
}

// ─── Keyboard navigation ──────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent): void {
  if (!isOpen.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = (focusedIndex.value + 1) % totalOptions.value
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = (focusedIndex.value - 1 + totalOptions.value) % totalOptions.value
      break
    case 'Enter':
      e.preventDefault()
      if (focusedIndex.value === createOptionIndex.value) {
        selectCreate()
      }
      else if (focusedIndex.value >= 0 && focusedIndex.value < results.value.length) {
        const client = results.value[focusedIndex.value]
        if (client) selectClient(client)
      }
      break
    case 'Escape':
      e.preventDefault()
      closeDropdown()
      inputRef.value?.focus()
      break
  }
}

// ─── Click outside (blur + 150ms) ────────────────────────────────────────────

function onInputBlur(): void {
  setTimeout(() => {
    // Only close if focus left the entire wrapper
    if (!wrapperRef.value?.contains(document.activeElement)) {
      closeDropdown()
    }
  }, 150)
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

onUnmounted(() => {
  clearTimeout(debounceTimer)
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative w-full"
    role="combobox"
    :aria-haspopup="'listbox'"
    :aria-expanded="isOpen"
    aria-owns="client-autocomplete-listbox"
  >
    <!-- Input wrapper -->
    <div class="relative">
      <!-- Search icon -->
      <UIcon
        name="i-lucide-search"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-ink-soft/50 pointer-events-none"
        aria-hidden="true"
      />

      <!-- Text input -->
      <input
        :id="props.inputId"
        ref="inputRef"
        v-model="inputText"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="client-autocomplete-listbox"
        :aria-activedescendant="focusedIndex >= 0 ? (focusedIndex === createOptionIndex ? 'client-option-create' : `client-option-${focusedIndex}`) : undefined"
        autocomplete="off"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        class="w-full pl-9 pr-8 py-2 bg-cgws-ground border border-cgws-hairline rounded-sm
               font-sans text-sm text-cgws-ink
               placeholder:text-cgws-ink-soft
               focus:border-cgws-accent focus:ring-2 focus:ring-cgws-accent/20
               focus:outline-none disabled:opacity-50"
        :class="props.hasError ? 'border-cgws-danger' : ''"
        @keydown="onKeydown"
        @blur="onInputBlur"
      >

      <!-- Spinner (during loading) -->
      <div
        v-if="isLoading"
        class="absolute right-2 top-1/2 -translate-y-1/2
               w-4 h-4 rounded-full border-2 border-cgws-hairline
               border-t-cgws-accent animate-spin"
        aria-hidden="true"
      />

      <!-- Clear button (when text present and not loading) -->
      <button
        v-else-if="inputText"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2
               p-0.5 rounded-sm text-cgws-ink-soft/50 hover:text-cgws-ink
               transition-colors focus-visible:outline-none
               focus-visible:ring-1 focus-visible:ring-cgws-accent"
        aria-label="Effacer la sélection"
        tabindex="-1"
        @click="clearSelection"
      >
        <UIcon
          name="i-lucide-x"
          class="w-4 h-4"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <ul
        v-if="isOpen"
        id="client-autocomplete-listbox"
        role="listbox"
        aria-label="Suggestions de clients"
        class="absolute top-full left-0 right-0 z-50 mt-1
               bg-cgws-surface border border-cgws-hairline rounded-[4px]
               shadow-lg max-h-56 overflow-y-auto"
      >
        <!-- Skeleton rows while loading -->
        <template v-if="isLoading">
          <li
            v-for="i in 3"
            :key="i"
            class="flex items-center gap-3 px-3 py-2.5"
            aria-hidden="true"
          >
            <div class="w-7 h-7 rounded-full bg-cgws-hairline animate-pulse flex-shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3 w-32 bg-cgws-hairline rounded animate-pulse" />
              <div class="h-2 w-48 bg-cgws-hairline rounded animate-pulse" />
            </div>
          </li>
        </template>

        <!-- Results -->
        <template v-else>
          <li
            v-for="(client, i) in results"
            :id="`client-option-${i}`"
            :key="client.id"
            role="option"
            :aria-selected="focusedIndex === i"
            class="flex items-center gap-3 px-3 py-2.5
                   cursor-pointer transition-colors duration-100
                   hover:bg-cgws-surface/50"
            :class="focusedIndex === i ? 'bg-cgws-surface/50' : ''"
            @mousedown.prevent="selectClient(client)"
          >
            <!-- Avatar -->
            <div
              class="w-7 h-7 rounded-full bg-cgws-accent/15 flex-shrink-0
                     flex items-center justify-center"
              aria-hidden="true"
            >
              <span class="font-display text-sm text-cgws-accent">
                {{ client.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="font-sans text-sm font-medium text-cgws-ink truncate">
                {{ client.name }}
              </p>
              <p
                v-if="client.email"
                class="font-sans text-xs text-cgws-ink-soft/70 leading-tight truncate"
              >
                {{ client.email }}
              </p>
            </div>
            <!-- Divider handled via CSS divide -->
          </li>

          <!-- Divider before create option (when there are results) -->
          <li
            v-if="results.length > 0"
            role="none"
            class="border-t border-cgws-hairline"
          />
        </template>

        <!-- Create option — always shown when inputText >= 3 chars -->
        <li
          id="client-option-create"
          role="option"
          :aria-selected="focusedIndex === createOptionIndex"
          class="flex items-center gap-3 px-3 py-2.5
                 cursor-pointer bg-cgws-accent/5
                 hover:bg-cgws-accent/10 transition-colors"
          :class="focusedIndex === createOptionIndex ? 'bg-cgws-accent/10' : ''"
          @mousedown.prevent="selectCreate"
        >
          <UIcon
            name="i-lucide-plus"
            class="w-4 h-4 text-cgws-accent flex-shrink-0"
            aria-hidden="true"
          />
          <span class="font-sans text-sm font-medium text-cgws-accent">
            Créer : "{{ inputText }}"
          </span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
