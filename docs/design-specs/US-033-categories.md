# Gestion des Catégories — Spec UX (US-033)

**Purpose**: Interface backoffice permettant à Camille de gérer l'arborescence des catégories du catalogue (2 niveaux max), de les réordonner par glisser-déposer et d'activer/désactiver chaque entrée sans affecter le reste de la page.
**Périmètre**:
- `app/pages/admin/categories/index.vue` — page principale (arborescence + panneau latéral)
- `app/components/admin/CategoryTree.vue` — composant arborescence (racines + enfants)
- `app/components/admin/CategoryTreeItem.vue` — noeud individuel de l'arbre
- `app/components/admin/CategoryPanel.vue` — panneau latéral création / édition
- `server/api/admin/categories/index.get.ts` — liste complète enrichie du comptage produits
- `server/api/admin/categories/index.post.ts` — création
- `server/api/admin/categories/[id].put.ts` — mise à jour
- `server/api/admin/categories/[id].delete.ts` — suppression avec garde
- `server/api/admin/categories/reorder.patch.ts` — réordonnement bulk

---

## Prérequis : type `Category` à ajouter dans `app/types/index.ts`

Le type `Category` n'existe pas encore dans `index.ts`. Le développeur doit l'ajouter avant d'implémenter cette US :

```ts
// À ajouter dans app/types/index.ts

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null   // null = catégorie racine
  sortOrder: number
  isActive: boolean
}

// Version enrichie retournée par GET /api/admin/categories
export interface CategoryWithMeta extends Category {
  productCount: number        // nombre de produits directs (non hérité)
  children: CategoryWithMeta[]  // toujours vide si niveau 2 (pas de niveau 3)
}
```

---

## Contexte layout admin

Tout le contenu s'insère dans `<slot />` de `layouts/admin.vue`. La sidebar desktop (w-64 fixe, `cgws-tack`) est `lg:fixed`, le contenu principal a `lg:pl-64`. La topbar (h-14, `cgws-parchment`) est sticky `top-0 z-20`. La zone `<main>` a `p-4 md:p-6 lg:p-8 overflow-auto`.

Le panneau latéral d'édition est téléporté dans `<body>` pour éviter les conflits de `overflow-auto` avec le `<main>`.

Page : `definePageMeta({ middleware: 'admin', layout: 'admin', title: 'Catégories' })`

---

---

# PAGE — Catégories (`/admin/categories`)

## Layout ASCII (desktop 1280px+)

```
┌─ contenu <slot /> ────────────────────────────────────────────────────────┐
│                                                                             │
│  Catégories                                 [+ Ajouter une catégorie ▶]   │
│  6 catégories · 2 niveaux                                                  │
│  ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│  ┌─ Arborescence ──────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ⠿  ▼  Selles                    [3 sous-cat.]  [●]  [✏]  [🗑]      │   │
│  │       ├─ ⠿  Selles western                      [●]  [✏]  [🗑]      │   │
│  │       ├─ ⠿  Selles endurance                    [●]  [✏]  [🗑]      │   │
│  │       └─ ⠿  Selles de dressage                  [●]  [✏]  [🗑]      │   │
│  │                                                                      │   │
│  │  ⠿  ▼  Brides & Licols           [2 sous-cat.]  [●]  [✏]  [🗑]      │   │
│  │       ├─ ⠿  Brides                              [●]  [✏]  [🗑]      │   │
│  │       └─ ⠿  Licols & Longes                     [○]  [✏]  [🗑]      │   │
│  │                                                                      │   │
│  │  ⠿  ▶  Vêtements                 [0 sous-cat.]  [●]  [✏]  [🗑]      │   │
│  │                                                                      │   │
│  │  ⠿  ▶  Accessoires               [0 sous-cat.]  [●]  [✏]  [🗑]      │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                               ┌── Panneau latéral (si ouvert) ──┐
                                               │  ← Nouvelle catégorie            │
                                               │  ─────────────────────────────── │
                                               │  Nom *                           │
                                               │  [_____________________________] │
                                               │  URL : /catalogue/…              │
                                               │                                  │
                                               │  Slug (modifiable)               │
                                               │  [_____________________________] │
                                               │                                  │
                                               │  Catégorie parente               │
                                               │  [Aucune (catégorie racine) ▼]   │
                                               │                                  │
                                               │  [●] Visible dans le catalogue   │
                                               │                                  │
                                               │  ─────────────────────────────── │
                                               │  [Annuler]    [Enregistrer ▶]   │
                                               └──────────────────────────────────┘
```

## Layout ASCII (mobile 375px)

```
┌──────────────────────────────────────────┐
│  Catégories            [+ Ajouter]       │
│  6 catégories · 2 niveaux               │
│  ──────────────────────────────────────  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ▼  Selles                [●][✏][🗑] │  │  ← grip caché sur mobile
│  │    ┌──────────────────────────────┐│  │
│  │    │ Selles western      [●][✏][🗑]││  │
│  │    │ Selles endurance    [●][✏][🗑]││  │
│  │    │ Selles de dressage  [●][✏][🗑]││  │
│  │    └──────────────────────────────┘│  │
│  │                                    │  │
│  │ ▼  Brides & Licols      [●][✏][🗑] │  │
│  │    ┌──────────────────────────────┐│  │
│  │    │ Brides              [●][✏][🗑]││  │
│  │    │ Licols & Longes     [○][✏][🗑]││  │
│  │    └──────────────────────────────┘│  │
│  │                                    │  │
│  │ ▶  Vêtements            [●][✏][🗑] │  │
│  │ ▶  Accessoires          [●][✏][🗑] │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘

  [Panneau = bottom sheet, height 85dvh, slide-up]
```

## Breakpoints

- **Mobile 375px**: grip handles masqués (drag & drop désactivé sur mobile — trop imprévisible au touch). Réordonnement uniquement sur tablette/desktop. Le panneau latéral devient un bottom sheet (`fixed bottom-0 left-0 right-0 rounded-t-[12px]`). Badge "sous-cat." masqué pour économiser l'espace — uniquement le chevron signale l'existence d'enfants.
- **Tablet 768px**: grip handles visibles, drag & drop actif. Badge sous-catégories visible. Panneau latéral en overlay plein écran (`inset-0`) avec la boite de formulaire centrée.
- **Desktop 1280px**: panneau latéral droit fixe, largeur `w-96`, hauteur pleine, glisse depuis la droite. La liste reste visible derrière.

---

## En-tête de page

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h2 class="font-serif font-bold text-2xl text-cgws-charcoal">Catégories</h2>
    <p class="font-sans text-sm text-cgws-leather mt-0.5">
      {{ rootCount }} catégorie{{ rootCount !== 1 ? 's' : '' }} · 2 niveaux maximum
    </p>
  </div>
  <CgwsButton variant="primary" size="sm" type="button" @click="openPanel('create')">
    <UIcon name="i-lucide-plus" class="w-4 h-4 mr-1.5" aria-hidden="true" />
    Ajouter une catégorie
  </CgwsButton>
</div>
```

---

---

# COMPOSANT `CategoryTree.vue`

**Fichier** : `app/components/admin/CategoryTree.vue`

## Props et emits

```ts
interface Props {
  categories: CategoryWithMeta[]   // liste complète (racines + enfants imbriqués)
  loading?: boolean
}

const emit = defineEmits<{
  edit: [category: CategoryWithMeta]
  delete: [category: CategoryWithMeta]
  toggleActive: [id: string, newValue: boolean]
  reorder: [payload: ReorderPayload]
}>()

interface ReorderPayload {
  items: Array<{ id: string; sortOrder: number; parentId: string | null }>
}
```

## Structure de la liste racine

```html
<!-- CategoryTree.vue -->
<template>
  <div class="bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden">

    <!-- Skeleton chargement -->
    <template v-if="loading">
      <div v-for="i in 4" :key="i"
           class="flex items-center gap-3 px-4 py-3 border-b border-cgws-leather/10 last:border-b-0">
        <div class="w-4 h-4 rounded bg-cgws-leather/10 animate-pulse flex-shrink-0" />
        <div class="w-4 h-4 rounded bg-cgws-leather/10 animate-pulse flex-shrink-0" />
        <div class="h-4 w-40 rounded bg-cgws-leather/10 animate-pulse" />
        <div class="ml-auto h-5 w-16 rounded-full bg-cgws-leather/10 animate-pulse" />
      </div>
    </template>

    <!-- Liste vide -->
    <div v-else-if="categories.length === 0"
         class="py-16 text-center">
      <UIcon name="i-lucide-folder-open"
             class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30" aria-hidden="true" />
      <p class="font-sans text-sm text-cgws-leather italic">
        Aucune catégorie créée.
      </p>
      <p class="font-sans text-xs text-cgws-rope mt-1">
        Commencez par ajouter une catégorie racine.
      </p>
    </div>

    <!-- Arborescence -->
    <ul v-else
        ref="rootSortableRef"
        role="tree"
        aria-label="Arborescence des catégories"
        class="divide-y divide-cgws-leather/10"
        aria-busy="loading">

      <CategoryTreeItem
        v-for="cat in categories"
        :key="cat.id"
        :category="cat"
        :level="1"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-active="$emit('toggleActive', $event.id, $event.value)"
        @child-reorder="(parentId, items) => onChildReorder(parentId, items)"
      />

    </ul>
  </div>
</template>
```

## Initialisation Sortable.js (niveau racine)

```ts
// Dans CategoryTree.vue <script setup>
import Sortable from 'sortablejs'

const rootSortableRef = ref<HTMLElement | null>(null)
let rootSortable: Sortable | null = null

onMounted(() => {
  if (!rootSortableRef.value || props.loading) return
  initRootSortable()
})

watch(() => props.loading, (loading) => {
  if (!loading) nextTick(() => initRootSortable())
})

function initRootSortable() {
  if (!rootSortableRef.value) return
  rootSortable?.destroy()
  rootSortable = Sortable.create(rootSortableRef.value, {
    animation: 150,
    handle: '[data-drag-handle]',
    ghostClass: 'opacity-40 !bg-cgws-parchment',
    chosenClass: 'ring-1 ring-cgws-copper ring-inset',
    dragClass: 'shadow-lg',
    // Empêcher le glissement vers les groupes d'enfants
    group: { name: 'root-categories', pull: false, put: false },
    onEnd(evt) {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return
      if (evt.oldIndex === evt.newIndex) return
      // Recalculer les sortOrder pour toutes les racines dans leur nouvel ordre
      const items = Array.from(rootSortableRef.value!.querySelectorAll(':scope > [data-category-id]'))
        .map((el, idx) => ({
          id: el.getAttribute('data-category-id')!,
          sortOrder: idx,
          parentId: null,
        }))
      emit('reorder', { items })
    },
  })
}

onUnmounted(() => {
  rootSortable?.destroy()
})
```

---

---

# COMPOSANT `CategoryTreeItem.vue`

**Fichier** : `app/components/admin/CategoryTreeItem.vue`

## Props et emits

```ts
interface Props {
  category: CategoryWithMeta
  level: 1 | 2
}

const emit = defineEmits<{
  edit: [category: CategoryWithMeta]
  delete: [category: CategoryWithMeta]
  toggleActive: [payload: { id: string; value: boolean }]
  childReorder: [parentId: string, items: Array<{ id: string; sortOrder: number; parentId: string | null }>]
}>()
```

## Structure HTML d'un noeud

```html
<template>
  <li
    :data-category-id="category.id"
    role="treeitem"
    :aria-expanded="hasChildren ? isExpanded : undefined"
    :aria-selected="false"
    class="list-none"
    :class="{ 'opacity-60': !category.isActive }"
  >
    <!-- Ligne du noeud -->
    <div
      class="flex items-center gap-2 px-4 py-3 group"
      :class="[
        level === 1
          ? 'bg-white hover:bg-cgws-parchment/20'
          : 'bg-cgws-cream hover:bg-cgws-parchment/30 pl-10',
        'transition-colors duration-100',
      ]"
    >
      <!-- Handle drag & drop (masqué sur mobile) -->
      <button
        type="button"
        data-drag-handle
        class="hidden sm:flex flex-shrink-0 cursor-grab active:cursor-grabbing
               p-0.5 rounded-sm text-cgws-leather/40
               hover:text-cgws-leather opacity-0 group-hover:opacity-100
               transition-opacity duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
        :aria-label="`Réordonner : ${category.name}`"
        tabindex="-1"
        aria-hidden="true"
      >
        <UIcon name="i-lucide-grip-vertical" class="w-4 h-4" aria-hidden="true" />
      </button>

      <!-- Chevron expand/collapse (niveau 1 uniquement) -->
      <button
        v-if="level === 1"
        type="button"
        class="flex-shrink-0 p-0.5 rounded-sm text-cgws-leather/60
               hover:text-cgws-leather transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
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

      <!-- Indicateur niveau 2 (tiret de profondeur) -->
      <span v-if="level === 2" class="flex-shrink-0 w-4 text-cgws-leather/30 font-sans text-sm select-none"
            aria-hidden="true">└</span>

      <!-- Nom de la catégorie -->
      <span
        class="flex-1 min-w-0 font-sans text-sm truncate"
        :class="[
          level === 1
            ? 'font-semibold text-cgws-charcoal'
            : 'font-medium text-cgws-leather',
          !category.isActive && 'line-through decoration-cgws-leather/50',
        ]"
      >
        {{ category.name }}
      </span>

      <!-- Slug aperçu (niveau 1, desktop uniquement) -->
      <span class="hidden lg:inline font-mono text-[11px] text-cgws-leather/50 flex-shrink-0 mr-2">
        /{{ category.slug }}
      </span>

      <!-- Badge sous-catégories (niveau 1 uniquement, tablette+) -->
      <span
        v-if="level === 1"
        class="hidden sm:inline-flex items-center gap-1
               bg-cgws-parchment border border-cgws-leather/20 rounded-full
               px-2 py-0.5 font-sans text-[10px] text-cgws-leather flex-shrink-0"
        :aria-label="`${category.children.length} sous-catégorie${category.children.length !== 1 ? 's' : ''}`"
      >
        <UIcon name="i-lucide-folder" class="w-3 h-3" aria-hidden="true" />
        {{ category.children.length }}
      </span>

      <!-- Badge produits (tablette+) -->
      <span
        v-if="category.productCount > 0"
        class="hidden sm:inline-flex
               bg-cgws-copper/10 text-cgws-copper rounded-full
               px-2 py-0.5 font-sans text-[10px] font-medium flex-shrink-0"
        :aria-label="`${category.productCount} produit${category.productCount !== 1 ? 's' : ''}`"
      >
        {{ category.productCount }} produit{{ category.productCount !== 1 ? 's' : '' }}
      </span>

      <!-- Actions inline -->
      <div class="flex items-center gap-1 flex-shrink-0 ml-1">

        <!-- Toggle is_active -->
        <button
          type="button"
          role="switch"
          :aria-checked="category.isActive"
          :aria-label="category.isActive ? `Désactiver ${category.name}` : `Activer ${category.name}`"
          class="relative inline-flex h-5 w-9 items-center rounded-full
                 transition-colors duration-200
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-cgws-copper focus-visible:ring-offset-2"
          :class="category.isActive ? 'bg-cgws-copper' : 'bg-cgws-leather/30'"
          @click="$emit('toggleActive', { id: category.id, value: !category.isActive })"
        >
          <span
            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm
                   transition-transform duration-200"
            :class="category.isActive ? 'translate-x-4' : 'translate-x-0.5'"
            aria-hidden="true"
          />
        </button>

        <!-- Bouton éditer -->
        <button
          type="button"
          class="p-1.5 rounded-sm text-cgws-leather
                 hover:text-cgws-copper hover:bg-cgws-copper/10
                 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
          :aria-label="`Modifier ${category.name}`"
          @click="$emit('edit', category)"
        >
          <UIcon name="i-lucide-pencil" class="w-4 h-4" aria-hidden="true" />
        </button>

        <!-- Bouton supprimer -->
        <button
          type="button"
          class="p-1.5 rounded-sm text-cgws-leather
                 hover:text-cgws-rust hover:bg-cgws-rust/10
                 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
          :aria-label="`Supprimer ${category.name}`"
          @click="$emit('delete', category)"
        >
          <UIcon name="i-lucide-trash-2" class="w-4 h-4" aria-hidden="true" />
        </button>

      </div>
    </div>

    <!-- Sous-catégories (niveau 1 seulement, liste collapsible) -->
    <Transition name="tree-expand">
      <ul
        v-if="level === 1 && hasChildren && isExpanded"
        :id="`children-${category.id}`"
        ref="childSortableRef"
        role="group"
        class="border-t border-cgws-leather/10 divide-y divide-cgws-leather/10
               bg-cgws-cream/60"
      >
        <CategoryTreeItem
          v-for="child in category.children"
          :key="child.id"
          :category="child"
          :level="2"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @toggle-active="$emit('toggleActive', $event)"
        />
      </ul>
    </Transition>

  </li>
</template>
```

## Logique interne (script setup)

```ts
// CategoryTreeItem.vue <script setup>
import Sortable from 'sortablejs'

const isExpanded = ref(true)  // expanded par défaut
const childSortableRef = ref<HTMLElement | null>(null)
let childSortable: Sortable | null = null

const hasChildren = computed(() =>
  props.level === 1 && props.category.children.length > 0
)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// Initialiser Sortable sur la liste d'enfants quand elle est montée
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
    ghostClass: 'opacity-40 !bg-cgws-parchment',
    chosenClass: 'ring-1 ring-cgws-copper ring-inset',
    // Groupe isolé par parent : empêche les sous-catégories de fuir vers une autre liste racine
    group: { name: `children-${props.category.id}`, pull: false, put: false },
    onEnd(evt) {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return
      if (evt.oldIndex === evt.newIndex) return
      const items = Array.from(el!.querySelectorAll(':scope > [data-category-id]'))
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
```

## Transition arbre

```css
/* Dans <style scoped> de CategoryTreeItem.vue */
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
  max-height: 600px;  /* suffisant pour ~10 sous-catégories */
}
```

---

---

# COMPOSANT `CategoryPanel.vue`

**Fichier** : `app/components/admin/CategoryPanel.vue`

Side panel droit sur desktop, bottom sheet sur mobile. Remplace une modale plein écran : la liste reste visible en arrière-plan sur desktop, ce qui permet à Camille de voir l'arborescence pendant la saisie.

## Props et emits

```ts
interface Props {
  mode: 'create' | 'edit'
  initialData?: CategoryWithMeta
  rootCategories: CategoryWithMeta[]  // pour le select "Catégorie parente" — toujours les racines uniquement
  isSubmitting?: boolean
}

const emit = defineEmits<{
  submit: [payload: CategoryFormPayload]
  close: []
}>()

interface CategoryFormPayload {
  name: string
  slug: string
  parentId: string | null
  isActive: boolean
}
```

## Layout ASCII (desktop 1280px — panneau droit)

```
┌─────────────────────────────────────────────────────────────────────┐
│ (backdrop semi-transparent derrière, cliquable pour fermer)          │
│                               ┌─ w-96, h-full, fixed right-0 ──────┐│
│                               │                                      ││
│                               │ ← Nouvelle catégorie        [×]    ││
│                               │ ─────────────────────────────────   ││
│                               │                                      ││
│                               │  Nom *                               ││
│                               │  [______________________________]    ││
│                               │  /catalogue/selles-western           ││
│                               │  (slug auto — modifiable)            ││
│                               │                                      ││
│                               │  Slug *                              ││
│                               │  [______________________________]    ││
│                               │                                      ││
│                               │  Catégorie parente                   ││
│                               │  [Aucune (catégorie racine) ▼]       ││
│                               │  ⚠ Deviendra une sous-catégorie     ││
│                               │                                      ││
│                               │  Visibilité catalogue                ││
│                               │  [●────] Visible (actif)             ││
│                               │                                      ││
│                               │  ─────────────────────────────────   ││
│                               │  [Annuler]        [Enregistrer ▶]   ││
│                               └──────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Structure Tailwind du panneau

```html
<!-- CategoryPanel.vue — dans <Teleport to="body"> -->
<Teleport to="body">
  <Transition name="panel">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex"
      @keydown.esc="$emit('close')"
    >

      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-cgws-charcoal/40 backdrop-blur-[2px]"
        aria-hidden="true"
        @click="$emit('close')"
      />

      <!-- Panel desktop : droit -->
      <div
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'panel-title'"
        class="
          relative ml-auto w-full sm:w-96
          bg-cgws-cream border-l border-cgws-leather/30
          flex flex-col h-full overflow-y-auto shadow-2xl
          /* Bottom sheet sur mobile */
          sm:h-full
          /* Sur mobile : drawer bas. On surcharge avec la variante mobile séparée ci-dessous */
        "
      >

        <!-- En-tête panneau -->
        <div class="flex items-center justify-between px-5 py-4
                    border-b border-cgws-leather/20 bg-white flex-shrink-0">
          <div class="flex items-center gap-2">
            <UIcon
              :name="mode === 'create' ? 'i-lucide-folder-plus' : 'i-lucide-folder-pen'"
              class="w-5 h-5 text-cgws-copper" aria-hidden="true"
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
            class="p-1.5 rounded-sm text-cgws-leather
                   hover:text-cgws-copper hover:bg-cgws-copper/10
                   transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
            aria-label="Fermer le panneau"
            @click="$emit('close')"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <!-- Corps du formulaire -->
        <form
          @submit.prevent="handleSubmit"
          novalidate
          class="flex-1 flex flex-col px-5 py-5 space-y-5 overflow-y-auto"
        >

          <!-- Nom -->
          <div class="space-y-1">
            <label for="cat-name"
                   class="block font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather">
              Nom <span class="text-cgws-rust ml-0.5" aria-hidden="true">*</span>
              <span class="sr-only">(obligatoire)</span>
            </label>
            <input
              id="cat-name"
              v-model="form.name"
              type="text"
              required
              autocomplete="off"
              placeholder="ex. Selles western"
              class="w-full px-3 py-2 bg-white border rounded-sm font-sans text-sm
                     text-cgws-charcoal placeholder:text-cgws-rope outline-none
                     transition-colors duration-150"
              :class="errors.name
                ? 'border-cgws-rust focus:border-cgws-rust focus:ring-2 focus:ring-cgws-rust/20'
                : 'border-cgws-leather/40 focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20'"
              :aria-invalid="!!errors.name"
              aria-describedby="cat-name-hint cat-name-error"
              @input="onNameInput"
              @blur="validateField('name')"
            />
            <!-- Aperçu URL -->
            <p id="cat-name-hint" class="font-sans text-xs text-cgws-leather">
              URL : <code class="text-cgws-copper font-mono">/catalogue/{{ slugPreview || '…' }}</code>
            </p>
            <p v-if="errors.name" id="cat-name-error"
               role="alert" class="font-sans text-xs text-cgws-rust">
              {{ errors.name }}
            </p>
          </div>

          <!-- Slug (modifiable) -->
          <div class="space-y-1">
            <label for="cat-slug"
                   class="block font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather">
              Slug <span class="text-cgws-rust ml-0.5" aria-hidden="true">*</span>
              <span class="sr-only">(obligatoire)</span>
            </label>
            <input
              id="cat-slug"
              v-model="form.slug"
              type="text"
              required
              autocomplete="off"
              placeholder="selles-western"
              class="w-full px-3 py-2 bg-white border rounded-sm font-mono text-sm
                     text-cgws-charcoal placeholder:text-cgws-rope/60 outline-none
                     transition-colors duration-150"
              :class="errors.slug
                ? 'border-cgws-rust focus:border-cgws-rust focus:ring-2 focus:ring-cgws-rust/20'
                : 'border-cgws-leather/40 focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20'"
              :aria-invalid="!!errors.slug"
              aria-describedby="cat-slug-hint cat-slug-error"
              @blur="validateField('slug')"
            />
            <p id="cat-slug-hint" class="font-sans text-[11px] text-cgws-leather/70">
              Uniquement minuscules, chiffres et tirets. Modifier manuellement uniquement si nécessaire.
            </p>
            <p v-if="errors.slug" id="cat-slug-error"
               role="alert" class="font-sans text-xs text-cgws-rust">
              {{ errors.slug }}
            </p>
          </div>

          <!-- Catégorie parente -->
          <div class="space-y-1">
            <label for="cat-parent"
                   class="block font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather">
              Catégorie parente
            </label>
            <select
              id="cat-parent"
              v-model="form.parentId"
              class="w-full px-3 py-2 bg-white border border-cgws-leather/40 rounded-sm
                     font-sans text-sm text-cgws-charcoal appearance-none outline-none
                     focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                     transition-colors duration-150"
              aria-describedby="cat-parent-hint"
            >
              <option :value="null">Aucune (catégorie racine)</option>
              <option
                v-for="root in rootCategories"
                :key="root.id"
                :value="root.id"
                :disabled="mode === 'edit' && initialData?.id === root.id"
              >
                {{ root.name }}
              </option>
            </select>
            <p id="cat-parent-hint" class="font-sans text-[11px] text-cgws-leather/70">
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

          <!-- Visibilité (is_active toggle) -->
          <div class="space-y-2">
            <p class="font-sans text-xs font-semibold uppercase tracking-widest text-cgws-leather">
              Visibilité catalogue
            </p>
            <label class="flex items-center gap-3 cursor-pointer group">
              <!-- Toggle switch -->
              <button
                type="button"
                role="switch"
                :aria-checked="form.isActive"
                aria-label="Visible dans le catalogue public"
                class="relative inline-flex h-6 w-11 items-center rounded-full
                       transition-colors duration-200 flex-shrink-0
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-copper focus-visible:ring-offset-2"
                :class="form.isActive ? 'bg-cgws-copper' : 'bg-cgws-leather/30'"
                @click="form.isActive = !form.isActive"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                         transition-transform duration-200"
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

          <!-- Espace flex pour pousser le footer -->
          <div class="flex-1" aria-hidden="true" />

        </form>

        <!-- Footer boutons -->
        <div class="flex items-center justify-between px-5 py-4
                    border-t border-cgws-leather/20 bg-white flex-shrink-0">
          <CgwsButton variant="ghost" type="button" @click="$emit('close')">
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
```

## Transition du panneau

```css
/* <style scoped> dans CategoryPanel.vue */

/* Desktop : slide depuis la droite */
@media (min-width: 640px) {
  .panel-enter-active,
  .panel-leave-active {
    transition: transform 0.25s ease;
  }
  .panel-enter-active .relative.ml-auto,
  .panel-leave-active .relative.ml-auto {
    transition: transform 0.25s ease;
  }
  .panel-enter-from .relative.ml-auto,
  .panel-leave-to .relative.ml-auto {
    transform: translateX(100%);
  }
  .panel-enter-active,
  .panel-leave-active {
    transition: opacity 0.25s ease;
  }
  .panel-enter-from,
  .panel-leave-to {
    opacity: 0;
  }
}

/* Mobile : slide depuis le bas — bottom sheet */
@media (max-width: 639px) {
  .panel-enter-active .relative.ml-auto,
  .panel-leave-active .relative.ml-auto {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .panel-enter-from .relative.ml-auto,
  .panel-leave-to .relative.ml-auto {
    transform: translateY(100%);
  }
}
```

**Note mobile** : sur mobile, le panneau se comporte en bottom sheet. Appliquer ces classes supplémentaires au panneau via une classe conditionnelle `sm:` :

```html
<!-- Sur l'élément div du panneau, classes Tailwind de positionnement -->
class="
  relative
  /* Mobile : bottom sheet */
  w-full self-end rounded-t-xl max-h-[85dvh]
  /* Tablette+ : side panel droit */
  sm:ml-auto sm:w-96 sm:self-auto sm:rounded-none sm:max-h-full sm:h-full
  bg-cgws-cream border-t sm:border-t-0 sm:border-l border-cgws-leather/30
  flex flex-col overflow-y-auto shadow-2xl
"
```

## Logique formulaire (script setup)

```ts
// CategoryPanel.vue <script setup>

const props = defineProps<Props>()
const emit = defineEmits<{ submit: [payload: CategoryFormPayload]; close: [] }>()

const form = reactive<CategoryFormPayload>({
  name: props.initialData?.name ?? '',
  slug: props.initialData?.slug ?? '',
  parentId: props.initialData?.parentId ?? null,
  isActive: props.initialData?.isActive ?? true,
})

const errors = reactive<Partial<Record<keyof CategoryFormPayload, string>>>({})
const slugAutoSync = ref(props.mode === 'create')  // en création, slug suit le nom automatiquement

const slugPreview = computed(() => form.slug || slugify(form.name))

const parentName = computed(() =>
  props.rootCategories.find(c => c.id === form.parentId)?.name ?? ''
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

// Dès que l'utilisateur modifie le slug manuellement, on désactive la synchro auto
watch(() => form.slug, (newSlug, oldSlug) => {
  if (newSlug !== slugify(form.name) && newSlug !== oldSlug) {
    slugAutoSync.value = false
  }
})

function validateField(field: keyof CategoryFormPayload): boolean {
  delete errors[field]
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

// Focus trap
const panelRef = ref<HTMLElement | null>(null)
// ... (même implémentation que admin.vue getFocusableElements + handleDrawerKeydown)
// Appeler panelRef.value.querySelector('input')?.focus() au nextTick après l'ouverture
```

---

---

# MODALE DE SUPPRESSION

Contrôlée par `deleteTarget: CategoryWithMeta | null` dans `index.vue`. Deux cas à distinguer.

## Cas 1 — Suppression possible (catégorie vide)

```html
<Teleport to="body">
  <Transition name="modal">
    <div v-if="deleteTarget && canDelete"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-labelledby="delete-modal-title"
         @keydown.esc="deleteTarget = null">

      <div class="absolute inset-0 bg-cgws-charcoal/60 backdrop-blur-sm"
           aria-hidden="true" @click="deleteTarget = null" />

      <div class="relative bg-white border-2 border-cgws-charcoal rounded-sm
                  shadow-xl w-full max-w-md p-6 space-y-4">

        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-rust/10
                      flex items-center justify-center">
            <UIcon name="i-lucide-triangle-alert"
                   class="w-5 h-5 text-cgws-rust" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete-modal-title"
                class="font-serif font-bold text-lg text-cgws-charcoal">
              Supprimer « {{ deleteTarget.name }} » ?
            </h3>
            <p class="font-sans text-sm text-cgws-leather mt-1">
              Cette catégorie et ses {{ deleteTarget.children.length }} sous-catégorie{{ deleteTarget.children.length !== 1 ? 's' : '' }}
              seront définitivement supprimées. Cette action est irréversible.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <CgwsButton variant="secondary" size="sm" @click="deleteTarget = null">
            Annuler
          </CgwsButton>
          <button type="button"
                  :disabled="isDeleting"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-sm
                         bg-cgws-rust text-white font-sans text-sm font-semibold
                         hover:bg-cgws-charcoal transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                  @click="confirmDelete">
            <span v-if="isDeleting"
                  class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden="true" />
            Supprimer
          </button>
        </div>

      </div>
    </div>
  </Transition>
</Teleport>
```

## Cas 2 — Suppression bloquée (catégorie avec produits)

Le serveur (DELETE endpoint) retourne `{ canDelete: false, reason: 'has_products', productCount: N }` ou `{ canDelete: false, reason: 'has_children_with_products', productCount: N }`. Le client affiche alors une modale de blocage (sans bouton destructeur) :

```html
<!-- Modale de blocage — pas de bouton "Supprimer" -->
<div class="relative bg-white border-2 border-cgws-charcoal rounded-sm shadow-xl w-full max-w-md p-6 space-y-4">

  <div class="flex items-start gap-4">
    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-leather/10
                flex items-center justify-center">
      <UIcon name="i-lucide-shield-alert"
             class="w-5 h-5 text-cgws-leather" aria-hidden="true" />
    </div>
    <div>
      <h3 class="font-serif font-bold text-lg text-cgws-charcoal">
        Suppression impossible
      </h3>
      <p class="font-sans text-sm text-cgws-leather mt-1">
        <strong class="text-cgws-charcoal">{{ deleteTarget.name }}</strong>
        contient <strong class="text-cgws-charcoal">{{ guardProductCount }} produit{{ guardProductCount !== 1 ? 's' : '' }}</strong>.
        Réaffectez ou supprimez ces produits avant de supprimer la catégorie.
      </p>
      <NuxtLink
        to="/admin/produits"
        class="inline-flex items-center gap-1 mt-3 font-sans text-xs text-cgws-copper hover:underline"
      >
        <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" aria-hidden="true" />
        Gérer les produits
      </NuxtLink>
    </div>
  </div>

  <div class="flex justify-end pt-2">
    <CgwsButton variant="secondary" size="sm" @click="deleteTarget = null">
      Fermer
    </CgwsButton>
  </div>

</div>
```

**Logique côté client** : avant d'appeler l'API DELETE, on peut pré-vérifier avec le `productCount` déjà disponible dans `CategoryWithMeta`. Si `category.productCount > 0 || category.children.some(c => c.productCount > 0)`, afficher directement la modale de blocage sans appel réseau.

---

---

# PAGE `index.vue` — Orchestration

**Fichier** : `app/pages/admin/categories/index.vue`

## Script setup (logique complète)

```ts
definePageMeta({ middleware: 'admin', layout: 'admin', title: 'Catégories' })

const { data: categoriesData, pending, refresh } = await useFetch<{ categories: CategoryWithMeta[] }>(
  '/api/admin/categories',
  { default: () => ({ categories: [] }) }
)

const categories = computed(() => categoriesData.value?.categories ?? [])
const rootCount = computed(() => categories.value.length)

// Panel state
const panelOpen = ref(false)
const panelMode = ref<'create' | 'edit'>('create')
const panelInitialData = ref<CategoryWithMeta | undefined>()
const isSubmitting = ref(false)

function openPanel(mode: 'create' | 'edit', category?: CategoryWithMeta) {
  panelMode.value = mode
  panelInitialData.value = category
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
  panelInitialData.value = undefined
}

// Delete state
const deleteTarget = ref<CategoryWithMeta | null>(null)
const isDeleting = ref(false)
const guardProductCount = ref(0)
const showDeleteBlock = ref(false)

// Toast state
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => { toast.value = null }, 4000)
}

// Racines uniquement pour le select "catégorie parente"
const rootCategories = computed(() =>
  categories.value.filter(c => c.parentId === null)
)

// Handlers
async function handleCreate(payload: CategoryFormPayload) {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/categories', { method: 'POST', body: payload })
    closePanel()
    await refresh()
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
    await $fetch(`/api/admin/categories/${panelInitialData.value.id}`, {
      method: 'PUT', body: payload,
    })
    closePanel()
    await refresh()
    showToast('success', `Catégorie « ${payload.name} » mise à jour.`)
  }
  catch {
    showToast('error', 'Une erreur est survenue lors de la mise à jour.')
  }
  finally {
    isSubmitting.value = false
  }
}

async function handleToggleActive(id: string, newValue: boolean) {
  // Mise à jour optimiste
  const cat = findCategory(categories.value, id)
  if (cat) cat.isActive = newValue
  try {
    await $fetch(`/api/admin/categories/${id}`, {
      method: 'PUT', body: { isActive: newValue },
    })
    showToast('success', newValue ? 'Catégorie activée.' : 'Catégorie désactivée.')
  }
  catch {
    // Rollback
    if (cat) cat.isActive = !newValue
    showToast('error', 'Impossible de modifier la visibilité.')
  }
}

async function handleReorder(payload: ReorderPayload) {
  try {
    await $fetch('/api/admin/categories/reorder', { method: 'PATCH', body: payload })
    // Pas de toast — l'UI a déjà reflété l'ordre visuellement via Sortable
  }
  catch {
    showToast('error', 'Impossible de sauvegarder l\'ordre.')
    await refresh()  // rollback visuel
  }
}

async function openDelete(category: CategoryWithMeta) {
  const totalProducts = category.productCount
    + category.children.reduce((sum, c) => sum + c.productCount, 0)
  if (totalProducts > 0) {
    guardProductCount.value = totalProducts
    showDeleteBlock.value = true
    deleteTarget.value = category
    return
  }
  showDeleteBlock.value = false
  deleteTarget.value = category
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/categories/${deleteTarget.value.id}`, { method: 'DELETE' })
    showToast('success', `Catégorie « ${deleteTarget.value.name} » supprimée.`)
    deleteTarget.value = null
    await refresh()
  }
  catch {
    showToast('error', 'Impossible de supprimer cette catégorie.')
  }
  finally {
    isDeleting.value = false
  }
}

function findCategory(list: CategoryWithMeta[], id: string): CategoryWithMeta | undefined {
  for (const cat of list) {
    if (cat.id === id) return cat
    const child = cat.children.find(c => c.id === id)
    if (child) return child
  }
}
```

---

---

# API ROUTES SERVEUR

## Convention commune

Toutes les routes vérifient l'authentification via `requireAdminAuth(event)` (même helper que US-032). Non-authentifié → `throw createError({ statusCode: 401 })`.

---

## `GET /api/admin/categories` — Liste enrichie

**Fichier** : `server/api/admin/categories/index.get.ts`

Retourne l'arbre complet (racines + enfants) avec comptage de produits par catégorie.

```ts
// Stratégie : une seule requête Supabase pour les catégories + une pour les counts

const { data: rawCategories } = await supabase
  .from('categories')
  .select('*')
  .order('sort_order', { ascending: true })

const { data: productCounts } = await supabase
  .from('products')
  .select('category')
  .eq('status', 'active')

// Compter par slug de catégorie
const countMap: Record<string, number> = {}
for (const { category } of productCounts ?? []) {
  countMap[category] = (countMap[category] ?? 0) + 1
}

// Construire l'arbre (2 niveaux max)
const roots = rawCategories
  ?.filter(c => c.parent_id === null)
  .map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: null,
    sortOrder: c.sort_order,
    isActive: c.is_active,
    productCount: countMap[c.slug] ?? 0,
    children: rawCategories
      .filter(child => child.parent_id === c.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(child => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        parentId: child.parent_id,
        sortOrder: child.sort_order,
        isActive: child.is_active,
        productCount: countMap[child.slug] ?? 0,
        children: [],
      })),
  })) ?? []

return { categories: roots }
```

**Réponse 200** : `{ categories: CategoryWithMeta[] }`

---

## `POST /api/admin/categories` — Création

**Fichier** : `server/api/admin/categories/index.post.ts`

**Body JSON** :
```
name       : string (requis)
slug       : string (requis, format ^[a-z0-9]+(?:-[a-z0-9]+)*$)
parentId   : string UUID | null
isActive   : boolean (défaut true)
```

**Traitement** :
1. Valider `name` (non vide) et `slug` (format + unicité dans `categories.slug`) → 422 si invalide
2. Vérifier que si `parentId` est fourni, la catégorie parente existe et n'est pas elle-même une sous-catégorie (empêcher niveau 3) → 422 si violation
3. Calculer `sort_order` : `MAX(sort_order) + 1` dans le groupe (racine ou enfants du parent)
4. `INSERT INTO categories (name, slug, parent_id, is_active, sort_order) VALUES (...)`

**Réponse 201** : `{ category: Category }`

---

## `PUT /api/admin/categories/[id]` — Mise à jour

**Fichier** : `server/api/admin/categories/[id].put.ts`

**Body JSON** : même champs que POST (tous optionnels — PATCH partiel acceptable).

**Traitement** :
1. Récupérer la catégorie existante → 404 si absente
2. Si `parentId` change : vérifier règle 2 niveaux (nouveau parent ne doit pas lui-même avoir un parent)
3. Si `parentId` change et que la catégorie a des enfants → refuser (`throw createError({ statusCode: 422, message: 'Une catégorie avec des sous-catégories ne peut pas être déplacée en niveau 2.' })`)
4. Si `slug` change : vérifier unicité en excluant l'ID courant
5. `UPDATE categories SET … WHERE id = ?`

**Réponse 200** : `{ category: Category }`

---

## `DELETE /api/admin/categories/[id]` — Suppression avec garde

**Fichier** : `server/api/admin/categories/[id].delete.ts`

**Traitement** :
1. Récupérer la catégorie + ses enfants
2. Collecter tous les slugs impliqués (catégorie + enfants)
3. Compter les produits dans `products` dont `category` est dans ces slugs
4. Si `count > 0` → ne pas supprimer, retourner 409 :
   ```ts
   throw createError({
     statusCode: 409,
     data: { reason: 'has_products', productCount: count },
   })
   ```
5. Si aucun produit : supprimer d'abord les enfants, puis la catégorie parente

**Réponse 200** : `{ success: true, deletedId: id }`

**Note** : le client peut détecter le 409 et afficher la modale de blocage plutôt qu'un toast d'erreur générique.

---

## `PATCH /api/admin/categories/reorder` — Réordonnement bulk

**Fichier** : `server/api/admin/categories/reorder.patch.ts`

**Body JSON** :
```ts
{
  items: Array<{
    id: string         // UUID catégorie
    sortOrder: number  // nouvel index (0-based)
    parentId: string | null
  }>
}
```

**Traitement** : upsert en masse — `UPDATE categories SET sort_order = $1, parent_id = $2 WHERE id = $3` pour chaque item. Utiliser une transaction Supabase si disponible, sinon Promise.all des updates individuels.

**Réponse 200** : `{ updated: number }`

---

---

# ÉTATS ET TRANSITIONS

## États page

| État | Description visuelle |
|------|---------------------|
| Loading | 4 lignes skeleton dans le conteneur `bg-white` |
| Vide | Illustration `i-lucide-folder-open` + invitation à créer |
| Chargé — tout replié | Seules les lignes racine visibles, chevrons `▶` |
| Chargé — tout déployé | Sous-catégories visibles, chevrons `▼` |
| Panel ouvert | Overlay backdrop, panneau slide-in depuis droite / bas |
| Toggle is_active | Mise à jour optimiste instantanée, rollback si erreur |
| Drag en cours | Item source `opacity-40`, placeholder pointillé copper, curseur `grab` |
| Après drop | Animation `Sortable` recomposes, PATCH silencieux en background |
| Delete — possible | Modale de confirmation avec bouton rouge |
| Delete — bloquée | Modale de blocage sans bouton destructeur + lien vers produits |
| Delete en cours | Bouton en loading, modale non-fermable |

## États panneau latéral

| État | Description |
|------|-------------|
| Mode create, vierge | Tous les champs vides, slug vide, parentId null, isActive true |
| Mode create, saisie | Slug se synchronise automatiquement sur le nom |
| Mode edit, chargé | Champs pré-remplis depuis `initialData` |
| Slug modifié manuellement | Désactive la synchro auto du slug |
| Champ en erreur | Bordure `cgws-rust`, message inline sous le champ, `aria-invalid="true"` |
| Submit en cours | Bouton en loading, champs non-disabled (Camille peut corriger) |
| Submit succès | Panneau se ferme, refresh de l'arbre, toast succès |
| Submit erreur serveur (slug dupliqué) | Toast erreur, panneau reste ouvert |

---

---

# ACCESSIBILITÉ

## Arbre (`role="tree"`)

```
role="tree" → ul racine
role="treeitem" → chaque li
aria-expanded="true|false" → sur chaque treeitem de niveau 1 qui a des enfants
role="group" → ul des enfants (sous le treeitem parent)
aria-busy="true" → sur l'arbre pendant le chargement
```

Navigation clavier recommandée (ARIA pattern tree) :
- **Flèches haut/bas** : naviguer entre les items visibles
- **Flèche droite** : déployer un noeud replié, ou descendre dans l'enfant si déjà déployé
- **Flèche gauche** : replier, ou remonter au parent

Implémenter via `@keydown` sur chaque `li[role=treeitem]` avec `focusable` ref management. Chaque `li` doit avoir `tabindex="0"` (actif) ou `tabindex="-1"` (inactif) selon le focus.

## Drag & drop accessible

Le drag & drop SortableJS n'est pas nativement accessible au clavier. Fournir un fallback :

```html
<!-- Boutons de déplacement alternatifs — visibles uniquement au focus clavier -->
<div class="sr-only focus-within:not-sr-only flex gap-1 ml-2">
  <button
    type="button"
    class="p-1 text-xs bg-cgws-parchment border border-cgws-leather/30 rounded-sm
           focus-visible:ring-2 focus-visible:ring-cgws-copper"
    :aria-label="`Déplacer ${category.name} vers le haut`"
    :disabled="category.sortOrder === 0"
    @click="moveUp(category)"
  >
    <UIcon name="i-lucide-chevron-up" class="w-3 h-3" aria-hidden="true" />
  </button>
  <button
    type="button"
    class="p-1 text-xs bg-cgws-parchment border border-cgws-leather/30 rounded-sm
           focus-visible:ring-2 focus-visible:ring-cgws-copper"
    :aria-label="`Déplacer ${category.name} vers le bas`"
    @click="moveDown(category)"
  >
    <UIcon name="i-lucide-chevron-down" class="w-3 h-3" aria-hidden="true" />
  </button>
</div>
```

`moveUp` et `moveDown` calculent les nouveaux `sortOrder` localement et appellent `PATCH /api/admin/categories/reorder`.

## Panneau latéral

- `role="dialog" aria-modal="true"` sur le conteneur panneau
- `aria-labelledby="panel-title"` référence le `<h3>`
- Focus trap : même implémentation que `admin.vue` — `getFocusableElements()` + gestion Tab/Shift-Tab + Escape → fermeture
- Au montage du panneau : `nextTick(() => panelRef.value?.querySelector('input')?.focus())`
- À la fermeture : retour du focus sur le bouton déclencheur (stocker `document.activeElement` avant ouverture)

## Toggle is_active

- `role="switch"` + `aria-checked="true|false"` + `aria-label` avec nom de la catégorie
- Contraste : fond `cgws-copper (#B8650A)` avec dot blanc — le contraste du dot (blanc sur copper) est 3.0:1, acceptable pour un indicateur graphique de 14px+ (WCAG 1.4.11 Non-text contrast ≥ 3:1).

## Contraste texte

| Texte | Fond | Ratio |
|-------|------|-------|
| `cgws-charcoal (#1A0B03)` sur `white` | — | > 18:1 AAA |
| `cgws-leather (#7B3B1C)` sur `white` | — | 6.8:1 AA |
| `cgws-copper (#B8650A)` sur `white` | — | 3.2:1 — grand texte AA uniquement (Bebas Neue, slugs code) |
| `cgws-rope (#C8AB82)` sur `cgws-tack (#3D1A06)` | sidebar | 6.1:1 AA |
| `white` sur `cgws-rust (#943218)` | bouton supprimer | 5.2:1 AA |

---

---

# TAILWIND CLASSES CLÉS — RÉCAPITULATIF

```
/* Conteneur arbre */
bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden

/* En-tête de page admin */
font-serif font-bold text-2xl text-cgws-charcoal

/* Ligne noeud niveau 1 */
flex items-center gap-2 px-4 py-3 group
bg-white hover:bg-cgws-parchment/20 transition-colors duration-100

/* Ligne noeud niveau 2 (sous-catégorie) */
flex items-center gap-2 pl-10 pr-4 py-3 group
bg-cgws-cream hover:bg-cgws-parchment/30 transition-colors duration-100

/* Nom catégorie niveau 1 */
font-sans text-sm font-semibold text-cgws-charcoal

/* Nom catégorie niveau 2 */
font-sans text-sm font-medium text-cgws-leather

/* Badge sous-catégories */
bg-cgws-parchment border border-cgws-leather/20 rounded-full
px-2 py-0.5 font-sans text-[10px] text-cgws-leather

/* Badge comptage produits */
bg-cgws-copper/10 text-cgws-copper rounded-full
px-2 py-0.5 font-sans text-[10px] font-medium

/* Toggle switch actif */
bg-cgws-copper   (conteneur h-5 w-9 ou h-6 w-11)
translate-x-4    (dot)

/* Toggle switch inactif */
bg-cgws-leather/30
translate-x-0.5  (dot)

/* Bouton action icône (neutre) */
p-1.5 rounded-sm text-cgws-leather
hover:text-cgws-copper hover:bg-cgws-copper/10
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper

/* Bouton action icône (danger) */
p-1.5 rounded-sm text-cgws-leather
hover:text-cgws-rust hover:bg-cgws-rust/10
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper

/* Handle drag */
cursor-grab active:cursor-grabbing
opacity-0 group-hover:opacity-100 transition-opacity duration-150

/* Catégorie inactive */
opacity-60

/* Nom catégorie inactive */
line-through decoration-cgws-leather/50

/* Panel latéral (sm+) */
ml-auto w-96 bg-cgws-cream border-l border-cgws-leather/30
flex flex-col h-full shadow-2xl

/* Panel bottom sheet (mobile) */
w-full self-end rounded-t-xl max-h-[85dvh]
bg-cgws-cream border-t border-cgws-leather/30

/* En-tête panneau */
px-5 py-4 border-b border-cgws-leather/20 bg-white flex-shrink-0

/* Footer panneau */
px-5 py-4 border-t border-cgws-leather/20 bg-white flex-shrink-0

/* Champ texte (focus normal) */
border-cgws-leather/40 focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20

/* Champ texte (focus erreur) */
border-cgws-rust focus:border-cgws-rust focus:ring-2 focus:ring-cgws-rust/20

/* Skeleton pulse */
bg-cgws-leather/10 animate-pulse rounded

/* Toast succès */
bg-cgws-tack text-cgws-rope border-l-4 border-cgws-copper px-4 py-3 rounded-sm shadow-lg

/* Toast erreur */
bg-cgws-tack text-cgws-rope border-l-4 border-cgws-rust px-4 py-3 rounded-sm shadow-lg

/* Backdrop modale */
absolute inset-0 bg-cgws-charcoal/60 backdrop-blur-sm

/* Boîte modale */
relative bg-white border-2 border-cgws-charcoal rounded-sm shadow-xl w-full max-w-md p-6
```

---

---

# NOTES IMPLÉMENTATION

## SortableJS — groupes isolés

Pour empêcher rigoureusement le glissement d'un niveau vers l'autre :
- La liste racine a `group: { name: 'root-categories', pull: false, put: false }` — seul un réordonnement interne est possible.
- Chaque liste d'enfants a `group: { name: 'children-[parentId]', pull: false, put: false }` — même isolation.
- Il n'existe donc aucune configuration permettant de drag un item hors de son niveau. Si un besoin futur de "promouvoir une sous-catégorie en racine" émerge, il se fera via le formulaire d'édition (changer `parentId` → `null`), pas via le drag.

## Réordonnement PATCH — payload minimal

Après un `onEnd`, envoyer uniquement les IDs du groupe affecté avec leurs nouveaux `sortOrder`, pas la liste entière. Cela minimise les conflits concurrents.

```ts
// Exemple pour les racines après drag
const items = rootCategories.map((cat, idx) => ({
  id: cat.id,
  sortOrder: idx,
  parentId: null,
}))
emit('reorder', { items })
```

## Slug — unicité

En mode création, la vérification d'unicité se fait côté serveur (POST → 422 si slug déjà pris). Côté client, on peut ajouter une validation asynchrone `onBlur` sur le champ slug avec un `GET /api/admin/categories/check-slug?slug=xxx` (route optionnelle, non bloquante pour la US).

## Suppression sous-catégories orphelines

Si une catégorie racine est supprimée, le serveur supprime en cascade ses sous-catégories (pas de FK CASCADE dans le schéma actuel → gérer manuellement dans la route DELETE : `DELETE FROM categories WHERE parent_id = $id`).

## Catalogue public

L'impact sur le catalogue public est automatique : les pages catalogue lisent les catégories actives depuis Supabase. Lorsque `is_active = false`, la catégorie n'apparaît plus dans les filtres publics (la requête catalogue doit filtrer `WHERE is_active = true`). Aucune modification nécessaire sur les pages catalogue pour cette US — la donnée est la source de vérité.
