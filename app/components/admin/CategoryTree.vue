<script setup lang="ts">
import Sortable from 'sortablejs'
import type { CategoryWithMeta, ReorderPayload } from '~/types'

interface Props {
  categories: CategoryWithMeta[]
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [category: CategoryWithMeta]
  delete: [category: CategoryWithMeta]
  toggleActive: [id: string, newValue: boolean]
  reorder: [payload: ReorderPayload]
}>()

const rootSortableRef = ref<HTMLElement | null>(null)
let rootSortable: Sortable | null = null

function initRootSortable() {
  if (!rootSortableRef.value) return
  rootSortable?.destroy()
  rootSortable = Sortable.create(rootSortableRef.value, {
    animation: 150,
    handle: '[data-drag-handle]',
    ghostClass: 'opacity-40',
    chosenClass: 'ring-1 ring-cgws-accent ring-inset',
    dragClass: 'shadow-lg',
    group: { name: 'root-categories', pull: false, put: false },
    onEnd(evt) {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return
      if (evt.oldIndex === evt.newIndex) return
      const items = Array.from(
        rootSortableRef.value!.querySelectorAll<HTMLElement>(':scope > [data-category-id]'),
      ).map((el, idx) => ({
        id: el.getAttribute('data-category-id')!,
        sortOrder: idx,
        parentId: null as string | null,
      }))
      emit('reorder', { items })
    },
  })
}

onMounted(() => {
  if (!props.loading) {
    initRootSortable()
  }
})

watch(() => props.loading, (loading) => {
  if (!loading) {
    nextTick(() => initRootSortable())
  }
})

onUnmounted(() => {
  rootSortable?.destroy()
})

function onChildReorder(
  _parentId: string,
  items: Array<{ id: string; sortOrder: number; parentId: string | null }>,
) {
  emit('reorder', { items })
}

function onSiblingReorder(
  items: Array<{ id: string; sortOrder: number; parentId: string | null }>,
) {
  emit('reorder', { items })
}
</script>

<template>
  <div class="bg-cgws-surface border border-cgws-hairline rounded-[4px] overflow-hidden">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div
        v-for="i in 4"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 border-b border-cgws-hairline last:border-b-0"
      >
        <div class="w-4 h-4 rounded bg-cgws-hairline animate-pulse flex-shrink-0" />
        <div class="w-4 h-4 rounded bg-cgws-hairline animate-pulse flex-shrink-0" />
        <div class="h-4 w-40 rounded bg-cgws-hairline animate-pulse" />
        <div class="ml-auto h-5 w-16 rounded-full bg-cgws-hairline animate-pulse" />
      </div>
    </template>

    <!-- Empty state -->
    <div
      v-else-if="categories.length === 0"
      class="py-16 text-center"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
        aria-hidden="true"
      />
      <p class="font-sans text-sm text-cgws-ink-soft italic">
        Aucune catégorie créée.
      </p>
      <p class="font-sans text-xs text-cgws-ink-soft mt-1">
        Commencez par ajouter une catégorie racine.
      </p>
    </div>

    <!-- Tree -->
    <ul
      v-else
      ref="rootSortableRef"
      role="tree"
      aria-label="Arborescence des catégories"
      class="divide-y divide-cgws-hairline"
      :aria-busy="loading"
    >
      <CategoryTreeItem
        v-for="cat in categories"
        :key="cat.id"
        :category="cat"
        :level="1"
        :siblings="categories"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-active="(payload) => $emit('toggleActive', payload.id, payload.value)"
        @child-reorder="(parentId, items) => onChildReorder(parentId, items)"
        @sibling-reorder="(items) => onSiblingReorder(items)"
      />
    </ul>
  </div>
</template>
