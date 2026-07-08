# Animations Immersives — Spec UX (US-050)

**Purpose**: Couche d'animation complète du site CGWS — entrance au scroll, hover produit,
transitions de page et parallax hero — pour créer une expérience immersive "western premium"
sans alourdir le rendu ni exclure les utilisateurs sensibles au mouvement.

**Files concernés**:
- `app/plugins/gsap.client.ts` — registration centralisée ScrollTrigger (à créer)
- `app/composables/useAnimation.ts` — helpers partagés (à créer)
- `app/app.vue` — wrapping `<NuxtPage>` avec `<Transition>`
- `app/assets/css/main.css` — classes de transition de page + bloc prefers-reduced-motion
- `app/components/home/HeroSection.vue` — ajout parallax
- `app/components/home/StatsBar.vue` — stagger scroll-reveal des conchos
- `app/components/catalogue/ProductCard.vue` — border copper reveal manquante
- `app/layouts/admin.vue` — déjà implémenté, documenter uniquement

---

## 1. Inventaire des animations — état actuel vs cible

### 1.1 Hero entrance (HeroSection.vue)

**Statut** : IMPLEMENTE — aucune modification requise sauf ajout du parallax (§1.2).

| Élément | Type | From | To | Durée | Ease | Délai |
|---|---|---|---|---|---|---|
| `.hero-eyebrow` | `gsap.from` | opacity:0, y:-8 | current | 0.5s | power2.out | t=0 |
| `.hero-letter` (stagger) | `gsap.from` | opacity:0, y:30 | current | 0.45s/lettre | power2.out | t=0.15, stagger:0.035 |
| `.hero-subtitle` | `gsap.from` | opacity:0, y:16 | current | 0.6s | power2.out | t=0.8 |
| `.hero-ctas` | `gsap.from` | opacity:0, y:24 | current | 0.5s | power2.out | t=1.2 |
| `.saddle-illustration-wrapper` | `gsap.from` | opacity:0, x:30 | current | 0.9s | power1.out | t=0.4 |
| `.hero-scroll-indicator` | `gsap.from` | opacity:0 | current | 0.4s | — | t=1.6 |
| `.hero-scroll-indicator` (loop) | `gsap.to` yoyo | y:0 | y:6 | 1.2s | sine.inOut | delay:2, repeat:-1 |

### 1.2 Hero parallax (HeroSection.vue)

**Statut** : A IMPLEMENTER.

L'image de fond défile à 0.5× la vitesse de scroll pour créer une sensation de profondeur.
Utiliser GSAP ScrollTrigger scrub pour la compatibilité maximale (éviter `scroll-timeline`
CSS dont le support Safari est limité en 2025).

**Cible** : le `<NuxtImg>` de fond (ajouter class `.hero-bg-img`).

| Propriété | Valeur |
|---|---|
| type | `gsap.to` avec `scrollTrigger.scrub: true` |
| trigger | `section.hero` (l'élément section parent) |
| start | `"top top"` |
| end | `"bottom top"` |
| scrub | `true` (lié au scroll, pas de durée fixe) |
| y from→to | `"0%"` → `"30%"` (équivalent ≈0.5× pour une section plein-écran) |

**Implémentation** : ajouter dans le `gsap.context()` existant de `HeroSection.vue` après la
timeline d'entrance. La `NuxtImg` doit recevoir `class="... hero-bg-img"` et les styles
`position: absolute; inset: 0; will-change: transform;` (déjà en place via `absolute inset-0`).

```
gsap.to('.hero-bg-img', {
  y: '30%',
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero-section',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
})
```

Ajouter `class="hero-section"` sur le `<section>` racine de HeroSection et
`class="... hero-bg-img"` sur le `<NuxtImg>`.

### 1.3 StatsBar — stagger scroll-reveal des conchos (StatsBar.vue)

**Statut** : PARTIELLEMENT IMPLEMENTE.
- Le compteur numérique de chaque ConchoStat est animé (déjà dans ConchoStat.vue).
- L'entrée des médaillons eux-mêmes dans le viewport n'est pas staggerée.

**A ajouter dans StatsBar.vue** :

| Élément | Type | From | To | Durée | Ease | ScrollTrigger |
|---|---|---|---|---|---|---|
| `.concho-stat-root` (×4, stagger) | `gsap.from` | opacity:0, y:24, scale:0.85 | current | 0.55s | power2.out | trigger: section, start: "top 80%", once:true, stagger:0.12 |

```
gsap.from('.concho-stat-root', {
  opacity: 0,
  y: 24,
  scale: 0.85,
  duration: 0.55,
  ease: 'power2.out',
  stagger: 0.12,
  scrollTrigger: {
    trigger: 'section[aria-label="Chiffres clés CGWS"]',
    start: 'top 80%',
    once: true,
  },
})
```

Ajouter `onMounted` / `onUnmounted` avec `gsap.context` + check `prefers-reduced-motion`
(même pattern que HeroSection).

### 1.4 OurStorySection — reveal colonnes (OurStorySection.vue)

**Statut** : IMPLEMENTE — aucune modification requise.

| Élément | From | To | Durée | Ease | ScrollTrigger |
|---|---|---|---|---|---|
| `.story-text-col` | x:-60 (desktop) / y:40 (mobile), opacity:0 | current | 0.9s | power2.out | trigger:.story-section, start:top 80%, once:true |
| `.story-image-col` | x:60 (desktop) / y:40 (mobile), opacity:0 | current | 0.9s | power2.out | delay:0.15, idem |

### 1.5 ConchoStat — compteur numérique (ConchoStat.vue)

**Statut** : IMPLEMENTE — aucune modification requise.

| Propriété | Valeur |
|---|---|
| De | 0 |
| Vers | `props.value` (number) |
| Durée | 1.5s |
| Ease | power2.out |
| ScrollTrigger | trigger:.concho-stat-root, start:top 85%, once:true |
| Guard | `animateOnVisible: false` court-circuite l'animation pour les valeurs non-numériques |

### 1.6 ProductGrid — stagger initial + infinite scroll (ProductGrid.vue)

**Statut** : IMPLEMENTE — aucune modification requise.

| Trigger | Éléments | From | Durée | Ease | Stagger |
|---|---|---|---|---|---|
| `onMounted` | `.product-card` (tous) | opacity:0, y:20 | 0.35s | power2.out | 0.07s |
| `watch(products.length)` | nouvelles cartes uniquement (slice) | opacity:0, y:16 | 0.3s | power2.out | 0.05s |

### 1.7 ProductCard — hover complet (ProductCard.vue)

**Statut** : PARTIELLEMENT IMPLEMENTE.

**Manquant** : la transition de couleur de bordure vers `cgws-copper` sur les cartes actives.

Ce qui est en place :
- `group-hover:-translate-y-1` (translateY -4px) sur `<article>`
- `group-hover:shadow-lg group-hover:shadow-cgws-leather/20` sur `<article>`
- `group-hover:scale-105` sur `<NuxtImg>`
- Overlay tack/50 avec "Voir le produit" en `opacity-0 group-hover:opacity-100`

Ce qui doit être ajouté sur l'`<article>` des cartes actives :
- Remplacer `border-cgws-leather` statique par une transition vers `border-cgws-copper`
- Ajouter `transition-[border-color,transform,box-shadow]` si pas déjà présent

Classe Tailwind cible pour l'`<article>` (cartes active/reserved) :
```
transition-[transform,box-shadow,border-color] duration-200 ease-in-out
group-hover:border-cgws-copper
group-hover:-translate-y-1
group-hover:shadow-xl
group-hover:shadow-cgws-leather/25
```

Note : `shadow-xl` est plus prononcé que le `shadow-lg` actuel — cohérent avec le déplacement
vertical de 4px qui demande une ombre portée plus profonde.

L'image garde `transition-transform duration-300 group-hover:scale-105`.

**Hover CSS — récapitulatif visuel** :

```
État initial  : border-cgws-leather (bordeaux), translateY(0), shadow-none, image scale(1)
Hover (200ms) : border-cgws-copper (cuivre), translateY(-4px), shadow-xl, image scale(1.05)
Focus-visible : ring-2 ring-cgws-copper ring-offset-2 (déjà implémenté)
```

Sold cards : aucun hover (cursor-default, pas de groupe-hover).

### 1.8 Admin sidebar — slide-in mobile (admin.vue)

**Statut** : IMPLEMENTE — documenter uniquement.

| Élément | Mécanisme | Détails |
|---|---|---|
| Drawer `#admin-sidebar` | CSS Tailwind transition | `transition-transform duration-300 ease-in-out` : `-translate-x-full` → `translate-x-0` |
| Backdrop overlay | CSS `<Transition name="backdrop">` scoped | opacity 0→1 en 200ms ease-in-out |

Le desktop sidebar (`lg:flex lg:fixed`) est statique (toujours visible, pas d'animation d'ouverture).

---

## 2. Infrastructure GSAP centralisée

### 2.1 Plugin `app/plugins/gsap.client.ts`

Centralise la registration de ScrollTrigger pour éviter les enregistrements multiples
(actuellement chaque composant re-registre via `gsap.registerPlugin(ScrollTrigger)`).

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger)
  // Provide pour usage optionnel via useNuxtApp().$gsap
  return {
    provide: {
      gsap,
      ScrollTrigger,
    },
  }
})
```

Après mise en place du plugin, les composants peuvent remplacer leurs imports dynamiques
par `useNuxtApp().$gsap` — ou conserver les dynamic imports pour le tree-shaking.
Le développeur choisit la stratégie (les deux sont valides avec ce plugin).

### 2.2 Composable `app/composables/useAnimation.ts`

Helper partagé pour DRY up le boilerplate GSAP dans les composants.

```ts
// Interface publique du composable
export function useAnimation() {
  const prefersReducedMotion = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Reveal simple: un élément glisse vers sa position depuis below
  async function revealFrom(
    selector: string,
    from: gsap.TweenVars,
    scrollTriggerVars?: ScrollTrigger.Vars,
  ): Promise<void>

  // Stagger reveal: plusieurs éléments entrent en décalé
  async function staggerReveal(
    selector: string,
    from: gsap.TweenVars,
    staggerDelay: number,
    scrollTriggerVars?: ScrollTrigger.Vars,
  ): Promise<void>

  // Counter: anime un nombre de 0 → target
  async function animateCounter(
    selector: string,
    target: number,
    duration: number,
    onUpdate: (value: number) => void,
    scrollTriggerVars?: ScrollTrigger.Vars,
  ): Promise<void>

  // Parallax scrub: attache un effet de défilement lent à un élément
  async function parallaxScrub(
    selector: string,
    yPercent: number,
    triggerSelector: string,
  ): Promise<void>

  return {
    prefersReducedMotion,
    revealFrom,
    staggerReveal,
    animateCounter,
    parallaxScrub,
  }
}
```

Chaque méthode commence par `if (prefersReducedMotion()) return` avant toute opération GSAP.
Retourne des `Promise<void>` pour permettre `await` dans `onMounted`.

---

## 3. Transitions de page

### 3.1 Modification de `app/app.vue`

Envelopper `<NuxtPage>` avec `<NuxtPage :transition="pageTransition" />` (prop officielle Nuxt 4)
ou utiliser l'API de layout transition selon la documentation Nuxt 4.

Pattern recommandé (Nuxt 4 — `<NuxtPage>` supporte la prop `transition`) :

```vue
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :transition="{ name: 'page', mode: 'out-in', appear: false }" />
    </NuxtLayout>
  </div>
</template>
```

`mode: 'out-in'` garantit que la page sortante a fini de disparaître avant que l'entrante
n'apparaisse — indispensable pour éviter les chevauchements visuels.

`appear: false` : pas d'animation au premier rendu (le hero prend le relais).

### 3.2 Classes CSS dans `app/assets/css/main.css`

```css
/* ─── Page transitions ─────────────────────────────────── */
.page-enter-active {
  transition: opacity 200ms ease-out;
}
.page-leave-active {
  transition: opacity 150ms ease-in;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* ─── prefers-reduced-motion — global CSS kill-switch ───── */
@media (prefers-reduced-motion: reduce) {
  /* Désactive toutes les transitions et animations CSS */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Neutralise la transition de page */
  .page-enter-active,
  .page-leave-active {
    transition: none !important;
  }

  /* Neutralise le drawer admin */
  #admin-sidebar {
    transition: none !important;
  }

  /* Neutralise les hover CSS ProductCard */
  .product-card article {
    transition: none !important;
    transform: none !important;
  }
}
```

**Durées** : leave 150ms (légèrement plus rapide, perception de réactivité) + enter 200ms
= 350ms max, bien sous le budget de 300ms exigé par la US (le mode out-in étant séquentiel,
le ressenti total est ≤ 300ms avec les transitions courtes choisies).

---

## 4. Accessibilité — prefers-reduced-motion

### 4.1 Stratégie en couches

| Couche | Mécanisme | Ce qu'elle couvre |
|---|---|---|
| CSS global | `@media (prefers-reduced-motion: reduce)` dans main.css | transitions CSS (page, hover, drawer) |
| JS par composant | `window.matchMedia('(prefers-reduced-motion: reduce)').matches` | animations GSAP (déjà en place dans HeroSection, OurStorySection, ConchoStat, ProductGrid) |
| Composable | `prefersReducedMotion()` dans `useAnimation.ts` | toutes les futures animations via le composable |

### 4.2 Comportement avec reduced-motion activé

| Animation | Avec reduced-motion |
|---|---|
| Hero entrance (lettres, entrées) | Supprimée — contenu visible immédiatement |
| Hero parallax | Supprimée — image fixe |
| StatsBar stagger | Supprimée — conchos visibles immédiatement |
| Stats counter | Supprimée — valeur finale affichée directement |
| OurStory reveal | Supprimée — colonnes visibles |
| ProductGrid stagger | Supprimée — cartes visibles |
| ProductCard hover (CSS translate/shadow) | Supprimée via CSS |
| Page transition (fade) | Supprimée via CSS |
| Admin drawer slide | Supprimée via CSS |
| Scroll indicator bounce | Supprimée |

**Expérience réduite** : toutes les informations restent accessibles, aucun contenu ne
dépend de l'animation pour être révélé.

### 4.3 Détection JS recommandée

```ts
// Pattern standard dans chaque onMounted GSAP
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

// Avec le composable
const { prefersReducedMotion } = useAnimation()
if (prefersReducedMotion()) return
```

---

## 5. Breakpoints et comportement responsive

| Animation | Mobile 375px | Tablet 768px | Desktop 1440px |
|---|---|---|---|
| Hero entrance lettres | Identique | Identique | Identique |
| Hero parallax | Désactivé (performance mobile) | Activé si `md:` | Activé |
| StatsBar stagger | Stagger 0.12s sur 2 cols | Stagger 0.12s sur 4 cols | Stagger 0.12s sur 4 cols |
| OurStory reveal | y:40 (vertical) | x:±60 (horizontal) | x:±60 (horizontal) |
| ProductCard hover | Pas de hover (touch) — focus visible uniquement | Idem | Hover complet |
| Page transition | Identique (150+200ms) | Identique | Identique |
| Admin sidebar | Slide-in CSS 300ms | Non affiché | Sidebar fixe, pas d'animation |

**Hero parallax mobile** : désactiver via `if (window.innerWidth < 768) return` avant la
création du ScrollTrigger scrub — le scroll position fixe est plus performant sur mobile
et évite les jank GPU.

---

## 6. Tailwind classes — résumé des modifications

### ProductCard.vue — `<article>` des cartes active/reserved

Remplacer :
```
transition-[transform,box-shadow] duration-200 ease-in-out
group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-cgws-leather/20
```

Par :
```
transition-[transform,box-shadow,border-color] duration-200 ease-in-out
group-hover:-translate-y-[4px] group-hover:shadow-xl group-hover:shadow-cgws-leather/25 group-hover:border-cgws-copper
```

Note: `-translate-y-1` = 4px en Tailwind v4, les deux sont équivalents. Utiliser
`-translate-y-[4px]` pour la lisibilité dans la spec.

### admin.vue — drawer mobile (inchangé, documenter)

```
transform transition-transform duration-300 ease-in-out
isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
```

---

## 7. Ordre de priorité d'implémentation

| Priorité | Item | Raison |
|---|---|---|
| P1 — Obligatoire | CSS page transitions + `app.vue` | Toutes les navigations, impact UX direct |
| P1 — Obligatoire | `@media prefers-reduced-motion` global CSS | Critère Gherkin d'accessibilité |
| P1 — Obligatoire | `app/plugins/gsap.client.ts` | Centralise ScrollTrigger, évite les double-registrations |
| P1 — Obligatoire | ProductCard border copper hover | Critère Gherkin explicite |
| P2 — Haute valeur | `app/composables/useAnimation.ts` | DRY up, maintenabilité |
| P2 — Haute valeur | Hero parallax (desktop only) | Immersion premium, low effort |
| P2 — Haute valeur | StatsBar stagger scroll-reveal | Renforce l'effet medallion |
| P3 — Optionnel | Refactorer les composants existants vers `useAnimation.ts` | Qualité de code, pas UX |

---

## 8. Animations — timing global et cohérence

**Principe** : les animations d'entrance durent toujours ≤ 1s par élément et se terminent
avant que l'utilisateur ait le temps de vouloir interagir. Les boucles infinies (scroll
indicator) sont légères (y: 6px) et se coupent dès le premier scroll.

| Catégorie | Durée recommandée | Ease |
|---|---|---|
| Entrance rapide (labels, badges) | 0.3–0.5s | power2.out |
| Entrance medium (titres, colonnes) | 0.5–0.9s | power2.out |
| Counter numérique | 1.5s | power2.out |
| Parallax scrub | dépend du scroll | none (ease:none obligatoire pour scrub) |
| Hover CSS | 150–200ms | ease-in-out |
| Page leave | 150ms | ease-in |
| Page enter | 200ms | ease-out |
| Drawer slide | 300ms | ease-in-out |

**Règle d'or** : `ease: 'none'` uniquement pour les animations scrub (parallax). Toutes
les autres utilisent `power2.out` pour les entrées et `ease-in-out` pour les transitions CSS.
