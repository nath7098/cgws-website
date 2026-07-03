<script setup lang="ts">
import type { CategoryWithMeta, CategoryFormPayload, ReorderPayload } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Catégories',
})

useSeoMeta({
  title: 'Catégories — CGWS Administration',
  robots: 'noindex, nofollow',
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── State ────────────────────────────────────────────────────────────────────

const categories = ref<CategoryWithMeta[]>([])
const isLoading = ref(false)

const rootCount = computed(() => categories.value.length)
const rootCategories = computed(() => categories.value.filter(c => c.parentId === null))

// Panel state
const panelOpen = ref(false)
const panelMode = ref<'create' | 'edit'>('create')
const panelInitialData = ref<CategoryWithMeta | undefined>()
const isSubmitting = ref(false)

// Delete state
const deleteTarget = ref<CategoryWithMeta | null>(null)
const isDeleting = ref(false)
const showDeleteBlock = ref(false)
const guardProductCount = ref(0)
const canDelete = computed(() => !showDeleteBlock.value)
const deleteModalRef = ref<HTMLElement | null>(null)

// Toast
interface ToastState { type: 'success' | 'error'; message: string }
const toast = ref<ToastState | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

// ─── Data fetching ────────────────────────────────────────────────────────────

async function loadCategories() {
  isLoading.value = true
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ categories: CategoryWithMeta[] }>('/api/admin/categories', {
      headers: buildAuthHeaders(token),
    })
    categories.value = data.categories
  }
  catch {
    showToast('error', 'Erreur lors du chargement des catégories.')
  }
  finally {
    isLoading.value = false
  }
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function openPanel(mode: 'create' | 'edit', category?: CategoryWithMeta) {
  panelMode.value = mode
  panelInitialData.value = category
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
  panelInitialData.value = undefined
}

async function handleSubmit(payload: CategoryFormPayload) {
  if (panelMode.value === 'create') {
    await handleCreate(payload)
  }
  else {
    await handleEdit(payload)
  }
}

async function handleCreate(payload: CategoryFormPayload) {
  isSubmitting.value = true
  try {
    const token = await getAccessToken()
    await $fetch('/api/admin/categories', {
      method: 'POST',
      body: payload,
      headers: buildAuthHeaders(token),
    })
    closePanel()
    await loadCategories()
    showToast('success', `Catégorie « ${payload.name} » créée avec succès.`)
  }
  catch {
    showToast('error', 'Une erreur est survenue lors de la création.')
  }
  finally {
    isSubmitting.value = false
  }
}

async function handleEdit(payload: CategoryFormPayload) {
  if (!panelInitialData.value) return
  isSubmitting.value = true
  try {
    const token = await getAccessToken()
    await $fetch(`/api/admin/categories/${panelInitialData.value.id}`, {
      method: 'PUT',
      body: payload,
      headers: buildAuthHeaders(token),
    })
    closePanel()
    await loadCategories()
    showToast('success', `Catégorie « ${payload.name} » mise à jour.`)
  }
  catch {
    showToast('error', 'Une erreur est survenue lors de la mise à jour.')
  }
  finally {
    isSubmitting.value = false
  }
}

// ─── Toggle active (optimistic) ──────────────────────────────────────────────

async function handleToggleActive(id: string, newValue: boolean) {
  const cat = findCategory(categories.value, id)
  if (cat) cat.isActive = newValue
  try {
    const token = await getAccessToken()
    await $fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: { isActive: newValue },
      headers: buildAuthHeaders(token),
    })
    showToast('success', newValue ? 'Catégorie activée.' : 'Catégorie désactivée.')
  }
  catch {
    if (cat) cat.isActive = !newValue
    showToast('error', 'Impossible de modifier la visibilité.')
  }
}

// ─── Reorder ─────────────────────────────────────────────────────────────────

async function handleReorder(payload: ReorderPayload) {
  try {
    const token = await getAccessToken()
    await $fetch('/api/admin/categories/reorder', {
      method: 'PATCH',
      body: payload,
      headers: buildAuthHeaders(token),
    })
  }
  catch {
    showToast('error', 'Impossible de sauvegarder l\'ordre.')
    await loadCategories()
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

function openDelete(category: CategoryWithMeta) {
  const totalProducts = category.productCount
    + category.children.reduce((sum, c) => sum + c.productCount, 0)

  if (totalProducts > 0) {
    guardProductCount.value = totalProducts
    showDeleteBlock.value = true
  }
  else {
    showDeleteBlock.value = false
  }
  deleteTarget.value = category
  nextTick(() => {
    const first = deleteModalRef.value?.querySelector<HTMLElement>('button:not([disabled])')
    first?.focus()
  })
}

function closeDeleteModal() {
  deleteTarget.value = null
}

function handleDeleteModalKeydown(event: KeyboardEvent) {
  if (!deleteModalRef.value) return
  const focusables = Array.from(
    deleteModalRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  )
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (event.key === 'Tab') {
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  const target = deleteTarget.value
  try {
    const token = await getAccessToken()
    await $fetch(`/api/admin/categories/${target.id}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(token),
    })
    showToast('success', `Catégorie « ${target.name} » supprimée.`)
    deleteTarget.value = null
    await loadCategories()
  }
  catch {
    showToast('error', 'Impossible de supprimer cette catégorie.')
  }
  finally {
    isDeleting.value = false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findCategory(list: CategoryWithMeta[], id: string): CategoryWithMeta | undefined {
  for (const cat of list) {
    if (cat.id === id) return cat
    const child = cat.children.find(c => c.id === id)
    if (child) return child
  }
}

function showToast(type: 'success' | 'error', message: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { type, message }
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  loadCategories()
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="font-serif font-bold text-2xl text-cgws-ink">
          Catégories
        </h2>
        <p class="font-sans text-sm text-cgws-ink-soft mt-0.5">
          {{ rootCount }} catégorie{{ rootCount !== 1 ? 's' : '' }} · 2 niveaux maximum
        </p>
      </div>
      <CgwsButton
        variant="primary"
        size="sm"
        type="button"
        @click="openPanel('create')"
      >
        <UIcon
          name="i-lucide-plus"
          class="w-4 h-4 mr-1.5"
          aria-hidden="true"
        />
        <span class="hidden sm:inline">Ajouter une catégorie</span>
        <span class="sm:hidden">Ajouter</span>
      </CgwsButton>
    </div>

    <!-- Category tree -->
    <CategoryTree
      :categories="categories"
      :loading="isLoading"
      @edit="(cat) => openPanel('edit', cat)"
      @delete="openDelete"
      @toggle-active="handleToggleActive"
      @reorder="handleReorder"
    />

    <!-- Side panel -->
    <CategoryPanel
      :open="panelOpen"
      :mode="panelMode"
      :initial-data="panelInitialData"
      :root-categories="rootCategories"
      :is-submitting="isSubmitting"
      @submit="handleSubmit"
      @close="closePanel"
    />

    <!-- Delete modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="deleteTarget"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          @keydown.esc="closeDeleteModal"
          @keydown="handleDeleteModalKeydown"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-cgws-ink/60 backdrop-blur-sm"
            aria-hidden="true"
            @click="!isDeleting && closeDeleteModal()"
          />

          <!-- Case 1: can delete -->
          <div
            v-if="canDelete"
            ref="deleteModalRef"
            class="relative bg-white border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-danger/10 flex items-center justify-center">
                <UIcon
                  name="i-lucide-triangle-alert"
                  class="w-5 h-5 text-cgws-danger"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3
                  id="delete-modal-title"
                  class="font-serif font-bold text-lg text-cgws-ink"
                >
                  Supprimer « {{ deleteTarget.name }} » ?
                </h3>
                <p class="font-sans text-sm text-cgws-ink-soft mt-1">
                  <template v-if="deleteTarget.children.length > 0">
                    Cette catégorie et ses
                    <strong class="text-cgws-ink">{{ deleteTarget.children.length }} sous-catégorie{{ deleteTarget.children.length !== 1 ? 's' : '' }}</strong>
                    seront définitivement supprimées.
                  </template>
                  <template v-else>
                    Cette catégorie sera définitivement supprimée.
                  </template>
                  Cette action est irréversible.
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <CgwsButton
                variant="secondary"
                size="sm"
                type="button"
                :disabled="isDeleting"
                @click="closeDeleteModal"
              >
                Annuler
              </CgwsButton>
              <button
                type="button"
                :disabled="isDeleting"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-cgws-danger text-cgws-on-danger font-sans text-sm font-semibold hover:bg-cgws-brand-espresso transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                @click="confirmDelete"
              >
                <span
                  v-if="isDeleting"
                  class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                Supprimer
              </button>
            </div>
          </div>

          <!-- Case 2: delete blocked (has products) -->
          <div
            v-else
            ref="deleteModalRef"
            class="relative bg-white border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-hairline flex items-center justify-center">
                <UIcon
                  name="i-lucide-shield-alert"
                  class="w-5 h-5 text-cgws-ink-soft"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3
                  id="delete-modal-title"
                  class="font-serif font-bold text-lg text-cgws-ink"
                >
                  Suppression impossible
                </h3>
                <p class="font-sans text-sm text-cgws-ink-soft mt-1">
                  <strong class="text-cgws-ink">{{ deleteTarget.name }}</strong>
                  contient
                  <strong class="text-cgws-ink">{{ guardProductCount }} produit{{ guardProductCount !== 1 ? 's' : '' }}</strong>.
                  Réaffectez ou supprimez ces produits avant de supprimer la catégorie.
                </p>
                <NuxtLink
                  to="/admin/produits"
                  class="inline-flex items-center gap-1 mt-3 font-sans text-xs text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                >
                  <UIcon
                    name="i-lucide-external-link"
                    class="w-3.5 h-3.5"
                    aria-hidden="true"
                  />
                  Gérer les produits
                </NuxtLink>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <CgwsButton
                variant="secondary"
                size="sm"
                type="button"
                @click="closeDeleteModal"
              >
                Fermer
              </CgwsButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
          class="fixed top-4 right-4 z-[60] flex items-center gap-3 bg-cgws-brand-espresso text-cgws-brand-cream px-4 py-3 rounded-sm shadow-lg border-l-4 transition-all duration-300"
          :class="toast.type === 'error' ? 'border-cgws-danger' : 'border-cgws-accent'"
        >
          <UIcon
            :name="toast.type === 'error' ? 'i-lucide-x-circle' : 'i-lucide-check-circle'"
            class="w-5 h-5 flex-shrink-0"
            :class="toast.type === 'error' ? 'text-cgws-danger' : 'text-cgws-accent'"
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
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

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
