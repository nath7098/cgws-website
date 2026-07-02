# Gestion des Consignations — Spec UX (US-040)

**Purpose**: Interface backoffice pour traiter les demandes de consignation reçues via le formulaire public. Camille y consulte chaque demande, négocie le prix, accepte (ce qui crée automatiquement un produit au catalogue) ou refuse avec motif, puis suit la commission lors de la vente.
**Périmètre**:
- `app/pages/admin/consignations/index.vue` — liste paginée, filtrée, triée
- `app/pages/admin/consignations/[id].vue` — page détail + actions
- `server/api/admin/consignments/index.get.ts` — liste paginée
- `server/api/admin/consignments/[id].get.ts` — détail + linked product + sale
- `server/api/admin/consignments/[id].accept.patch.ts` — acceptation + création produit + email
- `server/api/admin/consignments/[id].reject.patch.ts` — refus + email

---

## Contexte layout admin

Tout le contenu s'insère dans `<slot />` de `layouts/admin.vue`. La sidebar desktop (w-64, `cgws-tack`) et la topbar (h-14, `cgws-parchment`) sont gérées par le layout. La zone de contenu hérite de `bg-cgws-cream` et dispose d'un padding `p-4 md:p-6 lg:p-8`. Chaque page définit `definePageMeta({ middleware: 'admin', layout: 'admin' })`.

---

## Constantes statuts consignation

```ts
const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  pending:  'En attente',
  accepted: 'En vente',
  rejected: 'Refusée',
  sold:     'Vendue',
  returned: 'Retournée',
}

const BASE_PILL = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 font-sans font-medium text-[11px] uppercase tracking-wider rounded-full'

function consignmentPillClass(status: ConsignmentStatus): string {
  const map: Record<ConsignmentStatus, string> = {
    pending:  `${BASE_PILL} bg-cgws-copper/20 text-cgws-copper`,
    accepted: `${BASE_PILL} bg-green-100 text-green-700`,
    rejected: `${BASE_PILL} bg-cgws-rust/15 text-cgws-rust`,
    sold:     `${BASE_PILL} bg-cgws-charcoal/10 text-cgws-charcoal`,
    returned: `${BASE_PILL} bg-cgws-leather/15 text-cgws-leather`,
  }
  return map[status]
}
```

Le badge `pending` reçoit un point pulsant à gauche du texte (voir section tableau). Aucun autre statut n'a de pulse.

---

---

# PAGE 1 — Liste des consignations (`/admin/consignations`)

## Layout ASCII (desktop 1280px+)

```
┌─ contenu <slot /> ─────────────────────────────────────────────────────────┐
│                                                                              │
│  Consignations                          [Trier : En attente en premier ✓]   │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [🔍 Rechercher un déposant…]    [Statut ▼]                                 │
│                                                                              │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Déposant        Article décrit      Px demandé  Px vente   Date  Statut│   │
│ │───────────────────────────────────────────────────────────────────────│   │
│ │ ● Dupont Marie  Selle Bob Lee 15"   480,00 €    —          02/07  [En attente] [Voir]│
│ │ ● Martin Jean   Selle Wade 16"      350,00 €    —          01/07  [En attente] [Voir]│
│ │   Leroy Anne    Botte Western T40   120,00 €   110,00 €   28/06  [En vente]   [Voir]│
│ │   Petit Paul    Bride King Series    85,00 €    80,00 €   25/06  [Vendue]     [Voir]│
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  12 demandes · page 1 de 1               [◀]  1  [▶]                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

Les lignes `pending` ont un fond `bg-cgws-copper/5` et leur badge contient un point pulsant (`animate-pulse`). Les lignes des autres statuts ont un fond `bg-white`.

## Breakpoints

- **Mobile 375px**: tableau remplacé par une pile de cartes (`bg-white border border-cgws-leather/30 rounded-[4px]`). Chaque carte affiche : badge statut en haut à droite, nom déposant en titre, article sur une ligne, prix demandé en `font-display text-cgws-copper`, date en `text-xs text-cgws-leather`, bouton "Voir" pleine largeur en bas.
- **Tablet 768px**: tableau sans les colonnes "Prix vente" et "Date" — les colonnes essentielles restent (déposant, article, prix demandé, statut, action).
- **Desktop 1280px**: toutes les colonnes visibles.

## En-tête de page

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h2 class="font-serif font-bold text-2xl text-cgws-charcoal">Consignations</h2>
    <p class="font-sans text-sm text-cgws-leather mt-0.5">
      {{ pendingCount > 0
        ? `${pendingCount} demande${pendingCount > 1 ? 's' : ''} en attente de traitement`
        : `${totalCount} demande${totalCount !== 1 ? 's' : ''} au total` }}
    </p>
  </div>
</div>
```

Si `pendingCount > 0`, le sous-titre est mis en `text-cgws-copper font-medium` pour attirer l'attention.

## Barre de recherche + filtre statut

```html
<div class="bg-white border border-cgws-leather/30 rounded-[4px] p-3
            flex flex-col sm:flex-row gap-3 mb-4">

  <!-- Champ de recherche -->
  <div class="relative flex-1 min-w-0">
    <UIcon name="i-lucide-search"
           class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                  text-cgws-rope pointer-events-none"
           aria-hidden="true" />
    <input
      v-model="searchQuery"
      type="search"
      placeholder="Rechercher un déposant…"
      class="w-full pl-9 pr-3 py-2 bg-cgws-cream border border-cgws-leather/40
             rounded-sm font-sans text-sm text-cgws-charcoal
             placeholder:text-cgws-rope outline-none
             focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20"
      aria-label="Rechercher par nom de déposant"
    />
  </div>

  <!-- Filtre statut -->
  <div class="relative min-w-[180px]">
    <select
      v-model="filterStatus"
      class="w-full py-2 px-3 pr-9 bg-cgws-cream border border-cgws-leather/40
             rounded-sm font-sans text-sm text-cgws-charcoal appearance-none
             focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 outline-none"
      aria-label="Filtrer par statut">
      <option value="">Tous les statuts</option>
      <option value="pending">En attente</option>
      <option value="accepted">En vente</option>
      <option value="rejected">Refusées</option>
      <option value="sold">Vendues</option>
      <option value="returned">Retournées</option>
    </select>
    <UIcon name="i-lucide-chevron-down"
           class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                  w-4 h-4 text-cgws-leather/60"
           aria-hidden="true" />
  </div>

</div>
```

**Debounce recherche** : 300 ms via `watchDebounced` sur `searchQuery`, reset page à 1 à chaque changement.

## Tableau des consignations

### Colonnes

| # | Clé | Label thead | Classes td | Visibilité |
|---|-----|-------------|-----------|------------|
| 1 | depositorName | Déposant | `font-sans text-sm font-medium text-cgws-charcoal` | tous |
| 2 | itemDescription | Article décrit | `font-sans text-sm text-cgws-leather line-clamp-1 max-w-[220px]` | tous |
| 3 | askingPrice | Px demandé | `font-display text-base text-cgws-charcoal whitespace-nowrap text-right` | tous |
| 4 | agreedPrice | Px vente | `font-display text-base text-cgws-copper whitespace-nowrap text-right` | `hidden md:table-cell` |
| 5 | createdAt | Date | `font-sans text-xs text-cgws-leather whitespace-nowrap` | `hidden lg:table-cell` |
| 6 | status | Statut | — (badge pill) | tous |
| 7 | actions | — | `text-right` | tous |

### Structure HTML du tableau

```html
<div class="bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden">
  <table class="w-full text-sm font-sans" aria-label="Liste des consignations">
    <caption class="sr-only">
      {{ totalCount }} demande{{ totalCount !== 1 ? 's' : '' }}, demandes en attente affichées en premier
    </caption>
    <thead class="border-b border-cgws-leather/20 bg-cgws-parchment/40">
      <tr>
        <th scope="col" class="py-3 pl-4 pr-3 text-left
                                font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Déposant
        </th>
        <th scope="col" class="py-3 px-3 text-left
                                font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Article décrit
        </th>
        <th scope="col" class="py-3 px-3 text-right
                                font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Px demandé
        </th>
        <th scope="col" class="hidden md:table-cell py-3 px-3 text-right
                                font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Px vente
        </th>
        <th scope="col" class="hidden lg:table-cell py-3 px-3 text-left
                                font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Date
        </th>
        <th scope="col" class="py-3 px-3 text-left
                                font-sans text-[10px] uppercase tracking-widest text-cgws-leather">
          Statut
        </th>
        <th scope="col" class="py-3 pl-3 pr-4 text-right">
          <span class="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-cgws-leather/10">
      <tr v-for="item in consignments" :key="item.id"
          :class="[
            'transition-colors duration-100',
            item.status === 'pending'
              ? 'bg-cgws-copper/5 hover:bg-cgws-copper/10'
              : 'bg-white hover:bg-cgws-parchment/20',
          ]">

        <!-- Déposant -->
        <td class="py-3 pl-4 pr-3">
          <span class="font-sans text-sm font-medium text-cgws-charcoal">
            {{ item.depositorName }}
          </span>
          <br />
          <span class="font-sans text-xs text-cgws-leather">
            {{ item.depositorEmail }}
          </span>
        </td>

        <!-- Article -->
        <td class="py-3 px-3 max-w-[220px]">
          <span class="font-sans text-sm text-cgws-leather line-clamp-2">
            {{ item.itemDescription }}
          </span>
          <span v-if="item.brand"
                class="font-sans text-xs text-cgws-leather/70">
            {{ item.brand }}
          </span>
        </td>

        <!-- Prix demandé -->
        <td class="py-3 px-3 text-right font-display text-base text-cgws-charcoal whitespace-nowrap">
          {{ formatPrice(item.askingPrice) }}
        </td>

        <!-- Prix de vente (md+) -->
        <td class="hidden md:table-cell py-3 px-3 text-right font-display text-base whitespace-nowrap"
            :class="item.agreedPrice ? 'text-cgws-copper' : 'text-cgws-leather/40'">
          {{ item.agreedPrice ? formatPrice(item.agreedPrice) : '—' }}
        </td>

        <!-- Date (lg+) -->
        <td class="hidden lg:table-cell py-3 px-3
                   font-sans text-xs text-cgws-leather whitespace-nowrap">
          {{ formatDate(item.createdAt) }}
        </td>

        <!-- Statut -->
        <td class="py-3 px-3">
          <span :class="consignmentPillClass(item.status)">
            <!-- Point pulsant uniquement pour pending -->
            <span v-if="item.status === 'pending'"
                  class="w-1.5 h-1.5 rounded-full bg-cgws-copper animate-pulse flex-shrink-0"
                  aria-hidden="true" />
            {{ CONSIGNMENT_STATUS_LABELS[item.status] }}
          </span>
        </td>

        <!-- Action -->
        <td class="py-3 pl-3 pr-4 text-right">
          <NuxtLink
            :to="`/admin/consignations/${item.id}`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm
                   bg-cgws-copper/10 text-cgws-copper text-xs font-semibold
                   hover:bg-cgws-copper hover:text-white
                   transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-cgws-copper"
            :aria-label="`Voir la demande de ${item.depositorName}`">
            Voir
            <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
          </NuxtLink>
        </td>

      </tr>
    </tbody>
  </table>
</div>
```

### État chargement (skeleton)

```html
<tr v-for="i in 8" :key="i" class="border-b border-cgws-leather/10 bg-white">
  <td class="py-3 pl-4 pr-3">
    <div class="h-4 w-32 bg-cgws-leather/10 rounded animate-pulse mb-1" />
    <div class="h-3 w-44 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
  <td class="py-3 px-3">
    <div class="h-4 w-40 bg-cgws-leather/10 rounded animate-pulse mb-1" />
    <div class="h-3 w-20 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
  <td class="py-3 px-3 text-right">
    <div class="h-5 w-20 bg-cgws-leather/10 rounded animate-pulse ml-auto" />
  </td>
  <td class="hidden md:table-cell py-3 px-3 text-right">
    <div class="h-5 w-16 bg-cgws-leather/10 rounded animate-pulse ml-auto" />
  </td>
  <td class="hidden lg:table-cell py-3 px-3">
    <div class="h-4 w-14 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
  <td class="py-3 px-3">
    <div class="h-5 w-20 bg-cgws-leather/10 rounded-full animate-pulse" />
  </td>
  <td class="py-3 pl-3 pr-4 text-right">
    <div class="h-7 w-16 bg-cgws-leather/10 rounded animate-pulse ml-auto" />
  </td>
</tr>
```

### État vide

```html
<tr>
  <td colspan="7" class="py-16 text-center">
    <UIcon name="i-lucide-inbox"
           class="w-10 h-10 mx-auto mb-3 text-cgws-leather/30"
           aria-hidden="true" />
    <p class="font-sans text-sm text-cgws-leather italic">
      Aucune demande de consignation.
    </p>
    <button v-if="filterStatus || searchQuery"
            class="mt-3 font-sans text-xs text-cgws-copper hover:underline"
            @click="resetFilters">
      Réinitialiser les filtres
    </button>
  </td>
</tr>
```

## Pagination

Identique au pattern US-032 (fenêtre glissante 5 pages, `visiblePages`, compteur « 12 demandes · page 1 de 1 »), avec `aria-label="Pagination des consignations"`.

## Tri prioritaire

Le tri par défaut place les `pending` en premier via l'API (clause SQL `ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC`). Ce tri est fixe — aucun contrôle utilisateur de tri n'est exposé dans cette US.

---

---

# PAGE 2 — Détail d'une consignation (`/admin/consignations/[id]`)

## Layout ASCII (desktop 1280px+)

```
┌─ contenu <slot /> ────────────────────────────────────────────────────────────┐
│                                                                                │
│  [← Retour]  Demande de Dupont Marie                   [badge statut]          │
│  ─────────────────────────────────────────────────────────────────────────    │
│                                                                                │
│  ┌─ col gauche (lg:col-span-2) ─────────────────┐  ┌─ col droite (sticky) ─┐  │
│  │                                              │  │                        │  │
│  │  ┌─ Coordonnées du déposant ─────────────┐  │  │  ┌─ Photos ─────────┐  │  │
│  │  │  Dupont Marie                         │  │  │  │  [img] [img]     │  │  │
│  │  │  marie@email.fr · 06 12 34 56 78      │  │  │  │  [img] [img]     │  │  │
│  │  └───────────────────────────────────────┘  │  │  │  [img]           │  │  │
│  │                                              │  │  │                  │  │  │
│  │  ┌─ Description de l'article ────────────┐  │  │  │  3 photo(s)      │  │  │
│  │  │  Selle Bob Lee Trail 15" western       │  │  │  └──────────────────┘  │  │
│  │  │  Marque : Bob Lee · État : Bon état    │  │  │                        │  │
│  │  │  Prix demandé : 480,00 €               │  │  └────────────────────────┘  │
│  │  │                                        │  │                              │
│  │  │  Prix de mise en vente (€) *           │  │                              │
│  │  │  [___480,00_______________]            │  │                              │
│  │  │  ↑ Modifiable avant acceptation        │  │                              │
│  │  │                                        │  │                              │
│  │  │  Notes internes (optionnel)            │  │                              │
│  │  │  [textarea…]                           │  │                              │
│  │  └───────────────────────────────────────┘  │                              │
│  │                                              │                              │
│  │  ┌─ Actions ─────────────────────────────┐  │                              │
│  │  │  [Accepter la consignation ▶]          │  │                              │
│  │  │  [Refuser]                             │  │                              │
│  │  └───────────────────────────────────────┘  │                              │
│  │                                              │                              │
│  └──────────────────────────────────────────────┘                              │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Breakpoints

- **Mobile 375px**: colonne unique, photos avant les actions (remonter après déposant + description), boutons d'action pleine largeur empilés. Prix de vente affiché en grand (`font-display text-2xl text-cgws-copper`). Pas de sticky.
- **Tablet 768px**: colonne unique, photos sous la description et avant les actions. Boutons en ligne (flex-row).
- **Desktop 1280px**: grille `lg:grid-cols-3` — infos+actions sur 2/3 à gauche, photos sur 1/3 à droite (`lg:sticky lg:top-24`).

## En-tête de page

```html
<div class="flex items-start justify-between mb-6 gap-4">
  <!-- Retour + titre -->
  <div class="flex items-center gap-3 min-w-0">
    <NuxtLink
      to="/admin/consignations"
      class="flex-shrink-0 p-1.5 rounded-sm text-cgws-leather
             hover:text-cgws-copper hover:bg-cgws-copper/10
             transition-colors focus-visible:ring-2
             focus-visible:ring-cgws-copper focus-visible:outline-none"
      aria-label="Retour à la liste des consignations">
      <UIcon name="i-lucide-arrow-left" class="w-5 h-5" aria-hidden="true" />
    </NuxtLink>
    <div class="min-w-0">
      <h2 class="font-serif font-bold text-2xl text-cgws-charcoal line-clamp-1">
        Demande de {{ consignment?.depositorName ?? '…' }}
      </h2>
      <p class="font-sans text-xs text-cgws-leather mt-0.5">
        Reçue le {{ formatDate(consignment?.createdAt) }}
      </p>
    </div>
  </div>
  <!-- Badge statut courant -->
  <span v-if="consignment" :class="[consignmentPillClass(consignment.status), 'flex-shrink-0 mt-1']">
    <span v-if="consignment.status === 'pending'"
          class="w-1.5 h-1.5 rounded-full bg-cgws-copper animate-pulse"
          aria-hidden="true" />
    {{ CONSIGNMENT_STATUS_LABELS[consignment.status] }}
  </span>
</div>

<!-- Skeleton pendant chargement -->
<div v-if="!consignment" class="space-y-4 animate-pulse">
  <div class="h-8 w-72 bg-cgws-leather/10 rounded" />
  <div class="h-48 bg-cgws-leather/10 rounded-[4px]" />
  <div class="h-64 bg-cgws-leather/10 rounded-[4px]" />
</div>
```

## Grille principale (lg+)

```html
<div v-if="consignment"
     class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

  <!-- Colonne infos + actions (2/3) -->
  <div class="lg:col-span-2 space-y-5">
    <!-- Coordonnées déposant -->
    <!-- Description article -->
    <!-- Actions (état-dépendant) -->
    <!-- Commission (si sold) -->
  </div>

  <!-- Colonne photos (1/3, sticky lg+) -->
  <div class="lg:col-span-1 lg:sticky lg:top-24 order-first lg:order-last">
    <!-- Galerie photos -->
  </div>

</div>
```

Sur mobile (`order-first`), les photos remontent au-dessus de la zone d'information — pratique pour évaluer visuellement l'article dès le premier regard.

## Carte — Coordonnées du déposant

```html
<section aria-labelledby="depositor-heading"
         class="bg-white border border-cgws-leather/30 rounded-[4px] p-5">
  <h3 id="depositor-heading"
      class="font-sans font-semibold text-xs uppercase tracking-widest
             text-cgws-copper mb-4">
    Déposant
  </h3>
  <dl class="space-y-3">
    <div class="flex items-center gap-3">
      <dt class="sr-only">Nom</dt>
      <UIcon name="i-lucide-user" class="w-4 h-4 text-cgws-leather/60 flex-shrink-0"
             aria-hidden="true" />
      <dd class="font-sans text-sm font-medium text-cgws-charcoal">
        {{ consignment.depositorName }}
      </dd>
    </div>
    <div class="flex items-center gap-3">
      <dt class="sr-only">Email</dt>
      <UIcon name="i-lucide-mail" class="w-4 h-4 text-cgws-leather/60 flex-shrink-0"
             aria-hidden="true" />
      <dd>
        <a :href="`mailto:${consignment.depositorEmail}`"
           class="font-sans text-sm text-cgws-copper hover:underline
                  focus-visible:ring-2 focus-visible:ring-cgws-copper
                  focus-visible:outline-none rounded-sm">
          {{ consignment.depositorEmail }}
        </a>
      </dd>
    </div>
    <div class="flex items-center gap-3">
      <dt class="sr-only">Téléphone</dt>
      <UIcon name="i-lucide-phone" class="w-4 h-4 text-cgws-leather/60 flex-shrink-0"
             aria-hidden="true" />
      <dd>
        <a :href="`tel:${consignment.depositorPhone}`"
           class="font-sans text-sm text-cgws-charcoal hover:text-cgws-copper
                  focus-visible:ring-2 focus-visible:ring-cgws-copper
                  focus-visible:outline-none rounded-sm">
          {{ consignment.depositorPhone }}
        </a>
      </dd>
    </div>
  </dl>
</section>
```

## Carte — Description de l'article + Prix de vente

```html
<section aria-labelledby="item-heading"
         class="bg-white border border-cgws-leather/30 rounded-[4px] p-5 space-y-5">
  <h3 id="item-heading"
      class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper">
    Article proposé
  </h3>

  <!-- Description + métadonnées -->
  <div class="space-y-3">
    <p class="font-sans text-sm text-cgws-charcoal leading-relaxed">
      {{ consignment.itemDescription }}
    </p>
    <dl class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div v-if="consignment.brand">
        <dt class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-0.5">Marque</dt>
        <dd class="font-sans text-sm font-medium text-cgws-charcoal">{{ consignment.brand }}</dd>
      </div>
      <div>
        <dt class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-0.5">État</dt>
        <dd class="font-sans text-sm font-medium text-cgws-charcoal">{{ CONDITION_LABELS[consignment.condition] }}</dd>
      </div>
      <div>
        <dt class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-0.5">Prix demandé</dt>
        <dd class="font-display text-base text-cgws-charcoal">{{ formatPrice(consignment.askingPrice) }}</dd>
      </div>
    </dl>
  </div>

  <!-- Séparateur -->
  <hr class="border-cgws-leather/15" />

  <!-- Prix de mise en vente (éditable si pending) -->
  <div>
    <label for="field-agreed-price"
           class="block font-sans text-xs font-semibold uppercase
                  tracking-wider text-cgws-leather mb-1.5">
      Prix de mise en vente (€)
      <span v-if="consignment.status === 'pending'" class="text-cgws-rust ml-0.5">*</span>
    </label>
    <div class="relative">
      <input
        id="field-agreed-price"
        v-model.number="form.agreedPrice"
        type="number"
        min="0"
        step="0.01"
        :disabled="consignment.status !== 'pending' || isSubmitting"
        class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
               rounded-sm font-display text-xl text-cgws-copper
               focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
               focus:outline-none
               disabled:opacity-60 disabled:bg-cgws-leather/5 disabled:cursor-default"
        :class="errors.agreedPrice ? 'border-cgws-rust' : ''"
        aria-required="true"
        :aria-describedby="errors.agreedPrice ? 'agreed-price-error' : 'agreed-price-hint'"
      />
    </div>
    <p v-if="errors.agreedPrice" id="agreed-price-error" role="alert"
       class="mt-1 font-sans text-xs text-cgws-rust">
      {{ errors.agreedPrice }}
    </p>
    <p v-else id="agreed-price-hint"
       class="mt-1 font-sans text-xs text-cgws-leather">
      <template v-if="consignment.status === 'pending'">
        Le déposant demande {{ formatPrice(consignment.askingPrice) }}.
        Ajustez si vous avez convenu d'un prix différent.
      </template>
      <template v-else>
        Prix convenu lors de l'acceptation.
      </template>
    </p>
  </div>

  <!-- Notes internes (visibles et éditables uniquement si pending) -->
  <div v-if="consignment.status === 'pending'">
    <label for="field-notes"
           class="block font-sans text-xs font-semibold uppercase
                  tracking-wider text-cgws-leather mb-1.5">
      Notes internes
      <span class="font-normal normal-case tracking-normal text-cgws-leather/70">(optionnel)</span>
    </label>
    <textarea
      id="field-notes"
      v-model="form.notes"
      :rows="3"
      placeholder="Observations sur l'état, historique de contact…"
      :disabled="isSubmitting"
      class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
             rounded-sm font-sans text-sm text-cgws-charcoal
             placeholder:text-cgws-rope resize-none
             focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
             focus:outline-none disabled:opacity-50"
    />
  </div>
  <div v-else-if="consignment.notes"
       class="bg-cgws-parchment/50 border border-cgws-leather/20 rounded-sm p-3">
    <p class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-1">Notes</p>
    <p class="font-sans text-sm text-cgws-charcoal">{{ consignment.notes }}</p>
  </div>

</section>
```

`CONDITION_LABELS` :
```ts
const CONDITION_LABELS: Record<ProductCondition, string> = {
  new:       'Neuf',
  excellent: 'Excellent état',
  good:      'Bon état',
  fair:      'État correct',
}
```

## Galerie photos

```html
<section aria-labelledby="photos-heading"
         class="bg-white border border-cgws-leather/30 rounded-[4px] p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 id="photos-heading"
        class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper">
      Photos
    </h3>
    <span class="font-sans text-xs text-cgws-leather">
      {{ consignment.images.length }} photo{{ consignment.images.length !== 1 ? 's' : '' }}
    </span>
  </div>

  <!-- État vide -->
  <div v-if="consignment.images.length === 0"
       class="py-8 text-center border-2 border-dashed border-cgws-leather/20 rounded-sm">
    <UIcon name="i-lucide-image-off"
           class="w-8 h-8 mx-auto mb-2 text-cgws-leather/30" aria-hidden="true" />
    <p class="font-sans text-xs text-cgws-leather italic">
      Aucune photo fournie par le déposant.
    </p>
  </div>

  <!-- Grille d'images -->
  <div v-else
       class="grid grid-cols-2 lg:grid-cols-2 gap-2"
       role="list"
       aria-label="Photos de l'article soumises par le déposant">
    <div v-for="(url, index) in consignment.images" :key="url"
         role="listitem"
         class="relative aspect-square rounded-sm overflow-hidden
                bg-cgws-parchment border border-cgws-leather/20">
      <NuxtImg
        :src="url"
        :alt="`Photo ${index + 1} de l'article — ${consignment.itemDescription}`"
        class="w-full h-full object-cover"
        width="200"
        height="200"
        format="webp"
        loading="lazy"
      />
      <!-- Badge première photo -->
      <div v-if="index === 0"
           class="absolute bottom-0 left-0 right-0
                  bg-cgws-copper/85 text-cgws-charcoal
                  font-sans font-semibold text-[9px] uppercase tracking-wider
                  py-0.5 text-center">
        Principale
      </div>
    </div>
  </div>

</section>
```

## Panneau d'actions — selon statut

Le panneau est conditionnel sur `consignment.status`. Il constitue la section la plus basse de la colonne gauche.

### Variante `pending` — Accepter ou Refuser

```html
<section v-if="consignment.status === 'pending'"
         aria-labelledby="actions-heading"
         class="bg-white border border-cgws-leather/30 rounded-[4px] p-5">
  <h3 id="actions-heading"
      class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper mb-4">
    Décision
  </h3>
  <p class="font-sans text-sm text-cgws-leather mb-5">
    En acceptant, un produit sera automatiquement créé au catalogue avec le prix de mise en vente
    indiqué ci-dessus. Un email de confirmation sera envoyé à
    <strong class="text-cgws-charcoal">{{ consignment.depositorEmail }}</strong>.
  </p>
  <div class="flex flex-col sm:flex-row gap-3">
    <!-- Accepter -->
    <button
      type="button"
      :disabled="isSubmitting"
      class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5
             rounded-sm bg-cgws-copper text-white
             font-sans text-sm font-semibold
             hover:bg-cgws-leather transition-colors duration-150
             disabled:opacity-40 disabled:cursor-not-allowed
             focus-visible:ring-2 focus-visible:ring-cgws-copper
             focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-describedby="accept-hint"
      @click="handleAccept">
      <span v-if="isSubmitting && pendingAction === 'accept'"
            class="w-4 h-4 rounded-full border-2 border-white
                   border-t-transparent animate-spin"
            aria-hidden="true" />
      <UIcon v-else name="i-lucide-check-circle"
             class="w-4 h-4" aria-hidden="true" />
      {{ isSubmitting && pendingAction === 'accept' ? 'Validation…' : 'Accepter la consignation' }}
    </button>

    <!-- Refuser -->
    <button
      type="button"
      :disabled="isSubmitting"
      class="sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5
             rounded-sm border border-cgws-rust/50 text-cgws-rust bg-transparent
             font-sans text-sm font-semibold
             hover:bg-cgws-rust/10 hover:border-cgws-rust
             transition-colors duration-150
             disabled:opacity-40 disabled:cursor-not-allowed
             focus-visible:ring-2 focus-visible:ring-cgws-copper
             focus-visible:outline-none"
      @click="openRejectModal">
      <UIcon name="i-lucide-x-circle" class="w-4 h-4" aria-hidden="true" />
      Refuser
    </button>
  </div>
  <p id="accept-hint" class="mt-3 font-sans text-xs text-cgws-leather/70">
    Assurez-vous que le prix de mise en vente est correct avant d'accepter.
  </p>
</section>
```

### Variante `accepted` — En vente + lien produit

```html
<section v-else-if="consignment.status === 'accepted'"
         class="bg-white border border-cgws-leather/30 rounded-[4px] p-5">
  <div class="flex items-start gap-4">
    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100
                flex items-center justify-center">
      <UIcon name="i-lucide-shopping-bag" class="w-5 h-5 text-green-700" aria-hidden="true" />
    </div>
    <div>
      <p class="font-sans text-sm font-semibold text-cgws-charcoal mb-1">
        Consignation acceptée — article en vente
      </p>
      <p class="font-sans text-sm text-cgws-leather">
        Un produit a été créé automatiquement au catalogue
        avec un prix de mise en vente de
        <strong class="font-display text-base text-cgws-copper">
          {{ formatPrice(consignment.agreedPrice!) }}
        </strong>.
      </p>
      <NuxtLink v-if="linkedProduct"
                :to="`/admin/produits/${linkedProduct.id}`"
                class="mt-3 inline-flex items-center gap-1.5
                       font-sans text-sm font-semibold text-cgws-copper
                       hover:underline focus-visible:ring-2
                       focus-visible:ring-cgws-copper focus-visible:outline-none">
        Voir le produit au catalogue
        <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</section>
```

### Variante `rejected` — Refusée + motif

```html
<section v-else-if="consignment.status === 'rejected'"
         class="bg-cgws-rust/5 border border-cgws-rust/30 rounded-[4px] p-5">
  <div class="flex items-start gap-4">
    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-rust/15
                flex items-center justify-center">
      <UIcon name="i-lucide-ban" class="w-5 h-5 text-cgws-rust" aria-hidden="true" />
    </div>
    <div>
      <p class="font-sans text-sm font-semibold text-cgws-charcoal mb-1">
        Consignation refusée
      </p>
      <p class="font-sans text-sm text-cgws-leather">
        Un email de refus a été envoyé à
        <strong class="text-cgws-charcoal">{{ consignment.depositorEmail }}</strong>
        avec le motif suivant :
      </p>
      <blockquote v-if="consignment.notes"
                  class="mt-2 pl-3 border-l-2 border-cgws-rust/40
                         font-sans text-sm text-cgws-charcoal italic">
        {{ consignment.notes }}
      </blockquote>
    </div>
  </div>
</section>
```

Note : lors du refus, le `motif` saisi dans la modale est stocké dans `consignment.notes` côté serveur.

### Variante `sold` — Vendue + commission

```html
<section v-else-if="consignment.status === 'sold'"
         class="bg-white border border-cgws-leather/30 rounded-[4px] p-5 space-y-4">
  <h3 class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper">
    Détail de la vente
  </h3>

  <dl class="space-y-2">
    <!-- Prix de vente effectif -->
    <div class="flex items-center justify-between py-2
                border-b border-cgws-leather/10">
      <dt class="font-sans text-sm text-cgws-leather">Prix de vente</dt>
      <dd class="font-display text-lg text-cgws-charcoal">
        {{ formatPrice(linkedSale?.salePrice ?? consignment.agreedPrice ?? 0) }}
      </dd>
    </div>
    <!-- Commission CGWS -->
    <div class="flex items-center justify-between py-2
                border-b border-cgws-leather/10">
      <dt class="font-sans text-sm text-cgws-leather">
        Commission CGWS
        <span class="text-xs text-cgws-leather/60">(20 %)</span>
      </dt>
      <dd class="font-display text-lg text-cgws-rust">
        − {{ formatPrice(linkedSale?.commissionAmount ?? computedCommission) }}
      </dd>
    </div>
    <!-- Montant à reverser -->
    <div class="flex items-center justify-between pt-3">
      <dt class="font-sans text-sm font-semibold text-cgws-charcoal">
        Montant à reverser au déposant
      </dt>
      <dd class="font-display text-2xl text-cgws-copper">
        {{ formatPrice(computedDepositorAmount) }}
      </dd>
    </div>
  </dl>

  <p class="font-sans text-xs text-cgws-leather/70">
    Taux de commission CGWS fixe : 20 % du prix de vente effectif.
  </p>
</section>
```

**Computed commission** :
```ts
const COMMISSION_RATE = 0.20

const computedCommission = computed(() => {
  const price = linkedSale?.value?.salePrice ?? consignment.value?.agreedPrice ?? 0
  return Math.round(price * COMMISSION_RATE * 100) / 100
})

const computedDepositorAmount = computed(() => {
  const price = linkedSale?.value?.salePrice ?? consignment.value?.agreedPrice ?? 0
  return Math.round((price - computedCommission.value) * 100) / 100
})
```

### Variante `returned` — Retournée

```html
<section v-else-if="consignment.status === 'returned'"
         class="bg-cgws-leather/5 border border-cgws-leather/20 rounded-[4px] p-5">
  <div class="flex items-center gap-3">
    <UIcon name="i-lucide-undo-2" class="w-5 h-5 text-cgws-leather" aria-hidden="true" />
    <p class="font-sans text-sm text-cgws-leather">
      Cet article a été retourné au déposant.
    </p>
  </div>
</section>
```

---

---

# MODALE DE REFUS

La modale de refus suit le même pattern que `SaleModal.vue` : `<Teleport to="body">`, `<Transition name="modal">`, focus trap identique, `@keydown.esc` pour fermer.

## Déclenchement

Contrôlée par `showRejectModal: boolean`. Ouverte via `openRejectModal()`, qui initialise `rejectForm.reason = ''` et positionne le focus sur le `<textarea>` au prochain tick.

## Structure HTML

```html
<Teleport to="body">
  <Transition name="modal">
    <div v-if="showRejectModal"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         role="dialog"
         aria-modal="true"
         aria-labelledby="reject-modal-title"
         @keydown.esc="closeRejectModal">

      <!-- Backdrop -->
      <div class="absolute inset-0 bg-cgws-charcoal/60 backdrop-blur-sm"
           aria-hidden="true"
           @click="closeRejectModal" />

      <!-- Boîte modale -->
      <div ref="rejectModalRef"
           class="relative bg-white border-2 border-cgws-charcoal rounded-sm
                  shadow-xl w-full max-w-md flex flex-col max-h-[90dvh]"
           tabindex="-1"
           @keydown="handleRejectModalKeydown">

        <!-- En-tête -->
        <div class="flex items-start gap-4 p-5 border-b border-cgws-leather/20 flex-shrink-0">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-rust/10
                      flex items-center justify-center">
            <UIcon name="i-lucide-ban" class="w-5 h-5 text-cgws-rust" aria-hidden="true" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 id="reject-modal-title"
                class="font-serif font-bold text-lg text-cgws-charcoal">
              Refuser la demande
            </h3>
            <p class="font-sans text-sm text-cgws-leather mt-0.5 line-clamp-1">
              {{ consignment.depositorName }} — {{ consignment.itemDescription }}
            </p>
          </div>
          <button type="button"
                  class="flex-shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-sm
                         text-cgws-leather hover:text-cgws-charcoal
                         hover:bg-cgws-parchment/40 transition-colors
                         focus-visible:ring-2 focus-visible:ring-cgws-copper
                         focus-visible:outline-none"
                  aria-label="Fermer sans refuser"
                  @click="closeRejectModal">
            <UIcon name="i-lucide-x" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <!-- Corps -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <p class="font-sans text-sm text-cgws-leather">
            Un email sera automatiquement envoyé à
            <strong class="text-cgws-charcoal">{{ consignment.depositorEmail }}</strong>
            avec le motif de refus.
          </p>
          <div>
            <label for="reject-reason"
                   class="block font-sans text-xs font-semibold uppercase
                          tracking-wider text-cgws-leather mb-1.5">
              Motif de refus <span class="text-cgws-rust">*</span>
            </label>
            <textarea
              id="reject-reason"
              ref="rejectReasonRef"
              v-model="rejectForm.reason"
              :rows="4"
              placeholder="Ex. : L'état de l'article ne correspond pas à nos critères de dépôt…"
              required
              :disabled="isSubmitting"
              class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
                     rounded-sm font-sans text-sm text-cgws-charcoal
                     placeholder:text-cgws-rope resize-none
                     focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                     focus:outline-none disabled:opacity-50"
              :class="rejectErrors.reason ? 'border-cgws-rust' : ''"
              aria-required="true"
              :aria-describedby="rejectErrors.reason ? 'reject-reason-error' : undefined"
            />
            <p v-if="rejectErrors.reason"
               id="reject-reason-error"
               role="alert"
               class="mt-1 font-sans text-xs text-cgws-rust">
              {{ rejectErrors.reason }}
            </p>
            <p class="mt-1 font-sans text-xs text-cgws-leather/70">
              Ce message sera repris tel quel dans l'email envoyé au déposant.
            </p>
          </div>
        </div>

        <!-- Pied de page -->
        <div class="flex flex-col-reverse sm:flex-row items-center justify-between
                    gap-3 p-5 border-t border-cgws-leather/20 flex-shrink-0">
          <button type="button"
                  :disabled="isSubmitting"
                  class="w-full sm:w-auto px-4 py-2 rounded-sm
                         border border-cgws-leather/40 text-cgws-leather
                         font-sans text-sm font-medium
                         hover:bg-cgws-parchment/40 hover:text-cgws-charcoal
                         transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                         focus-visible:ring-2 focus-visible:ring-cgws-copper
                         focus-visible:outline-none"
                  @click="closeRejectModal">
            Annuler
          </button>
          <button type="button"
                  :disabled="isSubmitting || !rejectForm.reason.trim()"
                  class="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         px-5 py-2 rounded-sm bg-cgws-rust text-white
                         font-sans text-sm font-semibold
                         hover:bg-cgws-charcoal transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         focus-visible:ring-2 focus-visible:ring-cgws-copper
                         focus-visible:ring-offset-2 focus-visible:outline-none"
                  @click="handleReject">
            <span v-if="isSubmitting && pendingAction === 'reject'"
                  class="w-4 h-4 rounded-full border-2 border-white
                         border-t-transparent animate-spin"
                  aria-hidden="true" />
            {{ isSubmitting && pendingAction === 'reject' ? 'Envoi…' : 'Confirmer le refus' }}
          </button>
        </div>

      </div>
    </div>
  </Transition>
</Teleport>
```

**Focus trap** : implémentation identique à `SaleModal.vue` — sélection de tous les éléments focusables dans `rejectModalRef`, cycle Tab/Shift+Tab, focus initial sur `rejectReasonRef` (le textarea), retour du focus sur le bouton "Refuser" à la fermeture.

---

---

# API ROUTES SERVEUR

## Convention commune

Toutes les routes admin vérifient l'authentification via `requireAdminAuth(event)`. Si non-authentifié → `throw createError({ statusCode: 401 })`. Erreurs de validation → `throw createError({ statusCode: 422, data: { errors: Record<string, string> } })`.

---

## `GET /api/admin/consignments` — Liste paginée

**Fichier** : `server/api/admin/consignments/index.get.ts`

**Query params** :
```
page   : number (défaut 1)
limit  : number (défaut 20, max 100)
search : string (optionnel) — ILIKE sur depositor_name
status : ConsignmentStatus (optionnel)
```

**Réponse** :
```ts
{
  items:        Consignment[]  // snake_case → camelCase
  total:        number
  page:         number
  totalPages:   number
  pendingCount: number         // count des demandes pending (tous filtres désactivés)
}
```

**Requête Supabase** :
```ts
let query = supabase
  .from('consignments')
  .select('*', { count: 'exact' })
  .order('CASE WHEN status = $1 THEN 0 ELSE 1 END', { ascending: true }) // SQL raw si nécessaire
  .order('created_at', { ascending: false })

// Supabase ne supporte pas CASE WHEN dans .order() nativement.
// Alternative : deux requêtes fusionnées, ou RPC SQL :
//   SELECT * FROM consignments
//   ORDER BY (CASE WHEN status = 'pending' THEN 0 ELSE 1 END), created_at DESC
//   LIMIT $limit OFFSET $offset
// Via supabase.rpc('list_consignments', { p_status, p_search, p_limit, p_offset })

if (search) query = query.ilike('depositor_name', `%${search}%`)
if (status) query = query.eq('status', status)

query = query.range((page - 1) * limit, page * limit - 1)
```

Pour le `pendingCount`, effectuer une requête COUNT séparée sans les filtres de recherche/statut : `supabase.from('consignments').select('id', { count: 'exact', head: true }).eq('status', 'pending')`.

---

## `GET /api/admin/consignments/[id]` — Détail

**Fichier** : `server/api/admin/consignments/[id].get.ts`

**Réponse** :
```ts
{
  consignment:   Consignment
  linkedProduct?: {
    id:     string
    title:  string
    status: ProductStatus
    slug:   string
  }
  linkedSale?: {
    salePrice:        number
    commissionAmount: number
    saleDate:         string
    paymentMethod:    PaymentMethod
  }
}
```

**Traitement** :
```ts
// 1. Récupérer la consignation
const { data: cons } = await supabase
  .from('consignments').select('*').eq('id', id).single()
if (!cons) throw createError({ statusCode: 404 })

// 2. Récupérer le produit lié (si accepted/sold)
let linkedProduct = undefined
if (['accepted', 'sold'].includes(cons.status)) {
  const { data: prod } = await supabase
    .from('products')
    .select('id, title, status, slug')
    .eq('consignment_id', id)
    .maybeSingle()
  linkedProduct = prod ?? undefined
}

// 3. Récupérer la vente (si sold)
let linkedSale = undefined
if (cons.status === 'sold' && linkedProduct) {
  const { data: sale } = await supabase
    .from('sales')
    .select('sale_price, commission_amount, sale_date, payment_method')
    .eq('product_id', linkedProduct.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  linkedSale = sale ?? undefined
}
```

---

## `PATCH /api/admin/consignments/[id]/accept` — Acceptation

**Fichier** : `server/api/admin/consignments/[id].accept.patch.ts`

**Body** :
```ts
{
  agreedPrice: number   // requis, > 0
  notes?:      string   // notes internes optionnelles
}
```

**Traitement** :
1. Valider `agreedPrice > 0` → 422 si invalide
2. Récupérer la consignation, vérifier `status === 'pending'` → 409 si déjà traitée
3. Générer un slug pour le produit à partir de `itemDescription + brand` (slugify + vérification unicité)
4. Créer le produit dans `products` :
   ```ts
   {
     title:          cons.item_description,
     slug:           generatedSlug,
     description:    '',           // Camille pourra enrichir via l'interface produit
     price:          agreedPrice,
     category:       'accessoires', // valeur par défaut — Camille corrige ensuite
     brand:          cons.brand ?? '',
     condition:      cons.condition,
     is_consignment: true,
     consignment_id: id,
     status:         'active',
     images:         cons.images,  // reprendre les images du déposant
     stock:          1,
   }
   ```
5. Mettre à jour la consignation : `status = 'accepted'`, `agreed_price = agreedPrice`, `notes = notes`
6. Envoyer l'email d'acceptation via Resend à `cons.depositor_email`

**Réponse 200** :
```ts
{
  consignment:   Consignment
  linkedProduct: { id: string; title: string; slug: string; status: ProductStatus }
}
```

**Email d'acceptation** — sujet : `"Votre consignation a été acceptée — CGWS"`. Corps : montant convenu, lien vers la boutique, explication du processus.

**Note** : le produit créé a `category: 'accessoires'` par défaut. Camille peut le corriger depuis `/admin/produits/[id]`. Un message d'info dans le panneau `accepted` peut le signaler : `"Pensez à vérifier la catégorie du produit créé."`

---

## `PATCH /api/admin/consignments/[id]/reject` — Refus

**Fichier** : `server/api/admin/consignments/[id].reject.patch.ts`

**Body** :
```ts
{
  reason: string  // requis, non vide
}
```

**Traitement** :
1. Valider `reason.trim().length > 0` → 422 si vide
2. Vérifier `status === 'pending'` → 409 si déjà traitée
3. Mettre à jour : `status = 'rejected'`, `notes = reason`
4. Envoyer l'email de refus via Resend

**Email de refus** — sujet : `"Votre demande de consignation — CGWS"`. Corps : motif transmis, invitation à recontacter CGWS pour toute question.

**Réponse 200** :
```ts
{ consignment: Consignment }
```

---

---

# RÉSUMÉ DES ÉTATS ET TRANSITIONS

## Workflow statuts

```
pending ──────────────────────┬──► accepted ──► sold
                               │
                               └──► rejected

accepted ──(article retourné manuellement)──► returned
```

La transition `accepted → sold` n'est pas gérée par US-040 : elle se déclenche via l'enregistrement d'une vente sur le produit lié (SaleModal, US-034), qui met à jour le produit en `sold` et la consignation en `sold` côté serveur.

## États — page liste

| État | Description |
|------|-------------|
| Chargement | 8 lignes skeleton |
| Vide (aucune demande) | Illustration `i-lucide-inbox` + texte |
| Vide (filtre actif) | Message + bouton "Réinitialiser" |
| Default | Tableau, pending en premier avec fond copper/5 |

## États — page détail

| État | Description |
|------|-------------|
| Chargement | Skeleton formulaire + photos |
| `pending` | Prix éditable, notes éditables, boutons Accepter/Refuser |
| `accepted` | Prix en lecture seule, carte "En vente" + lien produit |
| `rejected` | Prix en lecture seule, carte "Refusée" + motif en blockquote |
| `sold` | Prix en lecture seule, carte commission avec calcul 20% |
| `returned` | Carte "Retournée" |
| Acceptation en cours | Bouton "Validation…" avec spinner, tout le formulaire disabled |
| Refus en cours | Bouton "Envoi…" avec spinner dans la modale, modale non fermable |

## Toast de feedback

Pattern identique à US-032 (`<Teleport to="body">`, `role="status" aria-live="polite"` pour succès, `role="alert" aria-live="assertive"` pour erreurs, disparition après 4 secondes) :

```html
<div v-if="toast"
     :role="toast.type === 'error' ? 'alert' : 'status'"
     :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
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

Messages toast :
- Acceptation réussie : `"Consignation acceptée — produit créé au catalogue."`
- Refus réussi : `"Demande refusée — email envoyé au déposant."`
- Erreur réseau : `"Une erreur est survenue. Veuillez réessayer."`
- Conflit (déjà traitée) : `"Cette demande a déjà été traitée."`

---

---

# ACCESSIBILITÉ

- Le tableau a une `<caption class="sr-only">` décrivant le contenu et l'ordre de tri
- Toutes les colonnes `<th scope="col">` avec texte lisible
- Le point pulsant (`animate-pulse`) du badge `pending` est `aria-hidden="true"` — le texte "En attente" suffit à la restitution vocale
- Modale de refus : `role="dialog" aria-modal="true"` + `aria-labelledby` → titre de la modale + focus trap identique à `SaleModal.vue` + Escape pour fermer + retour focus sur le bouton "Refuser" à la fermeture
- Bouton "Voir" dans le tableau : `aria-label="Voir la demande de [depositorName]"` pour distinguer les boutons entre eux
- Panneau Commission : structure `<dl>/<dt>/<dd>` sémantique, montant à reverser annoté comme résultat final
- Section photos : `role="list"` + `role="listitem"` sur chaque image, alt text contextuel (`"Photo 1 de l'article — Selle Bob Lee 15\""`)
- Liens email/téléphone dans la carte déposant : href `mailto:` et `tel:` natifs, accessibles au clavier
- Prix de vente désactivé en lecture seule : `disabled` + texte hint suffisamment contrastés (le fond `cgws-leather/5` sur `disabled` reste > 4.5:1 pour le texte `text-cgws-copper`)
- Focus visible : `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2 focus-visible:outline-none` sur tous les interactifs
- Erreur champ prix : `aria-describedby` sur l'input pointant vers le message d'erreur, `role="alert"` sur le `<p>` d'erreur
- Toast : `role="status" aria-live="polite"` (succès) ou `role="alert" aria-live="assertive"` (erreur)
- Contraste : `cgws-charcoal (#1A0B03)` sur `white` > 18:1. `cgws-copper (#B8650A)` sur `white` = 3.2:1 — acceptable pour Bebas Neue taille `text-xl`+ (grand texte WCAG). `text-cgws-rust (#943218)` sur `white` = 5.2:1 (AAA texte normal). Badge `pending` : `text-cgws-copper` sur `bg-cgws-copper/20` ≈ 3.5:1 — acceptable car le contexte (pulsation + ligne surlignée) renforce la hiérarchie visuelle au-delà du seul contraste textuel.

---

---

# TAILWIND CLASSES CLÉS — RÉCAPITULATIF

```
/* Ligne pending — fond prioritaire */
bg-cgws-copper/5 hover:bg-cgws-copper/10

/* Badge pending avec pulse */
bg-cgws-copper/20 text-cgws-copper
inline-flex items-center gap-1.5 px-2.5 py-0.5
font-sans font-medium text-[11px] uppercase tracking-wider rounded-full

/* Point pulsant */
w-1.5 h-1.5 rounded-full bg-cgws-copper animate-pulse flex-shrink-0

/* Badge accepted */
bg-green-100 text-green-700 [mêmes classes pill]

/* Badge rejected */
bg-cgws-rust/15 text-cgws-rust [mêmes classes pill]

/* Badge sold */
bg-cgws-charcoal/10 text-cgws-charcoal [mêmes classes pill]

/* Bouton "Voir" tableau */
bg-cgws-copper/10 text-cgws-copper text-xs font-semibold
hover:bg-cgws-copper hover:text-white
inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm

/* Bouton Accepter (primary) */
bg-cgws-copper text-white font-sans text-sm font-semibold
hover:bg-cgws-leather rounded-sm px-5 py-2.5

/* Bouton Refuser (ghost danger) */
border border-cgws-rust/50 text-cgws-rust
hover:bg-cgws-rust/10 hover:border-cgws-rust rounded-sm px-4 py-2.5

/* Carte déposant / article */
bg-white border border-cgws-leather/30 rounded-[4px] p-5

/* Carte "accepted" */
bg-white border border-cgws-leather/30 rounded-[4px] p-5

/* Carte "rejected" */
bg-cgws-rust/5 border border-cgws-rust/30 rounded-[4px] p-5

/* Input prix désactivé */
disabled:opacity-60 disabled:bg-cgws-leather/5 disabled:cursor-default

/* Section commission — montant reverser */
font-display text-2xl text-cgws-copper

/* Commission — déduction */
font-display text-lg text-cgws-rust

/* Legend fieldset */
font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper

/* Textarea motif refus */
bg-cgws-cream border border-cgws-leather/40 rounded-sm
font-sans text-sm text-cgws-charcoal placeholder:text-cgws-rope resize-none
focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 focus:outline-none
```
