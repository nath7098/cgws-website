<script setup lang="ts">
import Sortable from 'sortablejs'
import type { CategoryWithMeta } from '~/types'

interface Props {
  category: CategoryWithMeta
  level: 1 | 2
  siblings: CategoryWithMeta[]
}

interface ReorderItem {
  id: string
  sortOrder: number
  parentId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [category: CategoryWithMeta]
  delete: [category: CategoryWithMeta]
  toggleActive: [payload: { id: string; value: boolean }]
  childReorder: [parentId: string, items: ReorderItem[]]
  siblingReorder: [items: ReorderItem[]]
}>()

const isExpanded = ref(true)
const childSortableRef = ref<HTMLElement | null>(null)
let childSortable: Sortable | null = null

const hasChildren = computed(() => props.level === 1 && props.category.children.length > 0)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// ─── Keyboard accessibility: move up/down ────────────────────────────────────

const sortedSiblings = computed(() => [...props.siblings].sort((a, b) => a.sortOrder - b.sortOrder))
const myIndex = computed(() => sortedSiblings.value.findIndex(s => s.id === props.category.id))
const isFirst = computed(() => myIndex.value <= 0)
const isLast = computed(() => myIndex.value >= sortedSiblings.value.length - 1)

function moveUp() {
  const sorted = [...sortedSiblings.value]
  const idx = myIndex.value
  if (idx <= 0) return
  ;[sorted[idx - 1], sorted[idx]] = [sorted[idx]!, sorted[idx - 1]!]
  emit('siblingReorder', sorted.map((s, i) => ({
    id: s.id,
    sortOrder: i,
    parentId: s.parentId,
  })))
}

function moveDown() {
  const sorted = [...sortedSiblings.value]
  const idx = myIndex.value
  if (idx >= sorted.length - 1) return
  ;[sorted[idx], sorted[idx + 1]] = [sorted[idx + 1]!, sorted[idx]!]
  emit('siblingReorder', sorted.map((s, i) => ({
    id: s.id,
    sortOrder: i,
    parentId: s.parentId,
  })))
}

// ─── Sortable for child items ─────────────────────────────────────────────────

watch([isExpanded, childSortableRef], async ([expanded, el]) => {
  if (!expanded || !el) {
    childSortable?.destroy()
    childSortable = null
    return
  }
  await nextTick()
  childSortable?.destroy()
  childSortable = Sortable.create(el, {
    animation: 150,
    handle: '[data-drag-handle]',
    ghostClass: 'opacity-40',
    chosenClass: 'ring-1 ring-cgws-accent ring-inset',
    group: { name: `children-${props.category.id}`, pull: false, put: false },
    onEnd(evt) {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return
      if (evt.oldIndex === evt.newIndex) return
      const items = Array.from(el!.querySelectorAll<HTMLElement>(':scope > [data-category-id]'))
        .map((node, idx) => ({
          id: node.getAttribute('data-category-id')!,
          sortOrder: idx,
          parentId: props.category.id,
        }))
      emit('childReorder', props.category.id, items)
    },
  })
}, { immediate: false })

onUnmounted(() => {
  childSortable?.destroy()
})
</script>

<template>
  <li
    :data-category-id="category.id"
    role="treeitem"
    :aria-expanded="hasChildren ? isExpanded : undefined"
    :aria-selected="false"
    class="list-none"
    :class="{ 'opacity-60': !category.isActive }"
  >
    <!-- Node row -->
    <div
      class="flex items-center gap-2 px-4 py-3 group transition-colors duration-100"
      :class="level === 1
        ? 'bg-white hover:bg-cgws-surface/20'
        : 'bg-cgws-ground hover:bg-cgws-surface/30 pl-10'"
    >
      <!-- Drag handle (hidden on mobile) -->
      <button
        type="button"
        data-drag-handle
        class="hidden sm:flex flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded-sm text-cgws-ink-soft/40 hover:text-cgws-ink-soft opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
        :aria-label="`Réordonner : ${category.name}`"
        tabindex="-1"
        aria-hidden="true"
      >
        <UIcon name="i-lucide-grip-vertical" class="w-4 h-4" aria-hidden="true" />
      </button>

      <!-- Chevron expand/collapse (level 1 only) -->
      <button
        v-if="level === 1"
        type="button"
        class="flex-shrink-0 p-0.5 rounded-sm text-cgws-ink-soft/60 hover:text-cgws-ink-soft transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
        :aria-label="isExpanded ? `Réduire ${category.name}` : `Développer ${category.name}`"
        :aria-controls="`children-${category.id}`"
        :aria-expanded="isExpanded"
        @click="toggleExpand"
      >
        <UIcon
          :name="hasChildren ? (isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right') : 'i-lucide-minus'"
          class="w-4 h-4 transition-transform duration-200"
          aria-hidden="true"
        />
      </button>

      <!-- Level 2 depth indicator -->
      <span
        v-if="level === 2"
        class="flex-shrink-0 w-4 text-cgws-ink-soft/30 font-sans text-sm select-none"
        aria-hidden="true"
      >└</span>

      <!-- Category name -->
      <span
        class="flex-1 min-w-0 font-sans text-sm truncate"
        :class="[
          level === 1 ? 'font-semibold text-cgws-ink' : 'font-medium text-cgws-ink-soft',
          !category.isActive && 'line-through decoration-cgws-hairline',
        ]"
      >
        {{ category.name }}
      </span>

      <!-- Slug preview (level 1, desktop only) -->
      <span class="hidden lg:inline font-mono text-[11px] text-cgws-ink-soft/50 flex-shrink-0 mr-2">
        /{{ category.slug }}
      </span>

      <!-- Sub-category badge (level 1, tablet+) -->
      <span
        v-if="level === 1"
        class="hidden sm:inline-flex items-center gap-1 bg-cgws-surface border border-cgws-hairline rounded-full px-2 py-0.5 font-sans text-[10px] text-cgws-ink-soft flex-shrink-0"
        :aria-label="`${category.children.length} sous-catégorie${category.children.length !== 1 ? 's' : ''}`"
      >
        <UIcon name="i-lucide-folder" class="w-3 h-3" aria-hidden="true" />
        {{ category.children.length }}
      </span>

      <!-- Product count badge (tablet+) -->
      <span
        v-if="category.productCount > 0"
        class="hidden sm:inline-flex bg-cgws-accent/10 text-cgws-accent rounded-full px-2 py-0.5 font-sans text-[10px] font-medium flex-shrink-0"
        :aria-label="`${category.productCount} produit${category.productCount !== 1 ? 's' : ''}`"
      >
        {{ category.productCount }} produit{{ category.productCount !== 1 ? 's' : '' }}
      </span>

      <!-- Keyboard accessibility: move up/down (sr-only, visible on focus) -->
      <div class="sr-only focus-within:not-sr-only flex gap-1 flex-shrink-0">
        <button
          type="button"
          class="p-1 text-xs bg-cgws-surface border border-cgws-hairline rounded-sm focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none"
          :aria-label="`Déplacer ${category.name} vers le haut`"
          :disabled="isFirst"
          @click="moveUp"
        >
          <UIcon name="i-lucide-chevron-up" class="w-3 h-3" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="p-1 text-xs bg-cgws-surface border border-cgws-hairline rounded-sm focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:outline-none"
          :aria-label="`Déplacer ${category.name} vers le bas`"
          :disabled="isLast"
          @click="moveDown"
        >
          <UIcon name="i-lucide-chevron-down" class="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      <!-- Inline actions -->
      <div class="flex items-center gap-1 flex-shrink-0 ml-1">
        <!-- Toggle is_active -->
        <button
          type="button"
          role="switch"
          :aria-checked="category.isActive"
          :aria-label="category.isActive ? `Désactiver ${category.name}` : `Activer ${category.name}`"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2"
          :class="category.isActive ? 'bg-cgws-accent' : 'bg-cgws-hairline'"
          @click="$emit('toggleActive', { id: category.id, value: !category.isActive })"
        >
          <span
            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
            :class="category.isActive ? 'translate-x-4' : 'translate-x-0.5'"
            aria-hidden="true"
          />
        </button>

        <!-- Edit button -->
        <button
          type="button"
          class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-accent/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          :aria-label="`Modifier ${category.name}`"
          @click="$emit('edit', category)"
        >
          <UIcon name="i-lucide-pencil" class="w-4 h-4" aria-hidden="true" />
        </button>

        <!-- Delete button -->
        <button
          type="button"
          class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-danger hover:bg-cgws-danger/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          :aria-label="`Supprimer ${category.name}`"
          @click="$emit('delete', category)"
        >
          <UIcon name="i-lucide-trash-2" class="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Children list (level 1 only, collapsible) -->
    <Transition name="tree-expand">
      <ul
        v-if="level === 1 && hasChildren && isExpanded"
        :id="`children-${category.id}`"
        ref="childSortableRef"
        role="group"
        class="border-t border-cgws-hairline divide-y divide-cgws-hairline bg-cgws-ground/60"
      >
        <CategoryTreeItem
          v-for="child in category.children"
          :key="child.id"
          :category="child"
          :level="2"
          :siblings="category.children"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @toggle-active="$emit('toggleActive', $event)"
          @sibling-reorder="(items) => $emit('childReorder', category.id, items)"
        />
      </ul>
    </Transition>
  </li>
</template>

<style scoped>
.tree-expand-enter-active,
.tree-expand-leave-active {
  transition: opacity 0.15s ease, max-height 0.2s ease;
  overflow: hidden;
}
.tree-expand-enter-from,
.tree-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.tree-expand-enter-to,
.tree-expand-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
