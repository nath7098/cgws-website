# Fiche Produit — Spec UX (US-013)

**Purpose**: Page de détail d'un produit CGWS. Le visiteur arrive depuis le catalogue (ou un lien direct/SEO) et consulte toutes les informations nécessaires pour prendre une décision d'achat : galerie photos, description complète, état, taille, prix, et badge consignation. L'unique CTA est un lien téléphonique vers CGWS — pas de panier. La page gère également l'état "Vendu" avec CTA désactivé.
**Sprint**: 1 — Site Public Vitrine

**Fichiers concernés par cette spec :**
- `app/pages/catalogue/[slug].vue`
- `app/components/product/ProductGallery.vue`
- `app/components/product/ProductInfo.vue`
- `app/components/product/RelatedProducts.vue`

---

## 1. Vue d'ensemble de la page `/catalogue/[slug]`

### Layout global — ASCII wireframe (desktop 1280px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [AppHeader sticky — bg-cgws-tack h-16]                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Breadcrumb — bg-cgws-cream border-b border-cgws-leather/10 py-3]           │
│   Accueil  /  Catalogue  /  Selle western Prestige                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ max-w-[1280px] mx-auto px-[var(--container-px)] py-10                       │
│ flex gap-12 items-start                                                      │
│ ┌────────────────────────────────────┐  ┌───────────────────────────────┐   │
│ │   ProductGallery  (55%)            │  │  ProductInfo (flex-1)          │   │
│ │                                    │  │                                │   │
│ │  ┌──────────────────────────────┐  │  │  [NEUF]  [CONSIGNATION]        │   │
│ │  │                              │  │  │                                │   │
│ │  │    Image principale          │  │  │  Selle western Prestige        │   │
│ │  │    aspect-[4/3]              │  │  │  ← Playfair 700 36px           │   │
│ │  │                              │  │  │                                │   │
│ │  │  ←   [image]   →             │  │  │  Prestige · Selles             │   │
│ │  │                              │  │  │  ← Inter 400 14px              │   │
│ │  └──────────────────────────────┘  │  │                                │   │
│ │                                    │  │  850 €                         │   │
│ │  [●] [○] [○] [○] [○]  thumbnails  │  │  ← Bebas Neue 48px cgws-copper │   │
│ │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │  │                                │   │
│ │  └──┘ └──┘ └──┘ └──┘ └──┘        │  │  Excellent état                │   │
│ └────────────────────────────────────┘  │  Taille : 15"                  │   │
│                                         │                                │   │
│                                         │  ─────────────────────────     │   │
│                                         │                                │   │
│                                         │  Description complète du       │   │
│                                         │  produit en plusieurs lignes   │   │
│                                         │  ← Inter 400 16px              │   │
│                                         │                                │   │
│                                         │  ┌────────────────────────┐    │   │
│                                         │  │ CONSIGNATION INFO BOX  │    │   │
│                                         │  │ bg-cgws-parchment      │    │   │
│                                         │  └────────────────────────┘    │   │
│                                         │                                │   │
│                                         │  [  Appeler pour acquérir  ]   │   │
│                                         │  [  Contacter par message   ]  │   │
│                                         └───────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ConchoDivider]                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [RelatedProducts — bg-cgws-cream py-12]                                     │
│   VOUS POURRIEZ AUSSI AIMER  ← Rye eyebrow                                  │
│   Articles similaires  ← Playfair Display 700 32px                          │
│                                                                              │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                      │
│   │Card 1│ │Card 2│ │Card 3│ │Card 4│  ← ProductCard (même style catalogue)│
│   └──────┘ └──────┘ └──────┘ └──────┘                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ [AppFooter — bg-cgws-tack]                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Layout global — ASCII wireframe (tablet 768px)

```
┌──────────────────────────────────────┐
│ [AppHeader sticky h-16]             │
├──────────────────────────────────────┤
│ [Breadcrumb py-3]                   │
│   Accueil / Catalogue / [Titre]     │
├──────────────────────────────────────┤
│ [ProductGallery — full width]       │
│  ┌──────────────────────────────┐   │
│  │  Image principale aspect-4/3 │   │
│  └──────────────────────────────┘   │
│  [● ○ ○ ○ ○] thumbnails            │
├──────────────────────────────────────┤
│ [ProductInfo — full width]          │
│  px-[var(--container-px)]           │
│  [badges] [titre] [prix]            │
│  [taille] [description]             │
│  [consignment box]                  │
│  [CTA buttons]                      │
├──────────────────────────────────────┤
│ [ConchoDivider]                     │
├──────────────────────────────────────┤
│ [RelatedProducts]                   │
│  grid-cols-2                        │
│  [Card] [Card]                      │
│  [Card] [Card]                      │
└──────────────────────────────────────┘
```

### Layout global — ASCII wireframe (mobile 375px)

```
┌──────────────────────────────┐
│ [AppHeader sticky h-16]     │
├──────────────────────────────┤
│ [Breadcrumb compact py-2]   │
│  Catalogue / [Titre tronqué]│
├──────────────────────────────┤
│ [ProductGallery full width] │
│ ┌────────────────────────┐  │
│ │ Image principale       │  │
│ │ aspect-[4/3]           │  │
│ │               [2 / 5]  │  │
│ └────────────────────────┘  │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│ └──┘ └──┘ └──┘ └──┘ └──┘  │
├──────────────────────────────┤
│ [ProductInfo full width px4]│
│  [NEUF] [CONSIGNATION]      │
│  Selle western Prestige     │
│  Prestige · Selles          │
│  850 €                      │
│  Excellent état · 15"       │
│  ─────────────────────────  │
│  Description du produit...  │
│  [Consignment box]          │
│  [Appeler pour acquérir]    │
│  [Contacter par message]    │
├──────────────────────────────┤
│ [ConchoDivider]             │
├──────────────────────────────┤
│ [RelatedProducts]           │
│  Articles similaires        │
│  ┌────────────────────────┐ │
│  │ ProductCard 1          │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ ProductCard 2          │ │
│  └────────────────────────┘ │
└──────────────────────────────┘
```

---

## 2. Breadcrumb

**Location**: directement dans `app/pages/catalogue/[slug].vue`, au-dessus de la section principale.

### Layout ASCII

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  bg-cgws-cream border-b border-cgws-leather/10                               │
│                                                                              │
│  max-w-[1280px] mx-auto px-[var(--container-px)] py-3                       │
│                                                                              │
│  Accueil  ›  Catalogue  ›  Selle western Prestige                           │
│  ← Inter 400 12px text-cgws-leather/70                  text-cgws-leather   │
│                                                          (item courant)      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tailwind classes

**Wrapper :**
```
bg-cgws-cream border-b border-cgws-leather/10
```

**Container :**
```
max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] py-3
flex items-center gap-2 flex-wrap
```

**Liens (Accueil, Catalogue) :**
```
font-sans text-xs text-cgws-leather/70
hover:text-cgws-copper transition-colors duration-150
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-copper
rounded-sm
```

**Séparateur › :**
```
font-sans text-xs text-cgws-leather/40
select-none
aria-hidden="true"
```

**Item courant (produit) :**
```
font-sans text-xs text-cgws-leather
truncate max-w-[200px] sm:max-w-none
```

**Mobile (375px) :** Affiche uniquement "Catalogue ›  [Titre tronqué à 30 car.]" — l'entrée "Accueil" est masquée (`hidden sm:inline`).

### Accessibilité

```html
<nav aria-label="Fil d'Ariane">
  <ol class="flex items-center gap-2" itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <NuxtLink itemprop="item" to="/" class="...">
        <span itemprop="name">Accueil</span>
      </NuxtLink>
      <meta itemprop="position" content="1" />
    </li>
    <!-- séparateur aria-hidden -->
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <NuxtLink itemprop="item" to="/catalogue" class="...">
        <span itemprop="name">Catalogue</span>
      </NuxtLink>
      <meta itemprop="position" content="2" />
    </li>
    <!-- séparateur aria-hidden -->
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name" class="..." aria-current="page">{{ product.title }}</span>
      <meta itemprop="position" content="3" />
    </li>
  </ol>
</nav>
```

---

## 3. ProductGallery

**Location**: `app/components/product/ProductGallery.vue`
**Purpose**: Galerie Swiper avec une image principale grande et une bande de miniatures en bas. L'utilisateur navigue entre les photos du produit via swipe (mobile) ou flèches (desktop). La miniature active est bordée en cuivre.

### Props TypeScript

```ts
interface Props {
  images: string[]      // Product.images — tableau d'URLs
  alt: string           // Product.title + brand pour l'attribut alt de base
  sold?: boolean        // Product.status === 'sold' — active le mode grayscale + overlay
}
```

### Layout ASCII (état normal)

```
┌──────────────────────────────────────────────────────────┐
│  relative group                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ← (flèche prev, opacity-0 group-hover:opacity-100)│  │
│  │                                                    │  │
│  │            [Image principale]                     │  │
│  │            aspect-[4/3] object-cover              │  │
│  │            NuxtImg webp lazy                       │  │
│  │                                                    │  │
│  │  → (flèche next, opacity-0 group-hover:opacity-100)│  │
│  │                                     [2 / 5]       │  │  ← badge compteur
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [thumb1●] [thumb2] [thumb3] [thumb4] [thumb5]    │  │
│  │  ← Swiper thumbnails, overflow-x-auto gap-2       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Layout ASCII (état Vendu)

```
┌────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐  │
│  │  [Image grayscale — filter grayscale(100%)]  │  │
│  │                                              │  │
│  │         ┌─────────────────┐                 │  │
│  │         │     VENDU       │ ← overlay badge  │  │
│  │         └─────────────────┘  centré          │  │
│  │  bg-cgws-charcoal/30 overlay                 │  │
│  └──────────────────────────────────────────────┘  │
│  [thumbnails aussi en grayscale via CSS parent]    │
└────────────────────────────────────────────────────┘
```

### Tailwind classes — galerie

**Wrapper global :**
```
group relative w-full
```

**Swiper main wrapper :**
```
relative overflow-hidden rounded-[6px] bg-cgws-leather/10
aspect-[4/3]
```
Sold modifier ajouté sur ce wrapper : `grayscale`

**Chaque slide image (NuxtImg) :**
```
w-full h-full object-cover
```

**Overlay sold :**
```
absolute inset-0 bg-cgws-charcoal/30
flex items-center justify-center
pointer-events-none z-10
```

**Badge "VENDU" centré (sold overlay) :**
```
font-display text-[40px] md:text-[56px] text-cgws-rope
uppercase tracking-[0.15em]
border-4 border-cgws-rope/60
px-6 py-2
rotate-[-8deg]
```

**Badge compteur images (bas-droite) :**
```
absolute bottom-3 right-3 z-20
bg-cgws-charcoal/60 backdrop-blur-sm
font-sans text-xs text-cgws-rope
px-2.5 py-1 rounded-sm
```
Masqué si `images.length <= 1`.

**Flèches de navigation (prev/next) :**
```
absolute top-1/2 -translate-y-1/2 z-20
w-10 h-10 rounded-full
bg-cgws-tack/60 backdrop-blur-sm hover:bg-cgws-copper/80
flex items-center justify-center
transition-all duration-150
opacity-0 group-hover:opacity-100
focus-visible:opacity-100 focus-visible:outline-none
focus-visible:ring-2 focus-visible:ring-cgws-copper
[prev]: left-3
[next]: right-3
```
Icône: `i-lucide-chevron-left` / `i-lucide-chevron-right` — `w-5 h-5 text-cgws-rope`
Masquées si `images.length <= 1` (`v-if`).

### Tailwind classes — bande miniatures

**Wrapper bande :**
```
mt-3 overflow-x-auto pb-1
flex gap-2
```
`scroll-snap-type-x: mandatory` (via `snap-x snap-mandatory` Tailwind) sur le wrapper.

**Chaque miniature :**
```
flex-shrink-0 snap-start
w-[72px] h-[54px] md:w-[80px] md:h-[60px]
rounded-[4px] overflow-hidden
cursor-pointer
border-2 transition-all duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper
```

**Miniature inactive :**
```
border-transparent opacity-60 hover:opacity-90 hover:border-cgws-leather/50
```

**Miniature active (index courant) :**
```
border-cgws-copper ring-1 ring-cgws-copper/30 opacity-100
```

**Image dans miniature :**
```
w-full h-full object-cover
```

**Sold modifier sur les miniatures :** `grayscale opacity-50` appliqué au wrapper de la bande via classe conditionnelle parent.

### Swiper — notes d'intégration

Utiliser `swiper/vue` avec les modules `Navigation` et `Thumbs` :
```ts
// Swiper principal
const mainSwiperRef = ref()
// Swiper miniatures
const thumbsSwiperRef = ref()
// Partage de l'instance pour la synchronisation Thumbs
```
- `slidesPerView: 1` sur le Swiper principal
- `spaceBetween: 0`
- `loop: false` (pas assez d'images pour boucler)
- `keyboard: { enabled: true }` pour la navigation clavier
- Les flèches natives Swiper sont remplacées par des boutons custom (`navigation: false`) pour garder le contrôle stylistique total

### Fallback image unique / images vides

Si `images.length === 0` : afficher le placeholder silhouette de selle (même SVG que TagCard), fond `cgws-leather/10`, pas de miniatures, pas de flèches.

Si `images.length === 1` : afficher l'image unique, masquer flèches et miniatures, masquer le badge compteur.

### Animations GSAP

Initialisées dans `onMounted()`, nettoyées dans `onUnmounted()`.

```ts
// Guard prefers-reduced-motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

// Fade-in de l'image principale au chargement
gsap.from('.product-gallery-main', {
  opacity: 0,
  scale: 0.98,
  duration: 0.6,
  ease: 'power2.out',
  clearProps: 'all',
})

// Apparition décalée des miniatures
gsap.from('.product-gallery-thumb', {
  opacity: 0,
  y: 8,
  duration: 0.3,
  ease: 'power2.out',
  stagger: 0.06,
  delay: 0.3,
  clearProps: 'all',
})
```

### Accessibilité

- Wrapper Swiper : `role="region" aria-label="Galerie photos du produit"`
- Chaque slide : `aria-label="Photo ${index + 1} sur ${images.length} — ${alt}"`
- Flèche prev : `aria-label="Photo précédente"`, `type="button"`
- Flèche next : `aria-label="Photo suivante"`, `type="button"`
- Miniatures : `<button type="button" :aria-label="\`Voir photo ${index + 1}\`" :aria-pressed="currentIndex === index">`
- Swiper avec `keyboard: { enabled: true }` — flèches clavier gauche/droite naviguent entre les slides
- Badge compteur : `aria-hidden="true"` (info purement visuelle)
- Overlay sold : `role="img" aria-label="Produit vendu"` sur le conteneur de l'overlay

### Contraste

| Combinaison | Ratio | Statut |
|---|---|---|
| `cgws-rope` sur `cgws-charcoal/60` (badge compteur) | ~7:1 estimé | ✓ WCAG AA |
| `cgws-rope` sur `cgws-tack/60` (boutons nav) | ~6:1 estimé | ✓ WCAG AA |
| `cgws-rope` sur `cgws-charcoal/30` (badge VENDU) | ~5:1 large text 40px | ✓ Large text WCAG AA |

---

## 4. ProductInfo

**Location**: `app/components/product/ProductInfo.vue`
**Purpose**: Bloc d'information produit à droite de la galerie. Hiérarchie typographique claire : badges → titre → marque/catégorie → prix → détails (état, taille) → description → encart consignation → CTA.

### Props TypeScript

```ts
import type { Product } from '~/types'

interface Props {
  product: Product
}
```

### Layout ASCII (état normal, desktop)

```
┌───────────────────────────────────────────────────────┐
│  flex flex-col gap-4                                  │
│                                                       │
│  [NEUF]  [CONSIGNATION]      ← badges row             │
│                                                       │
│  Selle western Prestige 16" ← H1 Playfair 700 36px   │
│                              text-cgws-charcoal       │
│                                                       │
│  Prestige · Selles           ← Inter 400 14px         │
│                              text-cgws-leather        │
│                                                       │
│  ──────────────────────────  ← border-t cgws-leather/20
│                                                       │
│  850 €                       ← Bebas Neue 48px        │
│                              text-cgws-copper         │
│                                                       │
│  Excellent état              ← Inter 500 14px         │
│                              text-cgws-leather        │
│  Taille : 15"                ← Inter 400 14px         │
│                              text-cgws-leather        │
│                              (si product.size existe) │
│                                                       │
│  ──────────────────────────  ← border-t cgws-leather/10
│                                                       │
│  Description complète du     ← Inter 400 16px         │
│  produit sur plusieurs       text-cgws-charcoal       │
│  lignes (texte complet,       leading-relaxed         │
│  pas de line-clamp)          whitespace-pre-wrap      │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ bg-cgws-parchment  p-4  rounded-[4px]          │  │
│  │ border border-cgws-leather/30                  │  │
│  │                                                │  │
│  │ [CONSIGNATION badge]                           │  │
│  │                                                │  │
│  │ Cet article est proposé en consignation        │  │
│  │ par un particulier. Son prix a été convenu     │  │
│  │ avec CGWS.                                     │  │
│  │ ← Inter 400 13px text-cgws-leather             │  │
│  │                                                │  │
│  │ En savoir plus → /consignation                 │  │
│  │ ← Inter 500 13px text-cgws-copper              │  │
│  └────────────────────────────────────────────────┘  │
│  (bloc visible uniquement si product.isConsignment)  │
│                                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [  i-lucide-phone  Appeler pour acquérir      ] │ │
│  │ ← CgwsButton variant="primary" size="md" as="a"│ │
│  │ ← href="tel:+33XXXXXXXXX"  w-full               │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [  Contacter par message                      ] │ │
│  │ ← CgwsButton variant="secondary" size="md"     │ │
│  │ ← NuxtLink to="/contact"  w-full               │ │
│  └──────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Layout ASCII (état Vendu)

```
┌───────────────────────────────────────────────────────┐
│  [VENDU] [OCCASION]          ← badges row             │
│                                                       │
│  Selle western Prestige 16"                           │
│  Prestige · Selles                                    │
│                                                       │
│  850 €                       ← prix en cgws-leather   │
│                              (pas copper — vendu)     │
│                                                       │
│  Excellent état · 15"                                 │
│                                                       │
│  ──────────────────────────                          │
│                                                       │
│  Description...                                       │
│                                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [  Article vendu                              ] │ │
│  │ ← CgwsButton variant="primary" disabled        │ │
│  │   opacity-40 cursor-not-allowed  w-full         │ │
│  └──────────────────────────────────────────────────┘ │
│  (le bouton secondaire est masqué en état vendu)      │
└───────────────────────────────────────────────────────┘
```

### Logique des badges

```ts
// Badges affichés dans l'ordre : condition → consignment → sold (surpasse tout)
const conditionBadge = computed(() => {
  if (product.status === 'sold') return 'sold'
  return product.condition === 'new' ? 'new' : 'occasion'
})

const showConsignmentBadge = computed(() =>
  product.isConsignment && product.status !== 'sold'
)
```

### Labels d'état complets (affichés en texte sous le prix)

```ts
const conditionLabel: Record<ProductCondition, string> = {
  new: 'Article neuf — jamais utilisé',
  excellent: 'Excellent état — très légèrement utilisé',
  good: 'Bon état — légères marques d\'usage',
  fair: 'État correct — marques d\'usure visibles',
}
```

### Labels de catégorie

```ts
const categoryLabel: Record<ProductCategory, string> = {
  'selles': 'Selles',
  'brides-licols': 'Brides & Licols',
  'bottes-chaussures': 'Bottes & Chaussures',
  'vetements': 'Vêtements',
  'accessoires': 'Accessoires',
  'protections': 'Protections',
}
```

### Tailwind classes — détail complet

**Wrapper principal :**
```
flex flex-col gap-5
```

**Badges row :**
```
flex flex-wrap items-center gap-2
```

**H1 — titre produit :**
```
font-serif font-bold
text-[24px] sm:text-[28px] lg:text-[36px]
text-cgws-charcoal leading-tight
mt-1
```
C'est le seul `<h1>` de la page — ne pas utiliser `<h2>`.

**Ligne marque · catégorie :**
```
font-sans text-sm text-cgws-leather
flex items-center gap-2
```
Format : `{{ product.brand }} · {{ categoryLabel[product.category] }}`

**Séparateur mince (après marque/catégorie) :**
```
border-t border-cgws-leather/20 my-1
```

**Prix :**
```
font-display text-[48px] leading-none
text-cgws-copper
[sold]: text-cgws-leather
mt-1
```
Format : `{{ product.price.toFixed(0) }} €`
Inclure `<span class="sr-only">Prix : </span>` avant la valeur.

**Ligne état + taille :**
```
flex flex-col gap-1.5
```

**État (conditionLabel) :**
```
font-sans font-medium text-sm text-cgws-leather
flex items-center gap-1.5
```
Icône `i-lucide-tag` — `w-3.5 h-3.5 text-cgws-copper/70 flex-shrink-0`

**Taille (conditionnelle — `v-if="product.size"`) :**
```
font-sans text-sm text-cgws-leather
flex items-center gap-1.5
```
Icône `i-lucide-ruler` — `w-3.5 h-3.5 text-cgws-leather/50 flex-shrink-0`
Format : `Taille : {{ product.size }}`

**Séparateur mince (avant description) :**
```
border-t border-cgws-leather/10 my-1
```

**Description :**
```
font-sans text-base text-cgws-charcoal
leading-relaxed
whitespace-pre-wrap
```

**Encart consignation (`v-if="product.isConsignment && product.status !== 'sold'"`) :**
```
bg-cgws-parchment
border border-cgws-leather/30 rounded-[4px]
p-4
flex flex-col gap-3
```

Texte encart :
```
font-sans text-[13px] text-cgws-leather leading-relaxed
```

Lien "En savoir plus" :
```
font-sans font-medium text-[13px] text-cgws-copper
hover:text-cgws-leather transition-colors duration-150
underline underline-offset-2
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-copper
```

**Zone CTA :**
```
flex flex-col sm:flex-row gap-3 mt-2
```

**Bouton primaire "Appeler pour acquérir" (état actif) :**
```vue
<CgwsButton
  variant="primary"
  size="md"
  as="a"
  href="tel:+33XXXXXXXXX"
  class="flex-1 sm:flex-none"
>
  <i-lucide-phone class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
  Appeler pour acquérir
</CgwsButton>
```

**Bouton secondaire "Contacter par message" (état actif) :**
```vue
<CgwsButton
  variant="secondary"
  size="md"
  as="NuxtLink"
  to="/contact"
  class="flex-1 sm:flex-none"
>
  Contacter par message
</CgwsButton>
```

**Bouton "Article vendu" (état sold) :**
```vue
<CgwsButton
  variant="primary"
  size="md"
  disabled
  class="w-full cursor-not-allowed"
>
  Article vendu
</CgwsButton>
```
Le bouton secondaire est masqué (`v-if="!isSold"`) en état vendu.

### Animations GSAP

Initialisées dans `onMounted()`, nettoyées dans `onUnmounted()`.

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

// Stagger des éléments de ProductInfo — entrée depuis la droite
gsap.from([
  '.product-info-badges',
  '.product-info-title',
  '.product-info-meta',
  '.product-info-price',
  '.product-info-details',
  '.product-info-description',
  '.product-info-consignment',
  '.product-info-cta',
], {
  opacity: 0,
  x: 16,
  duration: 0.45,
  ease: 'power2.out',
  stagger: 0.07,
  delay: 0.2,   // décalé après la galerie (0.6s)
  clearProps: 'all',
})
```

Chaque élément de ProductInfo doit avoir la classe `data-animate` correspondante sur son noeud racine.

### Accessibilité

- `<h1>` natif pour le titre produit — unique sur la page
- Prix : `<span class="sr-only">Prix : </span>` + `<span aria-label="${product.price.toFixed(0)} euros">` autour du montant
- Taille : préfixer par `<span class="sr-only">Taille : </span>` si le label visuel n'est pas assez explicite pour les lecteurs d'écran
- Encart consignation : `role="note"` sur le bloc parchment
- Bouton tel: : `aria-label="Appeler CGWS pour acquérir ${product.title}"` — surcharge le contenu textuel du bouton pour les lecteurs d'écran
- Bouton secondaire : `aria-label="Contacter CGWS par message pour ${product.title}"`
- Bouton vendu : `aria-disabled="true"` en plus de `disabled` (redondance intentionnelle pour certains AT)

### Contraste

| Combinaison | Ratio | Statut |
|---|---|---|
| `cgws-charcoal` sur `cgws-cream` (titre, description) | 16.6:1 | ✓ WCAG AA |
| `cgws-leather` sur `cgws-cream` (marque, état) | 5.38:1 | ✓ WCAG AA |
| `cgws-copper` sur `cgws-cream` (prix 48px) | 3.03:1 | ✓ Large text WCAG AA |
| `cgws-leather` sur `cgws-parchment` (encart consignation) | 5.88:1 | ✓ WCAG AA |
| `cgws-charcoal` sur `cgws-copper` (bouton primaire) | 4.61:1 | ✓ WCAG AA |
| white sur `cgws-denim` (bouton secondaire) | 8.51:1 | ✓ WCAG AA |

---

## 5. ConchoDivider — entre sections

Le composant existant `app/components/ui/ConchoDivider.vue` est utilisé tel quel entre la section principale et RelatedProducts, et éventuellement entre la section principale et le breadcrumb (selon le rendu).

Usage :
```vue
<ConchoDivider />
```
`aria-hidden="true"` déjà présent dans le composant — aucune modification nécessaire.

---

## 6. RelatedProducts

**Location**: `app/components/product/RelatedProducts.vue`
**Purpose**: Section "Articles similaires" affichant 4 produits de la même catégorie que le produit courant, hors le produit lui-même. Réutilise directement `ProductCard` du catalogue pour une cohérence visuelle totale. Masquée si aucun produit similaire n'existe.

### Props TypeScript

```ts
import type { Product } from '~/types'

interface Props {
  products: Product[]     // max 4 items, déjà filtrés par le parent
  category: string        // nom de la catégorie pour le titre de section
  isLoading?: boolean     // affiche 4 skeletons
}
```

### Layout ASCII (desktop 1280px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  bg-cgws-cream py-12 md:py-16                                                │
│                                                                              │
│  max-w-[1280px] mx-auto px-[var(--container-px)]                            │
│                                                                              │
│  VOUS POURRIEZ AUSSI AIMER       ← Rye 12px uppercase tracking-[0.2em]      │
│                                     text-cgws-copper                        │
│                                                                              │
│  Articles similaires             ← Playfair Display 700 32px                │
│                                     text-cgws-charcoal mb-8                 │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │          │  │          │  │          │  │          │                   │
│  │ ProductCard ProductCard ProductCard ProductCard                          │
│  │ (catalogue) (catalogue) (catalogue) (catalogue)                          │
│  │          │  │          │  │          │  │          │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Grille responsive

```
grid
grid-cols-1          ← 375px : 1 colonne (les cards sont longues — pleine largeur)
sm:grid-cols-2       ← 640px : 2 colonnes
lg:grid-cols-4       ← 1024px+ : 4 colonnes
gap-4 md:gap-6
```

Note : pas de sidebar sur la fiche produit, donc `lg:grid-cols-4` est correct sans ajustement.

### Tailwind classes

**Section wrapper :**
```
bg-cgws-cream py-12 md:py-16
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

**H2 :**
```
font-serif font-bold text-[28px] md:text-[32px] text-cgws-charcoal
leading-tight mb-8
```

**Grille :**
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6
```

### État chargement — Skeletons

Pendant le fetch des produits similaires (`isLoading: true`), afficher 4 `ProductCardSkeleton` existants :
```vue
<template v-if="isLoading">
  <ProductCardSkeleton v-for="n in 4" :key="`skeleton-${n}`" />
</template>
```
`aria-busy="true"` sur la grille pendant le chargement.

### Condition d'affichage de la section

La section entière est masquée (`v-if`) si :
- `isLoading === false` ET `products.length === 0`

Pas d'état vide affiché — on masque simplement la section.

### Animations GSAP

ScrollTrigger déclenché quand la section entre dans le viewport.

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

gsap.from('.related-product-card', {
  opacity: 0,
  y: 24,
  duration: 0.4,
  ease: 'power2.out',
  stagger: 0.09,
  scrollTrigger: {
    trigger: '.related-products-grid',
    start: 'top 85%',
    once: true,
  },
  clearProps: 'all',
})
```

Chaque ProductCard dans cette section reçoit la classe `related-product-card` via un wrapper `<div>`.

### Accessibilité

- `<section aria-labelledby="related-products-heading">`
- `<h2 id="related-products-heading">Articles similaires</h2>`
- Les ProductCards héritent de leur propre accessibilité (voir US-012 §3)

---

## 7. Page `catalogue/[slug].vue` — Structure complète

### Schéma de la page

```vue
<script setup lang="ts">
import type { Product } from '~/types'

const route = useRoute()
const slug = route.params.slug as string

// Fetch produit
const { data: product, error } = await useAsyncData(
  `product-${slug}`,
  () => $fetch<Product>(`/api/products/${slug}`)
)

// 404 si introuvable
if (error.value || !product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
}

// Fetch produits similaires (même catégorie, exclu le courant, limit 4)
const { data: relatedProducts } = await useAsyncData(
  `related-${slug}`,
  () => $fetch<Product[]>('/api/products', {
    query: {
      category: product.value!.category,
      exclude: product.value!.id,
      limit: 4,
      status: 'active',
    }
  })
)

// SEO dynamique
useSeoMeta({
  title: `${product.value.title} — ${product.value.brand} | CGWS`,
  description: product.value.description.slice(0, 160),
  ogTitle: `${product.value.title} — CGWS`,
  ogDescription: product.value.description.slice(0, 160),
  ogImage: product.value.images[0] ?? undefined,
  ogType: 'product',
  twitterCard: 'summary_large_image',
})

// JSON-LD Product schema
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.value.title,
      description: product.value.description,
      brand: { '@type': 'Brand', name: product.value.brand },
      image: product.value.images,
      offers: {
        '@type': 'Offer',
        price: product.value.price,
        priceCurrency: 'EUR',
        availability: product.value.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
        url: `https://cgws.fr/catalogue/${product.value.slug}`,
      },
    }),
  }],
})
</script>
```

### Markup de la page

```vue
<template>
  <!-- Breadcrumb -->
  <nav aria-label="Fil d'Ariane" class="bg-cgws-cream border-b border-cgws-leather/10">
    <!-- voir §2 Breadcrumb -->
  </nav>

  <!-- Section principale -->
  <section
    class="bg-cgws-cream py-8 md:py-12"
    aria-label="Détail du produit"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]
                flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

      <!-- Galerie -->
      <ProductGallery
        :images="product.images"
        :alt="`${product.title}, ${product.brand}`"
        :sold="product.status === 'sold'"
        class="w-full lg:w-[55%] flex-shrink-0"
      />

      <!-- Informations -->
      <ProductInfo
        :product="product"
        class="flex-1 min-w-0 lg:sticky lg:top-[calc(4rem+2rem)]"
      />

    </div>
  </section>

  <!-- Diviseur -->
  <ConchoDivider />

  <!-- Produits similaires -->
  <RelatedProducts
    v-if="relatedProducts && relatedProducts.length > 0"
    :products="relatedProducts"
    :category="product.category"
  />
</template>
```

### Gestion 404

Quand `createError({ statusCode: 404 })` est lancé, Nuxt affiche automatiquement la page `error.vue`. La page d'erreur doit exister dans `app/error.vue` (hors scope de cette US — à créer avec un design minimal cgws-cream + CgwsButton "Retour au catalogue").

---

## 8. Breakpoints complets

| Breakpoint | Largeur | Galerie | Info | Produits similaires |
|---|---|---|---|---|
| Base | 375px | Pleine largeur, empilée au-dessus de l'info | Pleine largeur dessous | 1 colonne |
| sm | 640px | Pleine largeur | Pleine largeur | 2 colonnes |
| md | 768px | Pleine largeur | Pleine largeur | 2 colonnes |
| lg | 1024px | 55% (flex-row) | flex-1 (sticky) | 4 colonnes |
| xl | 1280px | 55% | flex-1 | 4 colonnes |
| 2xl | 1440px | 55% | flex-1 | 4 colonnes |

**Gap entre galerie et info :**
- Mobile/tablet : `gap-8` (empilé verticalement)
- Desktop : `gap-12` (côte à côte)

---

## 9. Accessibilité — récapitulatif page

### Structure sémantique

```
<AppHeader> (nav principale)
<nav aria-label="Fil d'Ariane"> (breadcrumb)
<main>
  <section aria-label="Détail du produit">
    <ProductGallery role="region" aria-label="Galerie photos">
    <ProductInfo> (contient le <h1> unique)
  </section>
  <section aria-labelledby="related-products-heading">
    <RelatedProducts> (contient le <h2>)
  </section>
</main>
<AppFooter>
```

### Navigation clavier complète

- Tab : breadcrumb → liens galerie (flèches, miniatures) → CTA primaire → CTA secondaire → lien consignation → produits similaires (4 cartes)
- Flèches ←/→ dans le Swiper principal (via `keyboard: { enabled: true }` Swiper)
- Enter / Space : active les miniatures, les boutons CTA, les ProductCards
- Escape : pas d'état modal sur cette page (pas de lightbox V1)

### Annonces lecteurs d'écran

- Changement de slide Swiper : `aria-live="polite"` sur un `<span class="sr-only">` mis à jour avec "Photo ${n} sur ${total}"
- Prix affiché : préfixé par `<span class="sr-only">Prix : </span>`

---

## 10. Animations GSAP — récapitulatif global de la page

Toutes initialisées dans `onMounted()`, nettoyées dans `onUnmounted()`. Guard `prefers-reduced-motion` systématique.

| Composant | Animation | Timing | Trigger |
|---|---|---|---|
| ProductGallery | fade-in + scale 0.98→1 de l'image principale | 0.6s ease power2.out | `onMounted` immédiat |
| ProductGallery | stagger miniatures y: 8→0 + opacity | 0.3s, stagger 0.06, delay 0.3s | `onMounted` |
| ProductInfo | stagger éléments x: 16→0 + opacity | 0.45s, stagger 0.07, delay 0.2s | `onMounted` |
| RelatedProducts | stagger cards y: 24→0 + opacity | 0.4s, stagger 0.09 | ScrollTrigger `top 85%` |

Les animations ProductGallery et ProductInfo sont déclenchées simultanément au chargement (page load). Le délai relatif entre elles (gallery: 0s, info: delay 0.2s) crée une entrée légèrement décalée gauche-droite, sans paraître saccadée.
