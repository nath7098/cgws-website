<script setup lang="ts">
import { MAX_IMPORT_SIZE_MB, MAX_IMPORT_LINES } from '#shared/utils/csvImport'

interface Props {
  modelValue: File | null
  disabled?: boolean
  maxSizeMb?: number
  maxLines?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxSizeMb: MAX_IMPORT_SIZE_MB,
  maxLines: MAX_IMPORT_LINES,
})

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'error': [message: string]
}>()

const isDragOver = ref(false)
const fileError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function openFilePicker() {
  if (props.disabled) return
  fileInputRef.value?.click()
}

function setError(message: string) {
  fileError.value = message
  emit('update:modelValue', null)
  emit('error', message)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

/**
 * Immediate client-side checks (US-063 §3): extension, size, and a fast
 * physical-line heuristic. UTF-8 validity is NOT reliably checkable here and is
 * enforced server-side. On failure the file is not assigned (modelValue stays
 * null) and the dropzone shows its own error so the user can retry at once.
 */
async function validateAndAccept(file: File) {
  fileError.value = null

  if (!file.name.toLowerCase().endsWith('.csv')) {
    setError('Format de fichier non supporté, un fichier .csv est attendu')
    return
  }

  if (file.size > props.maxSizeMb * 1024 * 1024) {
    setError(`Fichier trop volumineux (max ${props.maxSizeMb} Mo)`)
    return
  }

  // Fast line-count heuristic (not a full CSV parse — the server is the source
  // of truth). Counts physical lines minus the header, tolerating a trailing
  // newline and both \r\n / \n line endings.
  try {
    const content = await file.text()
    const normalized = content.replace(/\r\n?/g, '\n')
    const trimmedTrailing = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized
    const totalLines = trimmedTrailing.length === 0 ? 0 : trimmedTrailing.split('\n').length
    const dataLines = Math.max(0, totalLines - 1)
    if (dataLines > props.maxLines) {
      setError(`Trop de lignes (max ${props.maxLines} par import)`)
      return
    }
  }
  catch {
    setError('Impossible de lire le fichier. Veuillez réessayer.')
    return
  }

  fileError.value = null
  emit('update:modelValue', file)
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void validateAndAccept(file)
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0]
  if (file) void validateAndAccept(file)
}

function clearFile() {
  fileError.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
  emit('update:modelValue', null)
}
</script>

<template>
  <div>
    <!-- Empty / drag state -->
    <div
      v-if="!modelValue"
      role="button"
      tabindex="0"
      aria-label="Zone de dépôt du fichier CSV. Activez pour parcourir vos fichiers."
      :aria-disabled="disabled ? 'true' : undefined"
      :class="[
        'border-2 border-dashed rounded-sm p-8 text-center transition-colors duration-200',
        disabled
          ? 'opacity-50 cursor-not-allowed border-cgws-accent/40'
          : isDragOver
            ? 'border-cgws-accent bg-cgws-surface-2 border-solid cursor-pointer'
            : 'border-cgws-accent/40 hover:border-cgws-accent hover:bg-cgws-surface-2/40 cursor-pointer',
      ]"
      @click="openFilePicker()"
      @keydown.enter.prevent="openFilePicker()"
      @keydown.space.prevent="openFilePicker()"
      @dragenter.prevent="!disabled && (isDragOver = true)"
      @dragover.prevent="!disabled && (isDragOver = true)"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <UIcon
        name="i-lucide-cloud-upload"
        class="w-8 h-8 mx-auto mb-3 text-cgws-accent/50"
        aria-hidden="true"
      />
      <p class="font-sans text-sm font-medium text-cgws-ink mb-2">
        Glissez votre fichier CSV ici
      </p>
      <CgwsButton
        variant="ghost"
        size="sm"
        type="button"
        :disabled="disabled"
        @click.stop="openFilePicker()"
      >
        Parcourir…
      </CgwsButton>
      <p class="font-sans text-xs text-cgws-ink-soft mt-3">
        .csv seul &nbsp;·&nbsp; {{ maxSizeMb }} Mo max &nbsp;·&nbsp; {{ maxLines }} lignes max
      </p>
    </div>

    <!-- Hidden native input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".csv,text/csv"
      :disabled="disabled"
      class="sr-only"
      aria-hidden="true"
      tabindex="-1"
      @change="handleFileInput"
    >

    <!-- Selected file -->
    <div
      v-if="modelValue"
      class="flex items-center gap-3 p-4 bg-cgws-surface-2 border border-cgws-hairline rounded-sm"
    >
      <UIcon
        name="i-lucide-file-spreadsheet"
        class="w-8 h-8 text-cgws-accent flex-shrink-0"
        aria-hidden="true"
      />
      <div class="flex-1 min-w-0">
        <p class="font-sans text-sm font-medium text-cgws-ink truncate">
          {{ modelValue.name }}
        </p>
        <p class="font-sans text-xs text-cgws-ink-soft">
          {{ formatFileSize(modelValue.size) }}
        </p>
      </div>
      <button
        type="button"
        :disabled="disabled"
        class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-danger hover:bg-cgws-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Retirer le fichier sélectionné"
        @click="clearFile()"
      >
        <UIcon
          name="i-lucide-x"
          class="w-4 h-4"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- File error -->
    <p
      v-if="fileError"
      role="alert"
      class="font-sans text-xs text-cgws-danger mt-2 flex items-center gap-1.5"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="w-3.5 h-3.5 flex-shrink-0"
        aria-hidden="true"
      />
      {{ fileError }}
    </p>
  </div>
</template>
