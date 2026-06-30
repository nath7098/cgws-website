# AppHeader + MobileMenu — Spec UX (US-014)

**Purpose**: Navigation principale persistante sur toutes les pages publiques. Sur desktop, sticky header transparent puis flouté au scroll. Sur mobile, hamburger ouvrant un drawer depuis la droite — premier contact visuel avec la marque à chaque chargement de page.

**Locations**:
- `app/components/layout/AppHeader.vue` — composant principal (remplace le placeholder existant)
- `app/components/layout/MobileMenu.vue` — drawer mobile (nouveau composant)
- `app/composables/useScrollHeader.ts` — détection scroll pour l'état opaque/blur

---

## Composants réutilisés (design system existant)

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `CgwsButton` | `ui/CgwsButton.vue` | CTA "Consigner une selle" (variant primary, size sm) dans le drawer |
| `USlideover` | Nuxt UI v4 | Shell du drawer mobile — gère focus trap, ARIA dialog, Escape, clic extérieur |
| `UIcon` | Nuxt UI v4 | `i-lucide-menu`, `i-lucide-x`, `i-lucide-phone`, `i-lucide-mail`, `i-lucide-chevron-right` |

> Note: `USlideover` est utilisé avec `:transition="false"` — GSAP prend en charge l'intégralité de l'animation slide-in/out. USlideover conserve néanmoins le focus trap (Reka UI Dialog) et les rôles ARIA.

---

## Logotype CGWS

Rendu purement typographique — aucun fichier SVG séparé à ce stade. Deux lignes empilées formant un monogramme de marque :

```
CGWS
Sellerie · Brèches
```

- Ligne 1 : "CGWS" — Bebas Neue 400, `text-[28px]` desktop / `text-[24px]` mobile, `text-cgws-copper`, `tracking-[0.2em]`, `leading-none`, `uppercase`
- Ligne 2 : "Sellerie · Brèches" — Inter 400, `text-[9px]`, `text-cgws-rope`, `tracking-[0.25em]`, `leading-none`, `uppercase` — `aria-hidden="true"` (décoratif, déjà couvert par l'`aria-label` du lien parent)
- Interaction : au hover sur le lien, ligne 1 passe en `text-cgws-rope`, ligne 2 en `text-cgws-copper/70` — `transition-colors duration-150`
- Le NuxtLink wrapper est un groupe (`group`) avec `aria-label="CGWS — Retour à l'accueil"`

---

## Layout ASCII

### Desktop 1440px

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ px-[var(--container-px)]                               max-w-[1280px] centré     │
│                                                                                  │
│  CGWS              Catalogue  Consignation  À Propos  Contact   [📞]             │
│  Sellerie · Brèches                                                              │
│                                                                                  │
│  ← logo (NuxtLink)                                               nav + actions → │
└──────────────────────────────────────────────────────────────────────────────────┘
  fond : bg-cgws-tack (default) | bg-cgws-tack/90 backdrop-blur-md (scrolled)
  hauteur : h-16 (64px) · sticky top-0 z-50
```

### Tablet 768px–1023px

```
┌────────────────────────────────────────────────────────────────┐
│  CGWS                                                     [≡]  │
│  Sellerie · Brèches                                            │
└────────────────────────────────────────────────────────────────┘
  Hamburger visible — nav liens masqués — même scroll behavior
  hauteur : h-16 · px-6
```

### Mobile 375px

```
┌──────────────────────────────────────────┐
│  CGWS                               [≡]  │
│  Sellerie · Brèches                      │
└──────────────────────────────────────────┘
  hauteur : h-14 (56px) · px-4
  Cible tactile hamburger : 44×44px minimum
```

### Drawer mobile — état ouvert

```
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░┌───────────────────────────────┐
  ░ backdrop cgws-tack/60 blur-sm ░░░│  CGWS                     [✕] │ ← h-14, border-b leather/30
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                               │
  ░  (tap outside → fermeture)    ░░░│  Catalogue               [›]  │ ← py-4 px-5, border-b leather/20
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Consignation            [›]  │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  À Propos                [›]  │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Contact                 [›]  │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                               │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ────────── ◉ ──────────      │ ← concho-divider
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                               │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  📞 02 47 XX XX XX            │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ✉ contact@cgws.fr            │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                               │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  [ CONSIGNER UNE SELLE ]      │ ← CgwsButton primary sm, w-full
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                               │
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░└───────────────────────────────┘
                                      ← w-[85vw] max-w-[340px] · fond bg-cgws-tack
```

---

## Breakpoints

### Mobile 375px
- Hauteur header : `h-14` (56px)
- Logo : Bebas Neue `text-[24px]`, tagline `text-[9px]`
- Hamburger visible (`flex lg:hidden`), nav desktop masquée (`hidden lg:flex`)
- Padding horizontal : `px-4`
- Cible tactile hamburger : `w-11 h-11` (44×44px) avec `-mr-2.5` pour compensation optique

### Tablet 768px
- Hauteur header : `h-16` (64px)
- Hamburger encore visible (seuil est `lg:` = 1024px)
- Padding horizontal : `px-6`
- Drawer identique à mobile

### Desktop 1024px (`lg:`)
- Hauteur header : `h-16` (64px)
- Nav liens visibles horizontalement, hamburger masqué
- Gap entre liens : `gap-8`
- Icône téléphone apparaît à droite des liens nav
- Padding : `px-8`

### Desktop 1440px
- Container centré max-w `[var(--container-max)]` = 1280px
- Padding via `var(--container-px)` = `clamp(1rem, 4vw, 2rem)`
- Espace aéré grâce au `justify-between` sur le header

---

## États

### Header — Default (scroll = 0px)

```
bg-cgws-tack
border-b border-cgws-leather/30
```

Fond plein `cgws-tack` (#3D1A06), pas de blur, bordure inférieure discrète.

### Header — Scrolled (scroll > 50px)

```
bg-cgws-tack/90
backdrop-blur-md
border-b border-cgws-leather/50
shadow-lg shadow-cgws-charcoal/20
```

Légère transparence sur le fond, blur backdrop (16px), ombre subtile, bordure légèrement plus visible. Transition : `transition-all duration-300 ease-in-out` sur l'élément `<header>`.

### Lien nav desktop — Default

```
font-sans text-sm font-medium text-cgws-rope
```

### Lien nav desktop — Hover

```
text-cgws-copper
transition-colors duration-150
```

### Lien nav desktop — Active (route courante)

```
text-cgws-copper
```

Appliquer via `active-class="text-cgws-copper"` sur `NuxtLink`. Pas d'indicateur underline — la couleur copper seule suffit (minimalisme premium). `aria-current="page"` ajouté manuellement via `useRoute()`.

### Hamburger — Default

```
text-cgws-rope
```

### Hamburger — Hover / Focus

```
text-cgws-copper
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:rounded-sm
```

Icône bascule entre `i-lucide-menu` (fermé) et `i-lucide-x` (ouvert) avec `transition-transform duration-200`.

### Icône téléphone (desktop)

```
text-cgws-rope hover:text-cgws-copper
transition-colors duration-150
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:rounded-sm
```

Sur hover desktop : tooltip natif via attribut `title="02 47 XX XX XX"`. Pas de tooltip custom JS — le natif suffit et reste accessible.

### Drawer — Fermé

Non rendu visuellement, mais USlideover maintient le DOM (`:unmount-on-hide="true"` par défaut — le contenu est démonté).

### Drawer — Ouvert

Fond panel `bg-cgws-tack`, largeur `w-[85vw] max-w-[340px]`, hauteur `h-full`. Les 15% restants forment l'affordance de fermeture par tap extérieur.

### Liens drawer — Default

```
text-cgws-rope font-sans text-lg font-medium
```

### Liens drawer — Hover

```
text-cgws-copper bg-cgws-leather/10
```

### Liens drawer — Active

```
text-cgws-copper
```

### Focus (keyboard)

Ring : `ring-2 ring-cgws-copper ring-offset-2 ring-offset-cgws-tack` sur tous les éléments interactifs. Visible sur fond sombre du header.

---

## Tailwind classes (clés)

### `<header>` — élément racine

```
sticky top-0 z-50 h-16
flex items-center justify-between
transition-all duration-300 ease-in-out
border-b
```

Classes conditionnelles (`:class` binding) :

```
// Default
bg-cgws-tack border-cgws-leather/30

// Scrolled
bg-cgws-tack/90 backdrop-blur-md border-cgws-leather/50 shadow-lg shadow-cgws-charcoal/20
```

Padding via style inline : `style="padding-left: var(--container-px); padding-right: var(--container-px);"`

### Logo — NuxtLink wrapper

```
group flex flex-col items-start gap-0
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm
```

### Logo — ligne 1

```
font-display text-[28px] leading-none uppercase tracking-[0.2em]
text-cgws-copper group-hover:text-cgws-rope
transition-colors duration-150
```

Mobile (`text-[24px]` via classe mobile-first + override desktop) :
```
text-[24px] lg:text-[28px]
```

### Logo — ligne 2

```
font-sans text-[9px] leading-none uppercase tracking-[0.25em] mt-0.5
text-cgws-rope group-hover:text-cgws-copper/70
transition-colors duration-150
```

### Nav desktop

```
hidden lg:flex items-center gap-8
```

### Lien nav desktop

```
font-sans text-sm font-medium text-cgws-rope
hover:text-cgws-copper transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm px-1 py-0.5
```

### Section actions droite

```
flex items-center gap-2
```

### Icône téléphone

```
hidden lg:flex items-center justify-center w-9 h-9
text-cgws-rope hover:text-cgws-copper transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm
```

### Bouton hamburger

```
lg:hidden flex items-center justify-center w-11 h-11 -mr-2.5
text-cgws-rope hover:text-cgws-copper transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:rounded-sm
```

### Drawer — panel USlideover (via prop `ui`)

```
// ui.content
bg-cgws-tack w-[85vw] max-w-[340px] h-full flex flex-col

// ui.overlay
bg-cgws-tack/60 backdrop-blur-sm
```

### Drawer — header

```
h-14 flex items-center justify-between px-5 flex-shrink-0
border-b border-cgws-leather/30
```

### Drawer — liens nav

```
flex items-center justify-between
py-4 px-5
border-b border-cgws-leather/20
font-sans text-lg font-medium text-cgws-rope
hover:text-cgws-copper hover:bg-cgws-leather/10
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-copper
```

### Concho-divider inline (entre nav et contact)

```
// wrapper
relative flex items-center mx-5 my-2

// lignes
flex-1 border-t border-cgws-leather/30

// médaillon
mx-3 w-5 h-5 rounded-full border-2 border-cgws-copper/60
flex items-center justify-center flex-shrink-0

// pivot central
w-1.5 h-1.5 rounded-full bg-cgws-copper/80
```

### Drawer — section contact

```
px-5 py-5 flex flex-col gap-3
```

Lien contact (téléphone / mail) :

```
flex items-center gap-3
text-cgws-rope hover:text-cgws-copper text-sm font-sans
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm
```

### Drawer — CTA footer

```
px-5 pb-8 mt-auto flex-shrink-0
```

`CgwsButton` variant `primary` size `sm` avec `class="w-full justify-center"`.

---

## Animations GSAP

Toutes les animations GSAP sont déclarées dans `onMounted()` et nettoyées dans `onUnmounted()`. `import gsap from 'gsap'` en tête du `<script setup>`.

### useScrollHeader.ts — détection scroll

```typescript
// Utilise @vueuse/core (déjà dans les dépendances)
import { useWindowScroll } from '@vueuse/core'
import { computed } from 'vue'

export function useScrollHeader(threshold = 50) {
  const { y } = useWindowScroll()
  const isScrolled = computed(() => y.value > threshold)
  return { isScrolled }
}
```

La valeur `threshold` est 50px (défaut). La classe CSS `transition-all duration-300 ease-in-out` sur le `<header>` gère la transition visuelle — pas de GSAP nécessaire pour le scroll, Vue réactivité suffit.

### Drawer — ouverture (MobileMenu.vue)

Déclenchement : watcher sur `open` passant de `false` à `true`, dans `watch(open, (val) => { if (val) animateOpen() })`.

```javascript
function animateOpen() {
  // 1. Panel slide-in depuis la droite
  gsap.fromTo(panelRef.value,
    { xPercent: 100 },
    { xPercent: 0, duration: 0.35, ease: 'power2.out' }
  )

  // 2. Backdrop fade-in (concurrent)
  gsap.fromTo(backdropRef.value,
    { opacity: 0 },
    { opacity: 1, duration: 0.30, ease: 'none' }
  )

  // 3. Liens nav — stagger après le panel
  gsap.fromTo(navLinkRefs.value,
    { opacity: 0, x: 16 },
    {
      opacity: 1, x: 0,
      stagger: 0.06,
      delay: 0.15,
      duration: 0.22,
      ease: 'power1.out'
    }
  )
}
```

### Drawer — fermeture

Déclenchement : watcher sur `open` passant de `true` à `false`. La fermeture doit précéder le démontage — utiliser `emit('update:open', false)` uniquement après la fin de l'animation (callback `onComplete`).

```javascript
function animateClose(done: () => void) {
  gsap.to(navLinkRefs.value, {
    opacity: 0, x: 16,
    stagger: 0.03,
    duration: 0.15,
    ease: 'power1.in'
  })

  gsap.to(panelRef.value, {
    xPercent: 100,
    duration: 0.25,
    ease: 'power2.in',
    delay: 0.05,
    onComplete: done
  })

  gsap.to(backdropRef.value, {
    opacity: 0,
    duration: 0.20,
    ease: 'none'
  })
}
```

### Icône hamburger — bascule

Pas de GSAP. Transition CSS sur l'icône uniquement :

```
transition-transform duration-200
```

`v-if` / `v-else` sur `i-lucide-menu` (fermé) et `i-lucide-x` (ouvert). Vue gère le swap.

### Nettoyage

```javascript
onUnmounted(() => {
  gsap.killTweensOf([
    panelRef.value,
    backdropRef.value,
    ...(navLinkRefs.value ?? [])
  ])
})
```

---

## Accessibilité

### Header

- Élément `<header>` sémantique — rôle `banner` implicite, pas de `role` explicite nécessaire
- Skip link : premier enfant du `<header>`, ciblant `#main-content` (id à poser sur `<main>` dans le layout)

```html
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]
         focus:bg-cgws-copper focus:text-cgws-charcoal focus:px-3 focus:py-1
         focus:rounded-sm focus:font-sans focus:text-sm font-semibold"
>
  Aller au contenu principal
</a>
```

### Nav desktop

- `<nav aria-label="Navigation principale">` enveloppe les liens
- `aria-current="page"` sur le NuxtLink de la route active (via `useRoute()`)

### Bouton hamburger

```html
<button
  type="button"
  :aria-expanded="isMobileMenuOpen"
  :aria-label="isMobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'"
  aria-controls="mobile-menu"
>
  <UIcon ... aria-hidden="true" />
</button>
```

### Drawer (MobileMenu.vue — USlideover)

- USlideover via Reka UI Dialog injecte automatiquement : `role="dialog"`, `aria-modal="true"`
- Ajouter `id="mobile-menu"` sur l'élément panel pour correspondre à `aria-controls`
- `aria-label="Menu de navigation"` sur le dialog (prop `title` de USlideover ou via `aria-label` sur le content)
- Bouton fermeture : `aria-label="Fermer le menu"`
- Focus trap : géré par Reka UI — le focus est capturé dans le drawer à l'ouverture (premier focus sur le bouton fermeture), relâché à la fermeture (retour au bouton hamburger)
- Touche Escape : ferme le drawer — comportement natif Reka UI Dialog
- Clic extérieur : ferme via `dismissible: true` (défaut USlideover)
- Nav interne : `<nav aria-label="Navigation mobile">`

### Icône téléphone

```html
<a
  href="tel:+33247XXXXXX"
  aria-label="Appeler la boutique"
  title="02 47 XX XX XX"
>
  <UIcon name="i-lucide-phone" aria-hidden="true" />
</a>
```

Le `title` fournit le tooltip natif au hover sur desktop et le numéro pour les lecteurs d'écran qui lisent les `title` en complément de l'`aria-label`.

### Contrastes WCAG AA

| Foreground | Background | Ratio | Verdict |
|-----------|-----------|-------|---------|
| `cgws-rope` #C8AB82 | `cgws-tack` #3D1A06 | ~6.2:1 | AA Normal + Large |
| `cgws-copper` #B8650A | `cgws-tack` #3D1A06 | ~3.8:1 | AA Large text + UI components |
| `cgws-charcoal` #1A0B03 | `cgws-copper` #B8650A | ~5.1:1 | AA Normal + Large (texte CTA) |
| `cgws-rope` #C8AB82 | `cgws-tack/90` (avec blur) | ~5.6:1 | AA Normal (valeur conservée) |

> Le ratio `cgws-copper` / `cgws-tack` à 3.8:1 est conforme AA pour les composants UI (seuil 3:1) et pour le grand texte (Bebas Neue à 28px = large text). Non conforme AA pour le texte normal — éviter `cgws-copper` sur des textes body en-dessous de 18px non gras.

---

## Structure Vue — AppHeader.vue (squelette)

```vue
<script setup lang="ts">
import { useScrollHeader } from '~/composables/useScrollHeader'

const { isScrolled } = useScrollHeader(50)
const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const route = useRoute()
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 h-14 lg:h-16 flex items-center justify-between',
      'border-b transition-all duration-300 ease-in-out',
      isScrolled
        ? 'bg-cgws-tack/90 backdrop-blur-md border-cgws-leather/50 shadow-lg shadow-cgws-charcoal/20'
        : 'bg-cgws-tack border-cgws-leather/30',
    ]"
    style="padding-left: var(--container-px); padding-right: var(--container-px);"
  >
    <!-- Skip link -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]
             focus:bg-cgws-copper focus:text-cgws-charcoal focus:px-3 focus:py-1
             focus:rounded-sm focus:font-sans focus:text-sm font-semibold"
    >
      Aller au contenu principal
    </a>

    <!-- Logotype -->
    <NuxtLink
      to="/"
      class="group flex flex-col items-start gap-0
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm"
      aria-label="CGWS — Retour à l'accueil"
    >
      <span
        class="font-display text-[24px] lg:text-[28px] leading-none uppercase tracking-[0.2em]
               text-cgws-copper group-hover:text-cgws-rope transition-colors duration-150"
      >CGWS</span>
      <span
        class="font-sans text-[9px] leading-none uppercase tracking-[0.25em] mt-0.5
               text-cgws-rope group-hover:text-cgws-copper/70 transition-colors duration-150"
        aria-hidden="true"
      >Sellerie · Brèches</span>
    </NuxtLink>

    <!-- Nav desktop -->
    <nav class="hidden lg:flex items-center gap-8" aria-label="Navigation principale">
      <!-- NuxtLink répété pour chaque item — active-class="text-cgws-copper" -->
      <!-- Catalogue · Consignation · À Propos · Contact -->
    </nav>

    <!-- Actions droite -->
    <div class="flex items-center gap-2">
      <!-- Téléphone — desktop uniquement -->
      <a
        href="tel:+33247XXXXXX"
        class="hidden lg:flex items-center justify-center w-9 h-9
               text-cgws-rope hover:text-cgws-copper transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm"
        aria-label="Appeler la boutique"
        title="02 47 XX XX XX"
      >
        <UIcon name="i-lucide-phone" class="w-5 h-5" aria-hidden="true" />
      </a>

      <!-- Hamburger — mobile/tablet -->
      <button
        type="button"
        class="lg:hidden flex items-center justify-center w-11 h-11 -mr-2.5
               text-cgws-rope hover:text-cgws-copper transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:rounded-sm"
        :aria-expanded="isMobileMenuOpen"
        :aria-label="isMobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'"
        aria-controls="mobile-menu"
        @click="toggleMobileMenu"
      >
        <UIcon
          :name="isMobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
          class="w-5 h-5 transition-transform duration-200"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Drawer mobile -->
    <MobileMenu v-model:open="isMobileMenuOpen" />
  </header>
</template>
```

---

## Structure Vue — MobileMenu.vue (squelette)

```vue
<script setup lang="ts">
import gsap from 'gsap'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const panelRef = ref<HTMLElement | null>(null)
const backdropRef = ref<HTMLElement | null>(null)
const navLinkRefs = ref<HTMLElement[]>([])

const navLinks = [
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'Consignation', to: '/consignation' },
  { label: 'À Propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' },
]

function close() {
  emit('update:open', false)
}

// Animations GSAP — voir section dédiée ci-dessus
// watch(open, ...) pour déclencher animateOpen / animateClose

onUnmounted(() => {
  gsap.killTweensOf([panelRef.value, backdropRef.value, ...(navLinkRefs.value ?? [])])
})
</script>

<template>
  <USlideover
    :open="open"
    side="right"
    :transition="false"
    :ui="{
      content: 'bg-cgws-tack w-[85vw] max-w-[340px] h-full flex flex-col',
      overlay: 'bg-cgws-tack/60 backdrop-blur-sm'
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <!-- Le panel intérieur est référencé par panelRef pour GSAP -->

      <!-- Header drawer -->
      <div class="h-14 flex items-center justify-between px-5 flex-shrink-0 border-b border-cgws-leather/30">
        <span class="font-display text-[22px] leading-none uppercase tracking-[0.2em] text-cgws-copper">CGWS</span>
        <button
          type="button"
          class="w-10 h-10 flex items-center justify-center text-cgws-rope hover:text-cgws-copper
                 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm"
          aria-label="Fermer le menu"
          @click="close"
        >
          <UIcon name="i-lucide-x" class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 flex flex-col py-2 overflow-y-auto" aria-label="Navigation mobile">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          ref="navLinkRefs"
          class="flex items-center justify-between py-4 px-5 border-b border-cgws-leather/20
                 font-sans text-lg font-medium text-cgws-rope
                 hover:text-cgws-copper hover:bg-cgws-leather/10 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-copper"
          active-class="text-cgws-copper"
          @click="close"
        >
          {{ link.label }}
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-cgws-leather flex-shrink-0" aria-hidden="true" />
        </NuxtLink>
      </nav>

      <!-- Concho-divider -->
      <div class="relative flex items-center mx-5 my-1 flex-shrink-0">
        <div class="flex-1 border-t border-cgws-leather/30" />
        <div class="mx-3 w-5 h-5 rounded-full border-2 border-cgws-copper/60 flex items-center justify-center flex-shrink-0">
          <div class="w-1.5 h-1.5 rounded-full bg-cgws-copper/80" />
        </div>
        <div class="flex-1 border-t border-cgws-leather/30" />
      </div>

      <!-- Contact -->
      <div class="px-5 py-5 flex flex-col gap-3 flex-shrink-0">
        <a
          href="tel:+33247XXXXXX"
          class="flex items-center gap-3 text-cgws-rope hover:text-cgws-copper text-sm font-sans
                 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm"
          aria-label="Appeler la boutique"
        >
          <UIcon name="i-lucide-phone" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>02 47 XX XX XX</span>
        </a>
        <a
          href="mailto:contact@cgws.fr"
          class="flex items-center gap-3 text-cgws-rope hover:text-cgws-copper text-sm font-sans
                 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm"
          aria-label="Envoyer un email à la boutique"
        >
          <UIcon name="i-lucide-mail" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>contact@cgws.fr</span>
        </a>
      </div>

      <!-- CTA consignation -->
      <div class="px-5 pb-8 flex-shrink-0">
        <CgwsButton
          as="NuxtLink"
          to="/consignation"
          variant="primary"
          size="sm"
          class="w-full justify-center"
          @click="close"
        >
          Consigner une selle
        </CgwsButton>
      </div>
    </template>
  </USlideover>
</template>
```

---

## Notes d'implémentation

1. **Numéros réels** : Les valeurs `02 47 XX XX XX` et `contact@cgws.fr` sont des placeholders. Camille doit fournir ses coordonnées réelles avant la mise en production. Le développeur peut les stocker dans `nuxt.config.ts` sous `runtimeConfig.public` (pas d'env secrets nécessaires).

2. **Route `/a-propos`** : Cette page n'existe pas encore dans le sprint 1. Le lien doit être présent dans la nav avec `NuxtLink` — il renverra une 404 jusqu'à la création de la page. Ne pas utiliser de `<a>` statique.

3. **GSAP et USlideover** : USlideover remonte le `panelRef` intérieur uniquement quand `open` est `true`. Le `watch` sur `open` doit attendre le prochain tick (`nextTick`) avant d'animer pour que le DOM soit monté.

4. **overflow-y-auto sur la nav** : Sur des écrans très petits (375px × 568px), le drawer peut être plus court que son contenu. Le `flex-1 overflow-y-auto` sur la `<nav>` garantit le scroll interne sans affecter le CTA footer qui reste visible.

5. **Body scroll lock** : USlideover via Reka UI Dialog gère automatiquement le `overflow: hidden` sur le `<body>` pendant l'ouverture du drawer. Ne pas implémenter manuellement.
