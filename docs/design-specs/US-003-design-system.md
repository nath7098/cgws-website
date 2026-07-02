# Design System CGWS v2 — Spec UX (US-003)

**Purpose**: Établir l'identité visuelle cohérente "Sellerie de Brèches" sur l'ensemble du site — tokens, typographie, composants UI de base, layout et page de dev-showcase. Toute implémentation ultérieure référence cette spec comme source unique de vérité.
**Sprint**: 0 — Fondations

---

## 1. Vue d'ensemble

Le design system CGWS v2 incarne une sellerie artisanale haut de gamme : cuir naturel, laiton cuivré, denim passé. Chaque décision de design ancre visuellement la boutique dans l'univers du matériel réel (selles, conchos, coutures, étiquettes en cuir), sans jamais tomber dans le kitsch far-west. Le modèle de référence est la maroquinerie équestre premium — pas le rodéo américain.

Toutes les classes Tailwind ci-dessous supposent TailwindCSS v4 avec `@theme static` déclaré dans `app/assets/css/main.css` (déjà en place). Les utilitaires `bg-cgws-*`, `text-cgws-*`, `border-cgws-*` sont disponibles dès que `main.css` est importé.

---

## 2. Tokens couleur

| Token Tailwind | Variable CSS | Hex | Luminance relative | Usage principal |
|---|---|---|---|---|
| `cgws-tack` | `--cgws-tack` | `#3D1A06` | 0.024 | Fonds sombres : header, footer, hero |
| `cgws-leather` | `--cgws-leather` | `#7B3B1C` | 0.088 | Bordures, accents secondaires, labels marque |
| `cgws-copper` | `--cgws-copper` | `#B8650A` | 0.217 | Accent principal, CTA primaire, prix, conchos |
| `cgws-rope` | `--cgws-rope` | `#C8AB82` | 0.457 | Texte sur fonds sombres, midtones |
| `cgws-parchment` | `--cgws-parchment` | `#F0DDB8` | 0.759 | Fond des TagCards produit, fond des cartes étiquette |
| `cgws-cream` | `--cgws-cream` | `#FAF3E3` | 0.912 | Fond principal du site, fond des inputs |
| `cgws-denim` | `--cgws-denim` | `#2C4A72` | 0.082 | CTA secondaire uniquement — usage très parcimonieux |
| `cgws-rust` | `--cgws-rust` | `#943218` | 0.100 | Badges occasion, états d'erreur, alertes, refus |
| `cgws-charcoal` | `--cgws-charcoal` | `#1A0B03` | 0.008 | Texte fort, titres, bordures wanted-poster |

**Tokens interdits** : Ne jamais utiliser `cgws-brown`, `cgws-amber`, `cgws-dark`, `cgws-sand` — ces tokens v1 sont obsolètes et n'existent pas dans `tokens.css`.

---

## 3. Typographie

| Rôle | Police | Poids | Classe Tailwind | Usage |
|---|---|---|---|---|
| Hero H1, prix, chiffres | Bebas Neue | 400 | `font-display` | Titres plein écran, statistiques, étiquettes prix |
| Eyebrows, labels section | Rye | 400 | `font-eyebrow` | Labels de section au-dessus des H2, badges catégorie — sparingly |
| Titres H2–H3, noms produit | Playfair Display | 600–700 | `font-serif font-semibold` / `font-bold` | Section titles, product names in cards |
| Taglines, citations | Playfair Display Italic | 400i | `font-serif italic` | Sous-titres hero, pull quotes |
| Corps, labels, nav | Inter | 400–500 | `font-sans` | Tout le texte courant |
| Boutons, badges, chiffres forts | Inter | 600–700 | `font-sans font-semibold` | Libellés CTA, badges, emphasis numérique |

**Chargement** (dans `nuxt.config.ts`, via `@nuxtjs/google-fonts`) :
```ts
googleFonts: {
  families: {
    'Bebas Neue': true,
    'Rye': true,
    'Playfair Display': { wght: [400, 600, 700], ital: [400] },
    'Inter': [400, 500, 600, 700],
  },
  display: 'swap',
  preload: true,
}
```

**Règle critique** : Rye ne s'utilise jamais pour le corps de texte, les descriptions produit, ou les formulaires. Uniquement pour les eyebrows et labels de section — maximum 2 occurrences par page.

---

## 4. Composants UI

---

### 4.1 CgwsButton

**Location**: `app/components/ui/CgwsButton.vue`
**Purpose**: Bouton d'action principal du site. Trois variants reflètent la hiérarchie des actions — copper pour l'action primaire, denim pour l'alternative, ghost pour les actions tertiaires/liens.

#### Props TypeScript

```ts
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'sm'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  as?: 'button' | 'a' | 'NuxtLink'
  href?: string
  to?: string
}
```

#### ASCII Wireframe

```
PRIMARY (md)
┌─────────────────────────────┐
│   DÉCOUVRIR LE CATALOGUE    │  ← Bebas Neue 18px uppercase, bg-cgws-copper
└─────────────────────────────┘

SECONDARY (md)
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│  Service consignation  →   │  ← Inter 14px, border-cgws-denim, transparent bg
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

GHOST
  En savoir plus             ← Inter 14px, text-cgws-leather, underline au hover
```

#### Breakpoints

- Mobile 375px : width 100% (`w-full`) sauf dans des contextes inline
- Tablet 768px+ : width auto (`w-auto`), inline

#### Variants — Classes Tailwind détaillées

**Primary** (`variant="primary"`):
```
bg-cgws-copper text-cgws-charcoal
font-display text-[18px] tracking-widest uppercase
px-6 py-3 rounded-sm border-0
transition-colors duration-150 ease-in-out
hover:bg-cgws-leather
active:bg-cgws-tack active:text-cgws-rope
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2
disabled:opacity-40 disabled:cursor-not-allowed
```

**Secondary** (`variant="secondary"`):
```
bg-transparent text-cgws-denim
border-2 border-cgws-denim
font-sans font-semibold text-sm tracking-wide uppercase
px-6 py-3 rounded-sm
transition-colors duration-150 ease-in-out
hover:bg-cgws-denim/10
active:bg-cgws-denim/20
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-denim focus-visible:ring-offset-2
disabled:opacity-40 disabled:cursor-not-allowed
```

**Ghost** (`variant="ghost"`):
```
bg-transparent text-cgws-leather
font-sans font-medium text-sm
px-2 py-1 rounded-sm
transition-colors duration-150 ease-in-out
hover:text-cgws-copper underline-offset-4 hover:underline
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2
disabled:opacity-40 disabled:cursor-not-allowed
```

**Size modifier** (`size="sm"` override sur primary/secondary) :
```
px-4 py-2 text-[14px]
```

#### States

| State | Rendu |
|---|---|
| Default | Couleurs ci-dessus |
| Hover | Primary: `bg-cgws-leather` / Secondary: `bg-cgws-denim/10` / Ghost: `text-cgws-copper + underline` |
| Active | Primary: `bg-cgws-tack text-cgws-rope` |
| Focus | Ring `cgws-copper` 2px, offset 2px — visible pour tous variants |
| Loading | Spinner `<span>` animé en rotation à gauche du label, opacity 80%, `cursor-wait` |
| Disabled | `opacity-40 cursor-not-allowed`, aucune interaction hover |

#### Accessibility

- `role`: natif button
- `disabled` attribute sur l'élément DOM quand `disabled || loading`
- `aria-busy="true"` quand `loading`
- Contraste : `text-cgws-charcoal` (#1A0B03) sur `bg-cgws-copper` (#B8650A) → **4.61:1** — passe WCAG AA pour texte normal
- Note : le brief spécifiait `text-white` sur `bg-cgws-copper`. Ce ratio vaut ~3.93:1, insuffisant pour du texte normal selon WCAG 2.1 AA (seuil 4.5:1). `text-cgws-charcoal` est la correction conforme, et reste visuellement cohérent avec l'esthétique cuir gravé/martelé.

---

### 4.2 CgwsCard

**Location**: `app/components/ui/CgwsCard.vue`
**Purpose**: Carte générique pour encadrer du contenu dans les sections du site (sections "Notre Histoire", blocs informatifs, formulaires, etc.). Distincte de TagCard qui est réservée aux produits.

#### Props TypeScript

```ts
interface Props {
  title?: string
  padding?: 'sm' | 'md' | 'lg'
}
// Slots: default (content), header (optionnel)
```

#### ASCII Wireframe

```
┌─────────────────────────────────────┐  ← border border-cgws-leather/30
│  Titre de section                   │  ← Playfair Display 600, text-cgws-charcoal
│  ─────────────────────────────────  │  ← separator (border-b border-cgws-leather/20)
│                                     │
│  Contenu du slot                    │  ← Inter 400, text-cgws-charcoal
│                                     │
└─────────────────────────────────────┘
```

#### Classes Tailwind

```
bg-cgws-cream
border border-cgws-leather/30
rounded-[4px]
shadow-sm
p-6              ← padding md (défaut)
```

Header titre (si prop `title`) :
```
font-serif font-semibold text-xl text-cgws-charcoal
pb-3 mb-4 border-b border-cgws-leather/20
```

#### Breakpoints

- Mobile 375px : `p-4`, marges `mx-0`
- Desktop 1024px+ : `p-6`

---

### 4.3 CgwsBadge

**Location**: `app/components/ui/CgwsBadge.vue`
**Purpose**: Pilule de statut placée sur les TagCards produit. Communique d'un coup d'œil l'état de l'article (neuf, occasion, consignation, vendu). Mapping direct vers les champs `Product.condition`, `Product.isConsignment`, et `Product.status`.

#### Props TypeScript

```ts
type BadgeVariant = 'new' | 'occasion' | 'consignment' | 'sold'

interface Props {
  variant: BadgeVariant
}
```

**Mapping données** (à appliquer dans le composant parent TagCard) :

| Condition produit | Logique de sélection | Variant badge |
|---|---|---|
| `product.status === 'sold'` | Prioritaire sur tout | `sold` |
| `product.isConsignment === true` | Si non vendu | `consignment` |
| `product.condition === 'new'` | Sinon | `new` |
| `product.condition` in `['excellent','good','fair']` | Sinon | `occasion` |

#### ASCII Wireframe

```
[● NEUF]  [● OCCASION]  [● CONSIGNATION]  [● VENDU]
```

#### Variants — Classes Tailwind

**new** :
```
bg-cgws-denim text-white
font-sans font-medium text-[11px] uppercase tracking-wider
px-3 py-1 rounded-full inline-flex items-center gap-1.5
```

**occasion** :
```
bg-cgws-rust text-white
font-sans font-medium text-[11px] uppercase tracking-wider
px-3 py-1 rounded-full inline-flex items-center gap-1.5
```

**consignment** :
```
bg-cgws-copper text-cgws-charcoal
font-sans font-medium text-[11px] uppercase tracking-wider
px-3 py-1 rounded-full inline-flex items-center gap-1.5
```

**sold** :
```
bg-cgws-charcoal text-cgws-rope
font-sans font-medium text-[11px] uppercase tracking-wider
px-3 py-1 rounded-full inline-flex items-center gap-1.5
```

#### Libellés affichés par variant

| variant | Texte FR |
|---|---|
| `new` | Neuf |
| `occasion` | Occasion |
| `consignment` | Consignation |
| `sold` | Vendu |

#### Accessibility

- `role="status"` ou laisser comme `<span>` inline (préférable dans un contexte de liste)
- `aria-label` : `"Produit ${libellé}"` quand utilisé hors contexte évident
- Contrastes :
  - white sur `cgws-denim` → **7.93:1** ✓
  - white sur `cgws-rust` → **7.00:1** ✓
  - `cgws-charcoal` sur `cgws-copper` → **4.61:1** ✓
  - `cgws-rope` sur `cgws-charcoal` → **8.76:1** ✓
- Note : le brief spécifiait `text-white` sur `bg-cgws-copper` pour le badge consignment. Ce ratio est ~3.93:1, insuffisant à 11px. Correction : `text-cgws-charcoal` sur `bg-cgws-copper` (4.61:1 ✓).

---

### 4.4 CgwsInput

**Location**: `app/components/ui/CgwsInput.vue`
**Purpose**: Champ texte standard utilisé dans les formulaires publics (consignation, contact) et le backoffice. Associe toujours un label visible et gère l'état d'erreur.

#### Props TypeScript

```ts
interface Props {
  modelValue?: string
  label: string
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'url'
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name?: string
}
// Emits: update:modelValue
```

#### ASCII Wireframe

```
Label *                         ← Inter 14px 500, text-cgws-charcoal
┌─────────────────────────────────────┐
│  Placeholder en cgws-rope           │  ← border-cgws-leather
└─────────────────────────────────────┘

── Focus ──
┌─────────────────────────────────────┐
│  Valeur saisie                      │  ← border-cgws-copper + ring
└─────────────────────────────────────┘
                            ← ring 3px cgws-copper/20

── Error ──
Label *
┌─────────────────────────────────────┐
│  Valeur incorrecte                  │  ← border-cgws-rust
└─────────────────────────────────────┘
  ⚠ Message d'erreur explicite        ← Inter 12px, text-cgws-rust
```

#### Classes Tailwind

**Label** :
```
block font-sans font-medium text-sm text-cgws-charcoal mb-1.5
```

**Input — état default** :
```
w-full
bg-cgws-cream text-cgws-charcoal
border border-cgws-leather
rounded-sm
px-3 py-2.5
font-sans text-sm
placeholder:text-cgws-rope placeholder:font-normal
transition-shadow transition-colors duration-150
outline-none
focus:border-cgws-copper focus:ring-3 focus:ring-cgws-copper/20
disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cgws-parchment/50
```

**Input — état error** (classes ajoutées) :
```
border-cgws-rust focus:border-cgws-rust focus:ring-cgws-rust/20
```

**Message d'erreur** :
```
mt-1 font-sans text-xs text-cgws-rust
```

#### Accessibility

- `<label>` toujours associé via `for` / `id` — ne jamais omettre
- `aria-describedby` pointe vers le message d'erreur quand `error` est défini
- `aria-invalid="true"` sur l'input en état error
- `aria-required="true"` si `required`
- Contraste `text-cgws-charcoal` sur `bg-cgws-cream` → **16.6:1** ✓

---

### 4.5 TagCard

**Location**: `app/components/ui/TagCard.vue`
**Purpose**: Composant signature CGWS. Chaque produit du catalogue est présenté comme une étiquette en cuir suspendue à l'article — trou de perforation, couture pointillée cuivrée, fond parchemin. Usage réservé aux listes et fiches produit uniquement.

#### Props TypeScript

```ts
import type { Product } from '~/types'

interface Props {
  product: Product
}
// Émet: click (pour navigation vers /catalogue/[slug])
```

#### ASCII Wireframe (mobile-first, width ~240px)

```
         ●                      ← perforation hole: w-3 h-3 rounded-full
┌────────┴────────────────────┐  ← bg-cgws-parchment border-2 border-cgws-leather rounded-[6px]
│                             │
│  ┌──────────────────────┐   │  ← NuxtImg, aspect-[4/3], object-cover, rounded-t-[4px]
│  │                      │   │
│  │     [image]          │   │
│  │                      │   │
│  └──────────────────────┘   │
│                             │
│  ╔ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╗  │  ← dashed border 1px cgws-copper, inset m-2 p-3
│  ╎  [CONSIGNATION]       ╎  │  ← CgwsBadge (variant auto-calculé)
│  ╎                       ╎  │
│  ╎  Selle western        ╎  │  ← Playfair Display 600, 16px, text-cgws-charcoal
│  ╎  Prestige             ╎  │  ← Inter, 13px, text-cgws-leather
│  ╎                       ╎  │
│  ╎              850 €    ╎  │  ← Bebas Neue, 24px, text-cgws-copper, text-right
│  ╚ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╝  │
└─────────────────────────────┘
```

#### Structure interne (pseudo-template)

```html
<article class="[card-classes]" role="article" :aria-label="`Produit : ${product.title}`">
  <!-- Perforation hole -->
  <div class="[hole-classes]" aria-hidden="true"></div>

  <!-- Image produit -->
  <div class="aspect-[4/3] overflow-hidden rounded-t-[4px]">
    <NuxtImg :src="product.images[0]" :alt="product.title" ... />
  </div>

  <!-- Bloc texte avec bordure couture -->
  <div class="[stitching-block-classes]">
    <CgwsBadge :variant="badgeVariant" />
    <h3 class="[title-classes]">{{ product.title }}</h3>
    <p class="[brand-classes]">{{ product.brand }}</p>
    <p class="[price-classes]">{{ formatPrice(product.price) }}</p>
  </div>
</article>
```

#### Classes Tailwind — détail

**Carte** :
```
relative flex flex-col
bg-cgws-parchment border-2 border-cgws-leather rounded-[6px]
overflow-hidden
transition-transform transition-shadow duration-200 ease-in-out
hover:-translate-y-1 hover:shadow-lg hover:shadow-cgws-leather/20
cursor-pointer
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper
```

**Perforation hole** :
```
absolute top-2 left-1/2 -translate-x-1/2
w-3 h-3 rounded-full
bg-cgws-cream border border-cgws-leather
z-10
```

**Bloc couture (stitching container)** :
```
m-2 p-3
border border-dashed border-cgws-copper
rounded-sm
flex flex-col gap-1.5
```

**Titre produit** :
```
font-serif font-semibold text-base text-cgws-charcoal
leading-snug line-clamp-2
mt-1.5
```

**Marque** :
```
font-sans text-[13px] text-cgws-leather
```

**Prix** :
```
font-display text-2xl text-cgws-copper
text-right mt-auto
```

#### States

| State | Rendu |
|---|---|
| Default | Carte plane, shadow-sm |
| Hover | `translateY(-4px)`, `shadow-lg shadow-cgws-leather/20` |
| Focus | Ring 2px `cgws-copper` |
| Sold | Overlay semi-transparent `bg-cgws-charcoal/20` + badge `sold` — image en `grayscale` |
| Image manquante | Fond `cgws-leather/10` avec icône selle SVG centrée |

#### Breakpoints

- Mobile 375px : grille 1 colonne, card full-width
- Tablet 768px : grille 2 colonnes
- Desktop 1024px : grille 3–4 colonnes

#### Accessibility

- `role="article"` sur l'élément racine
- `aria-label` : `"Produit : ${product.title}, ${product.brand}, ${formatPrice(product.price)}"`
- Image : `alt="${product.title} — ${product.brand}"` via `<NuxtImg>`
- Prix : `<span class="sr-only">Prix : </span>` avant la valeur numérique
- Badge : `<span class="sr-only">Statut : </span>` + le libellé
- Navigation clavier : `tabindex="0"` + `@keydown.enter="navigateTo"` si utilisé comme lien
- Contraste titre `cgws-charcoal` sur `cgws-parchment` → **13.97:1** ✓
- Contraste marque `cgws-leather` sur `cgws-parchment` → **5.88:1** ✓
- Contraste prix `cgws-copper` sur `cgws-parchment` → **3.03:1** — passe large text WCAG AA uniquement (24px ≥ 18pt, ok pour `text-2xl`)

#### Animation GSAP (onMounted)

```
Entrée lors du premier affichage en viewport (ScrollTrigger) :
- from: { opacity: 0, y: 20 }
- to: { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
- stagger: 0.08 (pour les grilles)
Nettoyer le ScrollTrigger dans onUnmounted
```

---

### 4.6 ConchoStat

**Location**: `app/components/ui/ConchoStat.vue`
**Purpose**: Médaillon circulaire façon concho de harnachement, remplace les barres de statistiques plates sur la homepage. Affiche un chiffre clé avec son label. Les "4 pointes" rappellent les ornements cardinaux des véritables conchos de selle.

#### Props TypeScript

```ts
interface Props {
  value: number | string
  label: string
  suffix?: string        // ex: '+', '%', ' ans'
  animateOnVisible?: boolean  // déclenche le counter GSAP au scroll
}
```

#### ASCII Wireframe

```
           ▲
           │
     ◄ ───────── ►
    /  ╭─────────╮  \
   /   │  · · ·  │   \
  ▼   │  · 250 ·  │   ▼
       │  · · ·  │
       │  Selles  │
        ╰─────────╯
           ▲
           │
           ▼
```

Représentation plus précise :

```
        △ (pointe Nord, SVG triangle)
  ◁ ──[══════════]── ▷
      ║  ╌ ╌ ╌  ║
      ║  ╌ 250╌  ║  ← Bebas Neue 32px (desktop) / 26px (mobile)
      ║  ╌selles╌║  ← Rye 11px
      ║  ╌ ╌ ╌  ║
  ◁ ──[══════════]── ▷
        ▽ (pointe Sud)
```

#### Dimensions

| Breakpoint | Diamètre extérieur |
|---|---|
| Mobile 375px | 80px |
| Desktop 1024px+ | 100px |

#### Classes Tailwind + structure SVG

**Wrapper positionnel** :
```
relative inline-flex items-center justify-center
w-20 h-20 md:w-[100px] md:h-[100px]
```

**Cercle extérieur** (élément SVG ou div `rounded-full`) :
```
absolute inset-0 rounded-full border-2 border-cgws-copper
```

**Anneau intérieur pointillé** (inset de 6px) :
```
absolute inset-[6px] rounded-full border border-dashed border-cgws-copper/50
```

**Pointes cardinales** (4 triangles SVG, 6×8px chacun, positionnés via `absolute`) :
```
N: top-0 left-1/2 -translate-x-1/2 -translate-y-[4px]
S: bottom-0 left-1/2 -translate-x-1/2 translate-y-[4px]
E: right-0 top-1/2 -translate-y-1/2 translate-x-[4px]
W: left-0 top-1/2 -translate-y-1/2 -translate-x-[4px]
```
Couleur fill SVG : `#B8650A` (`cgws-copper`)

**Contenu central** :
```
relative z-10 flex flex-col items-center justify-center
```

**Valeur** :
```
font-display text-3xl md:text-[32px] text-cgws-copper leading-none
```

**Label** :
```
font-eyebrow text-[10px] md:text-[11px] text-cgws-leather
uppercase tracking-wider leading-tight text-center
```

#### States

| State | Rendu |
|---|---|
| Default | Cercle et pointes statiques |
| AnimateOnVisible | Counter GSAP 0 → `value`, 1.5s, `ease: "power2.out"`, déclenché par ScrollTrigger |
| Sans valeur | Squelette pulse en `cgws-parchment` (skeleton loader) |

#### Accessibility

- `role="img"` sur le composant
- `aria-label="\`${value}${suffix} ${label}\`"` — le rendu visuel n'est pas lisible par les SR sans ça
- Ne pas utiliser `aria-hidden` car c'est une information clé

---

## 5. Layout Default

**Location**: `app/layouts/default.vue`

#### Structure

```html
<div class="min-h-screen flex flex-col bg-cgws-cream">
  <AppHeader />          <!-- fond cgws-tack, sticky, z-50 -->
  <main class="flex-1">
    <slot />
  </main>
  <AppFooter />          <!-- fond cgws-tack -->
</div>
```

#### AppHeader (placeholder Sprint 0)

**Location**: `app/components/layout/AppHeader.vue`

```
┌────────────────────────────────────────────────────────────────────────┐
│  [CGWS]    Catalogue    Consignation    À Propos    Contact    📞      │
└────────────────────────────────────────────────────────────────────────┘
   ↑ font-display text-cgws-copper   ↑ Inter 14px text-cgws-rope
```

Classes header :
```
sticky top-0 z-50
bg-cgws-tack
border-b border-cgws-leather/30
px-[var(--container-px)]
h-16
flex items-center justify-between
transition-all duration-200
```

Logo :
```
font-display text-2xl text-cgws-copper tracking-widest uppercase
```

Liens nav :
```
font-sans text-sm text-cgws-rope
hover:text-cgws-copper
transition-colors duration-150
```

#### AppFooter (placeholder Sprint 0)

**Location**: `app/components/layout/AppFooter.vue`

```
┌──────────────────────────────────────────────────────────────┐
│  [CGWS]          Catalogue · Consignation · Contact          │
│  Brèches, 37     © 2026 CGWS — Mentions légales             │
└──────────────────────────────────────────────────────────────┘
```

Classes footer :
```
bg-cgws-tack
border-t border-cgws-copper/30
py-8 px-[var(--container-px)]
```

Texte footer :
```
font-sans text-sm text-cgws-rope
```

---

## 6. Page `/dev-components`

**Location**: `app/pages/dev-components.vue`
**Condition** : rendue uniquement hors production.

```ts
// En tête du script setup
if (process.env.NODE_ENV === 'production') {
  throw createError({ statusCode: 404, message: 'Not Found' })
}
```

#### Structure de la page

Fond `bg-cgws-cream`, layout vertical, sections séparées par un `<hr>` remplacé par un diviseur concho (ligne `border-cgws-leather/30` interrompue par un cercle centré `w-3 h-3 rounded-full border border-cgws-copper bg-cgws-cream`).

Chaque section porte un label `font-eyebrow text-cgws-leather uppercase text-xs tracking-widest mb-4`.

```
┌──────────────────────────────────────────────────────────────────┐
│  /dev-components — CGWS Design System v2                        │
│  [Rye label] "Sellerie de Brèches"                              │
├──────────────────────────────────────────────────────────────────┤
│  COULEURS                                                        │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ...         │
│  │tack │ │leat.│ │copp.│ │rope │ │parch│ │cream│              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
├──────────────────────────────────────────────────────────────────┤
│  TYPOGRAPHIE                                                     │
│  Bebas Neue · Rye · Playfair Display · Inter                    │
├──────────────────────────────────────────────────────────────────┤
│  BOUTONS                                                         │
│  [Primary md] [Primary sm] [Secondary md] [Ghost] [Disabled]   │
│  [Loading...]                                                    │
├──────────────────────────────────────────────────────────────────┤
│  BADGES                                                          │
│  [NEUF] [OCCASION] [CONSIGNATION] [VENDU]                       │
├──────────────────────────────────────────────────────────────────┤
│  INPUTS                                                          │
│  [Default] [Focus simulé] [Error] [Disabled]                    │
├──────────────────────────────────────────────────────────────────┤
│  CARDS                                                           │
│  [CgwsCard avec slot] [CgwsCard avec titre]                     │
├──────────────────────────────────────────────────────────────────┤
│  TAG CARDS (PRODUITS)                                            │
│  [TagCard neuf] [TagCard occasion] [TagCard consignation]       │
│  [TagCard vendu]                                                 │
├──────────────────────────────────────────────────────────────────┤
│  CONCHO STATS                                                    │
│     ◎         ◎         ◎         ◎                             │
│    250+      15+       100%      Brèches                        │
│   Selles   Marques   Passion      37                            │
└──────────────────────────────────────────────────────────────────┘
```

**Données fictives pour les TagCards** : utiliser des objets `Partial<Product>` conformes à `app/types/index.ts`. Ne pas inventer de champs. Exemple :

```ts
const demoProduct: Product = {
  id: 'demo-1',
  slug: 'selle-western-prestige',
  title: 'Selle western Prestige',
  description: 'Selle artisanale en cuir pleine fleur.',
  price: 850,
  category: 'selles',
  brand: 'Prestige',
  condition: 'excellent',
  isConsignment: true,
  status: 'active',
  images: ['/img/demo/selle-prestige.jpg'],
  stock: 1,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}
```

---

## 7. Breakpoints (mobile-first)

| Breakpoint | Largeur | Tailwind prefix | Notes |
|---|---|---|---|
| Base | 375px | (sans prefix) | Smartphone portrait — prioritaire |
| sm | 640px | `sm:` | Grands smartphones / paysage |
| md | 768px | `md:` | Tablette portrait |
| lg | 1024px | `lg:` | Tablette paysage / laptop |
| xl | 1280px | `xl:` | Desktop (container max) |
| 2xl | 1536px | `2xl:` | Grands écrans — rarement utilisé |

Container max-width : `max-w-[1280px] mx-auto px-[var(--container-px)]`

---

## 8. Accessibilité — Contrastes WCAG AA

Tous les ratios ci-dessous sont calculés selon WCAG 2.1 (formule relative luminance sRGB).

| Combinaison | Ratio | Seuil requis | Statut |
|---|---|---|---|
| `text-cgws-charcoal` sur `bg-cgws-cream` | 16.6:1 | 4.5:1 | ✓ |
| `text-cgws-charcoal` sur `bg-cgws-parchment` | 13.97:1 | 4.5:1 | ✓ |
| `text-cgws-leather` sur `bg-cgws-parchment` | 5.88:1 | 4.5:1 | ✓ |
| `text-cgws-rope` sur `bg-cgws-tack` | 6.82:1 | 4.5:1 | ✓ |
| `text-cgws-rope` sur `bg-cgws-charcoal` | 8.76:1 | 4.5:1 | ✓ |
| `text-white` sur `bg-cgws-rust` | 7.00:1 | 4.5:1 | ✓ |
| `text-white` sur `bg-cgws-denim` | 7.93:1 | 4.5:1 | ✓ |
| `text-cgws-charcoal` sur `bg-cgws-copper` | 4.61:1 | 4.5:1 | ✓ |
| `text-cgws-rope` sur `bg-cgws-charcoal` | 8.76:1 | 4.5:1 | ✓ |
| `text-cgws-copper` sur `bg-cgws-parchment` (prix) | 3.03:1 | 3:1 large text | ✓ (texte 24px+) |
| `text-cgws-denim` sur `bg-cgws-cream` (ghost secondary) | 7.27:1 | 4.5:1 | ✓ |
| `text-white` sur `bg-cgws-copper` | 3.93:1 | — | ⚠ interdit pour texte < 24px |

**Règle** : le seul cas où `text-white` sur fond `cgws-copper` est toléré est le prix affiché en Bebas Neue 24px+ (large text WCAG). Dans tous les autres contextes sur fond copper, utiliser `text-cgws-charcoal`.

---

## 9. Animations

Toutes les animations doivent être déclarées uniquement dans `onMounted()` et nettoyées dans `onUnmounted()`.

| Composant | Animation | Durée | Easing | Déclencheur |
|---|---|---|---|---|
| TagCard (entrée grille) | `opacity 0→1, y 20→0` | 400ms | `power2.out` | ScrollTrigger |
| TagCard (hover) | `translateY -4px, shadow` | 200ms | CSS transition | `:hover` |
| ConchoStat valeur | Counter `0 → value` | 1500ms | `power2.out` | ScrollTrigger |
| Page transitions | `opacity 0→1` | 250ms | CSS | `<NuxtPage>` transition |
| Tout | Désactivé si `prefers-reduced-motion: reduce` | — | — | Media query + GSAP check |

GSAP motion-safe pattern :
```ts
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // animations GSAP ici
}
```

---

## 10. Décisions de design non triviales

**1. Hole de perforation en `position: absolute`** : le trou de la TagCard est positionné en absolute sur le bord supérieur de la carte. L'`overflow-hidden` de la carte doit être désactivé sur l'axe vertical supérieur, ou le cercle doit être positionné légèrement à l'intérieur (`top-2` au lieu de `-top-1.5`) pour rester visible sans clip. Le choix retenu est `top-2` interne.

**2. Bordure couture pointillée** : la bordure `border-dashed` CSS native sera utilisée (plutôt qu'un SVG custom), ce qui donne un rendu homogène sur tous les navigateurs modernes. La propriété `border-spacing` n'est pas disponible sur les divs — pour un espacement des tirets plus généreux, envisager un SVG `<rect>` en `stroke-dasharray`.

**3. ConchoStat — pointes cardinales** : implémentées en SVG inline plutôt qu'en pseudo-éléments CSS pour garantir la reproductibilité cross-browser et faciliter la coloration avec le token `cgws-copper`.

**4. Rye "sparingly"** : la police Rye est limitée aux labels de section `font-eyebrow` en très petite taille (10–12px). Elle ne doit jamais apparaître dans des blocs de texte ou des listes. Si un label de section en Rye dépasse 20 mots, reformuler en abrégé.

**5. `cgws-denim` usage restreint** : ce token n'apparaît que sur les boutons `secondary` et le badge `new`. Aucune autre utilisation autorisée sans validation explicite. L'abus du denim dilue l'identité cuir/cuivre.

---

## 11. Contradiction Gherkin v1 vs Direction artistique v2

Le fichier `docs/SPRINT_PLAN.md` §US-003 contient des critères Gherkin rédigés avec les tokens **v1** (`cgws-brown`, `cgws-amber`, `cgws-dark`, `cgws-sand`) et des descriptions de variants v1 (`"primary" (amber)`, `"secondary" (outline sand)`). Or `app/assets/css/tokens.css` et `app/assets/css/main.css` implémentent déjà les tokens **v2** (`cgws-tack`, `cgws-leather`, `cgws-copper`, `cgws-rope`, etc.).

**Action requise** : le développeur doit implémenter v2 conformément à cette spec et à CLAUDE.md — pas conformément au Gherkin obsolète de SPRINT_PLAN.md. Le Product Owner devra mettre à jour les critères Gherkin dans SPRINT_PLAN.md pour les aligner sur v2 avant que `/qa` puisse valider US-003 sans ambiguïté. La seule correction critique est la ligne :

> `Then les variables CSS cgws-brown, cgws-amber, cgws-parchment, cgws-dark, cgws-rust, cgws-sand, cgws-cream sont définies`

À remplacer par :

> `Then les variables CSS cgws-tack, cgws-leather, cgws-copper, cgws-rope, cgws-parchment, cgws-cream, cgws-denim, cgws-rust, cgws-charcoal sont définies`

Le Gherkin ne mentionne pas non plus la font `Rye`, qui est pourtant requise par CLAUDE.md pour les eyebrows de section.
