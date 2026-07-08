# CRUD Produits — Spec UX (US-032)

**Purpose**: Interface backoffice complète pour créer, lister, modifier et supprimer des produits du catalogue. C'est la US pivot du Sprint 3 — Camille (P1) y passe la majorité de son temps en backoffice.
**Périmètre**:
- `app/pages/admin/produits/index.vue` — liste + recherche + filtres + pagination
- `app/pages/admin/produits/nouveau.vue` — page création (wraps ProductForm)
- `app/pages/admin/produits/[id].vue` — page édition (wraps ProductForm)
- `app/components/admin/ProductForm.vue` — formulaire partagé création/édition
- `app/components/admin/ImageUploader.vue` — drag & drop, preview, réordonnement, 8 images
- `server/api/admin/products/index.get.ts` — liste paginée
- `server/api/admin/products/index.post.ts` — création
- `server/api/admin/products/[id].get.ts` — détail
- `server/api/admin/products/[id].put.ts` — mise à jour
- `server/api/admin/products/[id].delete.ts` — suppression

---

## Contexte layout admin

Tout le contenu s'insère dans `<slot />` de `layouts/admin.vue`. La sidebar desktop (w-64, `cgws-tack`) et la topbar (h-14, `cgws-parchment`) sont gérées par le layout. La zone de contenu hérite de `bg-cgws-cream` et dispose d'un padding `p-4 md:p-6 lg:p-8`. Chaque page définit `definePageMeta({ middleware: 'admin', layout: 'admin' })` avec un titre adapté.

---

---

# PAGE 1 — Liste des produits (`/admin/produits`)

## Layout ASCII (desktop 1280px+)

```
┌─ contenu <slot /> ────────────────────────────────────────────────────────┐
│                                                                             │
│  Produits                                    [+ Ajouter un produit ▶]      │
│  ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│  [🔍 Rechercher par nom ou marque…]  [Catégorie ▼]  [Statut ▼]            │
│                                                                             │
│ ┌──────────────────────────────────────────────────────────────────────┐   │
│ │  [img]  Nom du produit          Catégorie    Prix       Statut   Date│   │
│ │──────────────────────────────────────────────────────────────────────│   │
│ │  [40px] Selle de Trail Bob Lee  Selles     480,00 €  [Disponible]   │   │
│ │                                                       28/06/26  [✏][🗑]│  │
│ │  [40px] Botte Western Nocona    Bottes     120,00 €  [Vendu]         │   │
│ │                                                       27/06/26  [✏][🗑]│  │
│ │  [40px] Bride King Series       Brides & L  85,00 €  [Réservé]       │   │
│ │                                                       25/06/26  [✏][🗑]│  │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  47 produits · page 1 de 3              [◀]  1  [2]  3  [▶]               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Breakpoints

- **Mobile 375px**: colonne catégorie masquée, colonne date masquée, prix affiché sous le nom (2 lignes dans la cellule nom/prix), actions en icône seule. Tableau remplacé par une liste de cartes `bg-white border border-cgws-leather/30 rounded-[4px]` empilées.
- **Tablet 768px**: tableau complet sans la colonne date, catégorie visible, actions avec icônes + tooltips.
- **Desktop 1440px**: tous les colonnes visibles, densité standard.

## En-tête de page

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h2 class="font-serif font-bold text-2xl text-cgws-charcoal">Produits</h2>
    <p class="font-sans text-sm text-cgws-leather mt-0.5">
      {{ totalCount }} produit{{ totalCount !== 1 ? 's' : '' }} au catalogue
    </p>
  </div>
  <CgwsButton variant="primary" size="sm" as="NuxtLink" to="/admin/produits/nouveau">
    <UIcon name="i-lucide-plus" class="w-4 h-4 mr-1.5" aria-hidden="true" />
    Ajouter un produit
  </CgwsButton>
</div>
```

## Barre de recherche + filtres

```html
<!-- Toolbar : bg-white border rounded, une seule ligne à md+ -->
<div class="bg-white border border-cgws-leather/30 rounded-[4px] p-3 flex flex-col sm:flex-row gap-3 mb-4">

  <!-- Champ de recherche -->
  <div class="relative flex-1 min-w-0">
    <UIcon name="i-lucide-search"
           class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-rope pointer-events-none"
           aria-hidden="true" />
    <input
      v-model="searchQuery"
      type="search"
      placeholder="Rechercher par nom ou marque…"
      class="w-full pl-9 pr-3 py-2 bg-cgws-cream border border-cgws-leather/40
             rounded-sm font-sans text-sm text-cgws-charcoal
             placeholder:text-cgws-rope outline-none
             focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20"
      aria-label="Rechercher un produit par nom ou marque"
    />
  </div>

  <!-- Filtre catégorie -->
  <select v-model="filterCategory"
          class="py-2 px-3 pr-8 bg-cgws-cream border border-cgws-leather/40 rounded-sm
                 font-sans text-sm text-cgws-charcoal appearance-none
                 focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 outline-none
                 min-w-[160px]"
          aria-label="Filtrer par catégorie">
    <option value="">Toutes catégories</option>
    <option value="selles">Selles</option>
    <option value="brides-licols">Brides & Licols</option>
    <option value="bottes-chaussures">Bottes & Chaussures</option>
    <option value="vetements">Vêtements</option>
    <option value="accessoires">Accessoires</option>
    <option value="protections">Protections</option>
  </select>

  <!-- Filtre statut -->
  <select v-model="filterStatus"
          class="[même classes que filtre catégorie] min-w-[140px]"
          aria-label="Filtrer par statut">
    <option value="">Tous statuts</option>
    <option value="active">Disponible</option>
    <option value="sold">Vendu</option>
    <option value="reserved">Réservé</option>
    <option value="inactive">Inactif</option>
  </select>

</div>
```

**Debounce recherche** : 300 ms via `watchDebounced` (VueUse) sur `searchQuery`, reset la pagination à la page 1 à chaque changement.

## Tableau des produits

### Colonnes

| # | Clé | Label thead | Classes td | Visibilité |
|---|-----|-------------|-----------|------------|
| 1 | miniature | — | `w-10 pr-0` | tous |
| 2 | title | Nom | `font-sans text-sm font-medium text-cgws-charcoal` | tous |
| 3 | category | Catégorie | `font-sans text-sm text-cgws-leather` | `hidden sm:table-cell` |
| 4 | price | Prix | `font-display text-base text-cgws-copper whitespace-nowrap` | tous |
| 5 | status | Statut | — (badge pill) | tous |
| 6 | createdAt | Date ajout | `font-sans text-xs text-cgws-leather whitespace-nowrap` | `hidden lg:table-cell` |
| 7 | actions | — | `text-right` | tous |

### Structure HTML du tableau

```html
<div class="bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden">
  <table class="w-full text-sm font-sans" aria-label="Liste des produits">
    <caption class="sr-only">{{ totalCount }} produits, triés par date d'ajout décroissante</caption>
    <thead class="border-b border-cgws-leather/20 bg-cgws-parchment/40">
      <tr>
        <th scope="col" class="w-12 py-3 pl-4 pr-2 text-left">
          <span class="sr-only">Image</span>
        </th>
        <th scope="col" class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Nom
        </th>
        <th scope="col" class="hidden sm:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Catégorie
        </th>
        <th scope="col" class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Prix
        </th>
        <th scope="col" class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Statut
        </th>
        <th scope="col" class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Ajouté le
        </th>
        <th scope="col" class="py-3 pl-3 pr-4 text-right">
          <span class="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-cgws-leather/10">
      <tr v-for="product in products" :key="product.id"
          class="hover:bg-cgws-parchment/20 transition-colors duration-100">
        <!-- Miniature -->
        <td class="py-2.5 pl-4 pr-2 w-12">
          <div class="w-10 h-10 rounded-sm overflow-hidden bg-cgws-parchment border border-cgws-leather/20 flex-shrink-0">
            <NuxtImg v-if="product.images[0]"
                     :src="product.images[0]" :alt="product.title"
                     class="w-full h-full object-cover"
                     width="40" height="40" format="webp" loading="lazy" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-lucide-image" class="w-4 h-4 text-cgws-leather/40" aria-hidden="true" />
            </div>
          </div>
        </td>
        <!-- Nom -->
        <td class="py-2.5 px-3">
          <span class="font-sans text-sm font-medium text-cgws-charcoal line-clamp-1">
            {{ product.title }}
          </span>
          <span v-if="product.brand" class="font-sans text-xs text-cgws-leather">
            {{ product.brand }}
          </span>
        </td>
        <!-- Catégorie (sm+) -->
        <td class="hidden sm:table-cell py-2.5 px-3 font-sans text-sm text-cgws-leather">
          {{ CATEGORY_LABELS[product.category] }}
        </td>
        <!-- Prix -->
        <td class="py-2.5 px-3 text-right font-display text-base text-cgws-copper whitespace-nowrap">
          {{ formatPrice(product.price) }}
        </td>
        <!-- Statut -->
        <td class="py-2.5 px-3">
          <span :class="statusPillClass(product.status)">
            {{ STATUS_LABELS[product.status] }}
          </span>
        </td>
        <!-- Date (lg+) -->
        <td class="hidden lg:table-cell py-2.5 px-3 font-sans text-xs text-cgws-leather whitespace-nowrap">
          {{ formatDate(product.createdAt) }}
        </td>
        <!-- Actions -->
        <td class="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
          <div class="inline-flex items-center gap-1">
            <NuxtLink :to="`/admin/produits/${product.id}`"
                      class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-copper
                             hover:bg-cgws-copper/10 transition-colors duration-150
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                      :aria-label="`Modifier ${product.title}`">
              <UIcon name="i-lucide-pencil" class="w-4 h-4" aria-hidden="true" />
            </NuxtLink>
            <button type="button"
                    class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-rust
                           hover:bg-cgws-rust/10 transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
                    :aria-label="`Supprimer ${product.title}`"
                    @click="openDeleteModal(product)">
              <UIcon name="i-lucide-trash-2" class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Statut pills (classe helper `statusPillClass`)

| `ProductStatus` | Label FR | Classe Tailwind |
|----------------|----------|-----------------|
| `active` | Disponible | `bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 font-sans font-medium text-[11px] uppercase tracking-wider` |
| `sold` | Vendu | `bg-cgws-charcoal/10 text-cgws-charcoal …` |
| `reserved` | Réservé | `bg-cgws-copper/15 text-cgws-copper …` |
| `inactive` | Inactif | `bg-cgws-leather/15 text-cgws-leather …` |

### États vide et chargement

**Chargement** — 8 lignes skeleton dans le `<tbody>` :
```html
<tr v-for="i in 8" :key="i" class="border-b border-cgws-leather/10">
  <td class="py-3 pl-4 pr-2">
    <div class="w-10 h-10 rounded-sm bg-cgws-leather/10 animate-pulse" />
  </td>
  <td class="py-3 px-3">
    <div class="h-4 w-40 bg-cgws-leather/10 rounded animate-pulse mb-1" />
    <div class="h-3 w-24 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
  <!-- ... -->
</tr>
```

**Vide** (aucun produit après filtre) — cellule unique `colspan="7"` :
```html
<tr>
  <td colspan="7" class="py-16 text-center">
    <UIcon name="i-lucide-package-open" class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30" aria-hidden="true" />
    <p class="font-sans text-sm text-cgws-leather italic">Aucun produit ne correspond à votre recherche.</p>
    <button @click="resetFilters" class="mt-3 font-sans text-xs text-cgws-copper hover:underline">
      Réinitialiser les filtres
    </button>
  </td>
</tr>
```

## Pagination

```html
<div class="flex items-center justify-between mt-4 flex-wrap gap-3">
  <!-- Compteur -->
  <p class="font-sans text-xs text-cgws-leather">
    {{ totalCount }} produit{{ totalCount !== 1 ? 's' : '' }} · page {{ currentPage }} de {{ totalPages }}
  </p>
  <!-- Boutons pages -->
  <nav aria-label="Pagination" class="inline-flex items-center gap-1">
    <button :disabled="currentPage === 1"
            class="p-1.5 rounded-sm text-cgws-leather disabled:opacity-30
                   hover:bg-cgws-leather/10 transition-colors
                   focus-visible:ring-2 focus-visible:ring-cgws-copper"
            aria-label="Page précédente"
            @click="goToPage(currentPage - 1)">
      <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
    </button>

    <button v-for="page in visiblePages" :key="page"
            :aria-current="page === currentPage ? 'page' : undefined"
            :class="[
              'w-8 h-8 rounded-sm font-sans text-sm transition-colors',
              page === currentPage
                ? 'bg-cgws-copper text-cgws-charcoal font-semibold'
                : 'text-cgws-leather hover:bg-cgws-leather/10'
            ]"
            @click="goToPage(page)">
      {{ page }}
    </button>

    <button :disabled="currentPage === totalPages"
            class="[mêmes classes que précédent]"
            aria-label="Page suivante"
            @click="goToPage(currentPage + 1)">
      <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
    </button>
  </nav>
</div>
```

`visiblePages` : fenêtre glissante de 5 pages max (pages courante ±2), avec `…` si l'écart est > 1 par rapport aux extrêmes (implémentation simple : tableau de numéros filtré côté composant).

## Modale de confirmation suppression

La modale est définie inline dans `index.vue`, contrôlée par `deleteTarget: Product | null`. Elle s'ouvre via `openDeleteModal(product)` et se ferme sur confirmation ou annulation.

```html
<!-- Overlay + boîte modale -->
<Teleport to="body">
  <Transition name="modal">
    <div v-if="deleteTarget"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true"
         :aria-labelledby="'modal-title'"
         @keydown.esc="deleteTarget = null">

      <!-- Backdrop -->
      <div class="absolute inset-0 bg-cgws-charcoal/60 backdrop-blur-sm"
           aria-hidden="true" @click="deleteTarget = null" />

      <!-- Boîte -->
      <div class="relative bg-white border-2 border-cgws-charcoal rounded-sm
                  shadow-xl w-full max-w-md p-6 space-y-4">

        <!-- Icône d'avertissement -->
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-rust/10
                      flex items-center justify-center">
            <UIcon name="i-lucide-triangle-alert"
                   class="w-5 h-5 text-cgws-rust" aria-hidden="true" />
          </div>
          <div>
            <h3 id="modal-title"
                class="font-serif font-bold text-lg text-cgws-charcoal">
              Supprimer ce produit ?
            </h3>
            <p class="font-sans text-sm text-cgws-leather mt-1">
              <strong class="text-cgws-charcoal">{{ deleteTarget.title }}</strong>
              sera définitivement supprimé du catalogue ainsi que toutes ses photos.
              Cette action est irréversible.
            </p>
          </div>
        </div>

        <!-- Actions -->
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
            Supprimer définitivement
          </button>
        </div>

      </div>
    </div>
  </Transition>
</Teleport>
```

**Après suppression réussie** : toast de succès (voir section Toast ci-dessous), fermeture modale, rafraîchissement de la liste sans rechargement de page.

## Toast de feedback

Les pages admin utilisent un mini-toast positionné en haut à droite. Pas de composant dédié en dehors de cette US — inline dans les pages concernées, `<Teleport to="body">` :

```html
<div v-if="toast"
     role="status" aria-live="polite"
     class="fixed top-4 right-4 z-[60] flex items-center gap-3
            bg-cgws-tack text-cgws-rope px-4 py-3 rounded-sm shadow-lg
            border-l-4 transition-all duration-300"
     :class="toast.type === 'error' ? 'border-cgws-rust' : 'border-cgws-copper'">
  <UIcon :name="toast.type === 'error' ? 'i-lucide-x-circle' : 'i-lucide-check-circle'"
         class="w-5 h-5 flex-shrink-0"
         :class="toast.type === 'error' ? 'text-cgws-rust' : 'text-cgws-copper'"
         aria-hidden="true" />
  <p class="font-sans text-sm">{{ toast.message }}</p>
</div>
```

Le toast disparaît automatiquement après 4 secondes via `setTimeout` → `toast.value = null`.

---

---

# PAGE 2 — Formulaire Produit (création + édition)

## Pages enveloppes

### `nouveau.vue`

```
definePageMeta({ middleware: 'admin', layout: 'admin', title: 'Nouveau produit' })
```

```html
<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <NuxtLink to="/admin/produits"
                class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-copper
                       hover:bg-cgws-copper/10 transition-colors
                       focus-visible:ring-2 focus-visible:ring-cgws-copper"
                aria-label="Retour à la liste des produits">
        <UIcon name="i-lucide-arrow-left" class="w-5 h-5" aria-hidden="true" />
      </NuxtLink>
      <h2 class="font-serif font-bold text-2xl text-cgws-charcoal">Nouveau produit</h2>
    </div>
    <ProductForm mode="create" @submit="handleCreate" @cancel="navigateTo('/admin/produits')" />
  </div>
</template>
```

### `[id].vue`

```
definePageMeta({ middleware: 'admin', layout: 'admin', title: 'Modifier le produit' })
```

Idem avec `mode="edit"` et `:initial-data="product"` (chargé via `useFetch` au montage). Affiche un skeleton de formulaire pendant le chargement.

```html
<h2 class="font-serif font-bold text-2xl text-cgws-charcoal line-clamp-1">
  Modifier : {{ product?.title ?? '…' }}
</h2>
<ProductForm v-if="product" mode="edit" :initial-data="product"
             @submit="handleUpdate" @cancel="navigateTo('/admin/produits')" />
<!-- Skeleton pendant chargement -->
<div v-else class="space-y-4 animate-pulse">
  <div class="h-48 bg-cgws-leather/10 rounded-[4px]" />
  <div class="h-64 bg-cgws-leather/10 rounded-[4px]" />
</div>
```

---

## Composant `ProductForm.vue`

### Props

```ts
interface Props {
  mode: 'create' | 'edit'
  initialData?: Product          // undefined en création, Product complet en édition
}
```

### Emits

```ts
defineEmits<{
  submit: [payload: ProductFormPayload]
  cancel: []
}>()

interface ProductFormPayload {
  fields: {
    title: string
    category: ProductCategory
    brand: string
    description: string
    price: number
    condition: ProductCondition
    size: string
    stock: number
    isConsignment: boolean
    consignmentId: string | null
    slug: string                 // slugifié, calculé par le composant
  }
  newImages: File[]             // nouveaux fichiers à uploader
  keptImages: string[]          // URLs existantes conservées, dans l'ordre final
  removedImages: string[]       // URLs existantes à supprimer du Storage
}
```

La page parente gère l'appel API après réception de `submit`.

### Layout ASCII (desktop 1024px+)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌─ Fieldset 1 : Informations générales ──┐  ┌─ Section Images ────┐  │
│  │  Nom du produit *                      │  │                     │  │
│  │  [_________________________]           │  │  [Zone drag-drop]   │  │
│  │  Slug aperçu : /catalogue/selle-...    │  │                     │  │
│  │                                        │  │  [Grid 4×2 previews]│  │
│  │  Catégorie *         Marque            │  │                     │  │
│  │  [select ▼]          [______]          │  │                     │  │
│  │                                        │  │  Photo 1 = Principal│  │
│  │  Description                           │  └─────────────────────┘  │
│  │  [textarea 4 lignes]                   │                            │
│  └────────────────────────────────────────┘  (sticky top-24 en lg+)   │
│                                                                        │
│  ┌─ Fieldset 2 : Prix & Stock ────────────┐                           │
│  │  Prix (€) *    Condition *   Taille     Stock                       │
│  │  [_____]       [select ▼]    [_____]    [_____]                     │
│  └────────────────────────────────────────┘                           │
│                                                                        │
│  ┌─ Fieldset 3 : Consignation ─────────────────────────────────────┐  │
│  │  ☐ Article en consignation                                       │  │
│  │  [si coché → CgwsSelect "Dépôt associé" apparaît]               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ─────────────────────────────────────────────────────────────────    │
│  [Annuler]                                         [Enregistrer ▶]    │
└──────────────────────────────────────────────────────────────────────┘
```

### Layout Tailwind — grille principale

```html
<form @submit.prevent="handleSubmit" novalidate
      class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

  <!-- Colonne gauche : champs (2/3) -->
  <div class="lg:col-span-2 space-y-5">
    <!-- Fieldset Infos générales -->
    <!-- Fieldset Prix & Stock -->
    <!-- Fieldset Consignation -->
    <!-- Bannière erreur serveur -->
    <!-- Footer boutons -->
  </div>

  <!-- Colonne droite : images (1/3, sticky) -->
  <div class="lg:col-span-1 lg:sticky lg:top-24">
    <ImageUploader
      v-model:kept-images="form.keptImages"
      v-model:new-files="form.newFiles"
      v-model:removed-images="form.removedImages"
    />
  </div>

</form>
```

### Fieldset 1 — Informations générales

```html
<fieldset class="bg-white border border-cgws-leather/30 rounded-[4px] p-5 space-y-4">
  <legend class="font-sans font-semibold text-xs uppercase tracking-widest
                 text-cgws-copper px-1 mb-1">
    Informations générales
  </legend>

  <!-- Nom -->
  <CgwsInput v-model="form.title" label="Nom du produit" name="title"
             required :error="errors.title" id="field-title"
             @blur="onBlur('title')" />

  <!-- Aperçu slug -->
  <p class="font-sans text-xs text-cgws-leather -mt-2">
    URL : <code class="text-cgws-copper font-mono">/catalogue/{{ slugPreview || '…' }}</code>
  </p>

  <!-- Catégorie + Marque -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <CgwsSelect v-model="form.category" label="Catégorie" name="category"
                required :options="CATEGORY_OPTIONS" :error="errors.category" />
    <CgwsInput v-model="form.brand" label="Marque" name="brand"
               placeholder="ex. Billy Cook, Wintec…" />
  </div>

  <!-- Description -->
  <CgwsTextarea v-model="form.description" label="Description" name="description"
                :rows="4" placeholder="Décrivez le produit en détail…"
                :error="errors.description" />
</fieldset>
```

**Slug preview** (computed) :
```ts
const slugPreview = computed(() => {
  const base = [form.title, form.brand].filter(Boolean).join(' ')
  return slugify(base)
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

### Fieldset 2 — Prix & Stock

```html
<fieldset class="bg-white border border-cgws-leather/30 rounded-[4px] p-5 space-y-4">
  <legend class="font-sans font-semibold text-xs uppercase tracking-widest
                 text-cgws-copper px-1 mb-1">
    Prix & Stock
  </legend>

  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <!-- Prix -->
    <div class="col-span-1">
      <CgwsInput v-model="form.price" label="Prix (€)" name="price"
                 type="number" required :error="errors.price"
                 placeholder="0.00" />
    </div>

    <!-- Condition -->
    <div class="col-span-1">
      <CgwsSelect v-model="form.condition" label="État" name="condition"
                  required :options="CONDITION_OPTIONS" :error="errors.condition" />
    </div>

    <!-- Taille / Dimensions -->
    <div class="col-span-1">
      <CgwsInput v-model="form.size" label="Taille / Dimensions" name="size"
                 placeholder="ex. 16.5\" W, T42…" />
    </div>

    <!-- Stock -->
    <div class="col-span-1">
      <CgwsInput v-model="form.stock" label="Stock" name="stock"
                 type="number" :hint="`Défaut : 1`" />
    </div>
  </div>
</fieldset>
```

**Constantes options** :

```ts
const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'selles',            label: 'Selles' },
  { value: 'brides-licols',     label: 'Brides & Licols' },
  { value: 'bottes-chaussures', label: 'Bottes & Chaussures' },
  { value: 'vetements',         label: 'Vêtements' },
  { value: 'accessoires',       label: 'Accessoires' },
  { value: 'protections',       label: 'Protections' },
]

const CONDITION_OPTIONS: SelectOption[] = [
  { value: 'new',       label: 'Neuf' },
  { value: 'excellent', label: 'Excellent état' },
  { value: 'good',      label: 'Bon état' },
  { value: 'fair',      label: 'État correct' },
]
```

### Fieldset 3 — Consignation (conditionnelle)

```html
<fieldset class="bg-white border border-cgws-leather/30 rounded-[4px] p-5">
  <legend class="font-sans font-semibold text-xs uppercase tracking-widest
                 text-cgws-copper px-1 mb-3">
    Consignation
  </legend>

  <!-- Checkbox -->
  <label class="flex items-center gap-3 cursor-pointer group">
    <input type="checkbox" v-model="form.isConsignment"
           class="w-4 h-4 rounded-sm border-cgws-leather accent-cgws-copper
                  focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2"
           id="field-is-consignment" />
    <span class="font-sans text-sm font-medium text-cgws-charcoal
                 group-hover:text-cgws-copper transition-colors">
      Article en consignation
    </span>
  </label>
  <p class="font-sans text-xs text-cgws-leather mt-1 ml-7">
    Cochez si cet article a été déposé par un particulier via le service de consignation.
  </p>

  <!-- Select conditionnel (Transition height) -->
  <Transition name="expand">
    <div v-if="form.isConsignment" class="mt-4">
      <CgwsSelect v-model="form.consignmentId"
                  label="Dépôt associé"
                  name="consignmentId"
                  :options="acceptedConsignmentOptions"
                  placeholder="— Sélectionnez un dépôt accepté —"
                  :hint="`Seuls les dépôts au statut « Acceptée » sont listés`"
                  :error="errors.consignmentId" />
    </div>
  </Transition>
</fieldset>
```

`acceptedConsignmentOptions` est chargé via `useFetch('/api/admin/consignments?status=accepted')` au montage du composant et mappé en `{ value: id, label: 'Dupont M. — Selle Bob Lee' }`.

**Transition expand** :
```css
.expand-enter-active, .expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 120px;
}
```

### Footer boutons

```html
<div class="flex items-center justify-between pt-4 border-t border-cgws-leather/20">
  <CgwsButton variant="ghost" type="button" @click="$emit('cancel')">
    Annuler
  </CgwsButton>
  <CgwsButton variant="primary" type="submit" size="md"
              :loading="isSubmitting" :disabled="isSubmitting">
    {{ isSubmitting
       ? (mode === 'create' ? 'CRÉATION…' : 'ENREGISTREMENT…')
       : (mode === 'create' ? 'CRÉER LE PRODUIT' : 'ENREGISTRER') }}
  </CgwsButton>
</div>
```

### Validation formulaire

Validation déclenchée à `@blur` sur chaque champ et à `handleSubmit`. Champs requis : `title`, `category`, `price` (> 0), `condition`. Si `isConsignment = true`, `consignmentId` requis.

Après submit réussi : redirection vers `/admin/produits` avec `navigateTo('/admin/produits')` et toast de succès passé via query param ou store.

---

---

# COMPOSANT `ImageUploader.vue`

**Fichier** : `app/components/admin/ImageUploader.vue`

Composant autonome gérant jusqu'à 8 images avec drag-drop, preview, et réordonnement par glisser-déposer. Conçu pour les deux modes (création = aucune image initiale, édition = URLs Supabase Storage existantes).

## Props et emits

```ts
// Props
interface Props {
  keptImages?: string[]    // URLs existantes à conserver (mode edit), ordre = ordre final
  newFiles?: File[]        // Nouveaux fichiers ajoutés
  removedImages?: string[] // URLs à supprimer du Storage lors de la sauvegarde
  maxImages?: number       // défaut : 8
  maxSizeMb?: number       // défaut : 5
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  keptImages: () => [],
  newFiles: () => [],
  removedImages: () => [],
  maxImages: 8,
  maxSizeMb: 5,
})

// Emits
const emit = defineEmits<{
  'update:keptImages': [value: string[]]
  'update:newFiles': [value: File[]]
  'update:removedImages': [value: string[]]
}>()
```

## Type interne `DisplayItem`

```ts
type DisplayItem =
  | { type: 'existing'; url: string; id: string }
  | { type: 'new'; file: File; previewUrl: string; id: string }
```

L'état interne `displayItems: DisplayItem[]` est la source de vérité pour l'ordre affiché. L'ID est un UUID local généré au montage pour les items existants, et à l'ajout pour les nouveaux.

## Anatomie complète

```
┌─ PHOTOS ─────────────────────────────────────────────────────┐
│  0 / 8 ajoutées · La première photo sera l'image principale  │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │   ☁  Glissez vos photos ici                        │     │  ← drop zone
│  │      ou                                             │     │
│  │      [+ Ajouter des photos]                        │     │
│  │                                                     │     │
│  │   JPEG · PNG · WEBP  ·  8 max  ·  5 MB par fichier │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│  │ ⠿    │ │ ⠿    │ │      │ │      │   ← handles drag       │
│  │ [img]│ │ [img]│ │  +   │ │  +   │                        │
│  │[PRINC│ │      │ │      │ │      │                        │
│  │ IPAL]│ │  [×] │ │      │ │      │                        │
│  │ [×]  │ │      │ │      │ │      │                        │
│  └──────┘ └──────┘ └──────┘ └──────┘                        │
│                                                               │
│  ┌── Progression upload (si en cours) ──────────────────┐   │
│  │  ████████░░░░░░  67%  Envoi photo 2/3…              │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Layout Tailwind

```html
<section aria-label="Gestion des photos du produit"
         class="bg-white border border-cgws-leather/30 rounded-[4px] p-4">

  <!-- En-tête -->
  <div class="flex items-center justify-between mb-3">
    <p class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper">
      Photos
    </p>
    <span class="font-sans text-xs text-cgws-leather">
      {{ displayItems.length }} / {{ maxImages }}
    </span>
  </div>
  <p class="font-sans text-xs text-cgws-leather mb-3">
    La <strong class="font-medium text-cgws-charcoal">première photo</strong> sera l'image principale du produit.
    Réorganisez par glisser-déposer.
  </p>

  <!-- Zone drop -->
  <div v-if="displayItems.length < maxImages"
       role="button" tabindex="0"
       :aria-label="'Zone de dépôt — ' + (maxImages - displayItems.length) + ' emplacements disponibles'"
       :class="[
         'border-2 border-dashed rounded-sm p-6 text-center mb-4',
         'transition-colors duration-200 cursor-pointer',
         isDragOver
           ? 'border-cgws-copper bg-cgws-parchment border-solid'
           : 'border-cgws-copper/40 hover:border-cgws-copper hover:bg-cgws-parchment/30',
         props.disabled ? 'opacity-50 cursor-not-allowed' : '',
       ]"
       @click="!props.disabled && openFilePicker()"
       @keydown.enter.space.prevent="!props.disabled && openFilePicker()"
       @dragenter.prevent="isDragOver = true"
       @dragover.prevent="isDragOver = true"
       @dragleave.prevent="isDragOver = false"
       @drop.prevent="handleDrop">
    <UIcon name="i-lucide-cloud-upload"
           class="w-7 h-7 mx-auto mb-2 text-cgws-copper/50" aria-hidden="true" />
    <p class="font-sans text-sm font-medium text-cgws-charcoal mb-2">
      Glissez vos photos ici
    </p>
    <CgwsButton variant="ghost" size="sm" type="button"
                :disabled="props.disabled"
                @click.stop="openFilePicker">
      + Ajouter des photos
    </CgwsButton>
    <p class="font-sans text-xs text-cgws-rope mt-2">
      JPEG · PNG · WEBP &nbsp;·&nbsp; {{ maxImages }} max &nbsp;·&nbsp; {{ maxSizeMb }} MB / fichier
    </p>
  </div>

  <!-- Input caché -->
  <input ref="fileInputRef" type="file"
         accept="image/jpeg,image/png,image/webp" multiple
         :disabled="props.disabled || displayItems.length >= maxImages"
         class="sr-only" aria-hidden="true"
         @change="handleFileInput" />

  <!-- Erreur fichier -->
  <p v-if="uploadError" role="alert"
     class="font-sans text-xs text-cgws-rust mb-3">
    {{ uploadError }}
  </p>

  <!-- Grid de previews (triable) -->
  <div v-if="displayItems.length > 0"
       ref="sortableContainer"
       class="grid grid-cols-4 gap-2"
       aria-label="Photos ajoutées, réorganisables par glisser-déposer">

    <div v-for="(item, index) in displayItems" :key="item.id"
         class="relative aspect-square rounded-sm overflow-hidden
                bg-cgws-parchment border border-cgws-leather/20 group
                cursor-grab active:cursor-grabbing select-none"
         :data-id="item.id">

      <!-- Handle glisser -->
      <div class="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100
                  transition-opacity duration-150 pointer-events-none">
        <UIcon name="i-lucide-grip-vertical"
               class="w-4 h-4 text-white drop-shadow-sm" aria-hidden="true" />
      </div>

      <!-- Image -->
      <img :src="item.type === 'existing' ? item.url : item.previewUrl"
           :alt="`Photo ${index + 1}`"
           class="w-full h-full object-cover" loading="lazy" />

      <!-- Badge Principal (premier uniquement) -->
      <div v-if="index === 0"
           class="absolute bottom-0 left-0 right-0
                  bg-cgws-copper/90 text-cgws-charcoal
                  font-sans font-semibold text-[9px] uppercase tracking-wider
                  py-0.5 text-center">
        Principal
      </div>

      <!-- Bouton supprimer -->
      <button type="button"
              :aria-label="`Supprimer la photo ${index + 1}`"
              :disabled="props.disabled"
              class="absolute top-1 right-1 z-10
                     w-5 h-5 rounded-full bg-cgws-rust text-white
                     text-xs font-bold flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150
                     hover:bg-cgws-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
              @click.stop="removeItem(item.id)">
        <UIcon name="i-lucide-x" class="w-3 h-3" aria-hidden="true" />
      </button>

    </div>
  </div>

  <!-- Barre de progression upload -->
  <div v-if="uploadProgress !== null" class="mt-3">
    <div class="flex items-center justify-between mb-1">
      <p class="font-sans text-xs text-cgws-leather">{{ uploadProgressLabel }}</p>
      <span class="font-sans text-xs font-semibold text-cgws-copper">{{ uploadProgress }}%</span>
    </div>
    <div class="w-full h-1.5 bg-cgws-leather/20 rounded-full overflow-hidden">
      <div class="h-full bg-cgws-copper rounded-full transition-all duration-300 ease-out"
           :style="{ width: uploadProgress + '%' }"
           role="progressbar"
           :aria-valuenow="uploadProgress"
           aria-valuemin="0" aria-valuemax="100"
           :aria-label="uploadProgressLabel" />
    </div>
  </div>

</section>
```

## Réordonnement — Sortable.js

Le réordonnement est implémenté via `Sortable.js` (importé comme `import Sortable from 'sortablejs'`). Initialisé dans `onMounted`, détruit dans `onUnmounted`.

```ts
onMounted(() => {
  if (!sortableContainer.value) return
  sortableInstance = Sortable.create(sortableContainer.value, {
    animation: 150,
    handle: undefined,         // toute la carte est le handle
    ghostClass: 'opacity-40',
    chosenClass: 'ring-2 ring-cgws-copper ring-offset-1',
    onEnd(evt) {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return
      const moved = displayItems.value.splice(evt.oldIndex, 1)[0]!
      displayItems.value.splice(evt.newIndex, 0, moved)
      syncEmits()
    },
  })
})

onUnmounted(() => {
  sortableInstance?.destroy()
  // Libérer les Object URLs des nouveaux fichiers
  for (const item of displayItems.value) {
    if (item.type === 'new') URL.revokeObjectURL(item.previewUrl)
  }
})
```

`syncEmits()` recalcule et émet les trois valeurs (`keptImages`, `newFiles`, `removedImages`) depuis `displayItems.value`.

## Upload progress (côté page parente)

L'`ImageUploader` expose `uploadProgress: number | null` et `uploadProgressLabel: string` comme props entrantes depuis la page parente (qui gère l'upload réel via `fetch` avec XHR pour avoir la progression). Alternativement, la prop `disabled` suffit pour bloquer l'interaction pendant le submit — la barre de progression peut être simplifiée à un état binaire loading/idle dans un premier temps.

---

---

# API ROUTES SERVEUR

## Convention communes

Toutes les routes admin vérifient l'authentification via un helper `requireAdminAuth(event)` qui valide la session Supabase. Si non-authentifié → `throw createError({ statusCode: 401 })`.

Erreurs de validation → `throw createError({ statusCode: 422, data: { errors: Record<string, string> } })`.

---

## `GET /api/admin/products` — Liste paginée

**Fichier** : `server/api/admin/products/index.get.ts`

**Query params** :
```
page       : number (défaut 1)
limit      : number (défaut 20, max 100)
search     : string (optionnel) — ILIKE sur title ET brand
category   : ProductCategory (optionnel)
status     : ProductStatus (optionnel)
```

**Réponse** :
```ts
{
  items: Product[]      // résultats mappés snake_case → camelCase
  total: number         // count total (pour pagination)
  page: number
  totalPages: number
}
```

**Requête Supabase** :
```ts
let query = supabase
  .from('products')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })

if (search) query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%`)
if (category) query = query.eq('category', category)
if (status)   query = query.eq('status', status)

query = query.range((page - 1) * limit, page * limit - 1)
```

---

## `POST /api/admin/products` — Création

**Fichier** : `server/api/admin/products/index.post.ts`

**Body** : `multipart/form-data`
```
title       : string (requis)
category    : ProductCategory (requis)
brand       : string (optionnel)
description : string (optionnel)
price       : number (requis, > 0)
condition   : ProductCondition (requis)
size        : string (optionnel)
stock       : number (défaut 1)
isConsignment : 'true' | 'false'
consignmentId : string UUID (optionnel)
images[]    : File[] (optionnel, max 8)
```

**Traitement** :
1. Valider les champs requis → 422 si invalide
2. Générer le slug : `slugify(title + ' ' + brand)`, puis vérifier unicité dans `products.slug` ; si conflit → ajouter `-2`, `-3`, etc.
3. Uploader chaque image vers Supabase Storage (`products/${productId}/${filename}`) via `supabaseAdmin.storage.from('product-images').upload()`
4. Insérer le produit avec `status: 'active'`, `images: [urls...]`

**Réponse 201** :
```ts
{ product: Product }
```

---

## `GET /api/admin/products/[id]` — Détail

**Fichier** : `server/api/admin/products/[id].get.ts`

```ts
const { data } = await supabase.from('products').select('*').eq('id', id).single()
// 404 si data null
```

**Réponse 200** : `{ product: Product }`

---

## `PUT /api/admin/products/[id]` — Mise à jour

**Fichier** : `server/api/admin/products/[id].put.ts`

**Body** : `multipart/form-data`

Mêmes champs que POST, plus :
```
keptImages[]   : string[] — URLs existantes conservées, dans l'ordre final
removedImages[]: string[] — URLs à supprimer du Storage
newImages[]    : File[]   — nouvelles images à uploader
```

**Traitement** :
1. Valider les champs requis → 422
2. Supprimer de Storage les fichiers dans `removedImages` via `storage.remove([paths])`
3. Uploader les `newImages` → récupérer leurs URLs publiques
4. Fusionner : `images = [...keptImages, ...newUploadedUrls]`
5. Régénérer le slug uniquement si `title` ou `brand` ont changé (comparer avec l'existant), en vérifiant l'unicité en excluant l'ID courant
6. `UPDATE products SET … WHERE id = ?`

**Réponse 200** : `{ product: Product }`

---

## `DELETE /api/admin/products/[id]` — Suppression

**Fichier** : `server/api/admin/products/[id].delete.ts`

**Traitement** :
1. Récupérer le produit (pour avoir `images[]`)
2. Si `images.length > 0` → extraire les chemins Storage depuis les URLs et appeler `storage.remove([paths])`
3. `DELETE FROM products WHERE id = ?`

**Réponse 200** : `{ success: true, deletedId: id }`

**Gestion d'erreur** : si la suppression Storage échoue partiellement, logger l'erreur mais ne pas bloquer la suppression DB (les fichiers orphelins sont gérés par un job de nettoyage). Retourner 200 avec un warning dans le payload si besoin.

---

---

# RÉCAPITULATIF DES ÉTATS ET TRANSITIONS

## États page liste

| État | Description |
|------|-------------|
| Loading | 8 lignes skeleton dans le tableau |
| Empty (aucun produit) | Illustration + texte vide (voir ci-dessus) |
| Empty (filtre actif) | Message "aucun résultat" + lien "Réinitialiser" |
| Default | Tableau avec lignes, pagination |
| Delete pending | Modale ouverte, bouton "Supprimer" en loading |
| Delete success | Modale fermée, toast succès, liste rafraîchie |
| Delete error | Toast erreur `cgws-rust`, modale fermée |

## États formulaire

| État | Comportement |
|------|-------------|
| Mode create, vierge | Tous champs vides, slug `…`, stock = 1 |
| Mode edit, chargement | Skeleton formulaire (`animate-pulse`) |
| Mode edit, chargé | Champs pré-remplis, images existantes dans grid |
| Erreur champ | Bordure `cgws-rust`, message inline, focus auto sur premier champ en erreur |
| Submit en cours | Bouton en loading, tous champs disabled, ImageUploader disabled |
| Submit succès | Redirection vers `/admin/produits` + toast succès |
| Submit erreur serveur | Bannière rouge sous le dernier fieldset |

---

---

# ACCESSIBILITÉ

- Chaque `<fieldset>` a une `<legend>` descriptive (sr lisible même si visuellement petite)
- Le tableau a une `<caption class="sr-only">` avec le comptage et l'ordre de tri
- Toutes les colonnes `<th scope="col">` avec texte lisible (pas que des icônes)
- La modale de suppression : `role="dialog" aria-modal="true"` + focus trap sur ouverture + retour focus sur le bouton déclencheur à la fermeture
- ImageUploader drop zone : `role="button" tabindex="0"` accessible au clavier (Enter/Space)
- Barre de progression : `role="progressbar" aria-valuenow aria-valuemin aria-valuemax aria-label`
- Toast : `role="status" aria-live="polite"` pour les succès, `role="alert" aria-live="assertive"` pour les erreurs
- Boutons action icône-seule : `aria-label` complet avec nom du produit (`Modifier Selle de Trail`, `Supprimer Botte Western`)
- Checkbox consignation : label cliquable associé via `for` / `id`
- Focus visible : `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2` sur tous les interactifs
- Contraste : texte `cgws-charcoal (#1A0B03)` sur `white` > 18:1 (AAA). Prix `cgws-copper (#B8650A)` sur `white` = 3.2:1 — acceptable pour les grands caractères Bebas Neue (WCAG AA large text). Badges status : tous vérifiés ≥ 4.5:1.

---

---

# TAILWIND CLASSES CLÉS — RÉCAPITULATIF

```
/* Conteneur card admin générique */
bg-white border border-cgws-leather/30 rounded-[4px] shadow-sm

/* En-tête de page admin */
font-serif font-bold text-2xl text-cgws-charcoal

/* Thead tableau */
font-sans text-[10px] uppercase tracking-widest text-cgws-leather

/* Tbody lignes */
hover:bg-cgws-parchment/20 transition-colors duration-100
divide-y divide-cgws-leather/10

/* Prix tableau */
font-display text-base text-cgws-copper whitespace-nowrap

/* Bouton action icône */
p-1.5 rounded-sm transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper

/* Drop zone inactif */
border-2 border-dashed border-cgws-copper/40 rounded-sm
hover:border-cgws-copper hover:bg-cgws-parchment/30

/* Drop zone actif (dragover) */
border-cgws-copper bg-cgws-parchment border-solid

/* Preview image card */
relative aspect-square rounded-sm overflow-hidden
bg-cgws-parchment border border-cgws-leather/20 group
cursor-grab active:cursor-grabbing select-none

/* Badge Principal */
absolute bottom-0 left-0 right-0
bg-cgws-copper/90 text-cgws-charcoal
font-sans font-semibold text-[9px] uppercase tracking-wider

/* Toast succès */
bg-cgws-tack text-cgws-rope border-l-4 border-cgws-copper
px-4 py-3 rounded-sm shadow-lg

/* Fieldset legend */
font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper

/* Bannière erreur serveur */
bg-cgws-rust/10 border border-cgws-rust rounded-sm p-4
```
