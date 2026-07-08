# OurStorySection — Spec UX (US-011)

**Purpose**: Créer un lien humain et de confiance entre le visiteur et Camille/CGWS avant qu'il n'atteigne le catalogue. Après l'immersion spectaculaire du hero et la densité chiffrée de la StatsBar, cette section "atterrit" l'utilisateur dans quelque chose d'intime et d'authentique — une histoire, un visage, un lieu réel.
**Location**: `app/components/home/OurStorySection.vue`
**Position dans index.vue**: après `<StatsBar />`, avant la section catalogue preview (US-012)

---

## Composants réutilisés (design system existant)

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `CgwsButton` | `ui/CgwsButton.vue` | CTA "En savoir plus" — variant `secondary` |

Le concho divider est un élément inline décrit en section 7, à extraire ultérieurement en `ui/ConchoDivider.vue` si réutilisé.

---

## Layout ASCII

### Desktop 1280px

```
════════════════════════════════════════════════════════════════════════════════
  [CONCHO DIVIDER — rendu en fin de section, avant le prochain bloc]
  ── ── ── ── ── ── ── ── ── ●  ── ── ── ── ── ── ── ── ──
════════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│  bg-cgws-cream  ·  py-[clamp(3rem,8vw,6rem)]                               │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  TEXT COLUMN  (order-1)         │  │  IMAGE COLUMN  (order-2)       │   │
│  │  ← GSAP fade-in-left           │  │  GSAP fade-in-right →          │   │
│  │                                 │  │                                │   │
│  │  ┃ Notre Passion                │  │  ┌────────────────────────┐   │   │
│  │  border-l-2 copper · text-leather│  │  │                        │   │   │
│  │  font-eyebrow · 13px            │  │  │   NuxtImg portrait     │   │   │
│  │                                 │  │  │   aspect-[3/4]         │   │   │
│  │  L'histoire de                  │  │  │   object-cover center  │   │   │
│  │  Camille & CGWS                 │  │  │   rounded-lg           │   │   │
│  │  H2 · Playfair Bold             │  │  │   max-h-[540px]        │   │   │
│  │  44px · cgws-charcoal           │  │  │                        │   │   │
│  │                                 │  │  └────────────────────────┘   │   │
│  │  [Body text · ~150 mots         │  │                                │   │
│  │   Inter 400 · 16px              │  │                                │   │
│  │   leading-relaxed               │  │                                │   │
│  │   cgws-charcoal]                │  │                                │   │
│  │                                 │  │                                │   │
│  │  [En savoir plus →]             │  │                                │   │
│  │  CgwsButton secondary sm        │  │                                │   │
│  └─────────────────────────────────┘  └────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Tablet 768px

```
┌─────────────────────────────────────────────────────────┐
│  bg-cgws-cream  ·  py-16                                │
│                                                          │
│  ┌──────────────────────┐  ┌───────────────────────┐   │
│  │  TEXT COLUMN         │  │  IMAGE COLUMN         │   │
│  │                      │  │                       │   │
│  │  ┃ Notre Passion     │  │  ┌─────────────────┐  │   │
│  │                      │  │  │  NuxtImg        │  │   │
│  │  L'histoire de       │  │  │  aspect-[3/4]   │  │   │
│  │  Camille & CGWS      │  │  │  object-cover   │  │   │
│  │  H2 · 32px           │  │  └─────────────────┘  │   │
│  │                      │  │                       │   │
│  │  [Body text]         │  │                       │   │
│  │                      │  │                       │   │
│  │  [En savoir plus]    │  │                       │   │
│  └──────────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Mobile 375px

```
┌──────────────────────────────┐
│  bg-cgws-cream  ·  py-12 px-5│
│                              │
│  ┌──────────────────────────┐│
│  │  NuxtImg — portrait 4:5  ││  ← IMAGE EN PREMIER (order-1)
│  │  w-full · rounded-lg     ││
│  │  max-h-[380px]           ││
│  └──────────────────────────┘│
│                              │
│  ┃ Notre Passion              │  ← TEXT EN SECOND (order-2)
│  mt-8                        │
│                              │
│  L'histoire de               │
│  Camille & CGWS              │
│  H2 · 28px                   │
│                              │
│  [Corps du texte ~150 mots]  │
│  Inter · 15px · charcoal     │
│                              │
│  [En savoir plus →]          │
│  CgwsButton secondary sm     │
│                              │
└──────────────────────────────┘
```

---

## 1. Fond et transition de section

Cette section succède à `StatsBar` qui a un fond `bg-cgws-tack`. Le passage à `bg-cgws-cream` crée un contraste fort et perceptible qui signale au visiteur un changement de registre — des chiffres à l'humain. Aucun élément de transition supplémentaire n'est nécessaire au bord supérieur de la section.

Un **concho divider** est placé en **fin de section** (bas de `OurStorySection`, juste avant la clôture de `</section>`), sur fond `cgws-cream`, pour marquer la limite avec la section suivante (catalogue preview).

```html
<!-- Padding bottom de la section : pb-0 car le divider occupe visuellement l'espace -->
<section class="story-section bg-cgws-cream pt-[clamp(3rem,8vw,6rem)] pb-8 md:pb-12">
  <!-- contenu principal -->
  <!-- concho divider en bas -->
</section>
```

---

## 2. Ordre mobile — justification

**L'image apparaît en premier sur mobile** (`order-1`), le texte en second (`order-2`).

Raison : sur un écran de 375px, le visiteur vient de traverser le hero immersif et la barre de stats abstraite. L'image de Camille avec son cheval est le premier signal humain concret — un visage ou une présence crée un arrêt émotionnel immédiat avant que le regard ne descende vers le texte. Sur mobile, l'attention est scarce et le défilement rapide ; l'image "accroche" là où un paragraphe serait ignoré.

Sur desktop (`md:order-1` sur le texte, `md:order-2` sur l'image), on revient à la convention occidental de lecture : le texte (left) initie le récit, l'image (right) le confirme visuellement.

```html
<!-- Implémentation de l'inversion d'ordre -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
  <div class="story-text-col order-2 md:order-1"> ... </div>
  <div class="story-image-col order-1 md:order-2"> ... </div>
</div>
```

---

## 3. Image — description et placeholder

### 3.1 Image idéale (à fournir par Camille)

**Scène** : Camille de 3/4 face, main posée avec naturel sur l'encolure d'un quarter horse alezan ou bai. Lumière chaude de golden hour (fin d'après-midi). Arrière-plan : prairie de la Loire légèrement floue (bokeh doux), éventuellement une clôture de bois ou une grange ancienne. Tenue : jean, chemise en flanelle ou chambray, pas de chapeau obligatoire. Format idéal : portrait 3:4 ou 4:5.

**Ce qu'on évite** : pose marketing forcée, sourire figé, fond blanc studio.

### 3.2 Placeholder Unsplash

Deux options vérifiables par le développeur avant intégration (Unsplash modifie parfois ses IDs) :

**Option A** — femme avec cheval en extérieur :
```
https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=800&q=80&auto=format&fit=crop
```

**Option B** — recherche manuelle recommandée :
```
https://unsplash.com/s/photos/woman-horse-field-golden-hour
```
(filtrer sur orientations portrait, choisir une image avec lumière chaude et cadre rural)

**Attribution requise** : laisser le crédit Unsplash en commentaire dans le code pendant la phase placeholder ; supprimer à la mise en ligne de la vraie photo.

### 3.3 Implémentation NuxtImg

```vue
<div class="story-image-col order-1 md:order-2 relative">
  <div class="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)]">
    <NuxtImg
      src="/img/notre-histoire.webp"
      alt="Camille Guignon avec son cheval quarter horse en plein air — fondatrice de CGWS à Brèches, Indre-et-Loire"
      class="w-full h-full object-cover object-center aspect-[4/5] md:aspect-auto md:max-h-[540px]"
      :width="600"
      :height="750"
      loading="lazy"
      format="webp"
      quality="85"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  </div>
</div>
```

> `loading="lazy"` est correct ici — cette section est sous la fold. Contrairement au hero, pas besoin de `fetchpriority="high"`.
>
> `shadow-[0_8px_32px_rgba(61,26,6,0.12)]` — ombre brune légère qui ancre l'image dans la page sans border visible. RGB de cgws-tack (#3D1A06).

---

## 4. Eyebrow de section

### 4.1 Texte suggéré

```
Notre Passion
```

### 4.2 Traitement visuel et contrainte de contraste

`cgws-copper (#B8650A, luminance 0.217)` sur `cgws-cream (#FAF3E3, luminance 0.912)` donne un rapport de contraste de **3.6:1** — insuffisant pour du texte normal (<18pt non-gras) selon WCAG AA (seuil 4.5:1).

**Solution retenue** : le cuivre apparaît en tant qu'**accent décoratif** (bordure gauche `border-l-2 border-cgws-copper`) et le texte de l'eyebrow est en `text-cgws-leather (#7B3B1C)`, dont le contraste sur cream est **6.97:1** ✓ WCAG AA.

```html
<p class="story-eyebrow inline-flex items-center gap-3 mb-4 md:mb-5">
  <span
    class="block w-0.5 h-5 bg-cgws-copper flex-shrink-0"
    aria-hidden="true"
  ></span>
  <span class="font-eyebrow text-[13px] text-cgws-leather uppercase tracking-[0.2em]">
    Notre Passion
  </span>
</p>
```

> `font-eyebrow` = Rye 400 (classe configurée via `--font-eyebrow` dans tokens.css).
> Le `<span>` barre verticale copper est purement décoratif (`aria-hidden`), les assistants vocaux ne le lisent pas.

---

## 5. Titre H2

### 5.1 Texte suggéré

```
L'histoire de Camille & CGWS
```

### 5.2 Classes Tailwind

```html
<h2 class="story-title font-serif font-bold text-cgws-charcoal leading-tight
           text-[28px] md:text-[36px] lg:text-[44px]
           mb-5 md:mb-6 max-w-[20ch]">
  L'histoire de Camille&nbsp;&amp;&nbsp;CGWS
</h2>
```

> `max-w-[20ch]` : limite la largeur du H2 pour éviter une ligne unique trop longue sur desktop qui affaiblit l'impact visuel — force un retour à la ligne élégant.
>
> `&nbsp;&amp;&nbsp;` assure que le `&` ne se retrouve pas seul en début de ligne sur un retour automatique.
>
> Contraste `cgws-charcoal (#1A0B03, lum 0.008)` sur `cgws-cream (lum 0.912)` : **16.6:1** ✓✓ WCAG AAA.

---

## 6. Corps de texte — storytelling placeholder

> **TEXTE PLACEHOLDER — À PERSONNALISER PAR CAMILLE AVANT LA MISE EN LIGNE**
> Ce texte est un exemple de ton et de structure. Camille doit le relire, corriger les détails inexacts, et l'enrichir de ses propres mots. Environ 150 mots.

---

*Cavalière depuis l'enfance, Camille a grandi avec la passion du western dans le sang. C'est au cœur de l'Indre-et-Loire, à Brèches, qu'elle a décidé de transformer cette vocation en un vrai projet de vie : une boutique entièrement dédiée aux cavaliers western.*

*CGWS, c'est avant tout une sélection rigoureuse d'équipements authentiques — selles, brides, bottes et vêtements — choisis avec l'œil d'une cavalière exigeante. Chaque article neuf ou d'occasion passe entre les mains de Camille avant de rejoindre le catalogue.*

*Le service de consignation est né d'un besoin réel : offrir aux cavaliers une alternative fiable pour vendre leur matériel en toute confiance, sans les aléas des plateformes génériques.*

*Ici, on parle le même langage que vous — celui des selles qui sentent bon le cuir et des matins en selle dans la lumière de la Loire.*

---

```html
<!-- Balise dans le composant — le texte sera injecté dynamiquement ou en dur -->
<p class="story-body font-sans text-[15px] md:text-base text-cgws-charcoal
          leading-relaxed mb-6 md:mb-8 max-w-[52ch]">
  <!-- PLACEHOLDER — voir docs/design-specs/US-011 §6 -->
  Cavalière depuis l'enfance, Camille a grandi avec la passion du western
  dans le sang...
</p>
```

> `max-w-[52ch]` sur le corps de texte : limite la longueur de ligne à ~52 caractères pour un confort de lecture optimal (référence : l'ANSI recommande 45–75 caractères par ligne). Evite que le texte s'étale sur toute la demi-colonne desktop.

---

## 7. CTA "En savoir plus"

### 7.1 Variant choisi : `secondary`

Le variant `secondary` de `CgwsButton` utilise `cgws-denim` (#2C4A72) en contour et en texte. Sur fond `cgws-cream` :
- Contraste denim/cream : **(0.962)/(0.132) = 7.3:1** ✓ WCAG AA
- Sémantique : c'est une action secondaire d'exploration (pas d'achat) → `secondary` est correct selon la hiérarchie du design system

Le variant `primary` (copper/charcoal) est réservé aux CTAs d'achat ou de découverte catalogue — trop fort ici pour une section éditoriale.

```html
<CgwsButton
  as="NuxtLink"
  to="/a-propos"
  variant="secondary"
  size="sm"
  class="story-cta mt-2"
>
  En savoir plus
</CgwsButton>
```

> `size="sm"` — dans une section narrative, un bouton plus petit (`px-4 py-2 text-[14px]`) est plus discret et mieux proportionné que `md`. Il invite sans imposer.

---

## 8. Concho divider

Placé **en bas de `OurStorySection`**, après le contenu et avant la fermeture de `</section>`. Rendu sur fond `cgws-cream`.

```html
<!-- Concho Divider — bas de OurStorySection -->
<div
  class="flex items-center gap-4 mt-[clamp(3rem,8vw,6rem)]
         px-[clamp(1rem,4vw,2rem)] max-w-[1280px] mx-auto"
  aria-hidden="true"
>
  <div class="flex-1 border-t border-cgws-leather/25"></div>
  <!-- Médaillon concho central -->
  <div class="w-5 h-5 rounded-full border-2 border-cgws-copper
              flex items-center justify-center flex-shrink-0
              shadow-[0_0_0_3px_theme(colors.cgws.cream),0_0_0_4px_theme(colors.cgws.leather/25)]">
    <div class="w-1.5 h-1.5 rounded-full bg-cgws-copper"></div>
  </div>
  <div class="flex-1 border-t border-cgws-leather/25"></div>
</div>
```

> Le double ring sur le médaillon (`shadow-[0_0_0_3px_cream, 0_0_0_4px_leather/25]`) simule l'anneau pointillé de concho décrit dans le design system sans recourir à un SVG custom — simple et efficace.
>
> `aria-hidden="true"` sur tout l'élément — purement décoratif, aucun sens pour un lecteur d'écran.

---

## 9. Animation GSAP ScrollTrigger

### 9.1 Spécification

| Élément | Direction | x de départ | y de départ | Opacité | Durée | Ease | Délai relatif |
|---------|-----------|-------------|-------------|---------|-------|------|---------------|
| `.story-text-col` | fade-in-left (desktop) / fade-up (mobile) | `-60px` desktop, `0` mobile | `0` desktop, `40px` mobile | `0 → 1` | `0.9s` | `power2.out` | `0s` |
| `.story-image-col` | fade-in-right (desktop) / fade-up (mobile) | `+60px` desktop, `0` mobile | `0` desktop, `40px` mobile | `0 → 1` | `0.9s` | `power2.out` | `0.15s` |

**Déclencheur** : `trigger: '.story-section'`, `start: 'top 80%'` (section entre dans le viewport à 80% de sa hauteur), `once: true` (ne rejoue pas au scroll retour).

Le seuil `80%` (pas `85%`) est choisi délibérément : la section est longue (texte + image), elle peut être partiellement visible avant que l'utilisateur n'ait fait assez défiler. `80%` déclenche l'animation alors que la section est encore bien présente dans le viewport.

### 9.2 Implémentation

```ts
// app/components/home/OurStorySection.vue — <script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(async () => {
  // Import dynamique — ne bloque pas l'hydratation
  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  // Guard prefers-reduced-motion (WCAG 2.1 §2.3.3)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const isMobile = window.innerWidth < 768

  ctx = gsap.context(() => {
    // Texte — fade-in-left (desktop) ou fade-up (mobile)
    gsap.from('.story-text-col', {
      x: isMobile ? 0 : -60,
      y: isMobile ? 40 : 0,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.story-section',
        start: 'top 80%',
        once: true,
      },
    })

    // Image — fade-in-right (desktop) ou fade-up (mobile)
    gsap.from('.story-image-col', {
      x: isMobile ? 0 : 60,
      y: isMobile ? 40 : 0,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      delay: 0.15,
      scrollTrigger: {
        trigger: '.story-section',
        start: 'top 80%',
        once: true,
      },
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
```

> `gsap.context()` est obligatoire pour le cleanup propre à l'unmount — pattern identique à `HeroSection.vue`.
>
> `delay: 0.15` sur l'image crée un léger décalage qui donne l'impression que texte et image arrivent depuis leurs côtés respectifs et se "rejoignent" au centre — effet professionnel sans complexité.

---

## 10. Structure HTML complète du composant

```html
<template>
  <section
    class="story-section bg-cgws-cream pt-[clamp(3rem,8vw,6rem)] pb-8 md:pb-12"
    aria-labelledby="story-heading"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

      <!-- Grille 2 colonnes (desktop) / 1 colonne (mobile) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">

        <!-- Colonne texte — order-2 mobile (en dessous de l'image), order-1 desktop (à gauche) -->
        <div class="story-text-col order-2 md:order-1">

          <!-- Eyebrow -->
          <p class="story-eyebrow inline-flex items-center gap-3 mb-4 md:mb-5">
            <span class="block w-0.5 h-5 bg-cgws-copper flex-shrink-0" aria-hidden="true"></span>
            <span class="font-eyebrow text-[13px] text-cgws-leather uppercase tracking-[0.2em]">
              Notre Passion
            </span>
          </p>

          <!-- H2 — id lié à aria-labelledby de la section -->
          <h2
            id="story-heading"
            class="story-title font-serif font-bold text-cgws-charcoal leading-tight
                   text-[28px] md:text-[36px] lg:text-[44px]
                   mb-5 md:mb-6 max-w-[20ch]"
          >
            L'histoire de Camille&nbsp;&amp;&nbsp;CGWS
          </h2>

          <!-- Corps du texte — PLACEHOLDER À REMPLACER PAR CAMILLE -->
          <p
            class="story-body font-sans text-[15px] md:text-base text-cgws-charcoal
                   leading-relaxed mb-6 md:mb-8 max-w-[52ch]"
          >
            <!-- [PLACEHOLDER TEXT — voir docs/design-specs/US-011 §6] -->
            Cavalière depuis l'enfance, Camille a grandi avec la passion du western
            dans le sang. C'est au cœur de l'Indre-et-Loire, à Brèches, qu'elle a
            décidé de transformer cette vocation en un vrai projet de vie : une boutique
            entièrement dédiée aux cavaliers western.
            <!-- ... suite du texte placeholder ... -->
          </p>

          <!-- CTA -->
          <CgwsButton
            as="NuxtLink"
            to="/a-propos"
            variant="secondary"
            size="sm"
            class="story-cta"
          >
            En savoir plus
          </CgwsButton>

        </div>

        <!-- Colonne image — order-1 mobile (en premier), order-2 desktop (à droite) -->
        <div class="story-image-col order-1 md:order-2">
          <div class="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)]">
            <NuxtImg
              src="/img/notre-histoire.webp"
              alt="Camille Guignon avec son cheval quarter horse en plein air — fondatrice de CGWS à Brèches, Indre-et-Loire"
              class="w-full object-cover object-center
                     aspect-[4/5] md:aspect-auto md:max-h-[540px] lg:max-h-[580px]"
              :width="600"
              :height="750"
              loading="lazy"
              format="webp"
              quality="85"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

      </div>

      <!-- Concho Divider — bas de section -->
      <div
        class="flex items-center gap-4 mt-[clamp(3rem,8vw,6rem)]"
        aria-hidden="true"
      >
        <div class="flex-1 border-t border-cgws-leather/25"></div>
        <div
          class="w-5 h-5 rounded-full border-2 border-cgws-copper
                 flex items-center justify-center flex-shrink-0
                 ring-[3px] ring-cgws-cream ring-offset-0
                 outline outline-1 outline-cgws-leather/20"
        >
          <div class="w-1.5 h-1.5 rounded-full bg-cgws-copper"></div>
        </div>
        <div class="flex-1 border-t border-cgws-leather/25"></div>
      </div>

    </div>
  </section>
</template>
```

---

## 11. Breakpoints

| Breakpoint | Layout | Image | H2 taille | Texte taille | Gap colonnes |
|------------|--------|-------|-----------|--------------|--------------|
| 375px (mobile) | 1 colonne — image (`order-1`) au-dessus, texte en-dessous | `aspect-[4/5]` `max-h-[380px]` | 28px | 15px | — |
| 768px (md) | 2 colonnes `grid-cols-2` `items-center` | `aspect-auto max-h-[440px]` | 36px | 16px | `gap-12` |
| 1280px (lg/xl) | 2 colonnes `grid-cols-2` `items-center` | `aspect-auto max-h-[580px]` | 44px | 16px | `gap-20` |

---

## 12. États

| État | Apparence |
|------|-----------|
| **Default** | Section visible, texte et image à leur position finale (avant trigger GSAP) — pour les visiteurs avec JS désactivé ou `prefers-reduced-motion`, le contenu est visible immédiatement sans aucun décalage |
| **Avant trigger GSAP** | `.story-text-col` à `opacity: 0, x: -60` (desktop) — invisible pendant le scroll d'approche |
| **Animation en cours** | Les deux colonnes glissent vers leur position finale en `0.9s` — seul mouvement visible durant le scroll |
| **Hover CTA secondary** | `bg-cgws-denim/10` sur le bouton — défini dans `CgwsButton.vue` |
| **Focus CTA** | `ring-2 ring-cgws-copper ring-offset-2` — visible en navigation clavier |
| **Image en cours de chargement** | Fond de repli de la div : `bg-cgws-parchment` (placeholder warm — `class="bg-cgws-parchment"` sur le wrapper `overflow-hidden rounded-lg`) |
| **Image erreur** | Le bloc image garde son `aspect-[4/5]` avec fond `bg-cgws-parchment` — pas de cassure de layout |
| **reduced-motion** | Guard `prefers-reduced-motion: reduce` : les animations GSAP ne sont pas lancées, texte et image apparaissent statiques dans leur position finale dès le rendu |

---

## 13. Tailwind — classes clés récapitulatives

```
section:          story-section bg-cgws-cream pt-[clamp(3rem,8vw,6rem)] pb-8 md:pb-12
container-inner:  max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]
grid:             grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center

text-col:         story-text-col order-2 md:order-1
eyebrow-wrap:     story-eyebrow inline-flex items-center gap-3 mb-4 md:mb-5
eyebrow-bar:      block w-0.5 h-5 bg-cgws-copper flex-shrink-0
eyebrow-text:     font-eyebrow text-[13px] text-cgws-leather uppercase tracking-[0.2em]
h2:               story-title font-serif font-bold text-cgws-charcoal leading-tight
                  text-[28px] md:text-[36px] lg:text-[44px] mb-5 md:mb-6 max-w-[20ch]
body:             story-body font-sans text-[15px] md:text-base text-cgws-charcoal
                  leading-relaxed mb-6 md:mb-8 max-w-[52ch]
cta:              story-cta (props: variant="secondary" size="sm")

image-col:        story-image-col order-1 md:order-2
image-wrapper:    overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)]
                  bg-cgws-parchment
img:              w-full object-cover object-center
                  aspect-[4/5] md:aspect-auto md:max-h-[540px] lg:max-h-[580px]

divider-wrap:     flex items-center gap-4 mt-[clamp(3rem,8vw,6rem)]
divider-line:     flex-1 border-t border-cgws-leather/25
divider-medal:    w-5 h-5 rounded-full border-2 border-cgws-copper
                  flex items-center justify-center flex-shrink-0
                  ring-[3px] ring-cgws-cream outline outline-1 outline-cgws-leather/20
divider-center:   w-1.5 h-1.5 rounded-full bg-cgws-copper
```

---

## 14. Accessibilité

| Critère | Implémentation |
|---------|---------------|
| **Structure heading** | `<h2>` avec `id="story-heading"`, lié à `<section aria-labelledby="story-heading">`. La page n'a qu'un seul `<h1>` (hero — voir US-010) ; cette section utilise `<h2>` correctement. |
| **Alt image** | `"Camille Guignon avec son cheval quarter horse en plein air — fondatrice de CGWS à Brèches, Indre-et-Loire"` — descriptif et informatif. À mettre à jour lorsque la vraie photo est intégrée (décrire la scène réelle). |
| **Alt image placeholder** | Pendant la phase dev avec l'image Unsplash, utiliser `"Cavalière avec son cheval quarter horse dans une prairie — image d'illustration"` + supprimer toute mention de Camille. |
| **Eyebrow décoratif** | La barre verticale copper a `aria-hidden="true"` — non lu par les assistants vocaux. |
| **Concho divider** | `aria-hidden="true"` sur tout le bloc — purement décoratif. |
| **Navigation clavier** | Le CTA `<CgwsButton as="NuxtLink">` est sémantiquement un `<a>` — navigable au Tab, activable au Enter. |
| **Focus ring** | `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2` géré dans `CgwsButton.vue`. |
| **Reduced motion** | Guard `window.matchMedia('(prefers-reduced-motion: reduce)').matches` avant tout GSAP — le contenu est lisible sans animation. |
| **Ordre DOM vs ordre visuel** | L'inversion d'ordre via CSS `order-1/order-2` crée une divergence entre ordre DOM (texte→image) et ordre visuel mobile (image→texte). Cela est acceptable ici car les deux éléments sont thématiquement liés et la divergence est limitée à 2 éléments. Aucun risque de confusion pour la navigation clavier (le focus suit l'ordre DOM : texte en premier). |

### Table des contrastes

| Élément | Couleur texte | Fond effectif | Ratio | WCAG |
|---------|--------------|---------------|-------|------|
| Eyebrow texte | `cgws-leather #7B3B1C` lum 0.088 | `cgws-cream #FAF3E3` lum 0.912 | **6.97:1** | AA ✓ |
| H2 | `cgws-charcoal #1A0B03` lum 0.008 | `cgws-cream #FAF3E3` lum 0.912 | **16.6:1** | AAA ✓ |
| Corps de texte | `cgws-charcoal #1A0B03` lum 0.008 | `cgws-cream #FAF3E3` lum 0.912 | **16.6:1** | AAA ✓ |
| CTA secondary (texte) | `cgws-denim #2C4A72` lum 0.082 | `cgws-cream #FAF3E3` lum 0.912 | **7.3:1** | AA ✓ |
| Eyebrow barre cuivre | décoratif (`aria-hidden`) | `cgws-cream` | — | n/a |
| Concho divider | décoratif (`aria-hidden`) | `cgws-cream` | — | n/a |

> Note : `cgws-copper (#B8650A)` sur `cgws-cream` donne 3.6:1 — insuffisant pour du texte de taille normale (< 18pt). C'est pourquoi le copper est utilisé uniquement en élément décoratif (barre eyebrow, médaillon divider) dans cette section, jamais pour du texte lisible.
