<script setup lang="ts">
import type { CategoryWithMeta, CategoryFormPayload } from '~/types'

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: CategoryWithMeta
  rootCategories: CategoryWithMeta[]
  isSubmitting?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [payload: CategoryFormPayload]
  close: []
}>()

// ─── Form state ───────────────────────────────────────────────────────────────

const form = reactive<CategoryFormPayload>({
  name: '',
  slug: '',
  parentId: null,
  isActive: true,
})

const errors = reactive<Partial<Record<'name' | 'slug', string>>>({})
const slugAutoSync = ref(true)

const slugPreview = computed(() => form.slug || slugify(form.name))

const parentName = computed(
  () => props.rootCategories.find(c => c.id === form.parentId)?.name ?? '',
)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function onNameInput() {
  if (slugAutoSync.value) {
    form.slug = slugify(form.name)
  }
}

watch(() => form.slug, (newSlug) => {
  if (newSlug !== slugify(form.name)) {
    slugAutoSync.value = false
  }
})

function validateField(field: 'name' | 'slug'): boolean {
  errors[field] = undefined
  if (field === 'name' && !form.name.trim()) {
    errors.name = 'Le nom est obligatoire.'
    return false
  }
  if (field === 'slug') {
    if (!form.slug.trim()) {
      errors.slug = 'Le slug est obligatoire.'
      return false
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errors.slug = 'Uniquement minuscules, chiffres et tirets (ex. selles-western).'
      return false
    }
  }
  return true
}

function handleSubmit() {
  const nameOk = validateField('name')
  const slugOk = validateField('slug')
  if (!nameOk || !slugOk) return
  emit('submit', { ...form })
}

// ─── Focus management ─────────────────────────────────────────────────────────

const panelRef = ref<HTMLElement | null>(null)
let prevFocusEl: HTMLElement | null = null

watch(() => props.open, (open) => {
  if (open) {
    // Reset form
    form.name = props.initialData?.name ?? ''
    form.slug = props.initialData?.slug ?? ''
    form.parentId = props.initialData?.parentId ?? null
    form.isActive = props.initialData?.isActive ?? true
    slugAutoSync.value = props.mode === 'create'
    errors.name = undefined
    errors.slug = undefined

    prevFocusEl = document.activeElement as HTMLElement | null
    nextTick(() => {
      panelRef.value?.querySelector<HTMLElement>('input')?.focus()
    })
  }
  else {
    prevFocusEl?.focus()
    prevFocusEl = null
  }
})

watch(() => props.initialData, (data) => {
  if (props.open) {
    form.name = data?.name ?? ''
    form.slug = data?.slug ?? ''
    form.parentId = data?.parentId ?? null
    form.isActive = data?.isActive ?? true
    slugAutoSync.value = props.mode === 'create'
    errors.name = undefined
    errors.slug = undefined
  }
})

function handlePanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !panelRef.value) return

  const focusables = Array.from(
    panelRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!

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
</script>

<template>
  <Teleport to="body">
    <Transition name="panel">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex"
        @keydown="handlePanelKeydown"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-cgws-charcoal/40 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="$emit('close')"
        />

        <!-- Panel -->
        <div
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-title"
          class="relative w-full self-end rounded-t-xl max-h-[85dvh] sm:ml-auto sm:w-96 sm:self-auto sm:rounded-none sm:max-h-full sm:h-full bg-cgws-cream border-t sm:border-t-0 sm:border-l border-cgws-leather/30 flex flex-col overflow-y-auto shadow-2xl"
        >
          <!-- Panel header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-cgws-leather/20 bg-white flex-shrink-0">
            <div class="flex items-center gap-2">
              <UIcon
                :name="mode === 'create' ? 'i-lucide-folder-plus' : 'i-lucide-folder-pen'"
                class="w-5 h-5 text-cgws-copper"
                aria-hidden="true"
              />
              <h3
                id="panel-title"
                class="font-serif font-bold text-lg text-cgws-charcoal"
              >
                {{ mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie' }}
              </h3>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-copper hover:bg-cgws-copper/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
              aria-label="Fermer le panneau"
              @click="$emit('close')"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <!-- Form body -->
          <form
            class="flex-1 flex flex-col px-5 py-5 space-y-5 overflow-y-auto"
            novalidate
            @submit.prevent="handleSubmit"
          >
            <!-- Name field -->
            <div class="space-y-1">
              <label
                for="cat-name"
                class="block font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather"
              >
                Nom
                <span class="text-cgws-rust ml-0.5" aria-hidden="true">*</span>
                <span class="sr-only">(obligatoire)</span>
              </label>
              <input
                id="cat-name"
                v-model="form.name"
                type="text"
                required
                autocomplete="off"
                placeholder="ex. Selles western"
                class="w-full px-3 py-2 bg-white border rounded-sm font-sans text-sm text-cgws-charcoal placeholder:text-cgws-rope outline-none transition-colors duration-150"
                :class="errors.name
                  ? 'border-cgws-rust focus:border-cgws-rust focus:ring-2 focus:ring-cgws-rust/20'
                  : 'border-cgws-leather/40 focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20'"
                :aria-invalid="!!errors.name"
                aria-describedby="cat-name-hint cat-name-error"
                @input="onNameInput"
                @blur="validateField('name')"
              >
              <p
                id="cat-name-hint"
                class="font-sans text-xs text-cgws-leather"
              >
                URL : <code class="text-cgws-copper font-mono">/catalogue/{{ slugPreview || '…' }}</code>
              </p>
              <p
                v-if="errors.name"
                id="cat-name-error"
                role="alert"
                class="font-sans text-xs text-cgws-rust"
              >
                {{ errors.name }}
              </p>
            </div>

            <!-- Slug field -->
            <div class="space-y-1">
              <label
                for="cat-slug"
                class="block font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather"
              >
                Slug
                <span class="text-cgws-rust ml-0.5" aria-hidden="true">*</span>
                <span class="sr-only">(obligatoire)</span>
              </label>
              <input
                id="cat-slug"
                v-model="form.slug"
                type="text"
                required
                autocomplete="off"
                placeholder="selles-western"
                class="w-full px-3 py-2 bg-white border rounded-sm font-mono text-sm text-cgws-charcoal placeholder:text-cgws-rope/60 outline-none transition-colors duration-150"
                :class="errors.slug
                  ? 'border-cgws-rust focus:border-cgws-rust focus:ring-2 focus:ring-cgws-rust/20'
                  : 'border-cgws-leather/40 focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20'"
                :aria-invalid="!!errors.slug"
                aria-describedby="cat-slug-hint cat-slug-error"
                @blur="validateField('slug')"
              >
              <p
                id="cat-slug-hint"
                class="font-sans text-[11px] text-cgws-leather/70"
              >
                Uniquement minuscules, chiffres et tirets. Modifier manuellement uniquement si nécessaire.
              </p>
              <p
                v-if="errors.slug"
                id="cat-slug-error"
                role="alert"
                class="font-sans text-xs text-cgws-rust"
              >
                {{ errors.slug }}
              </p>
            </div>

            <!-- Parent category -->
            <div class="space-y-1">
              <label
                for="cat-parent"
                class="block font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather"
              >
                Catégorie parente
              </label>
              <select
                id="cat-parent"
                v-model="form.parentId"
                class="w-full px-3 py-2 bg-white border border-cgws-leather/40 rounded-sm font-sans text-sm text-cgws-charcoal appearance-none outline-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 transition-colors duration-150"
                aria-describedby="cat-parent-hint"
              >
                <option :value="null">
                  Aucune (catégorie racine)
                </option>
                <option
                  v-for="root in rootCategories"
                  :key="root.id"
                  :value="root.id"
                  :disabled="mode === 'edit' && initialData?.id === root.id"
                >
                  {{ root.name }}
                </option>
              </select>
              <p
                id="cat-parent-hint"
                class="font-sans text-[11px] text-cgws-leather/70"
              >
                <template v-if="form.parentId">
                  Cette catégorie apparaîtra sous
                  <strong class="text-cgws-charcoal">{{ parentName }}</strong>.
                  Maximum 2 niveaux — une sous-catégorie ne peut pas avoir d'enfants.
                </template>
                <template v-else>
                  Laissez vide pour créer une catégorie de premier niveau.
                </template>
              </p>
            </div>

            <!-- Visibility toggle -->
            <div class="space-y-2">
              <p class="font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather">
                Visibilité catalogue
              </p>
              <label class="flex items-center gap-3 cursor-pointer group">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="form.isActive"
                  aria-label="Visible dans le catalogue public"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2"
                  :class="form.isActive ? 'bg-cgws-copper' : 'bg-cgws-leather/30'"
                  @click="form.isActive = !form.isActive"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                    :class="form.isActive ? 'translate-x-6' : 'translate-x-1'"
                    aria-hidden="true"
                  />
                </button>
                <span class="font-sans text-sm text-cgws-charcoal group-hover:text-cgws-copper transition-colors">
                  {{ form.isActive ? 'Visible dans le catalogue' : 'Masqué du catalogue' }}
                </span>
              </label>
              <p class="font-sans text-[11px] text-cgws-leather/70 ml-14">
                Une catégorie inactive n'apparaît pas sur le site public mais reste accessible en backoffice.
              </p>
            </div>

            <!-- Flex spacer -->
            <div class="flex-1" aria-hidden="true" />
          </form>

          <!-- Footer -->
          <div class="flex items-center justify-between px-5 py-4 border-t border-cgws-leather/20 bg-white flex-shrink-0">
            <CgwsButton
              variant="ghost"
              type="button"
              @click="$emit('close')"
            >
              Annuler
            </CgwsButton>
            <CgwsButton
              variant="primary"
              type="button"
              size="sm"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              @click="handleSubmit"
            >
              {{ isSubmitting
                ? (mode === 'create' ? 'CRÉATION…' : 'ENREGISTREMENT…')
                : (mode === 'create' ? 'CRÉER' : 'ENREGISTRER') }}
            </CgwsButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Desktop: slide from right */
@media (min-width: 640px) {
  .panel-enter-active,
  .panel-leave-active {
    transition: opacity 0.25s ease;
  }
  .panel-enter-from,
  .panel-leave-to {
    opacity: 0;
  }
  .panel-enter-active .relative,
  .panel-leave-active .relative {
    transition: transform 0.25s ease;
  }
  .panel-enter-from .relative,
  .panel-leave-to .relative {
    transform: translateX(100%);
  }
}

/* Mobile: slide from bottom */
@media (max-width: 639px) {
  .panel-enter-active,
  .panel-leave-active {
    transition: opacity 0.3s ease;
  }
  .panel-enter-from,
  .panel-leave-to {
    opacity: 0;
  }
  .panel-enter-active .relative,
  .panel-leave-active .relative {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .panel-enter-from .relative,
  .panel-leave-to .relative {
    transform: translateY(100%);
  }
}
</style>
