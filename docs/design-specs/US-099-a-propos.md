# Page À propos — Spec UX (US-099)

**Purpose** : donner corps à la page `/a-propos`, aujourd'hui une 404 malgré des liens déjà en place dans `AppHeader.vue`, `MobileMenu.vue` et `AppFooter.vue`. La page installe la confiance (« à qui je confie ma selle / mon achat ? ») en présentant Camille, l'atelier de Brèches (37) et le service de consignation — le différenciateur métier de CGWS — avant de renvoyer vers `/consignation` et `/contact`. Structure et SEO sont livrés maintenant avec un contenu placeholder explicitement marqué ; le remplacement par la bio définitive + les vraies photos est un simple swap de constantes de contenu (voir §7 « Garantie swap »).

**Location** : `app/pages/a-propos.vue` (page monolithique — un seul fichier, sections séparées par `StarDivider`, à l'image de `consignation.vue`/`contact.vue`. Pas de nouveaux composants réutilisables extraits : `OurStorySection.vue` reste dédiée à la homepage, cette page réutilise son *pattern visuel* avec un texte étendu, pas le composant lui-même, car le texte de la page doit être plus long que la version teaser homepage).

Composants existants réutilisés tels quels : `CgwsButton`, `StarDivider`, `FiligreeCorner`, `ContactMap` (déjà câblée sur les coordonnées Brèches), `CgwsCard` (pour les blocs info atelier).

---

## Layout (ASCII wireframe — desktop 1440px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ AppHeader (inchangé)                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                          1 — HERO / INTRO                                │
│                     eyebrow "À PROPOS" (centré)                          │
│              H1 "Camille & CGWS" (Playfair, centré, ~56px)               │
│         tagline italique centrée, max 2 lignes, max-w-2xl                │
│                                                                            │
├──────────────────────────────── ★ StarDivider ────────────────────────────┤
│                     2 — CAMILLE (grille texte / image)                   │
│  ┌─────────────────────────────┐   ┌───────────────────────────────────┐ │
│  │ eyebrow "Portrait"          │   │  [arche fine accent-deco, coin]   │ │
│  │ H2 "Une cavalière, une      │   │  ┌─────────────────────────────┐  │ │
│  │     vocation"                │   │  │                             │  │ │
│  │ Texte étendu (2-3 paragr.)  │   │  │   Photo Camille (placeholder)│  │ │
│  │ ordre: texte GAUCHE          │   │  │   aspect 4/5                │  │ │
│  │                              │   │  └─────────────────────────────┘  │ │
│  └─────────────────────────────┘   └───────────────────────────────────┘ │
├──────────────────────────────── ★ StarDivider ────────────────────────────┤
│                  3 — L'ATELIER DE BRÈCHES (37)                            │
│  ┌───────────────────────────────────┐   ┌─────────────────────────────┐ │
│  │  [image atelier/sellerie]         │   │ eyebrow "L'Atelier"         │ │
│  │  ordre: image GAUCHE (alterné)    │   │ H2 "Brèches, Indre-et-Loire"│ │
│  │                                    │   │ texte accueil/retrait       │ │
│  └───────────────────────────────────┘   │ • adresse (i-lucide-map-pin)│ │
│                                            │ • horaires (i-lucide-clock) │ │
│                                            │ • tél (i-lucide-phone)      │ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              <ContactMap /> — pleine largeur, h-64/h-80             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────── ★ StarDivider ────────────────────────────┤
│               4 — ACTIVITÉS CGWS + CONSIGNATION (mise en avant)          │
│         eyebrow "Nos Activités" · H2 "Tout pour le cavalier western"     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Selles  │ │ Brides/ │ │ Bottes  │ │Vêtements│ │Accessoi-│            │
│  │neuf/occ.│ │ licols  │ │chaussur.│ │         │ │res/prot.│            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Bloc consignation — border accent-deco, bg-cgws-surface           │ │
│  │  icône étoile-boussole + "Vous voulez vendre votre selle ?"         │ │
│  │  texte court + CgwsButton primary → /consignation                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────── ★ StarDivider ────────────────────────────┤
│                       5 — CTA FINAL (contact)                            │
│              H2 "Une question ? Parlons-en."                             │
│              CgwsButton primary → /contact                              │
├──────────────────────────────────────────────────────────────────────────┤
│ AppFooter (inchangé — retirer le commentaire de garde /a-propos)         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Breakpoints

- **Mobile 375px** : toutes les grilles 2 colonnes passent en `grid-cols-1`. Ordre de lecture texte → image partout (image toujours en second, `order-2`, sauf section 2 « Camille » qui garde `order-1` pour l'image comme sur `OurStorySection.vue` — cohérence avec le pattern homepage déjà validé). Grille activités : `grid-cols-2` (5 items + le bloc consignation en pleine largeur sous la grille). `ContactMap` : `h-64`. Padding horizontal `px-[clamp(1rem,4vw,2rem)]` partout (déjà la valeur mobile de la fonction `clamp`).
- **Tablet 768px** : grilles texte/image passent à `md:grid-cols-2`. Grille activités `md:grid-cols-3`. `ContactMap` : `md:h-72`.
- **Desktop 1440px** : `container-max` 1280px conservé (`max-w-[1280px] mx-auto`), grilles texte/image `gap-12 lg:gap-20`. Grille activités `lg:grid-cols-5` (les 5 catégories sur une ligne). `ContactMap` : `lg:h-80`.

Aucune classe de breakpoint suggérée ici n'existe en dehors de celles déjà utilisées ailleurs sur le site (`OurStorySection.vue`, `contact.vue`, `consignation.vue`) — cohérence stricte avec l'existant plutôt que de nouvelles valeurs arbitraires.

---

## Sections détaillées

### 1. Hero / intro

```html
<section class="bg-cgws-ground py-12 md:py-16 lg:py-20 text-center" aria-labelledby="apropos-heading">
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase mb-4">
      À PROPOS
    </p>
    <h1
      id="apropos-heading"
      class="font-display uppercase text-cgws-ink leading-none
             text-[40px] md:text-[52px] lg:text-[64px] mb-4 md:mb-6"
    >
      Camille&nbsp;&amp;&nbsp;CGWS
    </h1>
    <p class="font-serif italic text-cgws-ink-soft text-base md:text-lg max-w-2xl mx-auto">
      <!-- PLACEHOLDER — à personnaliser par Camille -->
      Une boutique à taille humaine, pensée par et pour les cavaliers western —
      à Brèches, au cœur de l'Indre-et-Loire.
    </p>
  </div>
</section>
```

Un seul H1 par page (règle DoD). `font-display` = Playfair Display 700 en v3 (pas Bebas Neue, cf. `DESIGN_SYSTEM_v3.md` §3) — cohérent avec `consignation.vue`.

### 2. Camille (grille texte / image)

Reprend visuellement le pattern `OurStorySection.vue` (`.story-section`, grille 2 colonnes, arche fine `FiligreeCorner`/SVG accent-deco en coin d'image, GSAP slide-in) mais avec des classes/ids dédiés à cette page (`camille-section`, `camille-text-col`, `camille-image-col`, `id="camille-heading"`) pour éviter toute ambiguïté de sélecteur GSAP si les deux pages étaient un jour préchargées ensemble, et surtout parce que le **texte est étendu**, pas identique au teaser homepage.

```html
<section class="camille-section bg-cgws-ground py-10 md:py-14 lg:py-16" aria-labelledby="camille-heading">
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">

      <div class="camille-text-col order-2 md:order-1">
        <p class="inline-flex items-center gap-3 mb-4 md:mb-5">
          <span class="block w-0.5 h-5 bg-cgws-accent-deco flex-shrink-0" aria-hidden="true" />
          <span class="font-eyebrow text-[13px] text-cgws-ink-soft uppercase tracking-[0.2em]">Portrait</span>
        </p>
        <h2 id="camille-heading" class="font-serif font-bold text-cgws-ink leading-tight
               text-[26px] md:text-[32px] lg:text-[38px] mb-5 md:mb-6 max-w-[22ch]">
          Une cavalière, une vocation
        </h2>

        <!-- PLACEHOLDER — à personnaliser par Camille — reprend puis étend le texte de OurStorySection.vue -->
        <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed mb-5 max-w-[56ch]">
          Cavalière depuis l'enfance, Camille a grandi avec la passion du western
          dans le sang. C'est au cœur de l'Indre-et-Loire, à Brèches, qu'elle a
          décidé de transformer cette vocation en un vrai projet de vie&nbsp;: une
          boutique entièrement dédiée aux cavaliers western. CGWS, c'est avant tout
          une sélection rigoureuse d'équipements authentiques — selles, brides,
          bottes et vêtements — choisis avec l'œil d'une cavalière exigeante.
        </p>
        <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed mb-5 max-w-[56ch]">
          Le service de consignation est né d'un besoin réel&nbsp;: offrir aux
          cavaliers une alternative fiable pour vendre leur matériel en toute
          confiance, sans les tracas d'une annonce entre particuliers. Chaque
          selle déposée est examinée avec le même soin que si elle était la
          sienne — c'est cette exigence qui fait la réputation de CGWS bien
          au-delà de Brèches.
        </p>
        <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed max-w-[56ch]">
          Ici, on parle le même langage que vous — celui des selles qui sentent
          bon le cuir et des matins en selle dans la lumière de la Loire.
        </p>
      </div>

      <div class="camille-image-col order-1 md:order-2 relative">
        <svg class="pointer-events-none absolute -top-3 -left-3 z-10 h-16 w-16 md:h-20 md:w-20"
             viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <path d="M4 40 C4 16 24 4 40 4" stroke="var(--cgws-accent-deco)" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <div class="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)] bg-cgws-surface">
          <!-- Placeholder Unsplash — MÊME image que OurStorySection.vue, à remplacer par la vraie photo de Camille -->
          <NuxtImg
            src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=800&q=80&auto=format&fit=crop"
            alt="Camille, fondatrice de CGWS, avec son cheval quarter horse — photo d'illustration en attente de la vraie photo"
            class="w-full object-cover object-center aspect-[4/5] md:aspect-auto md:max-h-[540px] lg:max-h-[580px]"
            :width="600" :height="750" loading="lazy" format="webp" quality="85"
            sizes="xs:100vw sm:100vw md:50vw lg:50vw"
          />
        </div>
      </div>

    </div>
  </div>
</section>
```

Le `alt` est délibérément différent de celui de `OurStorySection.vue` (contexte de page différent : ici la photo EST Camille, sur la homepage c'est une illustration générique) — point à corriger dans le même mouvement que le remplacement de l'image réelle.

### 3. L'atelier de Brèches (37)

Grille image/texte inversée par rapport à la section 2 (alternance visuelle, évite deux sections identiques à la suite), suivie de `ContactMap` en pleine largeur sous les deux colonnes.

```html
<section class="atelier-section bg-cgws-surface py-10 md:py-14 lg:py-16" aria-labelledby="atelier-heading">
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center mb-10 md:mb-12">

      <div class="atelier-image-col order-1 relative">
        <div class="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)] bg-cgws-ground">
          <!-- Placeholder Unsplash — sellerie/atelier, à remplacer par une vraie photo de la boutique -->
          <NuxtImg
            src="https://images.unsplash.com/photo-1544966503-7ad532c5a8e8?w=600&h=800&q=80&auto=format&fit=crop"
            alt="Sellerie et matériel western exposés en boutique — photo d'illustration en attente de la vraie photo de l'atelier"
            class="w-full object-cover object-center aspect-[4/5] md:aspect-auto md:max-h-[480px]"
            :width="600" :height="750" loading="lazy" format="webp" quality="85"
            sizes="xs:100vw sm:100vw md:50vw lg:50vw"
          />
        </div>
      </div>

      <div class="atelier-text-col order-2">
        <p class="font-eyebrow text-[13px] text-cgws-ink-soft uppercase tracking-[0.2em] mb-4 md:mb-5">
          L'Atelier
        </p>
        <h2 id="atelier-heading" class="font-serif font-bold text-cgws-ink leading-tight
               text-[26px] md:text-[32px] lg:text-[38px] mb-5 md:mb-6 max-w-[22ch]">
          Brèches, Indre-et-Loire
        </h2>
        <!-- PLACEHOLDER — à personnaliser par Camille -->
        <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed mb-6 max-w-[56ch]">
          La boutique vous accueille à Brèches, au cœur du Véron. Venez essayer,
          toucher, comparer — le matériel western se choisit aussi à l'œil et au
          toucher. Les retraits de commande et les dépôts de consignation se font
          uniquement sur place, sur rendez-vous ou aux horaires d'ouverture.
        </p>
        <dl class="font-sans text-[14px] md:text-[15px] text-cgws-ink space-y-3">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-map-pin" class="w-4 h-4 mt-0.5 text-cgws-accent flex-shrink-0" aria-hidden="true" />
            <dd><!-- TODO: confirmer adresse exacte avec Camille -->Brèches, 37220 Indre-et-Loire</dd>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-clock" class="w-4 h-4 mt-0.5 text-cgws-accent flex-shrink-0" aria-hidden="true" />
            <dd>Mar–Ven 10h–18h · Sam 9h–17h</dd>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-phone" class="w-4 h-4 mt-0.5 text-cgws-accent flex-shrink-0" aria-hidden="true" />
            <!-- TODO: confirmer numéro avec Camille -->
            <dd><a href="tel:+33600000000" class="text-cgws-accent hover:underline">06 XX XX XX XX</a></dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="rounded-lg overflow-hidden border border-cgws-hairline h-64 md:h-72 lg:h-80">
      <ContactMap />
    </div>
  </div>
</section>
```

Horaires alignés sur ceux déjà déclarés dans le JSON-LD `LocalBusiness` d'`index.vue` (Mar-Ven 10h-18h, Sam 9h-17h) — pas une valeur inventée séparément.

### 4. Activités CGWS + mise en avant consignation

Grille de 5 catégories (reprend `ProductCategory` de `app/types/index.ts` : `selles`, `brides-licols`, `bottes-chaussures`, `vetements`, `accessoires` — la 6ᵉ catégorie `protections` est fusionnée visuellement avec « Accessoires » dans le libellé de la carte, pas un choix de donnée mais de présentation, pour garder 5 cartes lisibles) suivie d'un bloc consignation distinct.

```html
<section class="activites-section bg-cgws-ground py-10 md:py-14 lg:py-16" aria-labelledby="activites-heading">
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <div class="text-center mb-10 md:mb-12">
      <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase mb-4">Nos Activités</p>
      <h2 id="activites-heading" class="font-serif font-bold text-cgws-ink text-[26px] md:text-[32px] lg:text-[38px]">
        Tout pour le cavalier western
      </h2>
    </div>

    <ul class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10 md:mb-12">
      <li v-for="activite in activites" :key="activite.label"
          class="bg-cgws-surface border border-cgws-hairline rounded-[--ui-radius] p-4 md:p-5 text-center">
        <UIcon :name="activite.icon" class="w-6 h-6 mx-auto mb-2 text-cgws-accent" aria-hidden="true" />
        <p class="font-sans font-semibold text-sm text-cgws-ink">{{ activite.label }}</p>
      </li>
    </ul>

    <!-- Bloc consignation — mise en avant, PAS le motif "wanted poster" complet
         (réservé à consignation.vue, cf. CLAUDE.md "wanted-poster sections:
         reserved for the consignment CTA section only") : ici un simple
         callout avec bordure accent-deco, pour rappeler sans dupliquer. -->
    <div class="bg-cgws-surface border-2 border-cgws-accent-deco rounded-[--ui-radius] p-6 md:p-8
                flex flex-col md:flex-row items-center gap-5 md:gap-8 text-center md:text-left">
      <svg class="w-12 h-12 md:w-14 md:h-14 flex-shrink-0" viewBox="0 0 100 100" aria-hidden="true">
        <polygon class="fill-cgws-accent-deco" :points="STAR_POINTS" />
        <circle cx="50" cy="50" r="4.5" class="fill-cgws-surface" />
      </svg>
      <div class="flex-1">
        <h3 class="font-serif font-bold text-cgws-ink text-lg md:text-xl mb-1.5">
          Vous voulez vendre votre selle ?
        </h3>
        <p class="font-sans text-sm md:text-[15px] text-cgws-ink-soft max-w-[60ch]">
          Notre service de consignation vous permet de déposer votre matériel en
          toute confiance : nous l'exposons, nous le vendons pour vous, selon des
          conditions définies ensemble.
        </p>
      </div>
      <CgwsButton as="NuxtLink" to="/consignation" variant="primary" size="sm" class="flex-shrink-0 w-full md:w-auto">
        Découvrir la consignation
      </CgwsButton>
    </div>
  </div>
</section>
```

`activites` (données statiques, pas une constante métier partagée avec `ProductCategory` — simple tableau d'affichage) :

```ts
const activites = [
  { label: 'Selles neuves & occasion', icon: 'i-lucide-package' },
  { label: 'Brides & licols', icon: 'i-lucide-link' },
  { label: 'Bottes & chaussures', icon: 'i-lucide-footprints' },
  { label: 'Vêtements', icon: 'i-lucide-shirt' },
  { label: 'Accessoires & protections', icon: 'i-lucide-shield' },
]
```

*(Icônes à confirmer visuellement via `mcp__nuxt-ui-remote__search-icons` par `nuxt-developer` au moment de l'implémentation — celles listées ici sont des noms Lucide plausibles, pas vérifiés par ce spec.)*

### 5. CTA final (contact)

```html
<section class="cta-final-section bg-cgws-surface py-12 md:py-16 text-center" aria-labelledby="cta-final-heading">
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <h2 id="cta-final-heading" class="font-serif font-bold text-cgws-ink text-[24px] md:text-[30px] mb-6">
      Une question&nbsp;? Parlons-en.
    </h2>
    <CgwsButton as="NuxtLink" to="/contact" variant="primary" size="md">
      Nous contacter
    </CgwsButton>
  </div>
</section>
```

---

## États

- **Default** : contenu statique, aucune donnée asynchrone (pas de fetch Supabase sur cette page — tout le contenu est en dur/placeholder) → pas d'état de chargement/skeleton nécessaire.
- **Hover** : `CgwsButton` gère déjà ses propres états hover/active (variant `primary`, cf. `CgwsButton.vue`) — rien à spécifier de plus ici. Liens `tel:`/`mailto:` : `hover:underline` cohérent avec `contact.vue`.
- **Focus** : chaque élément interactif (CTA, liens `tel:`/`mailto:`, lien retour éventuel) porte `focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2` — hérité de `CgwsButton` pour les boutons ; à ajouter explicitement sur les liens `<a href="tel:">`/`<a href="mailto:">` de la section atelier, qui n'ont pas ce traitement par défaut dans le HTML natif.
- **Loading** : sans objet (pas de fetch). Seule ressource asynchrone : le tuile OpenStreetMap dans `ContactMap` (déjà gérée en interne par le composant, aucun état à spécifier côté page).
- **Empty** : sans objet — contenu toujours présent (placeholder si non personnalisé, jamais vide).
- **Error** : sans objet côté page (pas de requête réseau propre à cette page qui pourrait échouer, hors chargement de tuiles carte déjà couvert par `ContactMap`).
- **`prefers-reduced-motion: reduce`** : les animations GSAP de la section Camille sont désactivées (même garde que `OurStorySection.vue` : `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return` avant tout `gsap.context`).

---

## Animations (GSAP)

Reprend à l'identique le pattern déjà validé de `OurStorySection.vue` pour la seule section 2 (Camille) — c'est la section la plus proche du pattern homepage, les autres sections (atelier, activités, CTA final) restent statiques pour ne pas surcharger la page de scroll-triggers (principe « premium, generous whitespace », pas de décoration gratuite) :

```ts
onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)
  const isMobile = window.innerWidth < 768

  ctx = gsap.context(() => {
    gsap.from('.camille-text-col', {
      x: isMobile ? 0 : 60, y: isMobile ? 40 : 0, opacity: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: '.camille-section', start: 'top 80%', once: true },
    })
    gsap.from('.camille-image-col', {
      x: isMobile ? 0 : -60, y: isMobile ? 40 : 0, opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.15,
      scrollTrigger: { trigger: '.camille-section', start: 'top 80%', once: true },
    })
  })
})
onUnmounted(() => { ctx?.revert() })
```

Note : direction `x` inversée par rapport à `OurStorySection.vue` (texte à droite ici puisque l'image est en `order-1`/à gauche en desktop dans cette section — cf. wireframe §2) — cohérent avec le sens de lecture réel de la section, pas une valeur copiée-collée à l'aveugle.

---

## SEO — `usePageSeo()` + JSON-LD

```ts
usePageSeo({
  title: 'À propos — Camille, l\'atelier de Brèches et la consignation',
  description:
    'Camille Guignon Western Shop : découvrez Camille, l\'atelier de Brèches (37) et notre service de consignation de selles western.',
  image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1200&q=80&auto=format&fit=crop', // même placeholder que la photo Camille — remplacer en même temps
  type: 'website',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Camille Guignon',
        jobTitle: 'Fondatrice',
        // PLACEHOLDER — remplacer par la vraie photo une fois fournie par Camille
        image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=800&q=80&auto=format&fit=crop',
        worksFor: {
          '@type': 'LocalBusiness',
          name: 'CGWS — Camille Guignon Western Shop',
          url: 'https://cgws.fr',
        },
      }),
    },
    {
      // JSON-LD LocalBusiness — copie exacte de app/pages/index.vue (mêmes
      // coordonnées Brèches/37). Factorisation dans un helper partagé
      // (ex. `app/utils/localBusinessSchema.ts`) : nice-to-have signalé en
      // note technique de la US, pas bloquant pour le Done — nuxt-developer
      // tranche au moment de l'implémentation selon le temps disponible.
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'CGWS — Camille Guignon Western Shop',
        description:
          "Boutique d'équipements équestres western : selles, brides, bottes, vêtements et service de consignation.",
        url: 'https://cgws.fr',
        image: DEFAULT_OG_IMAGE,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Brèches',
          postalCode: '37220',
          addressCountry: 'FR',
        },
        openingHoursSpecification: [
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '18:00' },
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '17:00' },
        ],
        priceRange: '€€',
        currenciesAccepted: 'EUR',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer',
      }),
    },
  ],
})
```

`innerHTML` (pas `children`) — API unhead v2 confirmée par le fix `US-090` déjà appliqué sur `index.vue`, réutilisée à l'identique ici (pas de nouveau pattern SSR à vérifier via MCP, celui-ci est déjà en production).

---

## Accessibilité

- Hiérarchie de titres stricte et unique : un seul `<h1>` (hero), puis des `<h2>` par section (Camille / Atelier / Activités / CTA final), aucun saut de niveau. Le bloc consignation dans la section 4 utilise un `<h3>` (sous-titre du `<h2>` "Tout pour le cavalier western").
- Chaque `<section>` porte `aria-labelledby` pointant vers l'`id` de son titre — cohérent avec `OurStorySection.vue`/`consignation.vue`.
- Ordre de tabulation : naturel (DOM top-to-bottom), aucun `tabindex` positif. Les seuls éléments interactifs sont les 3 CTA (`/consignation`, `/contact` ×1 en section 4 implicite via bouton dédié, `/contact` en CTA final) et les liens `tel:`/`mailto:` de la section atelier — tous atteignables au clavier.
- Focus visible `ring-2 ring-cgws-accent ring-offset-2` sur tous les éléments interactifs (hérité de `CgwsButton`, à ajouter explicitement sur les liens `tel:`/`mailto:` bruts).
- Toutes les images passent par `<NuxtImg>` (`format="webp"`, `loading="lazy"` — aucune image n'est LCP sur cette page, contrairement à la homepage, donc lazy partout est correct sans exception).
- `alt` descriptif et honnête sur chaque image (mentionne explicitement qu'il s'agit d'une photo d'illustration temporaire tant que le placeholder n'est pas remplacé, cf. §2/§3) — évite un `alt` qui deviendrait mensonger une fois republié tel quel en prod sans relecture.
- Contraste : tous les textes utilisent `text-cgws-ink` (contraste ≥13:1 sur `ground` dans les 3 rendus, §2.6 `DESIGN_SYSTEM_v3.md`) ou `text-cgws-ink-soft` (≥6:1 dans les 3 rendus) sur fonds `ground`/`surface` opaques — aucun texte en `accent-deco` (réservé décoratif : étoile-boussole, arche, bordure du bloc consignation). Le bloc consignation utilise `border-cgws-accent-deco` uniquement en bordure (élément non textuel, seuil 3:1, largement respecté) — jamais en texte.
- `StarDivider`, arche fine SVG et étoile décorative du bloc consignation : tous `aria-hidden="true"`, jamais porteurs d'information (cohérent avec `US-072-signature-components.md` §3-4).

---

## Images — inventaire des placeholders

| Emplacement | Source (placeholder) | Marquage | Remplacement futur |
|---|---|---|---|
| Photo Camille (section 2) | Unsplash `photo-1553284965-...` — **identique** à `OurStorySection.vue` | `<!-- Placeholder Unsplash — MÊME image que OurStorySection.vue, à remplacer par la vraie photo de Camille -->` | 1 photo réelle de Camille |
| Photo atelier (section 3) | Unsplash `photo-1544966503-...` (sellerie) | `<!-- Placeholder Unsplash — sellerie/atelier, à remplacer par une vraie photo de l'atelier -->` | 1-2 photos réelles de la boutique |
| `og:image` / JSON-LD `Person.image` | Même Unsplash que la photo Camille | Commentaire dans le bloc `<script>` | Mise à jour simultanée avec la photo Camille |

Toutes les URLs Unsplash utilisent les mêmes paramètres de requête (`w`, `h`, `q=80`, `auto=format`, `fit=crop`) que le reste du site — pas de nouvelle convention introduite.

---

## Garantie « swap de constantes » (dernier critère Gherkin)

La structure garantit qu'intégrer la bio définitive + 3-4 vraies photos ne touche à rien d'autre que des valeurs, car :

1. **Texte** : chaque paragraphe placeholder est un littéral de template isolé (pas de logique conditionnelle dessus) marqué `<!-- PLACEHOLDER -->` — remplacer le texte ne change ni la structure `<section>`/`<h2>`/`<p>` ni les classes Tailwind qui l'entourent.
2. **Images** : chaque `<NuxtImg>` ne référence que `src`/`alt` en dur — remplacer `src` par un chemin `/images/...` local et corriger `alt` (retirer la mention « photo d'illustration temporaire ») ne touche à aucune classe de layout (`aspect-[4/5]`, `object-cover`, `sizes`, etc.), qui reste valable pour une vraie photo au même ratio recommandé (portrait 4:5 pour Camille, cohérent avec ce que la vraie photo devra respecter — à communiquer à Camille).
3. **SEO** : `image` de `usePageSeo()` et `Person.image` du JSON-LD pointent vers la même constante que la photo Camille — un seul remplacement (l'URL) propage la mise à jour aux deux endroits si on factorise cette URL dans une constante de tête de fichier (`const CAMILLE_PHOTO = '...'`), recommandé à `nuxt-developer` au moment de l'implémentation pour éviter une divergence entre les 3 occurrences (section 2, `usePageSeo`, `Person.image`).
4. **JSON-LD `LocalBusiness`** : dépend uniquement des coordonnées Brèches déjà valides — aucun changement requis lors du remplacement du contenu Camille.

Aucun de ces remplacements ne nécessite de modifier un composant, un composable ou la structure de la page — uniquement des valeurs de chaîne de caractères, exactement le principe déjà appliqué et validé pour `OurStorySection.vue` depuis l'US-011.

---

## Tailwind classes (résumé — hors blocs de code déjà détaillés ci-dessus)

- Fond de page alterné par section pour rythmer visuellement sans diviseur artificiel : `bg-cgws-ground` (hero, Camille, activités, CTA final) / `bg-cgws-surface` (atelier) — alternance déjà pratiquée par `consignation.vue`.
- Container standard partout : `max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]`.
- Espacement vertical de section : `py-10 md:py-14 lg:py-16` (sections de contenu) / `py-12 md:py-16 lg:py-20` (hero et CTA final, un peu plus généreux car moins de contenu vertical).
- Rayon : `rounded-[--ui-radius]` sur les cartes activités et le bloc consignation (suit la peau active, §5 `DESIGN_SYSTEM_v3.md`) ; `rounded-lg` conservé sur les photos et la carte (valeur fixe déjà utilisée par `OurStorySection.vue`/`contact.vue`, pas un rôle theme-aware).

---

## Notes pour `nuxt-developer`

- Retirer le commentaire de garde `<!-- /a-propos n'est pas encore créé — redirigera vers 404 jusqu'à implémentation -->` dans `AppFooter.vue` (ligne actuelle confirmée dans le code) une fois la page livrée — aucune autre modification de `AppHeader.vue`/`MobileMenu.vue`/`AppFooter.vue` requise, les liens `to="/a-propos"` existent déjà et fonctionneront tels quels.
- Vérifier les noms d'icônes Lucide proposés en §4 via `mcp__nuxt-ui-remote__search-icons` avant implémentation (non vérifiés par ce spec).
- `useHead`/`useSeoMeta` : patterns déjà en production sur `index.vue`/`contact.vue`/`consignation.vue`, aucune vérification MCP supplémentaire nécessaire pour cette US — seule la donnée factuelle (adresse, horaires, téléphone) reste `TODO` tant que Camille ne l'a pas confirmée, cohérent avec le traitement déjà appliqué dans `mentions-legales.vue`.
