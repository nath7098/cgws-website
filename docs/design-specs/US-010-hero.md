# HeroSection + StatsBar — Spec UX (US-010)

**Purpose**: Premier écran immersif de cgws.fr — communique en 3 secondes l'univers western premium de CGWS, capte l'attention du cavalier et le dirige vers le catalogue ou le service consignation. C'est le LCP critique du site.
**Locations**:
- `app/pages/index.vue` — page shell (import des sections)
- `app/components/home/HeroSection.vue` — hero plein écran
- `app/components/home/SaddleIllustration.vue` — SVG selle animé
- `app/components/home/StatsBar.vue` — bande stats sous le hero

---

## Composants réutilisés (design system existant)

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `CgwsButton` | `ui/CgwsButton.vue` | CTA "Découvrir le catalogue" (primary) |
| `ConchoStat` | `ui/ConchoStat.vue` | 4 stats avec médaillon et animation compteur |

> Note: le CTA "Service consignation" requiert un nouveau variant `outline-light` de `CgwsButton` (voir section 5.2). Le variant `secondary` existant utilise `cgws-denim` qui n'est pas lisible sur fond `cgws-tack` (rapport de contraste 1.86:1, non conforme WCAG AA).

---

## Layout ASCII

### Hero — Desktop 1440px

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [IMAGE PLEIN FOND — ranch golden hour, landscape 16:9, object-cover]      │
│  [OVERLAY GRADIENT : tack/90 → bas, tack/30 → milieu, transparent → haut] │
│                                                                             │
│  z-10 ── CONTENT LAYER ───────────────────────────────────────────────     │
│  │                                                                          │
│  │  [Rye 14px · cgws-rope]                                                 │
│  │  Sellerie Équestre Western · Brèches, 37                                │
│  │                                                                          │
│  │  [Bebas Neue ~100px · cgws-cream · stagger GSAP]                       │
│  │  L'AUTHENTIQUE                                                           │
│  │  WESTERN À VOTRE PORTÉE                                                 │
│  │                                                                          │
│  │  [Playfair Display Italic · 20px · cgws-rope · max-w-lg]               │
│  │  Équipements authentiques pour cavaliers passionnés —                   │
│  │  neuf, occasion et consignation.                                        │
│  │                                                                          │
│  │  [CgwsButton primary]      [CgwsButton outline-light]                  │
│  │  Découvrir le catalogue    Service consignation                         │
│  │                                                                          │
│                                              ╭──────────────────────╮      │
│                                              │  SVG SELLE WESTERN   │      │
│                                              │  (SaddleIllustration)│      │
│                                              │  w-72 · opacity-75   │      │
│                                              │  float animation     │      │
│                                              ╰──────────────────────╯      │
│                                                                             │
│              [▼ scroll indicator · bounce GSAP · absolute bottom-8]        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Hero — Mobile 375px

```
┌──────────────────────────────┐
│  [IMAGE PORTRAIT · crop top] │
│  [overlay tack/85 bottom]    │
│                              │
│  Sellerie Équestre · 37      │
│                              │
│  L'AUTHENTIQUE               │
│  WESTERN                     │
│  À VOTRE                     │
│  PORTÉE                      │
│                              │
│  Équipements authentiques    │
│  pour cavaliers passionnés.  │
│                              │
│  [Découvrir le catalogue   ] │
│  [Service consignation     ] │
│                              │
│           ▼                  │
└──────────────────────────────┘
```

### Stats Bar — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│ bg-cgws-tack · py-16                                                       │
│                                                                             │
│   ╭──────────╮    ╭──────────╮    ╭──────────╮    ╭──────────╮           │
│   │  ◆ 250+ │    │  ◆ 15+  │    │  ◆ 100% │    │   ◆ 37  │           │
│   ╰──────────╯    ╰──────────╯    ╰──────────╯    ╰──────────╯           │
│   articles        marques          passion          Brèches               │
│   en stock        référencées      équestre         Indre-et-Loire        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Stats Bar — Mobile 375px

```
┌──────────────────────────────┐
│ bg-cgws-tack · py-10         │
│   ╭──────╮    ╭──────╮      │
│   │ 250+ │    │  15+ │      │
│   ╰──────╯    ╰──────╯      │
│   articles    marques        │
│                              │
│   ╭──────╮    ╭──────╮      │
│   │ 100% │    │  37  │      │
│   ╰──────╯    ╰──────╯      │
│   passion     Brèches        │
└──────────────────────────────┘
```

---

## 1. Image de fond hero

### 1.1 Description de l'image

**Scène idéale** : une selle western richement travaillée (cuir brun, décoration fleurie toolée, étrier large en bois clair) posée sur une clôture de ranch au lever/coucher du soleil. Arrière-plan : prairie dorée légèrement floutée. Pas de cavalier visible — la selle seule est le sujet, comme dans une vitrine haut de gamme.

**Alternative acceptable** : un cavalier western en plein galop contre un ciel dramatique, vu de profil — silhouette + cheval + selle bien visible.

**Placeholder Unsplash suggéré** :
- Desktop : `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80&auto=format&fit=crop`
  (selle en cuir western — vérifier l'URL avant intégration, remplacer par photo Camille dès disponible)
- Mobile portrait : `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=768&h=1024&q=80&auto=format&fit=crop&crop=entropy`
- Recherche alternative : `https://unsplash.com/s/photos/western-saddle` ou `https://unsplash.com/s/photos/western-horse-rider`

### 1.2 Implémentation NuxtImg (LCP critique)

```vue
<!-- Dans HeroSection.vue — DOIT être le premier élément rendu -->
<NuxtImg
  src="/img/hero-desktop.webp"
  alt=""
  class="absolute inset-0 h-full w-full object-cover object-center md:object-[center_40%]"
  :width="1920"
  :height="1080"
  fetchpriority="high"
  loading="eager"
  format="webp"
  quality="85"
  sizes="(max-width: 768px) 768px, 1920px"
/>
```

> Focal point desktop : `object-[center_40%]` — cadre le sujet (selle/cavalier) dans le tiers supérieur.
> Focal point mobile : `object-[center_top]` — remontée vers le haut pour garder le sujet visible sous le texte.
>
> `fetchpriority="high"` + `loading="eager"` sont obligatoires pour passer le seuil LCP < 2.5s. Ajouter aussi dans `useHead()` de `index.vue` :
> ```ts
> useHead({ link: [{ rel: 'preload', as: 'image', href: '/img/hero-desktop.webp' }] })
> ```

### 1.3 Overlay gradient

```html
<div
  class="absolute inset-0 bg-gradient-to-t from-cgws-tack/90 via-cgws-tack/40 to-cgws-tack/10"
  aria-hidden="true"
/>
```

Logique : le bas (zone texte) est opaque à 90% — lisibilité maximale. Le milieu laisse deviner l'image. Le haut (10%) laisse l'image respirer et communique la qualité photographique.

---

## 2. Couche contenu hero

### 2.1 Structure de la page `index.vue`

```vue
<template>
  <main>
    <HeroSection />
    <StatsBar />
    <!-- US-011, US-012 sections suivent -->
  </main>
</template>
```

### 2.2 Layout interne `HeroSection.vue`

```html
<section
  class="relative w-full h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden"
  aria-label="Accueil CGWS — Sellerie équestre western"
>
  <!-- Image + overlay (z-0, z-1) -->
  <!-- SaddleIllustration (z-[2]) -->
  <!-- Content (z-[10]) -->
  <!-- ScrollIndicator (z-[10]) -->
</section>
```

Stack z-index :

| Élément | z-index |
|---------|---------|
| Image fond | 0 (flow naturel avec `absolute inset-0`) |
| Gradient overlay | `z-[1]` |
| SaddleIllustration | `z-[2]` |
| Contenu texte + CTA | `z-[10]` |
| Scroll indicator | `z-[10]` |

### 2.3 Positionnement du contenu

```html
<div class="relative z-[10] h-full flex flex-col justify-end pb-16 md:pb-24 lg:justify-center lg:pb-0
            px-[clamp(1rem,4vw,2rem)] max-w-[1280px] mx-auto w-full">
  <!-- Eyebrow -->
  <!-- H1 -->
  <!-- Subtitle -->
  <!-- CTAs -->
</div>
```

Desktop (`lg:justify-center`) : le contenu est verticalement centré. Ce positionnement laisse la selle SVG occuper le tiers droit sans se superposer au texte.

Mobile (`justify-end pb-16`) : le contenu pousse vers le bas, la zone haute de l'image reste visible.

### 2.4 Eyebrow

```html
<p class="hero-eyebrow font-eyebrow text-[13px] text-cgws-rope uppercase tracking-[0.2em] mb-4 md:mb-5">
  Sellerie Équestre Western · Brèches, 37
</p>
```

Contraste `cgws-rope (#C8AB82, lum 0.457)` sur fond sombre effectif `cgws-tack/90` : 6.85:1 ✓ WCAG AA.
`cgws-copper` ne peut pas être utilisé pour ce texte sur fond sombre : contraste 3.6:1, insuffisant pour du texte de 13px.

### 2.5 Titre H1 (structure pour GSAP stagger)

Le titre est pré-découpé en spans de caractères dans le template. Les espaces sont rendus en `&nbsp;` pour le stagger (sinon GSAP les rate).

```html
<h1
  class="font-display uppercase leading-none text-cgws-cream
         text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px]
         mb-5 md:mb-7 max-w-[15ch] lg:max-w-[12ch]"
  aria-label="L'AUTHENTIQUE WESTERN À VOTRE PORTÉE"
>
  <!-- Générés par v-for dans le computed titleChars -->
  <!-- Chaque char dans un <span class="hero-letter inline-block"> -->
  <!-- Les espaces : <span class="hero-letter inline-block w-[0.3em]" aria-hidden="true"> -->
</h1>
```

Implémentation script :

```ts
const TITLE = "L'AUTHENTIQUE WESTERN À VOTRE PORTÉE"

const titleChars = computed(() =>
  TITLE.split('').map((char, i) => ({
    char: char === ' ' ? ' ' : char,
    isSpace: char === ' ',
    key: i,
  }))
)
```

Taille en rem sur chaque breakpoint (clamp acceptable comme alternative à multi-breakpoint) :
- 375px : 52px → 2 lignes, casse courte
- 768px : 80px
- 1024px : 96px
- 1440px : 108px — pas au-delà pour éviter le clip sur `max-w-[1280px]` container

### 2.6 Sous-titre

```html
<p
  class="hero-subtitle font-serif italic text-cgws-rope
         text-[17px] md:text-[19px] lg:text-[21px]
         leading-relaxed mb-8 md:mb-10 max-w-[45ch] md:max-w-[38ch]"
>
  Équipements authentiques pour cavaliers passionnés —
  neuf, occasion et consignation.
</p>
```

Contraste `cgws-rope` sur overlay sombre : 6.85:1 ✓.

### 2.7 CTAs

```html
<div class="hero-ctas flex flex-col sm:flex-row gap-3 sm:gap-4">
  <CgwsButton
    as="NuxtLink"
    to="/catalogue"
    variant="primary"
    size="md"
    class="w-full sm:w-auto"
  >
    Découvrir le catalogue
  </CgwsButton>

  <CgwsButton
    as="NuxtLink"
    to="/consignation"
    variant="outline-light"
    size="md"
    class="w-full sm:w-auto"
  >
    Service consignation
  </CgwsButton>
</div>
```

**Nouveau variant `outline-light` requis dans `CgwsButton.vue`** (à ajouter par le développeur) :

```ts
// Dans variantClasses de CgwsButton.vue
'outline-light':
  'bg-transparent text-cgws-rope border-2 border-cgws-rope font-sans font-semibold uppercase tracking-wide ' +
  'hover:bg-cgws-rope/10 hover:text-cgws-cream active:bg-cgws-rope/20 focus-visible:ring-cgws-copper',
```

Contraste `outline-light` : `cgws-rope` sur fond sombre → 6.85:1 ✓. Au hover `cgws-cream` sur fond sombre → 13:1 ✓.

### 2.8 Scroll indicator

```html
<div
  class="hero-scroll-indicator absolute bottom-7 left-1/2 -translate-x-1/2 z-[10]
         flex flex-col items-center gap-1"
  aria-label="Défiler vers le bas"
  role="presentation"
>
  <span class="font-eyebrow text-[10px] text-cgws-rope/60 uppercase tracking-widest">Découvrir</span>
  <!-- Chevron SVG 16x24, stroke cgws-rope, strokeWidth 1.5 -->
  <svg width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
    <path d="M2 8 L8 14 L14 8" stroke="#C8AB82" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 14 L8 20 L14 14" stroke="#C8AB82" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  </svg>
</div>
```

Animation GSAP : `gsap.to('.hero-scroll-indicator', { y: 6, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })` — disparaît (opacity 0, duration 0.3) au premier scroll via `ScrollTrigger` `onEnter`.

---

## 3. SaddleIllustration SVG

### 3.1 Positionnement dans le hero

```html
<!-- Dans HeroSection.vue, avant la couche content -->
<div
  class="absolute z-[2]
         hidden md:block
         right-[6%] lg:right-[8%] xl:right-[10%]
         top-1/2 -translate-y-[55%]
         w-[200px] lg:w-[260px] xl:w-[300px]
         opacity-70 md:opacity-75"
  aria-hidden="true"
>
  <SaddleIllustration />
</div>
```

`hidden md:block` : la selle est masquée sur mobile (375px) pour ne pas concurrencer le texte. Elle apparaît à partir de 768px.

`-translate-y-[55%]` : légèrement au-dessus du centre vertical pour équilibrer visuellement avec le contenu textuel centré à gauche.

### 3.2 Géométrie SVG (guide pour le développeur)

`viewBox="0 0 220 310"` — portrait.

Anatomie de la selle western (3/4 gauche, légèrement de face) :

**1. Jupe gauche (left skirt)** — plus grande, plane, au premier plan
- Forme : quadrilatère arrondi, large et plat, ~180px de large × 140px de haut
- Positionnement : base de la selle, zone basse du SVG
- Fill : `#7B3B1C` (cgws-leather) · Stroke : `#1A0B03` 1.5px

**2. Jupe droite (right skirt)** — légèrement derrière, partiellement masquée
- Même forme décalée de +10px droite, fill légèrement plus sombre `#5A2B14`

**3. Corps de selle (seat)** — ellipse aplatie posée au-dessus des jupes
- Ellipse horizontale env. 140px de large × 55px de haut, centrée ~110px du haut
- Fill : gradient radial de `#7B3B1C` (bord) vers `#C8AB82` (centre illuminé, rope)
- Ce gradient simule la réflexion lumineuse sur le cuir tendu

**4. Pommel / arcade** — la partie avant relevée, en V aplati
- Deux courbes symétriques remontant de chaque côté du pommeau
- Fill : `#7B3B1C` · position : avant du corps de selle

**5. Corne (horn)** — élément distinctif western, PRIORITAIRE visuellement
- Tige cylindrique ~12px de large, ~35px de haut, sortant du pommeau
- Capuchon : ellipse en haut, légèrement évasée (plus large que la tige)
- Fill tige : `#7B3B1C` · Fill capuchon : `#B8650A` (cgws-copper)
- La corne en cuivre est le signe visuel immédiat "western" pour le visiteur non-initié

**6. Troussequin (cantle)** — dosseret arrière relevé
- Demi-arc derrière le siège, ~20px de haut
- Fill : `#7B3B1C`, légèrement en retrait

**7. Étriers (stirrups)** — oxbow style, larges et arrondis
- 2 rectangles à coins très arrondis, ~38px de large × 28px de haut
- Suspendus par des sangles (fenders) : rectangles étroits ~10px de large
- Fill étriers : `#B8650A` (cgws-copper) · Stroke : `#1A0B03` 1.5px

**8. Décoration toolée (skirt medallion)** — 1 concho sur chaque jupe
- Cercle ~16px, stroke `#B8650A` 1px, pas de fill, avec 8 petits points autour (tooling)
- Positionné au centre de la jupe gauche

**Résumé couleurs SVG** :

| Partie | Fill | Stroke |
|--------|------|--------|
| Jupes, corps, pommel, cantle | `#7B3B1C` | `#1A0B03` 1.5px |
| Seat center (highlight) | `#C8AB82` via gradient radial | — |
| Corne (capuchon), étriers | `#B8650A` | `#1A0B03` 1.5px |
| Jupe droite (arrière-plan) | `#5A2B14` | `#1A0B03` 1px |
| Concho décoratif (stroke only) | transparent | `#B8650A` 1px |

### 3.3 Animations GSAP de la selle

```ts
// Dans SaddleIllustration.vue, onMounted
const { gsap } = await import('gsap')

// Float principal — toute la selle oscille verticalement
gsap.to('.saddle-group', {
  y: -10,
  duration: 3,
  ease: 'sine.inOut',
  yoyo: true,
  repeat: -1,
})

// Micro-balancement de la corne — axe pivot en bas de la tige
gsap.to('.saddle-horn', {
  rotationZ: 1.5,
  transformOrigin: '50% 100%',
  duration: 4.5,
  ease: 'sine.inOut',
  yoyo: true,
  repeat: -1,
  delay: 0.5,
})

// Oscillation légère des étriers (synchronisée mais déphasée)
gsap.to('.saddle-stirrups', {
  rotationZ: 2,
  transformOrigin: '50% 0%',
  duration: 2.8,
  ease: 'sine.inOut',
  yoyo: true,
  repeat: -1,
  delay: 0.8,
})
```

Tout le SVG est dans un `<g class="saddle-group">`. La corne est dans `<g class="saddle-horn">`. Les deux étriers partagent `<g class="saddle-stirrups">`.

Vérifier `window.matchMedia('(prefers-reduced-motion: reduce)')` avant de lancer les animations (pattern déjà utilisé dans `ConchoStat.vue` et `TagCard.vue`).

---

## 4. StatsBar

### 4.1 Données ConchoStat

```ts
// Dans StatsBar.vue
const stats = [
  { value: 250, suffix: '+', label: 'articles en stock',     animateOnVisible: true  },
  { value: 15,  suffix: '+', label: 'marques référencées',   animateOnVisible: true  },
  { value: '100%', suffix: undefined, label: 'passion équestre',   animateOnVisible: false },
  { value: 37,  suffix: '',  label: 'Brèches · Indre-et-Loire', animateOnVisible: true  },
]
```

`value: '100%'` est une string → `ConchoStat` ne lancera pas la counter animation (guard `typeof props.value !== 'number'`). Le `%` est inclus dans la string car sinon `suffix` s'ajouterait en double.

`value: 37` permet une counter animation 0→37 qui renforce l'impression "chiffres qui vivent".

### 4.2 Problème de contraste ConchoStat sur fond sombre

Le composant existant utilise `text-cgws-leather` pour le label (`#7B3B1C` lum 0.088) sur fond `cgws-tack` (`#3D1A06` lum 0.024) → contraste 1.86:1. Non conforme WCAG AA.

**Correction requise** : ajouter un prop `onDark?: boolean` à `ConchoStat.vue` qui change la classe du label de `text-cgws-leather` vers `text-cgws-rope` :

```ts
// Dans ConchoStat.vue
interface Props {
  value: number | string
  label: string
  suffix?: string
  animateOnVisible?: boolean
  onDark?: boolean  // nouveau
}
```

```html
<!-- Label dans le template -->
<span :class="[
  'font-eyebrow text-[10px] md:text-[11px] uppercase tracking-wider leading-tight text-center',
  onDark ? 'text-cgws-rope' : 'text-cgws-leather'
]">
```

Dans `StatsBar.vue`, passer `:onDark="true"` sur chaque `ConchoStat`.

Contraste `cgws-rope` sur `cgws-tack` : 6.85:1 ✓ WCAG AA.

### 4.3 Layout StatsBar

```html
<section
  class="bg-cgws-tack py-12 md:py-16"
  aria-label="Chiffres clés CGWS"
>
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 lg:gap-8">
      <ConchoStat
        v-for="stat in stats"
        :key="stat.label"
        :value="stat.value"
        :suffix="stat.suffix"
        :label="stat.label"
        :animate-on-visible="stat.animateOnVisible"
        :on-dark="true"
      />
    </div>
  </div>
</section>
```

Séparateur entre les stats (desktop uniquement) : une fine ligne verticale `border-r border-cgws-leather/30` sur les 3 premiers ConchoStat via `[&:not(:last-child)]:border-r` ou en CSS grid + pseudo-éléments. Optionnel — ne pas ajouter si cela complexifie inutilement.

---

## 5. Breakpoints

| Breakpoint | Hauteur hero | Titre | Image focus | Selle SVG | CTA layout | Stats grid |
|------------|-------------|-------|-------------|-----------|------------|------------|
| 375px | `100svh min-h-[600px]` | 52px | portrait, `object-[center_top]` | `hidden` | `flex-col w-full` | `grid-cols-2` |
| 640px (sm) | `100svh` | 68px | portrait→landscape | `hidden` | `flex-row` | `grid-cols-2` |
| 768px (md) | `100svh` | 80px | landscape, `object-[center_40%]` | `block w-[200px] opacity-70` | `flex-row` | `grid-cols-4` |
| 1024px (lg) | `100svh max-h-[900px]` | 96px | landscape | `w-[260px] opacity-75` | `flex-row` | `grid-cols-4` |
| 1440px (xl) | `max-h-[900px]` | 108px | landscape | `w-[300px] opacity-75` | `flex-row` | `grid-cols-4` |

---

## 6. Animations GSAP — Timeline complète

```ts
// Dans HeroSection.vue, onMounted()
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Guard prefers-reduced-motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

const ctx = gsap.context(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

  // 1. Eyebrow (apparaît en premier, rapide)
  tl.from('.hero-eyebrow', {
    opacity: 0,
    y: -8,
    duration: 0.5,
  }, 0)

  // 2. Stagger letter-by-letter sur H1 (commence à t=0.15s)
  tl.from('.hero-letter', {
    opacity: 0,
    y: 30,
    stagger: 0.035,   // 35ms par lettre → ~1.3s pour 36 chars
    duration: 0.45,
  }, 0.15)

  // 3. Sous-titre fade-in (délai 0.8s comme spécifié)
  tl.from('.hero-subtitle', {
    opacity: 0,
    y: 16,
    duration: 0.6,
  }, 0.8)

  // 4. CTAs slide up (délai 1.2s comme spécifié)
  tl.from('.hero-ctas', {
    opacity: 0,
    y: 24,
    duration: 0.5,
  }, 1.2)

  // 5. Selle SVG (glisse depuis la droite pendant que le titre apparaît)
  tl.from('.saddle-illustration-wrapper', {
    opacity: 0,
    x: 30,
    duration: 0.9,
    ease: 'power1.out',
  }, 0.4)

  // 6. Scroll indicator (apparaît en dernier)
  tl.from('.hero-scroll-indicator', {
    opacity: 0,
    duration: 0.4,
  }, 1.6)

  // 7. Scroll indicator bounce loop (après son apparition)
  gsap.to('.hero-scroll-indicator', {
    y: 6,
    duration: 1.2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    delay: 2,
  })

  // 8. Masquer le scroll indicator au premier scroll
  ScrollTrigger.create({
    start: 'top -80px',
    once: true,
    onEnter: () => {
      gsap.to('.hero-scroll-indicator', { opacity: 0, duration: 0.3, pointerEvents: 'none' })
    },
  })
})

// Cleanup
onUnmounted(() => ctx.revert())
```

### Stats counter — géré par ConchoStat

Le composant `ConchoStat` gère lui-même son animation ScrollTrigger via `animateOnVisible: true`. La `StatsBar` n'a pas besoin de GSAP supplémentaire. Le trigger existant dans `ConchoStat` est `start: 'top 85%'` — aucun changement nécessaire.

---

## 7. États

| État | Apparence |
|------|-----------|
| **Initial** (avant animation) | Tous les `.hero-letter`, `.hero-subtitle`, `.hero-ctas` en `opacity: 0` — GSAP les met en from invisible |
| **Chargement image** | La section garde sa hauteur (`h-[100svh]`) avec `bg-cgws-tack` comme fond de repli pendant que l'image charge — aucun layout shift |
| **Scroll partiel** | Le scroll indicator disparaît progressivement dès que le visiteur commence à scroller |
| **Hover CTA primary** | `bg-cgws-leather`, transition 150ms — défini dans `CgwsButton.vue` |
| **Hover CTA outline-light** | `bg-cgws-rope/10`, texte `cgws-cream` |
| **Focus CTA** | Ring `ring-cgws-copper ring-2 ring-offset-2` |
| **reduced-motion** | Toutes les animations GSAP et SVG sont skippées, contenu visible immédiatement |

---

## 8. Tailwind — Classes clés

### `HeroSection.vue`

```
section:     relative w-full h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden
img:         absolute inset-0 h-full w-full object-cover object-[center_top] md:object-[center_40%]
overlay:     absolute inset-0 z-[1] bg-gradient-to-t from-cgws-tack/90 via-cgws-tack/40 to-cgws-tack/10
content:     relative z-[10] h-full flex flex-col justify-end pb-16 md:pb-24 lg:justify-center lg:pb-0
             px-[clamp(1rem,4vw,2rem)] max-w-[1280px] mx-auto w-full
eyebrow:     font-eyebrow text-[13px] text-cgws-rope uppercase tracking-[0.2em] mb-4 md:mb-5
h1:          font-display uppercase leading-none text-cgws-cream
             text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px]
             mb-5 md:mb-7 max-w-[15ch] lg:max-w-[12ch]
subtitle:    font-serif italic text-cgws-rope text-[17px] md:text-[19px] lg:text-[21px]
             leading-relaxed mb-8 md:mb-10 max-w-[45ch] md:max-w-[38ch]
ctas:        flex flex-col sm:flex-row gap-3 sm:gap-4
scroll-ind:  absolute bottom-7 left-1/2 -translate-x-1/2 z-[10] flex flex-col items-center gap-1
```

### `SaddleIllustration.vue` (wrapper dans hero)

```
wrapper:  absolute z-[2] hidden md:block
          right-[6%] lg:right-[8%] xl:right-[10%]
          top-1/2 -translate-y-[55%]
          w-[200px] lg:w-[260px] xl:w-[300px]
          opacity-70 md:opacity-75
```

### `StatsBar.vue`

```
section:  bg-cgws-tack py-12 md:py-16
inner:    max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]
grid:     grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 lg:gap-8
```

---

## 9. Performance LCP

Checklist pour passer LCP < 2.5s :

- `<NuxtImg fetchpriority="high" loading="eager">` sur l'image hero
- `<link rel="preload" as="image" href="/img/hero-desktop.webp">` dans `useHead()` de `index.vue`
- Image WebP livré en 1920px max, quality 85 (poids cible < 300Ko)
- Image mobile 768px max, quality 80 (poids cible < 120Ko)
- Les fonts Bebas Neue et Playfair Display sont en `display: swap` + preload dans `nuxt.config.ts`
- `SaddleIllustration.vue` est un SVG inline → pas de requête réseau supplémentaire
- GSAP importé dynamiquement `await import('gsap')` dans `onMounted` → ne bloque pas l'hydratation

---

## 10. Accessibilité

| Critère | Implémentation |
|---------|---------------|
| Heading structure | `<h1>` unique sur la page pour le titre hero — ne pas mettre de H1 ailleurs sur `index.vue` |
| Image fond | `alt=""` sur `<NuxtImg>` (décorative — le texte hero porte le sens) |
| Aria section hero | `<section aria-label="Accueil CGWS — Sellerie équestre western">` |
| Aria stats | `<section aria-label="Chiffres clés CGWS">` sur `StatsBar` |
| ConchoStat | `role="img" aria-label="250+ articles en stock"` — déjà implémenté dans le composant existant, lit la valeur finale (pas les valeurs intermédiaires du compteur). Pas besoin d'`aria-live`. |
| H1 screen reader | `aria-label="L'AUTHENTIQUE WESTERN À VOTRE PORTÉE"` sur le `<h1>` pour que les spans de caractères n'émettent pas de bruit. Les `.hero-letter` spans peuvent avoir `aria-hidden="true"`. |
| CTAs | `<NuxtLink>` natif — sémantique `<a>` correcte, pas besoin d'aria-role |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2` sur les deux CTA via `CgwsButton.vue` |
| Scroll indicator | `role="presentation"` — purement décoratif, masqué aux lecteurs d'écran |
| SVG selle | `aria-hidden="true"` sur tout `<SaddleIllustration>` — décoratif |
| Reduced motion | Guard `window.matchMedia('(prefers-reduced-motion: reduce)')` sur TOUTES les animations (hero timeline, selle float, scroll indicator bounce) |
| Contraste texte | Voir table ci-dessous |

### Table des contrastes

| Élément | Couleur texte | Fond effectif | Ratio | WCAG |
|---------|--------------|---------------|-------|------|
| Eyebrow | `cgws-rope #C8AB82` lum 0.457 | overlay sombre ≈ `cgws-tack` lum 0.024 | 6.85:1 | AA ✓ |
| H1 | `cgws-cream #FAF3E3` lum 0.912 | overlay sombre ≈ `cgws-tack` lum 0.024 | 13.0:1 | AA ✓ |
| Sous-titre | `cgws-rope #C8AB82` lum 0.457 | overlay sombre | 6.85:1 | AA ✓ |
| CTA primary (texte) | `cgws-charcoal #1A0B03` lum 0.008 | `cgws-copper #B8650A` lum 0.217 | 4.6:1 | AA ✓ |
| CTA outline-light (texte) | `cgws-rope #C8AB82` lum 0.457 | transparent sur fond sombre | 6.85:1 | AA ✓ |
| Stats valeur | `cgws-copper #B8650A` lum 0.217 | `cgws-tack #3D1A06` lum 0.024 | 3.6:1 | AA large text ✓ (32px Bebas Neue) |
| Stats label (`onDark`) | `cgws-rope #C8AB82` lum 0.457 | `cgws-tack #3D1A06` lum 0.024 | 6.85:1 | AA ✓ |
