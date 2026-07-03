<script setup lang="ts">
import Sortable from 'sortablejs'

interface Props {
  keptImages?: string[]
  newFiles?: File[]
  removedImages?: string[]
  maxImages?: number
  maxSizeMb?: number
  disabled?: boolean
  uploadProgress?: number | null
  uploadProgressLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  keptImages: () => [],
  newFiles: () => [],
  removedImages: () => [],
  maxImages: 8,
  maxSizeMb: 5,
  disabled: false,
  uploadProgress: null,
  uploadProgressLabel: '',
})

const emit = defineEmits<{
  'update:keptImages': [value: string[]]
  'update:newFiles': [value: File[]]
  'update:removedImages': [value: string[]]
}>()

type DisplayItem =
  | { type: 'existing'; url: string; id: string }
  | { type: 'new'; file: File; previewUrl: string; id: string }

const displayItems = ref<DisplayItem[]>([])
const isDragOver = ref(false)
const uploadError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const sortableContainer = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

// Initialise displayItems from keptImages on mount
onMounted(() => {
  displayItems.value = props.keptImages.map(url => ({
    type: 'existing' as const,
    url,
    id: crypto.randomUUID(),
  }))

  if (sortableContainer.value) {
    sortableInstance = Sortable.create(sortableContainer.value, {
      animation: 150,
      ghostClass: 'opacity-40',
      chosenClass: 'ring-2 ring-cgws-accent ring-offset-1',
      onEnd(evt) {
        if (evt.oldIndex === undefined || evt.newIndex === undefined) return
        const items = [...displayItems.value]
        const moved = items.splice(evt.oldIndex, 1)[0]
        if (moved !== undefined) {
          items.splice(evt.newIndex, 0, moved)
        }
        displayItems.value = items
        syncEmits()
      },
    })
  }
})

onUnmounted(() => {
  sortableInstance?.destroy()
  for (const item of displayItems.value) {
    if (item.type === 'new') {
      URL.revokeObjectURL(item.previewUrl)
    }
  }
})

function syncEmits() {
  const kept: string[] = []
  const newF: File[] = []

  for (const item of displayItems.value) {
    if (item.type === 'existing') kept.push(item.url)
    else newF.push(item.file)
  }

  emit('update:keptImages', kept)
  emit('update:newFiles', newF)
}

function openFilePicker() {
  if (props.disabled || displayItems.value.length >= props.maxImages) return
  fileInputRef.value?.click()
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
  // Reset so same files can be re-selected
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  if (props.disabled) return
  const files = Array.from(event.dataTransfer?.files ?? [])
  addFiles(files)
}

function addFiles(files: File[]) {
  uploadError.value = ''
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  const maxBytes = props.maxSizeMb * 1024 * 1024
  const remaining = props.maxImages - displayItems.value.length

  const validFiles: File[] = []
  for (const file of files) {
    if (!allowed.includes(file.type)) {
      uploadError.value = `Format non supporté : ${file.name}. Utilisez JPEG, PNG ou WEBP.`
      continue
    }
    if (file.size > maxBytes) {
      uploadError.value = `${file.name} dépasse ${props.maxSizeMb} MB.`
      continue
    }
    validFiles.push(file)
  }

  const toAdd = validFiles.slice(0, remaining)
  if (validFiles.length > remaining) {
    uploadError.value = `Maximum ${props.maxImages} photos. ${validFiles.length - remaining} ignorée(s).`
  }

  for (const file of toAdd) {
    displayItems.value.push({
      type: 'new',
      file,
      previewUrl: URL.createObjectURL(file),
      id: crypto.randomUUID(),
    })
  }

  syncEmits()
}

function removeItem(itemId: string) {
  const idx = displayItems.value.findIndex(item => item.id === itemId)
  if (idx === -1) return

  const item = displayItems.value[idx]!

  if (item.type === 'existing') {
    // Track removed images for server-side deletion
    emit('update:removedImages', [...props.removedImages, item.url])
  }
  else {
    URL.revokeObjectURL(item.previewUrl)
  }

  displayItems.value.splice(idx, 1)
  syncEmits()
}
</script>

<template>
  <section
    aria-label="Gestion des photos du produit"
    class="bg-white border border-cgws-hairline rounded-[4px] p-4"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <p class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent">
        Photos
      </p>
      <span class="font-sans text-xs text-cgws-ink-soft">
        {{ displayItems.length }} / {{ maxImages }}
      </span>
    </div>
    <p class="font-sans text-xs text-cgws-ink-soft mb-3">
      La <strong class="font-medium text-cgws-ink">première photo</strong> sera l'image principale.
      Réorganisez par glisser-déposer.
    </p>

    <!-- Drop zone -->
    <div
      v-if="displayItems.length < maxImages"
      role="button"
      tabindex="0"
      :aria-label="`Zone de dépôt — ${maxImages - displayItems.length} emplacements disponibles`"
      :class="[
        'border-2 border-dashed rounded-sm p-6 text-center mb-4',
        'transition-colors duration-200 cursor-pointer',
        isDragOver
          ? 'border-cgws-accent bg-cgws-surface border-solid'
          : 'border-cgws-accent/40 hover:border-cgws-accent hover:bg-cgws-surface/30',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      @click="openFilePicker()"
      @keydown.enter.prevent="openFilePicker()"
      @keydown.space.prevent="openFilePicker()"
      @dragenter.prevent="isDragOver = true"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <UIcon
        name="i-lucide-cloud-upload"
        class="w-7 h-7 mx-auto mb-2 text-cgws-accent/50"
        aria-hidden="true"
      />
      <p class="font-sans text-sm font-medium text-cgws-ink mb-2">
        Glissez vos photos ici
      </p>
      <CgwsButton
        variant="ghost"
        size="sm"
        type="button"
        :disabled="disabled"
        @click.stop="openFilePicker()"
      >
        + Ajouter des photos
      </CgwsButton>
      <p class="font-sans text-xs text-cgws-ink-soft mt-2">
        JPEG · PNG · WEBP &nbsp;·&nbsp; {{ maxImages }} max &nbsp;·&nbsp; {{ maxSizeMb }} MB / fichier
      </p>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      :disabled="disabled || displayItems.length >= maxImages"
      class="sr-only"
      aria-hidden="true"
      @change="handleFileInput"
    >

    <!-- File error -->
    <p
      v-if="uploadError"
      role="alert"
      class="font-sans text-xs text-cgws-danger mb-3"
    >
      {{ uploadError }}
    </p>

    <!-- Preview grid (sortable) -->
    <div
      v-if="displayItems.length > 0"
      ref="sortableContainer"
      class="grid grid-cols-4 gap-2"
      aria-label="Photos ajoutées, réorganisables par glisser-déposer"
    >
      <div
        v-for="(item, index) in displayItems"
        :key="item.id"
        class="relative aspect-square rounded-sm overflow-hidden bg-cgws-surface border border-cgws-hairline group cursor-grab active:cursor-grabbing select-none"
        :data-id="item.id"
      >
        <!-- Drag handle indicator -->
        <div
          class="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
          aria-hidden="true"
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="w-4 h-4 text-cgws-brand-cream drop-shadow-sm"
            aria-hidden="true"
          />
        </div>

        <!-- Image preview -->
        <img
          :src="item.type === 'existing' ? item.url : item.previewUrl"
          :alt="`Photo ${index + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        >

        <!-- Principal badge (first item only) -->
        <div
          v-if="index === 0"
          class="absolute bottom-0 left-0 right-0 bg-cgws-accent/90 text-cgws-on-accent font-sans font-semibold text-[9px] uppercase tracking-wider py-0.5 text-center"
          aria-hidden="true"
        >
          Principal
        </div>

        <!-- Remove button -->
        <button
          type="button"
          :aria-label="`Supprimer la photo ${index + 1}`"
          :disabled="disabled"
          class="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-cgws-danger text-cgws-on-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-cgws-brand-espresso disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          @click.stop="removeItem(item.id)"
        >
          <UIcon name="i-lucide-x" class="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Upload progress bar -->
    <div
      v-if="uploadProgress !== null"
      class="mt-3"
    >
      <div class="flex items-center justify-between mb-1">
        <p class="font-sans text-xs text-cgws-ink-soft">
          {{ uploadProgressLabel || 'Envoi en cours…' }}
        </p>
        <span class="font-sans text-xs font-semibold text-cgws-accent">{{ uploadProgress }}%</span>
      </div>
      <div class="w-full h-1.5 bg-cgws-hairline rounded-full overflow-hidden">
        <div
          class="h-full bg-cgws-accent rounded-full transition-all duration-300 ease-out"
          :style="{ width: `${uploadProgress}%` }"
          role="progressbar"
          :aria-valuenow="uploadProgress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="uploadProgressLabel || 'Progression de l\'envoi'"
        />
      </div>
    </div>
  </section>
</template>
