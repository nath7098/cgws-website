# FooterMentions — Spec UX (US-022)

**Purpose**: Footer persistant sur toutes les pages publiques (via `default.vue`) donnant accès aux liens de navigation secondaire, aux informations de contact de la boutique, aux liens légaux obligatoires et au branding CGWS. Couvre aussi la page `/mentions-legales` pointée par le footer.

**Locations** :
- `app/components/layout/AppFooter.vue` — remplace le placeholder existant
- `app/pages/mentions-legales.vue` — à créer

**Note sur les tokens** : les critères Gherkin dans le sprint plan mentionnent "cgws-dark" et "amber (#D4A017)" — ce sont des tokens v1 dépréciés. Cette spec utilise les tokens v2 corrects : `cgws-tack` (#3D1A06) pour le fond sombre et `cgws-copper` (#B8650A) pour la bordure top. Le footer placeholder actuel utilise `border-t border-cgws-copper/30` (1px, 30% opacité) — le nouveau footer appelle `border-t-2 border-cgws-copper` (2px, pleine opacité) pour un ancrage visuel fort.

**Composants UI utilisés** (tous existants) : `ConchoDivider` (avec prop `bgClass="bg-cgws-tack"`), `CgwsButton`

---

## Structure globale

| Bloc | Description |
|------|-------------|
| Bordure top | `border-t-2 border-cgws-copper` — séparation visible avec le contenu |
| Grille principale | 4 colonnes sur desktop, 2×2 sur tablet, empilées sur mobile |
| Séparateur | `ConchoDivider bgClass="bg-cgws-tack"` — entre grille et barre de bas |
| Barre de bas | Copyright + mention artisanale, `border-t border-cgws-leather/30` |

---

## Layout (ASCII wireframes) — AppFooter.vue

### Desktop 1280px

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ border-t-2 border-cgws-copper                                                    │
│ bg-cgws-tack · py-14                                                             │
│ max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]                                │
│                                                                                  │
│  ┌──────────────────┬─────────────┬──────────────────┬───────────────────────┐  │
│  │  COL 1 · MARQUE  │  COL 2 · NAV│  COL 3 · CONTACT │  COL 4 · LÉGAL        │  │
│  │                  │             │                  │                       │  │
│  │  CGWS            │  NAVIGATION │  BOUTIQUE        │  INFORMATIONS         │  │
│  │  (Bebas 28px,    │  (Rye 11px, │  (Rye 11px,      │  (Rye 11px,           │  │
│  │   cgws-parchment │   cgws-cop) │   cgws-cop)      │   cgws-cop)           │  │
│  │   tracking-wide) │             │                  │                       │  │
│  │                  │  Catalogue  │  [pin] Brèches   │  Mentions légales     │  │
│  │  Sellerie de     │  Consig-    │  37320 I.-et-L.  │  CGV (à venir)        │  │
│  │  Brèches         │  nation     │                  │  Politique de conf.   │  │
│  │  (Playfair 400i, │  Contact    │  [phone] 06 XX   │  (à venir)            │  │
│  │   cgws-rope,     │  À propos   │  XX XX XX        │                       │  │
│  │   text-sm,       │             │                  │                       │  │
│  │   leading-relax) │             │  [clock] Mar–Ven │                       │  │
│  │                  │             │  10h–18h         │                       │  │
│  │  [Instagram]     │             │  Sam 9h–17h      │                       │  │
│  │  [Facebook]      │             │  Dim–Lun Fermé   │                       │  │
│  │  (icônes 20px,   │             │                  │                       │  │
│  │   cgws-rope      │             │  [mail] contact  │                       │  │
│  │   hover:copper)  │             │  @cgws.fr        │                       │  │
│  └──────────────────┴─────────────┴──────────────────┴───────────────────────┘  │
│                                                                                  │
│                         ── ◉ ──  (ConchoDivider, bgClass cgws-tack)             │
│                                                                                  │
│  © 2025 CGWS — Camille Guignon Western Shop     Fait avec ♥ en Indre-et-Loire   │
│  (Inter 400, text-xs, cgws-rope/60)             (Inter 400, text-xs, cgws-rope/60)│
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Tablet 768px

```
┌──────────────────────────────────────────────────────┐
│  border-t-2 border-cgws-copper                       │
│  bg-cgws-tack · py-12                                │
│  grid grid-cols-2 gap-x-8 gap-y-10                   │
│                                                      │
│  ┌──────────────────────┬───────────────────────┐    │
│  │  COL 1 · MARQUE      │  COL 2 · NAVIGATION   │    │
│  │  CGWS + tagline      │  Catalogue            │    │
│  │  + icônes sociales   │  Consignation         │    │
│  │                      │  Contact              │    │
│  │                      │  À propos             │    │
│  ├──────────────────────┼───────────────────────┤    │
│  │  COL 3 · CONTACT     │  COL 4 · LÉGAL        │    │
│  │  adresse (1 ligne)   │  Mentions légales     │    │
│  │  téléphone           │  CGV (à venir)        │    │
│  │  horaires résumés    │  Politique conf.      │    │
│  │  email               │  (à venir)            │    │
│  └──────────────────────┴───────────────────────┘    │
│                                                      │
│            ── ◉ ──  (ConchoDivider)                  │
│                                                      │
│  © 2025 CGWS — CGWS            Fait avec ♥ I.-et-L.  │
└──────────────────────────────────────────────────────┘
```

### Mobile 375px

```
┌────────────────────────────────────┐
│  border-t-2 border-cgws-copper     │
│  bg-cgws-tack · py-10 · px-4      │
│                                    │
│  CGWS                              │
│  (Bebas 24px, cgws-parchment,      │
│   tracking-wide)                   │
│  Sellerie de Brèches               │
│  (Playfair 400i, cgws-rope, sm)    │
│  [Instagram] [Facebook]            │
│  (icônes 20px, gap-4, mt-3)       │
│                                    │
│  ─────────────────────────────     │
│  (border-t border-cgws-leather/20) │
│                                    │
│  ┌─────────────────┬─────────────┐ │
│  │  NAVIGATION     │  LÉGAL      │ │
│  │  (Rye 10px,     │  (Rye 10px) │ │
│  │   cgws-cop)     │             │ │
│  │                 │             │ │
│  │  Catalogue      │  Mentions   │ │
│  │  Consignation   │  légales    │ │
│  │  Contact        │  CGV        │ │
│  │  À propos       │  (à venir)  │ │
│  └─────────────────┴─────────────┘ │
│                                    │
│  ─────────────────────────────     │
│  (border-t border-cgws-leather/20) │
│                                    │
│  BOUTIQUE                          │
│  (Rye 10px, cgws-copper, mb-3)    │
│                                    │
│  [pin] Brèches, 37320 Ind.-et-L.   │
│  [phone] 06 XX XX XX XX            │
│  [clock] Mar–Ven 10h–18h          │
│          Sam 9h–17h · Dim Fermé    │
│  [mail] contact@cgws.fr            │
│                                    │
│     ── ◉ ──  (ConchoDivider)       │
│                                    │
│  © 2025 CGWS                       │
│  Fait avec ♥ en Indre-et-Loire     │
│  (chacun sur sa ligne, text-xs,    │
│   cgws-rope/60, text-center)       │
└────────────────────────────────────┘
```

---

## Breakpoints — AppFooter.vue

- **Mobile 375px** : `flex flex-col gap-8` — logo pleine largeur, puis grille `grid grid-cols-2 gap-6` pour Nav+Légal, puis Contact pleine largeur, puis barre de bas centrée. Icônes sociales à `w-5 h-5`.
- **Tablet 768px** : `grid grid-cols-2 gap-x-8 gap-y-10` — 2×2. Logo col 1, Nav col 2, Contact col 3, Légal col 4.
- **Desktop 1280px** : `grid grid-cols-4 gap-8` — 4 colonnes alignées. La colonne MARQUE est `col-span-1` mais visuellement plus aérée grâce au contenu social.

---

## Sections détaillées — AppFooter.vue

### Structure racine

```
<footer
  class="bg-cgws-tack border-t-2 border-cgws-copper"
  aria-label="Pied de page CGWS"
>
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] pt-12 pb-6
              md:pt-14 md:pb-8">
    <!-- Grille principale -->
    <div class="grid grid-cols-1 gap-10
                sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10
                lg:grid-cols-4 lg:gap-8">
      …
    </div>
    <!-- Séparateur -->
    <ConchoDivider bgClass="bg-cgws-tack" class="mt-8 mb-6" />
    <!-- Barre de bas -->
    <div class="…">…</div>
  </div>
</footer>
```

### Colonne 1 — Marque

```
<div class="flex flex-col gap-3">
  <div>
    <span class="font-display text-[28px] text-cgws-parchment tracking-widest
                 uppercase leading-none block">CGWS</span>
    <span class="font-serif italic text-sm text-cgws-rope leading-snug block mt-1">
      Sellerie de Brèches
    </span>
  </div>
  <p class="font-sans text-sm text-cgws-rope/80 leading-relaxed max-w-[220px]">
    Équipements western authentiques —
    neuf, occasion &amp; consignation.
  </p>
  <!-- Icônes réseaux sociaux — placeholders -->
  <div class="flex items-center gap-4 mt-2">
    <a
      href="#"
      aria-label="CGWS sur Instagram"
      class="text-cgws-rope hover:text-cgws-copper transition-colors duration-150"
    >
      <UIcon name="i-lucide-instagram" class="w-5 h-5" aria-hidden="true" />
    </a>
    <a
      href="#"
      aria-label="CGWS sur Facebook"
      class="text-cgws-rope hover:text-cgws-copper transition-colors duration-150"
    >
      <UIcon name="i-lucide-facebook" class="w-5 h-5" aria-hidden="true" />
    </a>
  </div>
</div>
```

### Colonne 2 — Navigation

Label de section en Rye (eyebrow), liens en Inter :

```
<div>
  <p class="font-eyebrow text-cgws-copper text-[11px] uppercase
            tracking-[0.2em] mb-4">Navigation</p>
  <ul class="flex flex-col gap-3" role="list">
    <li><NuxtLink to="/catalogue"    class="footer-link">Catalogue</NuxtLink></li>
    <li><NuxtLink to="/consignation" class="footer-link">Consignation</NuxtLink></li>
    <li><NuxtLink to="/contact"      class="footer-link">Contact</NuxtLink></li>
    <li><NuxtLink to="/a-propos"     class="footer-link">À propos</NuxtLink></li>
  </ul>
</div>
```

Classe utilitaire `footer-link` :
```
font-sans text-sm text-cgws-rope hover:text-cgws-copper
transition-colors duration-150
```

### Colonne 3 — Contact

```
<div>
  <p class="font-eyebrow text-cgws-copper text-[11px] uppercase
            tracking-[0.2em] mb-4">Boutique</p>
  <ul class="flex flex-col gap-3" role="list">

    <!-- Adresse -->
    <li class="flex items-start gap-2">
      <UIcon name="i-lucide-map-pin"
             class="w-4 h-4 text-cgws-copper flex-shrink-0 mt-0.5"
             aria-hidden="true" />
      <span class="font-sans text-sm text-cgws-rope/80 leading-snug">
        Brèches, 37320 Indre-et-Loire <!-- TODO: confirmer adresse exacte avec Camille -->
      </span>
    </li>

    <!-- Téléphone -->
    <li class="flex items-center gap-2">
      <UIcon name="i-lucide-phone"
             class="w-4 h-4 text-cgws-copper flex-shrink-0"
             aria-hidden="true" />
      <a href="tel:+33600000000"
         class="font-sans text-sm text-cgws-rope/80 hover:text-cgws-copper
                transition-colors duration-150">
        06 XX XX XX XX <!-- TODO: confirmer tel avec Camille -->
      </a>
    </li>

    <!-- Horaires -->
    <li class="flex items-start gap-2">
      <UIcon name="i-lucide-clock"
             class="w-4 h-4 text-cgws-copper flex-shrink-0 mt-0.5"
             aria-hidden="true" />
      <div class="font-sans text-sm text-cgws-rope/80 leading-snug">
        <span class="block">Mar – Ven · 10h – 18h</span>
        <span class="block">Samedi · 9h – 17h</span>
        <span class="block">Dim – Lun · Fermé</span>
      </div>
    </li>

    <!-- Email -->
    <li class="flex items-center gap-2">
      <UIcon name="i-lucide-mail"
             class="w-4 h-4 text-cgws-copper flex-shrink-0"
             aria-hidden="true" />
      <a href="mailto:contact@cgws.fr"
         class="font-sans text-sm text-cgws-rope/80 hover:text-cgws-copper
                transition-colors duration-150">
        contact@cgws.fr
      </a>
    </li>

  </ul>
</div>
```

### Colonne 4 — Légal

```
<div>
  <p class="font-eyebrow text-cgws-copper text-[11px] uppercase
            tracking-[0.2em] mb-4">Informations</p>
  <ul class="flex flex-col gap-3" role="list">
    <li>
      <NuxtLink to="/mentions-legales" class="footer-link">
        Mentions légales
      </NuxtLink>
    </li>
    <li>
      <span class="font-sans text-sm text-cgws-rope/40 cursor-not-allowed"
            aria-label="CGV — page à venir">
        CGV (à venir)
      </span>
    </li>
    <li>
      <span class="font-sans text-sm text-cgws-rope/40 cursor-not-allowed"
            aria-label="Politique de confidentialité — page à venir">
        Politique de conf. (à venir)
      </span>
    </li>
  </ul>
</div>
```

Les liens "à venir" sont rendus comme du texte désactivé (`cgws-rope/40`, `cursor-not-allowed`) — pas de lien mort ni de `href="#"`.

### Barre de bas

```
<div class="flex flex-col sm:flex-row items-center justify-between gap-2">
  <p class="font-sans text-xs text-cgws-rope/60 text-center sm:text-left">
    © 2025 CGWS — Camille Guignon Western Shop
  </p>
  <p class="font-sans text-xs text-cgws-rope/60 text-center sm:text-right">
    Fait avec ♥ en Indre-et-Loire
  </p>
</div>
```

---

## États — AppFooter.vue

- **Default** : rendu statique, pas d'état dynamique. Tous les liens stables.
- **Hover lien** : `text-cgws-copper`, `transition-colors duration-150`
- **Focus lien** : `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-tack rounded-sm`
- **Lien actif** (`NuxtLink` exact-active-class) : `text-cgws-copper` pour indiquer la page courante

Appliquer l'`active-class` sur les `NuxtLink` du footer :
```
<NuxtLink
  to="/catalogue"
  class="footer-link"
  active-class="text-cgws-copper"
>
```

---

## Tailwind classes clés — AppFooter.vue

```
footer           : bg-cgws-tack border-t-2 border-cgws-copper
container        : max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]
                   pt-12 pb-6 md:pt-14 md:pb-8
grille           : grid grid-cols-1 gap-10
                   sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10
                   lg:grid-cols-4 lg:gap-8
col-marque logo  : font-display text-[28px] text-cgws-parchment
                   tracking-widest uppercase leading-none
col-marque tagline : font-serif italic text-sm text-cgws-rope leading-snug
col-marque desc  : font-sans text-sm text-cgws-rope/80 leading-relaxed
                   max-w-[220px]
social icon link : text-cgws-rope hover:text-cgws-copper transition-colors
                   duration-150
icône sociale    : w-5 h-5
label section    : font-eyebrow text-cgws-copper text-[11px] uppercase
                   tracking-[0.2em] mb-4
footer-link      : font-sans text-sm text-cgws-rope hover:text-cgws-copper
                   transition-colors duration-150
contact icon     : w-4 h-4 text-cgws-copper flex-shrink-0
contact texte    : font-sans text-sm text-cgws-rope/80 leading-snug
lien désactivé   : font-sans text-sm text-cgws-rope/40 cursor-not-allowed
séparateur mobile: border-t border-cgws-leather/20 pt-8
bottom-bar       : flex flex-col sm:flex-row items-center
                   justify-between gap-2
bottom-bar text  : font-sans text-xs text-cgws-rope/60
```

---

---

## Page Mentions Légales — `/mentions-legales`

**Purpose** : Page institutionnelle obligatoire (loi française). Contenu long et structuré, fond clair, typographie sobre. Aucune animation — priorité à la lisibilité et l'accessibilité.

**Location** : `app/pages/mentions-legales.vue`

---

## Layout (ASCII wireframes) — mentions-legales.vue

### Desktop 1280px

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  bg-cgws-cream · min-h-screen                                                │
│                                                                              │
│  ← Retour à l'accueil    (lien en haut, cgws-copper, Inter 400 14px)        │
│  (NuxtLink to="/", px-[var(--container-px)], pt-8)                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │  max-w-3xl mx-auto px-[clamp(1rem,4vw,2rem)]              │             │
│  │  py-10 md:py-16                                            │             │
│  │                                                            │             │
│  │  MENTIONS LÉGALES                                          │             │
│  │  (Bebas Neue 56px, cgws-charcoal, tracking-wide, mb-2)    │             │
│  │                                                            │             │
│  │  Dernière mise à jour : janvier 2025                       │             │
│  │  (Inter 400 13px, cgws-charcoal/50, mb-12)                │             │
│  │                                                            │             │
│  │  ─────────────────────────────────────────────────────     │             │
│  │  (border-t border-cgws-leather/20, mb-10)                  │             │
│  │                                                            │             │
│  │  1. ÉDITEUR DU SITE                                        │             │
│  │  (Playfair Display 700 24px, cgws-charcoal, mb-4)         │             │
│  │                                                            │             │
│  │  Raison sociale : …  SIRET : …  TVA intracommunautaire … │             │
│  │  (Inter 400 15px, cgws-charcoal/80, leading-relaxed,      │             │
│  │   définitions en <dl> pour accessibilité)                  │             │
│  │                                                            │             │
│  │  2. HÉBERGEUR                                              │             │
│  │  [section répétée pour chaque H2]                          │             │
│  │                                                            │             │
│  │  3. PROPRIÉTÉ INTELLECTUELLE                               │             │
│  │  4. DONNÉES PERSONNELLES                                   │             │
│  │  5. COOKIES                                                │             │
│  │  6. CONDITIONS GÉNÉRALES DE VENTE                          │             │
│  │                                                            │             │
│  └────────────────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile 375px

```
┌───────────────────────────────┐
│  bg-cgws-cream                │
│  ← Retour (text-sm, pt-5)     │
│                               │
│  max-w-3xl mx-auto px-4 py-8 │
│                               │
│  MENTIONS LÉGALES             │
│  (Bebas 40px, charcoal)       │
│                               │
│  Dernière maj : jan. 2025     │
│  (Inter 400 12px, opacity-50) │
│                               │
│  ───────────────────────      │
│                               │
│  1. ÉDITEUR DU SITE           │
│  (Playfair 700 20px)          │
│  Lorem ipsum…                 │
│  (Inter 400 14px)             │
│                               │
│  [répéter pour chaque section]│
└───────────────────────────────┘
```

---

## Breakpoints — mentions-legales.vue

- **Mobile 375px** : H1 `text-[40px]`, corps `text-[14px]`, padding `px-4 py-8`, H2 `text-[20px]`
- **Tablet 768px** : H1 `text-[48px]`, corps `text-[15px]`, H2 `text-[22px]`
- **Desktop 1280px** : H1 `text-[56px]`, corps `text-[15px]`, max-w-3xl centré, H2 `text-[24px]`

---

## Sections de contenu — mentions-legales.vue

### Lien retour (en dehors du container centré)

```html
<div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] pt-6 md:pt-8">
  <NuxtLink
    to="/"
    class="inline-flex items-center gap-1.5 font-sans text-sm text-cgws-copper
           hover:text-cgws-leather transition-colors duration-150
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper
           focus-visible:ring-offset-2 rounded-sm"
  >
    <UIcon name="i-lucide-arrow-left" class="w-4 h-4" aria-hidden="true" />
    Retour à l'accueil
  </NuxtLink>
</div>
```

### Container article

```html
<article
  class="max-w-3xl mx-auto px-[clamp(1rem,4vw,2rem)] py-8 md:py-16"
  aria-labelledby="legal-title"
>
```

### H1 et sous-titre

```html
<h1
  id="legal-title"
  class="font-display text-[40px] sm:text-[48px] md:text-[56px]
         text-cgws-charcoal tracking-wide uppercase leading-none mb-2"
>
  Mentions Légales
</h1>
<p class="font-sans text-[12px] md:text-[13px] text-cgws-charcoal/50 mb-10">
  Dernière mise à jour : janvier 2025
</p>
<hr class="border-t border-cgws-leather/20 mb-10" aria-hidden="true" />
```

### Pattern de section (H2 + contenu)

Chaque section légale suit ce patron HTML. Le patron `<dl>` (definition list) est utilisé pour les informations structurées (SIRET, adresse, etc.) car il est sémantiquement correct pour les paires terme/définition.

```html
<section class="mb-10 md:mb-12" aria-labelledby="section-editeur">
  <h2
    id="section-editeur"
    class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
           text-cgws-charcoal leading-snug mb-4"
  >
    1. Éditeur du site
  </h2>
  <dl class="font-sans text-[14px] md:text-[15px] text-cgws-charcoal/80
             leading-relaxed space-y-1">
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Raison sociale :</dt>
      <dd>Camille Guignon — CGWS (Camille Guignon Western Shop)</dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Forme juridique :</dt>
      <dd>Entreprise individuelle</dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">SIRET :</dt>
      <dd>XXX XXX XXX XXXXX <!-- TODO: compléter avec Camille --></dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Adresse :</dt>
      <dd>Brèches, 37320 Indre-et-Loire, France <!-- TODO: confirmer adresse --></dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Email :</dt>
      <dd>
        <a href="mailto:contact@cgws.fr"
           class="text-cgws-copper hover:underline">contact@cgws.fr</a>
      </dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Téléphone :</dt>
      <dd>
        <a href="tel:+33600000000"
           class="text-cgws-copper hover:underline">06 XX XX XX XX</a>
        <!-- TODO: confirmer avec Camille -->
      </dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Directrice de la publication :</dt>
      <dd>Camille Guignon</dd>
    </div>
  </dl>
</section>
```

### Contenu placeholder de chaque section

Toutes les valeurs en `<!-- TODO -->` sont à confirmer avec Camille avant le go-live. Les textes ci-dessous sont des placeholders professionnels conformes à la législation française.

#### Section 2 — Hébergeur

```
Nom      : Vercel Inc.
Adresse  : 340 Pine Street, Suite 700, San Francisco, CA 94104, États-Unis
Site     : https://vercel.com
```

```html
<section class="mb-10 md:mb-12" aria-labelledby="section-hebergeur">
  <h2 id="section-hebergeur" class="[H2 classes]">2. Hébergeur</h2>
  <dl class="[dl classes]">
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Société :</dt>
      <dd>Vercel Inc.</dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Adresse :</dt>
      <dd>340 Pine Street, Suite 700, San Francisco, CA 94104, États-Unis</dd>
    </div>
    <div class="flex flex-wrap gap-x-2">
      <dt class="font-semibold text-cgws-charcoal">Site web :</dt>
      <dd>
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer"
           class="text-cgws-copper hover:underline">
          vercel.com
          <span class="sr-only">(ouvre un nouvel onglet)</span>
        </a>
      </dd>
    </div>
  </dl>
</section>
```

#### Section 3 — Propriété intellectuelle

Texte paragraphe (`<p>`) :

```
Le contenu de ce site (textes, photographies, visuels) est la propriété exclusive
de CGWS — Camille Guignon Western Shop, sauf mention contraire. Toute reproduction,
même partielle, est interdite sans autorisation préalable écrite.
```

#### Section 4 — Données personnelles

```
Conformément au Règlement Général sur la Protection des Données (RGPD, UE 2016/679)
et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez d'un
droit d'accès, de rectification, d'opposition et de suppression des données vous
concernant. Pour exercer ce droit, contactez-nous à l'adresse : contact@cgws.fr

Les données collectées via le formulaire de contact (nom, email, message) sont
utilisées uniquement pour répondre à votre demande. Elles ne sont ni cédées ni
vendues à des tiers. Durée de conservation : 12 mois.
```

#### Section 5 — Cookies

```
Ce site utilise uniquement des cookies strictement nécessaires à son fonctionnement
(préférences de session). Aucun cookie de tracking publicitaire ou analytique tiers
n'est déposé sans votre consentement explicite.
```

#### Section 6 — Conditions Générales de Vente

Sous-titres en Playfair 600 (légèrement moins gras que les H2) `font-serif font-semibold text-[17px] md:text-[18px] text-cgws-charcoal mb-2 mt-6` :

```
6.1 Champ d'application
Les présentes CGV s'appliquent à toute vente réalisée par CGWS, que ce soit
en boutique physique ou via une demande de réservation en ligne.

6.2 Prix
Les prix sont indiqués en euros TTC. CGWS se réserve le droit de modifier ses
prix à tout moment. Le prix facturé est celui en vigueur au moment de la commande.

6.3 Droit de rétractation
Conformément à l'article L221-18 du Code de la consommation, vous bénéficiez
d'un délai de 14 jours pour exercer votre droit de rétractation sur les achats
en ligne, à compter de la réception du bien. Ce droit ne s'applique pas aux
articles personnalisés ou aux achats effectués directement en boutique.

6.4 Service de consignation
Le service de dépôt-vente est soumis à un accord écrit entre le déposant et CGWS.
Les modalités (prix de vente, durée du dépôt, commission) sont définies lors de
la prise en charge du matériel. CGWS n'est pas responsable des dommages survenus
en dehors de son fait.

6.5 Litiges
En cas de litige, une solution amiable sera recherchée en priorité. À défaut,
les tribunaux compétents de Tours (Indre-et-Loire) seront seuls habilités à
trancher le différend. La présente clause s'applique même en cas de pluralité
de défendeurs.
```

---

## Tailwind classes clés — mentions-legales.vue

```
page             : bg-cgws-cream min-h-screen
retour-lien      : inline-flex items-center gap-1.5 font-sans text-sm
                   text-cgws-copper hover:text-cgws-leather
                   transition-colors duration-150 rounded-sm
                   focus-visible:ring-2 focus-visible:ring-cgws-copper
                   focus-visible:ring-offset-2
article          : max-w-3xl mx-auto px-[clamp(1rem,4vw,2rem)] py-8 md:py-16
H1               : font-display text-[40px] sm:text-[48px] md:text-[56px]
                   text-cgws-charcoal tracking-wide uppercase leading-none mb-2
sous-titre date  : font-sans text-[12px] md:text-[13px] text-cgws-charcoal/50 mb-10
séparateur       : border-t border-cgws-leather/20 mb-10
H2               : font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                   text-cgws-charcoal leading-snug mb-4
H3 (CGV)         : font-serif font-semibold text-[17px] md:text-[18px]
                   text-cgws-charcoal mb-2 mt-6
section          : mb-10 md:mb-12
dl               : font-sans text-[14px] md:text-[15px] text-cgws-charcoal/80
                   leading-relaxed space-y-1
dt               : font-semibold text-cgws-charcoal
p corps          : font-sans text-[14px] md:text-[15px] text-cgws-charcoal/80
                   leading-relaxed [&+p]:mt-4
lien cuivre      : text-cgws-copper hover:underline transition-colors duration-150
```

---

## Animations (GSAP)

Le footer est un élément statique — aucune animation GSAP. Les transitions sur les liens sont gérées par Tailwind (`transition-colors duration-150`).

La page mentions légales est également statique — aucune animation. L'entrée se fait en rendu serveur direct (SSR), donc GSAP ne serait ni approprié ni perceptible pour du texte légal.

---

## Accessibilité

### AppFooter.vue

| Élément | Attribut | Valeur |
|---------|----------|--------|
| `<footer>` | `aria-label` | `"Pied de page CGWS"` |
| Labels de section (eyebrows Rye) | `aria-hidden="true"` sur les `<p>` purement décoratifs — les `<ul>` qui suivent ont leur propre sémantique | — |
| Listes de liens | `role="list"` | Restaure la sémantique liste désactivée par `list-style: none` sous certains lecteurs d'écran |
| Icônes de contact | `aria-hidden="true"` | Purement décoratives |
| Liens sociaux | `aria-label` | `"CGWS sur Instagram"`, `"CGWS sur Facebook"` |
| Liens désactivés (CGV à venir) | Pas de `<a>` — utiliser `<span>` avec `aria-label` incluant "page à venir" | — |
| Lien actif (page courante) | `aria-current="page"` via `exact-active-class` | Nuxt le gère automatiquement si `active-class="text-cgws-copper"` |
| Focus ring tous liens | `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-tack rounded-sm` | Visible sur fond sombre |

### mentions-legales.vue

| Élément | Attribut | Valeur |
|---------|----------|--------|
| `<article>` | `aria-labelledby="legal-title"` | Lie le titre H1 à l'article principal |
| `<section>` (×6) | `aria-labelledby="section-[slug]"` | Chaque section légale est labellisée par son H2 |
| Liens externes (Vercel) | `rel="noopener noreferrer"` + `<span class="sr-only">` | Informe les lecteurs d'écran du contexte |
| `<hr>` décoratif | `aria-hidden="true"` | N'annonce pas de rupture de section aux AT |
| `<dl>` | Structure sémantique pour les paires terme/valeur | Préféré à un tableau ou des `<p>` pour les infos éditeur |

### Contrastes (WCAG AA — ratio minimum 4.5:1 pour texte normal)

| Paire | Contexte | Statut |
|-------|----------|--------|
| `cgws-parchment` (#F0DDB8) sur `cgws-tack` (#3D1A06) | Logo footer | ~8.6:1 ✓ |
| `cgws-rope` (#C8AB82) sur `cgws-tack` (#3D1A06) | Texte footer | ~5.1:1 ✓ |
| `cgws-copper` (#B8650A) sur `cgws-tack` (#3D1A06) | Labels, liens hover | ~4.8:1 ✓ |
| `cgws-rope/80` (≈#BFAB94) sur `cgws-tack` | Texte contact footer | ~4.6:1 ✓ |
| `cgws-charcoal` (#1A0B03) sur `cgws-cream` (#FAF3E3) | Corps mentions légales | ~16.6:1 ✓ |
| `cgws-charcoal/80` sur `cgws-cream` | Texte secondaire légal | ~13.3:1 ✓ |
| `cgws-copper` (#B8650A) sur `cgws-cream` | Liens mentions légales | ~4.7:1 ✓ |

---

## Composants nouveaux à créer

Aucun. Tous les composants UI requis existent :
- `ConchoDivider` — `app/components/ui/ConchoDivider.vue` ✓ (prop `bgClass` déjà présente)
- `CgwsButton` — `app/components/ui/CgwsButton.vue` ✓ (non utilisé dans footer, mais disponible si besoin ultérieur)

---

## Notes pour le développeur

1. **ConchoDivider sur fond sombre** : le composant accepte déjà une prop `bgClass`. Passer `bgClass="bg-cgws-tack"` pour que le ring blanc du médaillon se fonde sur le fond sombre et non sur `cgws-cream` par défaut. Vérifier aussi que `ring-cgws-cream` du ConchoDivider reste correct sur fond sombre ou adapter via prop si nécessaire.

2. **Liens "à venir"** : ne pas utiliser `<a href="#">` ou `<NuxtLink to="">` pour les pages non encore créées (CGV, politique de conf.). Utiliser un `<span>` avec style désactivé pour éviter les liens morts dans les audits accessibilité et SEO.

3. **TODO : informations Camille** : adresse postale exacte, numéro de téléphone, SIRET, numéro TVA intracommunautaire. Laisser des commentaires `<!-- TODO: confirmer avec Camille -->` partout. Ne pas mettre de fausses données dans la page légale — laisser des placeholders lisibles du type "XX XX XX XX XX".

4. **`/a-propos`** : le lien dans la navigation footer pointe vers une page non encore créée. Ajouter un commentaire dans le code et une note dans `docs/PROGRESS.md`. En attendant la page, le lien peut rester inactif (NuxtLink vers une route inexistante redirigera vers une 404 — c'est acceptable en développement).

5. **SEO de la page légale** : ajouter un `<Head>` avec `<title>Mentions légales — CGWS</title>` et `<meta name="robots" content="noindex">` (les pages légales n'ont pas besoin d'être indexées par Google).

6. **Année dans le copyright** : utiliser `new Date().getFullYear()` via un `computed` pour ne pas avoir à maintenir l'année manuellement.
