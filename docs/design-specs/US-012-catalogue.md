# Catalogue — Spec UX (US-012)

**Purpose**: Page de liste des produits CGWS. Le visiteur parcourt l'ensemble du catalogue (selles, brides, bottes, vêtements, accessoires, protections), filtre selon ses critères, trie les résultats et charge progressivement les articles via scroll infini. C'est la page à plus fort trafic et la porte d'entrée principale vers les fiches produit.
**Sprint**: 1 — Site Public Vitrine

**Fichiers concernés par cette spec :**
- `app/pages/catalogue/index.vue`
- `app/components/catalogue/ProductCard.vue`
- `app/components/catalogue/ProductGrid.vue`
- `app/components/catalogue/FilterPanel.vue`
- `app/components/catalogue/FilterDrawer.vue`
- `app/components/catalogue/SortSelect.vue`
- `app/components/catalogue/CatalogueHeader.vue`
- `app/components/catalogue/EmptyState.vue`
- `app/components/ui/ProductCardSkeleton.vue`
- `app/composables/useCatalogue.ts`
- `app/composables/useInfiniteScroll.ts`

---

## 1. Vue d'ensemble de la page `/catalogue`

### Layout global — ASCII wireframe (desktop 1280px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [AppHeader sticky — bg-cgws-tack h-16]                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ [CatalogueHeader — bg-cgws-cream py-10]                                     │
│   Sellerie de Brèches (Rye eyebrow)                                          │
│   CATALOGUE (Bebas Neue H1 64px)                                             │
│   143 produits disponibles (live region)                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ConchoDivider]                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ max-w-[1280px] mx-auto px-[var(--container-px)] flex gap-8 items-start      │
│ ┌────────────────────┐  ┌─────────────────────────────────────────────────┐ │
│ │  FilterPanel       │  │  [SortBar: result count left + SortSelect right]│ │
│ │  w-[260px]         │  │  ─────────────────────────────────────────────  │ │
│ │  sticky            │  │  [ProductGrid]                                  │ │
│ │                    │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │ │
│ │  [Catégorie  ▾]    │  │  │Card 1│ │Card 2│ │Card 3│ │Card 4│          │ │
│ │  ○ Selles (12)     │  │  └──────┘ └──────┘ └──────┘ └──────┘          │ │
│ │  ○ Brides (8)      │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │ │
│ │  ─────────────     │  │  │Card 5│ │Card 6│ │Card 7│ │Card 8│          │ │
│ │  [État       ▾]    │  │  └──────┘ └──────┘ └──────┘ └──────┘          │ │
│ │  ─────────────     │  │  ─────────────────────────────────────────────  │ │
│ │  [Marque     ▾]    │  │  [Sentinel IntersectionObserver]                │ │
│ │  ─────────────     │  │  [LoadingSpinner or "fin de liste"]             │ │
│ │  [Prix       ▾]    │  └─────────────────────────────────────────────────┘ │
│ │  ─────────────     │                                                       │
│ │  [Disponibilité ▾] │                                                       │
│ │  ─────────────     │                                                       │
│ │  [Réinitialiser]   │                                                       │
│ └────────────────────┘                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ [AppFooter — bg-cgws-tack]                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Layout global — ASCII wireframe (mobile 375px)

```
┌────────────────────────────┐
│ [AppHeader sticky h-16]   │
├────────────────────────────┤
│ [CatalogueHeader]          │
│   Sellerie de Brèches      │
│   CATALOGUE                │
│   143 produits             │
├────────────────────────────┤
│ [ConchoDivider]            │
├────────────────────────────┤
│ [FilterBar mobile]         │
│ [≡ Filtrer (3)]  [Trier ▾] │
├────────────────────────────┤
│ [ProductGrid — 1 colonne]  │
│ ┌────────────────────────┐ │
│ │      ProductCard       │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │      ProductCard       │ │
│ └────────────────────────┘ │
│ [Sentinel]                 │
│ [Spinner]                  │
├────────────────────────────┤
│ [AppFooter]                │
└────────────────────────────┘
  ↕
[FilterDrawer — bottom sheet, 85vh]
```

---

## 2. CatalogueHeader

**Location**: `app/components/catalogue/CatalogueHeader.vue`
**Purpose**: En-tête de section qui pose l'identité de la page — eyebrow Rye, titre H1 en Bebas Neue, compteur de résultats dynamique mis à jour à chaque changement de filtre.

### Layout ASCII

```
┌──────────────────────────────────────────────────────────────┐
│  bg-cgws-cream  py-10 md:py-14                               │
│                                                              │
│  ┌── max-w-[1280px] mx-auto px-[var(--container-px)] ──┐    │
│  │                                                       │    │
│  │  SELLERIE DE BRÈCHES          ← Rye 12px cgws-copper │    │
│  │                                                       │    │
│  │  CATALOGUE                    ← Bebas Neue 56px mob  │    │
│  │                                   64px desktop        │    │
│  │                               ← text-cgws-charcoal   │    │
│  │                                                       │    │
│  │  143 produits disponibles     ← Inter 500 14px       │    │
│  │                               ← text-cgws-leather    │    │
│  │                               ← aria-live="polite"   │    │
│  │                               ← aria-atomic="true"   │    │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Breakpoints

- Mobile 375px : H1 `text-[56px]`, `py-8`
- Desktop 1280px : H1 `text-[64px]`, `py-14`

### Tailwind classes

**Section wrapper :**
```
bg-cgws-cream
py-8 md:py-14
```

**Container :**
```
max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]
```

**Eyebrow :**
```
font-eyebrow text-[12px] text-cgws-copper
uppercase tracking-[0.2em]
mb-2
```

**H1 :**
```
font-display text-[56px] md:text-[64px] text-cgws-charcoal
leading-none tracking-wide
uppercase
mb-3
```

**Compteur :**
```
font-sans font-medium text-sm text-cgws-leather
```

### Props

```ts
interface Props {
  totalCount: number
  isFiltered: boolean  // true quand des filtres sont actifs — change le libellé
}
// "143 produits disponibles" → "12 produits trouvés" (quand filtré)
```

### Accessibilité

- `<h1>` natif — une seule occurrence par page
- `<span aria-live="polite" aria-atomic="true">` autour du compteur — les lecteurs d'écran annoncent la mise à jour
- `role="region" aria-label="En-tête du catalogue"` sur la section

---

## 3. ProductCard

**Location**: `app/components/catalogue/ProductCard.vue`
**Purpose**: Extension directe de TagCard, adaptée à l'usage catalogue. Même esthétique étiquette de selle, enrichie d'un lien de navigation et d'états visuels pour les produits vendus / réservés. À utiliser uniquement dans les grilles de produits.

### Props TypeScript

```ts
import type { Product } from '~/types'

interface Props {
  product: Product
}
```

### ASCII wireframe (mobile 375px — card environ 320px de large)

```
            ●                         ← perforation: w-3 h-3 rounded-full
┌───────────┴──────────────────────┐  ← bg-cgws-parchment border-2 border-cgws-leather
│                                  │     rounded-[6px] relative
│  ┌────────────────────────────┐  │  ← NuxtImg aspect-[4/3] rounded-t-[4px]
│  │                            │  │     object-cover overflow-hidden
│  │    [image produit]         │  │
│  │                            │  │  ←→ hover reveal: overlay bg-cgws-tack/50
│  │   ╔═══════════════════╗   │  │     + "Voir le produit" centré
│  │   ║  Voir le produit  ║   │  │     Bebas Neue 16px text-cgws-parchment
│  │   ╚═══════════════════╝   │  │     opacity-0 → opacity-100 (200ms)
│  └────────────────────────────┘  │
│                                  │
│  ╔ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╗  │  ← border border-dashed border-cgws-copper
│  ╎  [CONSIGNATION]           ╎  │     m-2 p-3 rounded-sm
│  ╎                           ╎  │
│  ╎  Selle western Prestige   ╎  │  ← Playfair Display 600 16px text-cgws-charcoal
│  ╎  Prestige                 ╎  │     line-clamp-2
│  ╎                           ╎  │  ← Inter 13px text-cgws-leather
│  ╎  Taille: 15"          850 €╎  │  ← Bebas Neue 24px text-cgws-copper
│  ╚ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╝  │
└──────────────────────────────────┘
```

### État Sold

```
┌──────────────────────────────────┐
│  ────────── [VENDU] ──────────── │  ← badge sold en haut de l'image
│  ┌────────────────────────────┐  │
│  │   [image en grayscale]    │  │  ← filter: grayscale(100%)
│  │   bg-cgws-charcoal/30     │  │  ← overlay semi-transparent
│  └────────────────────────────┘  │
│  ╔ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╗  │  ← stitching en cgws-leather/30 (atténué)
│  ╎  Selle western Prestige   ╎  │  ← text-cgws-charcoal/60
│  ╎  Prestige                 ╎  │
│  ╎                       850 €╎  │  ← prix en cgws-leather (pas copper)
│  ╚ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╝  │
└──────────────────────────────────┘
```

### État Reserved

```
  Bandeau diagonal "RÉSERVÉ" en cgws-rust/90
  (position: absolute, inset, rotate-[-25deg], pointer-events-none)
  Inter 700 11px uppercase tracking-widest text-white
  Card non cliquable (cursor-default, no hover effects)
```

### Tailwind classes — détail complet

**Wrapper NuxtLink :**
```
group block
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper
focus-visible:ring-offset-2 rounded-[6px]
```

**Carte (article) :**
```
relative flex flex-col
bg-cgws-parchment border-2 border-cgws-leather rounded-[6px]
overflow-hidden
transition-transform transition-shadow duration-200 ease-in-out
group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-cgws-leather/20
```

Note : l'état vendu supprime `-translate-y-1` et le shadow copper. Les transitions restent mais aucun hover transform ne s'applique.

**Modificateurs sold (classes conditionnelles ajoutées sur .carte) :**
```
cursor-default
[&_.stitching-block]:border-cgws-leather/30
[&_.product-title]:text-cgws-charcoal/60
[&_.product-price]:text-cgws-leather
```

**Perforation hole :**
```
absolute top-2 left-1/2 -translate-x-1/2
w-3 h-3 rounded-full
bg-cgws-cream border border-cgws-leather
z-10
```

**Zone image + hover overlay :**
```
[image wrapper] relative aspect-[4/3] overflow-hidden rounded-t-[4px]
[NuxtImg] w-full h-full object-cover
  group-hover:[&:not(.sold)]:scale-105
  transition-transform duration-300
  [sold state]: grayscale
[hover overlay] absolute inset-0 bg-cgws-tack/50
  flex items-center justify-center
  opacity-0 group-hover:opacity-100 transition-opacity duration-200
  [sold state]: hidden
[overlay label] font-display text-[16px] text-cgws-parchment uppercase tracking-widest
```

**Badge sold overlay (positionnement coin image) :**
```
absolute top-3 left-3 z-10
```

**Bloc couture stitching-block :**
```
stitching-block
m-2 p-3
border border-dashed border-cgws-copper
rounded-sm
flex flex-col gap-1.5
```

**Badge de statut :**
```
self-start
```
(le CgwsBadge existant, variant calculé selon la logique US-003 §4.3)

**Titre produit :**
```
product-title
font-serif font-semibold text-base text-cgws-charcoal
leading-snug line-clamp-2
mt-1
```

**Marque :**
```
font-sans text-[13px] text-cgws-leather
```

**Taille (conditionnelle, si `product.size` existe) :**
```
font-sans text-[12px] text-cgws-leather/70 italic
```

**Prix :**
```
product-price
font-display text-2xl text-cgws-copper
text-right mt-auto
```

**Bandeau réservé (état reserved) :**
```
absolute inset-0 flex items-center justify-center
pointer-events-none overflow-hidden
[inner span] rotate-[-25deg] bg-cgws-rust/90
px-8 py-1.5 w-[200%]
font-sans font-bold text-[11px] uppercase tracking-widest text-white
text-center
```

### États — résumé

| État | Comportement |
|---|---|
| Default | Carte plane, shadow-sm |
| Hover (active/reserved) | group-hover: translateY(-4px), shadow-lg, scale image +5%, overlay "Voir le produit" |
| Focus | Ring 2px cgws-copper visible sur le NuxtLink wrapper |
| Sold | Grayscale image, charcoal overlay /30, badge "Vendu", prix en cgws-leather, aucun hover |
| Reserved | Bandeau diag cgws-rust, card cliquable mais hover atténué |
| Image manquante | Fond cgws-leather/10, icône silhouette selle SVG 48px centré, text-cgws-leather/30 |

### Accessibilité

- `<NuxtLink>` natif `<a>` — rôle lien implicite
- `aria-label` sur le lien : `"${product.title} — ${product.brand} — ${formatPrice(product.price)}${product.status === 'sold' ? ' — Produit vendu' : ''}"`
- `<NuxtImg :alt="\`${product.title}, ${product.brand}\`" />`
- Prix : `<span class="sr-only">Prix : </span>` avant la valeur numérique
- Contraste titre `cgws-charcoal` (#1A0B03) sur `cgws-parchment` (#F0DDB8) → 13.97:1 ✓
- Contraste marque `cgws-leather` sur `cgws-parchment` → 5.88:1 ✓
- Contraste prix `cgws-copper` sur `cgws-parchment` → 3.03:1 — toléré uniquement car 24px+ (large text WCAG AA)

---

## 4. FilterPanel — Sidebar Desktop

**Location**: `app/components/catalogue/FilterPanel.vue`
**Purpose**: Panneau de filtres permanent en sidebar gauche, visible à partir de `lg:` (1024px). Chaque section de filtre est pliable. Les filtres actifs sont signalés visuellement. Un compteur d'actifs est affiché dans le titre de chaque section fermée.

### Layout ASCII (sidebar 260px)

```
┌────────────────────────────┐
│  FILTRES          [Reset]  │  ← header fixe de la sidebar
│  ──────────────────────────│
│                            │
│  ▾  Catégorie    (2)       │  ← section ouverte / compteur actifs
│  ┌──────────────────────┐  │
│  │ ☑ Selles          12 │  │
│  │ ☐ Brides & Licols  8 │  │
│  │ ☐ Bottes           5 │  │
│  │ ☐ Vêtements       14 │  │
│  │ ☐ Accessoires     32 │  │
│  │ ☐ Protections      4 │  │
│  └──────────────────────┘  │
│  ──────────────────────────│
│  ▸  État                   │  ← section fermée
│  ──────────────────────────│
│  ▸  Marque                 │
│  ──────────────────────────│
│  ▾  Prix                   │
│  ┌──────────────────────┐  │
│  │  0 €  ━━━━●══●━━  1500€│
│  │  [Min: 0    ] [Max: 1500]│
│  └──────────────────────┘  │
│  ──────────────────────────│
│  ▾  Disponibilité          │
│  ┌──────────────────────┐  │
│  │ ☑ En stock           │  │
│  │ ☐ Articles consignés │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### Breakpoints

- Mobile / Tablet < 1024px : le composant n'est pas rendu (remplacé par FilterDrawer)
- Desktop lg+ (1024px) : visible, `w-[260px] flex-shrink-0`
- Desktop xl+ (1280px) : même largeur, le grid produits gagne en espace

### Position sticky

```
sticky top-[calc(4rem+1px)]
max-h-[calc(100vh-5rem)]
overflow-y-auto
```
(`4rem` = hauteur du header sticky `h-16`)

### Structure globale

**Wrapper :**
```
hidden lg:flex lg:flex-col
w-[260px] flex-shrink-0
bg-cgws-cream
border border-cgws-leather/20 rounded-[4px]
```

**Header de la sidebar :**
```
flex items-center justify-between
px-4 py-3
border-b border-cgws-leather/20
```

**Label "FILTRES" :**
```
font-eyebrow text-[11px] text-cgws-leather uppercase tracking-[0.2em]
```

**Bouton reset :**
```
font-sans text-xs text-cgws-copper
hover:text-cgws-leather
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-1
disabled:opacity-30 disabled:cursor-not-allowed
```
Désactivé quand aucun filtre actif.

### Sections pliables — structure

Chaque section suit ce pattern :

```html
<div class="border-b border-cgws-leather/10 last:border-b-0">
  <!-- Toggle header -->
  <button
    class="flex items-center justify-between w-full px-4 py-3
           font-serif font-semibold text-sm text-cgws-charcoal
           hover:text-cgws-copper transition-colors duration-150
           focus-visible:outline-none focus-visible:ring-inset
           focus-visible:ring-2 focus-visible:ring-cgws-copper"
    :aria-expanded="isOpen"
    :aria-controls="`filter-section-${sectionId}`"
  >
    <span>{{ label }}</span>
    <span class="flex items-center gap-2">
      <!-- Compteur d'actifs -->
      <span v-if="activeCount > 0"
        class="font-sans font-semibold text-[11px] text-cgws-copper
               bg-cgws-copper/10 rounded-full px-2 py-0.5">
        {{ activeCount }}
      </span>
      <!-- Chevron -->
      <i-lucide-chevron-down
        class="w-4 h-4 text-cgws-leather/60 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </span>
  </button>

  <!-- Contenu dépliable -->
  <div
    :id="`filter-section-${sectionId}`"
    v-show="isOpen"
    class="px-4 pb-3 space-y-2"
  >
    <!-- checkboxes ou slider selon la section -->
  </div>
</div>
```

### Sections de filtres — détail

#### Section Catégorie

Checkboxes des 6 valeurs de `ProductCategory`, avec compteur entre parenthèses :

| Valeur | Label affiché |
|---|---|
| `selles` | Selles |
| `brides-licols` | Brides & Licols |
| `bottes-chaussures` | Bottes & Chaussures |
| `vetements` | Vêtements |
| `accessoires` | Accessoires |
| `protections` | Protections |

Ouverte par défaut.

#### Section État

Checkboxes :
- `new` → "Neuf"
- `excellent` + `good` + `fair` → regroupés en "Occasion" (une seule checkbox `occasion` qui mappe vers `['excellent','good','fair']`)

Fermée par défaut.

#### Section Marque

Liste dynamique des marques présentes dans les produits (depuis Supabase `DISTINCT brand`). Maximum 8 affichés, avec un "Voir plus" si davantage. Ordonnées alphabétiquement. Fermée par défaut.

**"Voir plus" :**
```
font-sans text-xs text-cgws-copper hover:underline cursor-pointer
mt-1
```

#### Section Prix (USlider range)

**USlider Nuxt UI :**
```vue
<USlider
  v-model="priceRange"
  :min="0"
  :max="priceMax"
  :step="10"
  :min-steps-between-thumbs="50"
  tooltip
  :ui="{
    track: 'bg-cgws-leather/20',
    range: 'bg-cgws-copper',
    thumb: 'bg-cgws-copper border-2 border-cgws-parchment ring-1 ring-cgws-copper'
  }"
/>
```

`priceRange` est un `ref([0, priceMax])` (tableau 2 valeurs — mode range via `multiple`).

`priceMax` est dérivé du produit le plus cher en base, plafonné à 5000€.

**Inputs numériques affichés sous le slider :**
```
flex gap-2 mt-3
[input min] flex-1 text-right  [label "Min"] [€]
[input max] flex-1 text-right  [label "Max"] [€]
```
Classes input prix :
```
w-full bg-cgws-cream border border-cgws-leather/40 rounded-sm
px-2 py-1 font-sans text-sm text-cgws-charcoal text-right
focus:outline-none focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
```

Ouverte par défaut.

#### Section Disponibilité

Checkboxes :
- "En stock" (filtre `status = 'active'`) — cochée par défaut
- "Inclure les réservés" (filtre `status = 'reserved'`)
- "Articles en consignation" (filtre `isConsignment = true`)

Ouverte par défaut.

### Checkbox styling — classe custom

Les checkboxes natives sont stylisées via `accent-color`:

```
accent-cgws-copper
w-4 h-4 rounded-[2px]
border border-cgws-leather/40
cursor-pointer
```

Wrapper label:
```
flex items-center justify-between gap-3
cursor-pointer
hover:text-cgws-copper transition-colors duration-150
```

Label texte:
```
font-sans text-sm text-cgws-charcoal flex-1
```

Compteur par option:
```
font-sans text-xs text-cgws-leather/60
```

---

## 5. FilterDrawer — Mobile

**Location**: `app/components/catalogue/FilterDrawer.vue`
**Purpose**: Version mobile du FilterPanel, implémentée comme un bottom drawer Nuxt UI. Déclenché par un bouton dans la barre de contrôle mobile, affiche les mêmes filtres avec footer d'action.

### Trigger

La barre mobile (voir §8 — SortBar mobile) contient le trigger. Il n'est PAS un UDrawer wrapper — le drawer est déclenché via `v-model:open`.

**Bouton trigger :**
```
flex items-center gap-2
bg-cgws-cream border border-cgws-leather/30 rounded-sm
px-3 py-2
font-sans font-medium text-sm text-cgws-charcoal
hover:border-cgws-copper hover:text-cgws-copper
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper
```

Label : "Filtrer" + icône `i-lucide-sliders-horizontal` (w-4 h-4)
Badge actif count : même style que le compteur de la sidebar, affiché à droite du label.

### UDrawer setup

```vue
<UDrawer
  v-model:open="isFilterDrawerOpen"
  direction="bottom"
  :snap-points="['85%']"
  :handle="true"
  :overlay="true"
  :ui="{
    content: 'bg-cgws-cream rounded-t-[12px] max-h-[85vh] flex flex-col',
    handle: 'bg-cgws-leather/30 w-12 h-1 rounded-full mx-auto mt-3',
    overlay: 'bg-cgws-charcoal/40 backdrop-blur-sm'
  }"
>
```

**z-index** : Le drawer Nuxt UI est rendu en portal `<teleport to="body">` — z-index géré par Nuxt UI, supérieur au contenu (z-50+), inférieur au header sticky (z-[60] à confirmer selon valeur du header).

### Structure interne du drawer

```
┌────────────────────────────────────────┐
│  ────  (handle)                        │
│  FILTRES                   ✕ Fermer    │  ← header
│  ────────────────────────────────────  │
│                                        │
│  [Sections de filtres — identiques     │  ← body overflow-y-auto
│   au FilterPanel, même markup]         │
│                                        │
│  ────────────────────────────────────  │
│  [Réinitialiser]  [Voir 143 produits]  │  ← footer sticky
└────────────────────────────────────────┘
```

**Header du drawer :**
```
flex items-center justify-between px-4 py-3 border-b border-cgws-leather/20 flex-shrink-0
[label FILTRES] font-eyebrow text-[11px] text-cgws-leather uppercase tracking-[0.2em]
[bouton ✕] font-sans text-sm text-cgws-leather hover:text-cgws-copper
```

**Body :**
```
flex-1 overflow-y-auto px-0
[mêmes sections que FilterPanel — catégorie, état, marque, prix, disponibilité]
```

**Footer :**
```
flex-shrink-0 px-4 py-4
border-t border-cgws-leather/20
flex gap-3
[Réinitialiser] CgwsButton variant="ghost" flex-1
[Voir X produits] CgwsButton variant="primary" flex-1
  label dynamique : "Voir {count} produit{s}"
```

---

## 6. SortSelect et SortBar

**Location**: `app/components/catalogue/SortSelect.vue`
**Purpose**: Sélecteur de tri placé à droite au-dessus de la grille. Desktop et mobile ont le même composant, mais le contexte d'affichage diffère (inline desktop, barre mobile).

### Options de tri

```ts
const sortItems = [
  { label: 'Pertinence', value: 'relevance' },
  { label: 'Prix croissant', value: 'price_asc' },
  { label: 'Prix décroissant', value: 'price_desc' },
  { label: 'Nouveautés', value: 'newest' },
]
```

### USelect Nuxt UI

```vue
<USelect
  v-model="sortValue"
  :items="sortItems"
  placeholder="Trier par"
  trailing-icon="i-lucide-chevrons-up-down"
  size="sm"
  :ui="{
    base: 'bg-cgws-cream border border-cgws-leather/40 text-cgws-charcoal
           font-sans text-sm rounded-sm
           hover:border-cgws-copper
           focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20',
    trailingIcon: 'text-cgws-leather/60',
    content: 'bg-cgws-cream border border-cgws-leather/20 rounded-sm shadow-lg',
    item: 'font-sans text-sm text-cgws-charcoal hover:bg-cgws-parchment hover:text-cgws-copper',
    itemTrailingIcon: 'text-cgws-copper'
  }"
/>
```

### SortBar — barre de contrôle au-dessus de la grille

**Location**: dans `ProductGrid.vue` ou `catalogue/index.vue`

**Desktop lg+ :**
```
flex items-center justify-between mb-6
[span] font-sans text-sm text-cgws-leather  → "143 produits"
[SortSelect] w-[200px]
```

**Mobile :**
```
flex items-center justify-between gap-3 mb-4 px-[var(--container-px)]
[bouton FilterDrawer trigger] flex-1
[SortSelect] w-[160px]
```

---

## 7. ProductGrid

**Location**: `app/components/catalogue/ProductGrid.vue`
**Purpose**: Conteneur de la grille de ProductCards. Gère l'état de chargement (skeletons), la grille responsive, le scroll infini via sentinel IntersectionObserver, et l'état vide.

### Grille responsive

```
grid
grid-cols-1          ← mobile 375px : 1 colonne
sm:grid-cols-2       ← 640px : 2 colonnes (grands phones / tableau)
md:grid-cols-2       ← 768px : 2 colonnes
lg:grid-cols-3       ← 1024px : 3 colonnes (avec sidebar)
xl:grid-cols-4       ← 1280px : 4 colonnes (avec sidebar — espace réduit)
gap-4 md:gap-6
```

Note sur les colonnes avec sidebar : à `lg:` la grille est dans un flex parent avec la sidebar 260px. `grid-cols-3` est correct à 1024px. À `xl:` (1280px), le parent a 1280px - 260px - 32px (gap) = environ 988px de large pour la grille, ce qui permet `grid-cols-4` à ~247px par carte.

### Chargement initial — Skeletons

Pendant le premier fetch Supabase, la grille affiche 12 `ProductCardSkeleton` (voir §8).

### Scroll infini

**Sentinel :**
```html
<div
  ref="sentinel"
  class="col-span-full h-4"
  aria-hidden="true"
/>
```

Placé après le dernier ProductCard. L'IntersectionObserver dans `useInfiniteScroll.ts` déclenche le chargement des 12 suivants quand il entre dans le viewport (threshold: 0.1).

**Indicateur de chargement supplémentaire :**
```
col-span-full flex justify-center py-8
[ConchoDivider-like ornement + spinner]
```

Structure :
```html
<div class="col-span-full flex flex-col items-center gap-4 py-8">
  <!-- Spinner concho animé -->
  <div class="w-8 h-8 rounded-full border-2 border-cgws-copper
              border-t-transparent animate-spin" />
  <span class="font-sans text-sm text-cgws-leather">
    Chargement des articles...
  </span>
</div>
```

**Fin de liste :**
```html
<div class="col-span-full text-center py-8">
  <ConchoDivider />
  <p class="font-serif italic text-cgws-leather text-sm mt-2">
    Tous les produits ont été chargés · {{ total }} articles
  </p>
</div>
```

---

## 8. ProductCardSkeleton

**Location**: `app/components/ui/ProductCardSkeleton.vue`
**Purpose**: Placeholder de chargement qui reproduit exactement les dimensions de ProductCard. L'animation pulse maintient le sentiment de progression sans révéler de contenu prématuré.

### Layout ASCII

```
            ●                         ← hole skeleton: w-3 h-3 rounded-full
┌───────────┴──────────────────────┐  ← même border-2 border-cgws-leather/20
│                                  │     bg-cgws-parchment rounded-[6px]
│  ┌────────────────────────────┐  │  ← aspect-[4/3] bg-cgws-leather/15
│  │     [bloc gris pulse]      │  │     animate-pulse
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  ╔ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╗  │
│  ╎  [badge ████]             ╎  │  ← w-20 h-5 bg-cgws-leather/15 rounded-full
│  ╎                           ╎  │
│  ╎  [titre ████████████]     ╎  │  ← h-4 bg-cgws-leather/15 rounded w-full
│  ╎  [titre ███████]          ╎  │  ← h-4 bg-cgws-leather/15 rounded w-3/4
│  ╎  [marque ████████]        ╎  │  ← h-3 bg-cgws-leather/10 rounded w-1/2 mt-1
│  ╎                           ╎  │
│  ╎                [prix ███] ╎  │  ← h-6 bg-cgws-leather/15 rounded w-16 ml-auto
│  ╚ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╝  │
└──────────────────────────────────┘
```

### Tailwind classes

**Carte skeleton :**
```
relative flex flex-col
bg-cgws-parchment border-2 border-cgws-leather/20 rounded-[6px]
overflow-hidden animate-pulse
```

**Perforation skeleton :**
```
absolute top-2 left-1/2 -translate-x-1/2
w-3 h-3 rounded-full bg-cgws-leather/15
z-10
```

**Image area skeleton :**
```
aspect-[4/3] bg-cgws-leather/15
```

**Bloc stitching skeleton :**
```
m-2 p-3 border border-dashed border-cgws-leather/15 rounded-sm
flex flex-col gap-2
```

**Éléments internes :**
```
[badge] h-5 w-20 bg-cgws-leather/15 rounded-full
[titre ligne 1] h-4 w-full bg-cgws-leather/15 rounded
[titre ligne 2] h-4 w-3/4 bg-cgws-leather/15 rounded
[marque] h-3 w-1/2 bg-cgws-leather/10 rounded mt-1
[prix] h-6 w-16 bg-cgws-leather/15 rounded self-end mt-auto
```

### Accessibilité

```html
<div role="status" aria-label="Chargement des produits en cours">
  <span class="sr-only">Chargement...</span>
  <!-- skeleton markup -->
</div>
```

`aria-busy="true"` sur le `<ProductGrid>` pendant le chargement.

---

## 9. EmptyState — "Aucun résultat"

**Location**: `app/components/catalogue/EmptyState.vue`
**Purpose**: Affiché quand la combinaison de filtres actifs retourne zéro produits. Guide le visiteur vers une sortie productive (reset ou modification des critères).

### Layout ASCII

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                    ◎  ← ornement concho 48px       │
│              (ConchoStat sans valeur, aria-hidden) │
│                                                    │
│         Aucun résultat                             │
│  ← Playfair Display 600 24px text-cgws-charcoal   │
│                                                    │
│  Modifiez vos critères de recherche ou explorez   │
│  tout le catalogue.                                │
│  ← Inter 400 14px text-cgws-leather text-center   │
│                                                    │
│     [Réinitialiser les filtres]                    │
│     ← CgwsButton variant="primary"                │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Tailwind classes

**Wrapper :**
```
col-span-full
flex flex-col items-center justify-center
py-16 md:py-24
text-center
gap-5
```

**Ornement concho (décoratif uniquement) :**
```
w-12 h-12 rounded-full
border-2 border-cgws-copper/40
ring-[6px] ring-cgws-leather/10
flex items-center justify-center
mb-2
[intérieur] w-3 h-3 rounded-full bg-cgws-copper/30
```
`aria-hidden="true"`

**Titre :**
```
font-serif font-semibold text-2xl text-cgws-charcoal
```

**Sous-texte :**
```
font-sans text-sm text-cgws-leather
max-w-[300px]
```

**CTA :**
```vue
<CgwsButton variant="primary" @click="resetFilters">
  Réinitialiser les filtres
</CgwsButton>
```

### Accessibilité

- `role="status"` sur le wrapper
- `aria-live="polite"` — annonce automatiquement l'état vide aux lecteurs d'écran quand les filtres changent

---

## 10. Breakpoints complets

| Breakpoint | Largeur | Grille | Sidebar | Filtres |
|---|---|---|---|---|
| Base | 375px | 1 colonne | Cachée | Drawer bottom |
| sm | 640px | 2 colonnes | Cachée | Drawer bottom |
| md | 768px | 2 colonnes | Cachée | Drawer bottom |
| lg | 1024px | 3 colonnes | 260px visible | Sidebar |
| xl | 1280px | 4 colonnes | 260px visible | Sidebar |
| 2xl | 1440px | 4 colonnes | 260px visible | Sidebar |

**Layout flex parent (lg+) :**
```
max-w-[1280px] mx-auto px-[var(--container-px)]
flex items-start gap-8 py-8
```

**Layout mobile :**
```
px-[var(--container-px)]
py-4
```

---

## 11. Accessibilité

### Skip link

Placé en début de `catalogue/index.vue`, avant le CatalogueHeader :

```html
<a
  href="#catalogue-results"
  class="sr-only focus:not-sr-only focus:fixed focus:top-20 focus:left-4
         focus:z-50 focus:bg-cgws-copper focus:text-cgws-charcoal
         focus:font-sans focus:font-semibold focus:text-sm
         focus:px-4 focus:py-2 focus:rounded-sm"
>
  Aller aux résultats
</a>
```

**ID cible :**
```html
<div id="catalogue-results" tabindex="-1">
  <!-- ProductGrid -->
</div>
```

### Live region pour le compteur

```html
<span
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="font-sans font-medium text-sm text-cgws-leather"
>
  {{ totalCount }} produit{{ totalCount > 1 ? 's' : '' }}
  {{ isFiltered ? 'trouvé' + (totalCount > 1 ? 's' : '') : 'disponible' + (totalCount > 1 ? 's' : '') }}
</span>
```

### Aria sur les filtres

- FilterPanel `<aside aria-label="Filtres du catalogue">` sur le wrapper principal
- Chaque section pliable : `<button :aria-expanded="isOpen" :aria-controls="sectionId">`
- Le body de chaque section : `<div :id="sectionId" role="region">` (ou `aria-hidden` quand fermé)
- Checkboxes : `<input type="checkbox">` avec `<label>` associé via `for`/`id`
- Slider USlider : `aria-label="Fourchette de prix"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` gérés par Nuxt UI

### Keyboard navigation

- Tab navigue dans l'ordre logique : header → filtres → tri → grille → sentinel
- Flèches dans les checkboxes (native)
- Flèches sur le USlider (native Radix UI via Nuxt UI)
- `Escape` ferme le FilterDrawer (géré par UDrawer)
- Enter / Space active les cartes ProductCard (via NuxtLink)

### Contraste — combinaisons non triviales

| Combinaison | Ratio | Statut |
|---|---|---|
| `cgws-charcoal` sur `cgws-cream` (texte corps) | 16.6:1 | ✓ WCAG AA |
| `cgws-charcoal` sur `cgws-parchment` (ProductCard titre) | 13.97:1 | ✓ WCAG AA |
| `cgws-leather` sur `cgws-parchment` (marque) | 5.88:1 | ✓ WCAG AA |
| `cgws-copper` sur `cgws-parchment` (prix 24px) | 3.03:1 | ✓ Large text WCAG AA |
| `cgws-leather` sur `cgws-cream` (compteur) | 5.38:1 | ✓ WCAG AA |
| `white` sur `cgws-rust` (badge sold overlay) | 7.00:1 | ✓ WCAG AA |
| `cgws-charcoal` sur `cgws-copper` (badge consignation) | 4.61:1 | ✓ WCAG AA |

---

## 12. Animations GSAP

Toutes les animations sont initialisées dans `onMounted()` et nettoyées dans `onUnmounted()`.

```ts
// Guard prefers-reduced-motion (à appliquer sur chaque bloc GSAP)
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
```

### Entrée staggerée des ProductCards

Au premier chargement de la grille (pas au scroll infini) :

```ts
// Dans ProductGrid.vue onMounted
gsap.from('.product-card', {
  opacity: 0,
  y: 20,
  duration: 0.35,
  ease: 'power2.out',
  stagger: 0.07,
  clearProps: 'all', // nettoie les styles inline après animation
})
```

### Apparition des nouvelles cartes (scroll infini)

Seulement les 12 nouvelles cartes (index `prevCount` à `newCount - 1`) :

```ts
gsap.from(newCardElements, {
  opacity: 0,
  y: 16,
  duration: 0.3,
  ease: 'power2.out',
  stagger: 0.05,
  clearProps: 'all',
})
```

### Hover — CSS transition (pas GSAP)

Le hover des ProductCards est géré via Tailwind CSS transitions (`transition-transform duration-200`) — pas GSAP — pour éviter la surcharge JS sur mobile.

### FilterPanel / FilterDrawer — transitions de dépliage

Via CSS `Transition` Vue natif sur les sections :

```html
<Transition name="filter-section">
  <div v-show="isOpen">...</div>
</Transition>
```

```css
/* Dans main.css ou scoped */
.filter-section-enter-active,
.filter-section-leave-active {
  transition: height 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
}
.filter-section-enter-from,
.filter-section-leave-to {
  height: 0;
  opacity: 0;
}
```

---

## 13. URL params et state management

### Mapping params URL

| Filtre | Param URL | Exemple |
|---|---|---|
| Catégorie | `categorie` | `?categorie=selles` |
| État | `etat` | `?etat=new` ou `?etat=occasion` |
| Marque | `marque` | `?marque=prestige` |
| Prix min | `prix_min` | `?prix_min=100` |
| Prix max | `prix_max` | `?prix_max=500` |
| Consignation | `consignation` | `?consignation=true` |
| Tri | `tri` | `?tri=price_asc` |

Multi-valeurs (ex: plusieurs catégories) : `?categorie=selles&categorie=brides-licols`

### Composable `useCatalogue.ts`

```ts
// Schéma fonctionnel (non implémenté ici — pour référence du développeur)
const filters = reactive<CatalogueFilters>({
  categories: [],       // ProductCategory[]
  condition: null,      // 'new' | 'occasion' | null
  brands: [],           // string[]
  priceMin: 0,
  priceMax: 5000,
  isConsignment: null,  // boolean | null
})

const sort = ref<'relevance' | 'price_asc' | 'price_desc' | 'newest'>('relevance')

// Sync bidirectionnel avec l'URL via useRoute + useRouter
// Supabase query builder basé sur filters + sort
// reset() remet tout à zéro + met à jour l'URL
```

---

## 14. Page `catalogue/index.vue` — Structure complète

```html
<!-- skip link -->
<a href="#catalogue-results" class="...">Aller aux résultats</a>

<!-- En-tête section -->
<CatalogueHeader :total-count="totalCount" :is-filtered="hasActiveFilters" />

<!-- Diviseur concho -->
<ConchoDivider />

<!-- Layout principal -->
<div class="max-w-[1280px] mx-auto px-[var(--container-px)] py-8">

  <!-- Mobile: barre filtres + tri -->
  <div class="lg:hidden flex items-center gap-3 mb-4">
    <FilterDrawer v-model:open="isDrawerOpen" :filters="filters" @reset="resetFilters" />
    <!-- bouton trigger inclus dans FilterDrawer -->
    <SortSelect v-model="sort" class="flex-1" />
  </div>

  <!-- Layout desktop: sidebar + grille -->
  <div class="flex items-start gap-8">

    <!-- Sidebar filtres (desktop seulement) -->
    <FilterPanel
      v-model:filters="filters"
      :price-max="maxPrice"
      @reset="resetFilters"
      class="hidden lg:flex"
    />

    <!-- Zone résultats -->
    <div id="catalogue-results" tabindex="-1" class="flex-1 min-w-0">

      <!-- SortBar desktop -->
      <div class="hidden lg:flex items-center justify-between mb-6">
        <span role="status" aria-live="polite" aria-atomic="true"
              class="font-sans text-sm text-cgws-leather">
          {{ totalCount }} produits
        </span>
        <SortSelect v-model="sort" />
      </div>

      <!-- Grille produits -->
      <ProductGrid
        :products="products"
        :is-loading="isLoading"
        :is-fetching-more="isFetchingMore"
        :has-more="hasMore"
        :total="totalCount"
        @load-more="loadMore"
      />

    </div>
  </div>
</div>
```
