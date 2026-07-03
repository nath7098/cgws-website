# Homepage v3 « Cowgirl élégante » — Spec UX (US-073)

**Purpose** : re-skin de la homepage vers la grille de rôles sémantiques v3 (theme-aware, 3 rendus `elegante-jour` / `elegante-nuit` / `rugueux`), en réutilisant tels quels les composants signature livrés en `US-072` (`StarDivider`, `FiligreeCorner`, `TagCard`, `CgwsButton`, `CgwsBadge`). C'est la vitrine d'entrée du site — elle doit incarner immédiatement l'identité "cavalière élégante" sans rupture de lisibilité entre les 3 peaux.
**Location** (fichiers concernés, re-skin en place — structure/props/emits existants préservés) :
- `app/pages/index.vue`
- `app/components/home/HeroSection.vue`
- `app/components/home/StatsBar.vue`
- `app/components/home/OurStorySection.vue`
- `app/components/home/SaddleIllustration.vue`

**Dépend de** : `US-070` (tokens en place), `US-071` (switcher — déjà fonctionnel, hors périmètre de cette spec), `US-072` (`StarDivider`, `FiligreeCorner`, `CgwsButton` déjà livrés et consommés ici, pas redéfinis).
**Constat de départ (audit du code actuel)** : contrairement à ce que suggérait le tableau de cadrage `US-073-074-075-pages-outline.md` (qui décrivait un état v2 attendu — fond `cgws-tack`, tokens `cgws-leather`/`cgws-copper`), les quatre fichiers ont déjà été mécaniquement re-tokenisés vers les noms de classes v3 (`bg-cgws-ground`, `text-cgws-accent`, `font-display`, `font-eyebrow`…) — probablement lors du passage `US-070`/`US-071`. Cette spec ne repart donc pas de zéro : elle **audite ce re-tokenage mécanique** et corrige les points où il a été fait "à l'aveugle" sans respecter la distinction fonctionnelle `accent` (texte lisible) / `accent-deco` (décoratif), ainsi que les écarts typographiques et de composition (arche fine, filigranes, diviseurs manquants) demandés par le cadrage. Chaque section ci-dessous liste explicitement : ce qui est déjà conforme (aucune action), et ce qui doit changer.

---

## 0. Assemblage de page — `app/pages/index.vue`

### État actuel

```vue
<main>
  <HeroSection />
  <StatsBar />
  <OurStorySection />
  <StarDivider />
</main>
```

Un seul `StarDivider` est présent, en toute fin de page. Le cadrage `US-073` demande « Diviseurs de section : `ConchoDivider` → `StarDivider variant="divider"` **partout** » — il manque les diviseurs entre Hero → StatsBar et StatsBar → Notre Histoire.

### Changement demandé

```vue
<main>
  <HeroSection />
  <StarDivider />
  <StatsBar />
  <StarDivider />
  <OurStorySection />
  <StarDivider />
</main>
```

- Les trois sections (`HeroSection`, `StatsBar`, `OurStorySection`) ont toutes un fond `bg-cgws-ground` — le `bgClass` par défaut de `StarDivider` (`bg-cgws-ground`, cf. `US-072` §2) convient donc **sans override** à chacun des trois emplacements ; ne pas passer de prop `bgClass` custom ici (homogénéité de fond sur toute la page, pas d'alternance surface/ground).
- Le premier `StarDivider` (juste après le Hero plein écran `h-[100svh]`) agit comme une transition éditoriale nette entre l'image immersive et le contenu structuré qui suit — cohérent avec le rôle de "trait d'union" du composant plutôt qu'un simple `<hr>`.
- Chaque `StarDivider` reste dans sa configuration par défaut (`variant="divider"`, `aria-hidden="true"` intégré au composant — cf. `US-072` §2, aucune prop supplémentaire nécessaire).

### Accessibilité

- Aucun rôle ARIA supplémentaire à porter dans `index.vue` : `StarDivider` gère déjà son `aria-hidden="true"` en interne pour `variant="divider"` (purement visuel, la hiérarchie de titres H1 → H2 suffit à structurer la page pour les technologies d'assistance).
- Hiérarchie de titres de la page : un seul H1 (Hero), un seul H2 (`#story-heading`, Notre Histoire) — pas de titre dans `StatsBar` (le composant expose déjà chaque stat via `role="img"` + `aria-label`, pas de titre de section requis par le cadrage actuel).

---

## 1. Hero — `HeroSection.vue`

### Ce qui est déjà conforme (aucune action)

- Fond de section `bg-cgws-ground` (fallback derrière l'image, visible pendant le chargement).
- Eyebrow `font-eyebrow` (Playfair capitales) — bon choix, "Sellerie Équestre Western · Brèches, 37" fait 6 mots, **ne doit jamais passer en Rye** (`font-heading`), conforme à la règle §3 du doc maître.
- H1 en `font-display` — le nom de classe pointe déjà vers `--cgws-font-display: 'Playfair Display'` (cf. `tokens.css`), donc la famille de police est correcte sans changement.
- Tagline en `font-serif italic`.
- CTA primaire `CgwsButton variant="primary"` → `bg-cgws-accent text-cgws-on-accent`, déjà theme-aware et AA garanti dans les 3 rendus (`US-072` §5).
- CTA secondaire `CgwsButton variant="outline-light"` → `text-cgws-brand-cream border-cgws-brand-cream/70`, un **littéral de marque volontairement fixe** (§2.5 doc maître) : ce bouton est posé sur la photo avec scrim sombre, pas sur le fond de page ; il doit rester visible identiquement quelle que soit la peau active, exactement comme le H1 (voir §1.3 ci-dessous). Aucun changement.

### 1.1 Correction requise — poids du H1 (Playfair 700 manquant)

Le doc maître (§3) prescrit **Playfair Display 700** pour le H1 hero. Le nom de classe `font-display` ne pilote que la *famille* de police (`--font-display` = indirection CSS vers `--cgws-font-display`), **pas le poids** — aucune règle CSS dans `main.css`/`tokens.css` ne force `font-weight: 700` sur `.font-display`. Le H1 actuel n'a donc aucune classe de poids explicite et s'affiche au poids par défaut du navigateur pour Playfair Display (400, fin) au lieu du 700 attendu par la charte.

**Correction** : ajouter `font-bold` à la classe du H1 :

```
font-display font-bold uppercase leading-none text-cgws-brand-cream
text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px]
mb-5 md:mb-7 max-w-[15ch] lg:max-w-[12ch]
```

### 1.2 Arche fine autour du bloc titre (nouveau — `US-072` §4)

**Décision tranchée** : `accent-deco` (ornemental), **pas** `edge` (structurel).

Justification : l'arche fine du Hero encadre le bloc *eyebrow + H1* posé sur une photographie avec scrim, pas les contours d'une carte ou d'un panneau fonctionnel (il n'y a aucune surface `bg-cgws-surface` à délimiter ici, juste un cadrage visuel purement décoratif). `edge` est réservé aux bordures structurelles de composants (cartes, boutons outline) ; ici l'arche ne "contient" rien fonctionnellement, elle habille le titre comme une esquisse d'arc de gravure de selle. Cf. `US-072` §4 : *« stroke `edge` structurel ou `accent-deco` ornemental — tranche et justifie »*.

**Structure** : wrapper `relative` autour de l'eyebrow + H1 (pas la tagline ni les CTA), avec un SVG en arc positionné derrière/au-dessus, `aria-hidden="true"`.

```
┌──────────────────────────────────────────┐
│         ╭─────────────────────╮          │  ← arc SVG, stroke accent-deco 1.5px, fill none
│         │  (marge ≥24px)      │          │
│   Sellerie Équestre Western · Brèches    │  ← eyebrow
│   L'AUTHENTIQUE WESTERN                  │  ← H1 (dans l'arc)
│   À VOTRE PORTÉE                         │
│                                            │
│   Équipements authentiques... (tagline,  hors arc)
│   [CTA] [CTA]                     (hors arc)
└──────────────────────────────────────────┘
```

Classes/structure :
```html
<div class="hero-title-block relative">
  <svg
    class="pointer-events-none absolute -top-6 left-0 w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[620px] h-auto"
    viewBox="0 0 520 160" fill="none" aria-hidden="true"
  >
    <path
      d="M20 160 C20 60 120 8 260 8 C400 8 500 60 500 160"
      stroke="var(--cgws-accent-deco)" stroke-width="1.5" stroke-linecap="round"
    />
  </svg>
  <p class="hero-eyebrow ...">Sellerie Équestre Western · Brèches, 37</p>
  <h1 class="... mt-6">…</h1>
</div>
```
- Marge intérieure ≥24px entre le trait d'arc et le haut de l'eyebrow (`mt-6` = 24px sur le premier élément du bloc, valeur minimale respectée).
- L'arc ne touche jamais le texte latéralement : `max-w` du SVG borné pour rester dans la largeur du bloc titre (`max-w-[15ch] lg:max-w-[12ch]` du H1), avec une marge de sécurité implicite par le `Q`/`C` de la courbe qui reste au-dessus.
- `aria-hidden="true"` sur le `<svg>`, aucun `role` supplémentaire nécessaire (décoratif pur, pas de médaillon-stat ici).
- **Contraste — non applicable (décoratif)** : `accent-deco` n'a aucune obligation AA texte (§2.1 doc maître). Point de vigilance esthétique seulement : vérifier visuellement que le trait reste perceptible sur le scrim sombre dans les 3 rendus, la valeur `accent-deco` changeant de teinte selon la peau (`#B76E79` Élégante Jour, `#C98B94` Élégante Nuit, `#B8650A` Rugueux) — toutes restent des tons chauds clairs/moyens sur un scrim très sombre (`brand-espresso` à 90% d'opacité), donc un contraste visuel suffisant est attendu mais **à confirmer en implémentation** (pas une mesure de contraste de texte, une vérification de lisibilité décorative).

### 1.3 Fond du Hero — littéraux de marque fixes, décision explicite et justifiée

**Point d'attention demandé par le cadrage** : *« l'ancien H1 était pensé sur fond `tack` sombre — vérifier qu'il reste lisible en Jour clair ET Nuit sombre »*.

**Constat** : le Hero n'utilise **pas** de fond plat theme-aware — c'est une photographie (`NuxtPicture`, LCP) recouverte d'un gradient scrim `from-cgws-brand-espresso/90 via-cgws-brand-espresso/40 to-cgws-brand-espresso/10`, avec H1/tagline/eyebrow en `text-cgws-brand-cream` et CTA secondaire en `text-cgws-brand-cream`. Tous ces tokens sont des **littéraux de marque fixes** (§2.5 doc maître : `brand-espresso`, `brand-cream`, `brand-sand`), **pas** des rôles theme-aware (`ground`/`ink`/`accent`).

**Décision (assumée, à valider en implémentation)** : conserver ce traitement littéral fixe plutôt que de basculer le scrim/texte sur des rôles theme-aware (`bg-cgws-ground/90`, `text-cgws-ink`). Justification :
1. Le fond réel du Hero est une **photographie**, pas un aplat de couleur de page — un scrim doit rester sombre pour garantir la lisibilité du texte clair posé dessus, **indépendamment** de la peau active. Si le scrim utilisait `bg-cgws-ground/90`, il deviendrait **clair** en Élégante Jour (`ground` = `#F6EDDF`, un ton crème très lumineux) — un texte clair (`ink` ou `brand-cream`) dessus perdrait tout contraste. Utiliser un rôle theme-aware sur un scrim photo casserait donc la lisibilité précisément dans le rendu par défaut du site (Élégante Jour).
2. §2.5 du doc maître autorise explicitement les littéraux de marque pour des « usages ponctuels documentés » — c'est le cas ici, documenté par cette spec.
3. Le variant `outline-light` de `CgwsButton` (déjà livré en `US-072`/`US-070`, cf. `app/components/ui/CgwsButton.vue`) est **spécifiquement construit** sur `text-cgws-brand-cream`/`border-cgws-brand-cream` — sa seule raison d'être est ce contexte photo-scrim fixe. Le re-token de ce variant vers des rôles theme-aware romprait son unique cas d'usage.
4. Conséquence : le Hero est la **seule section de la homepage qui ne change pas visuellement selon la peau/le mode actifs** (identique dans les 3 rendus). C'est un choix délibéré et cohérent — pas un oubli — car son fond n'est pas le canevas de page mais une photo de marque.

**Ce qui reste theme-aware dans le Hero, malgré ce fond fixe** :
- Le CTA primaire (`accent`/`on-accent`) change de teinte selon la peau (mauve Élégante Jour/Nuit, laiton Rugueux) — c'est le seul élément du Hero qui doit visiblement varier entre les 3 rendus.
- L'arche fine (`accent-deco`, §1.2) varie aussi de teinte.
- Le fond de secours `bg-cgws-ground` (avant chargement de l'image) reste theme-aware, cohérent avec le reste du site pendant le chargement.

**Contraste à vérifier en implémentation** (paires non pré-calculées dans le doc maître qui ne mesure que les rôles theme-aware, pas les littéraux `brand-*`) :
- `brand-cream` (`#F6EDDF`) sur `brand-espresso/90` (~`#2A1D16` à 90% d'opacité sur photo sombre) : extrêmes de luminance opposés, contraste attendu très large (>10:1) mais **à mesurer par QA sur le rendu réel** (l'opacité 90/40/10 du gradient et la photo sous-jacente influencent le résultat final en bas du dégradé, où l'opacité tombe à 10%).
- Zone la plus à risque : le tiers supérieur du Hero où le gradient descend à `/10` (quasi transparent) — mais le texte (eyebrow/H1/tagline/CTA) est positionné en bas/centre du Hero (`justify-end`/`justify-center`), donc dans la zone `/90`→`/40`, pas dans la zone `/10`. Aucune action requise, simple point de vigilance QA sur le positionnement du texte si le layout évolue.

### Wireframe (ASCII)

**Mobile 375px** (`h-[100svh]`, contenu ancré en bas) :
```
┌─────────────────────────┐
│      [photo + scrim]    │
│                         │
│                         │
│    ╭─── arche fine ───╮ │
│    Sellerie Équestre…   │  ← eyebrow, brand-sand
│    L'AUTHENTIQUE        │  ← H1, brand-cream, 52px
│    WESTERN À VOTRE      │
│    PORTÉE               │
│    Équipements          │  ← tagline italic
│    authentiques…        │
│    [Découvrir catalogue]│  ← CTA primary, pleine largeur
│    [Consignation]       │  ← CTA outline-light, pleine largeur
│         ⌄ Découvrir     │  ← scroll indicator
└─────────────────────────┘
```

**Tablet 768px** : bascule `lg:justify-center` pas encore active (seuil `lg`), reste ancré en bas comme mobile, mais avec l'illustration selle qui apparaît (`hidden md:block`) en haut à droite, opacité 75%. CTA en ligne (`sm:flex-row`).

**Desktop 1440px** : contenu centré verticalement (`lg:justify-center lg:pb-0`), illustration selle à droite (`lg:right-[8%]`, largeur `260px`), parallax scrub actif sur l'image de fond (`gsap.to('.hero-bg-img', { y: '30%', scrub: true })`, desktop uniquement `window.innerWidth >= 768`).

### Tailwind classes clés (récapitulatif, y compris corrections §1.1/§1.2)

```
Section: relative w-full h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden bg-cgws-ground
Scrim: bg-gradient-to-t from-cgws-brand-espresso/90 via-cgws-brand-espresso/40 to-cgws-brand-espresso/10
Bloc titre (nouveau wrapper): relative
Arche (nouveau): pointer-events-none absolute -top-6 left-0 w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[620px] h-auto — stroke var(--cgws-accent-deco)
Eyebrow: font-eyebrow text-[13px] text-cgws-brand-sand uppercase tracking-[0.2em] mb-4 md:mb-5
H1 (corrigé): font-display font-bold uppercase leading-none text-cgws-brand-cream text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px] mb-5 md:mb-7 max-w-[15ch] lg:max-w-[12ch]
Tagline: font-serif italic text-cgws-brand-sand text-[17px] md:text-[19px] lg:text-[21px] leading-relaxed mb-8 md:mb-10 max-w-[45ch] md:max-w-[38ch]
CTA primary: CgwsButton variant="primary" → bg-cgws-accent text-cgws-on-accent
CTA secondary: CgwsButton variant="outline-light" → text-cgws-brand-cream border-cgws-brand-cream/70
Scroll indicator: text-cgws-brand-sand / text-cgws-brand-sand/60
```

### États

| État | Rendu |
|---|---|
| Default | Photo + scrim + contenu, comme décrit ci-dessus |
| Chargement image | Fond `bg-cgws-ground` visible avant le `NuxtPicture` (LCP, `loading="eager"`, `fetchpriority: high`) |
| Hover CTA primary | `hover:bg-cgws-accent/90` (déjà géré par `CgwsButton`) |
| Hover CTA secondary | `hover:bg-cgws-brand-cream/10` (déjà géré par `CgwsButton`, littéral fixe) |
| Focus CTA | `focus-visible:ring-2 ring-cgws-accent` (primary) / `ring-cgws-brand-cream` (secondary) — déjà géré par `CgwsButton` |
| `prefers-reduced-motion` | Tout le timeline GSAP est court-circuité (`if (window.matchMedia(...).matches) return`, déjà en place) — le contenu s'affiche directement sans animation d'entrée |

### Animations GSAP (inchangées, déjà conformes)

- Timeline stagger : eyebrow → lettres H1 (stagger 0.035s) → tagline → CTA → illustration selle → scroll indicator, `onMounted`, guard `prefers-reduced-motion`.
- Scroll indicator : boucle `yoyo` infinie, disparaît après le premier scroll (`ScrollTrigger once: true`).
- Parallax du fond, desktop uniquement (`>= 768px`), `scrub: true`.
- Nettoyage `ctx.revert()` dans `onUnmounted` — déjà en place, aucun changement requis. L'ajout du wrapper `hero-title-block` (§1.2) ne casse pas les sélecteurs GSAP existants (`.hero-eyebrow`, `.hero-letter` restent des descendants, les sélecteurs de classe fonctionnent toujours).

### Accessibilité

- `aria-label="Accueil CGWS — Sellerie équestre western"` sur la section (inchangé).
- H1 : `aria-label` déjà porté sur la balise (le texte visuel est fragmenté en `<span>` par lettre pour le stagger GSAP, chaque span est `aria-hidden="true"` — pattern déjà correct, lecteur d'écran lit l'`aria-label` du H1 parent, pas les spans).
- Arche fine : `aria-hidden="true"` (nouveau, §1.2).
- Focus visible sur les deux CTA : ring `accent` (primary) ou `brand-cream` (secondary) — ce dernier est un choix delibéré cohérent avec le fond photo fixe, pas une variation par peau (cf. §1.3).
- Contraste texte : voir mesures/justification §1.3 — à confirmer par QA sur rendu réel (littéraux non pré-mesurés dans le doc maître).

---

## 2. StatsBar

### Ce qui est déjà conforme (aucune action)

- Utilise déjà `StarDivider variant="stat"` en boucle (`US-072` livré et consommé correctement).
- Fond `bg-cgws-ground`, grille `grid-cols-2 md:grid-cols-4`.
- Animation GSAP stagger déjà en place (`.star-stat-root`, `ScrollTrigger`, `once: true`), guard `prefers-reduced-motion`.

### 2.1 Ajout requis — `FiligreeCorner` aux coins de section

Le cadrage demande : *« filigranes discrets aux coins de section (`US-072` §3) »*. `StatsBar.vue` n'en contient actuellement aucun.

**Règle rappelée (`US-072` §3)** : maximum **2 filigranes visibles par viewport** — ne pas en poser aux 4 coins simultanément si cela crée une surcharge visuelle sur mobile (section basse, `py-12 md:py-16`).

**Décision** : 2 filigranes seulement, coins **diagonalement opposés** (haut-gauche + bas-droit), pour une composition asymétrique discrète plutôt que 4 coins symétriques (qui alourdirait une section déjà dense en contenu — 4 médaillons-stat).

```
┌───────────────────────────────────────┐
│ ﹌                                     │  ← FiligreeCorner top-left, opacity 40
│                                        │
│   ✦        ✦        ✦        ✦        │  ← StarDivider variant="stat" ×4
│  250+     15+      100%      37       │
│ articles marques  passion  Brèches    │
│                                        │
│                                    ﹌  │  ← FiligreeCorner bottom-right, opacity 40
└───────────────────────────────────────┘
```

Classes :
```html
<section class="relative bg-cgws-ground py-12 md:py-16" aria-label="Chiffres clés CGWS">
  <FiligreeCorner
    class="absolute top-4 left-4 md:top-6 md:left-6 w-12 h-12 md:w-16 md:h-16"
    :opacity="40"
  />
  <FiligreeCorner
    class="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-16 md:h-16 rotate-180"
    :opacity="40"
  />
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <!-- grille StarDivider inchangée -->
  </div>
</section>
```
- `rotate-180` sur le second filigrane pour varier l'orientation entre les deux coins (cf. `US-072` §3 : *« rotate-90/scale-x-[-1] pour varier les coins »* — ici `rotate-180` produit une variation symétrique-point cohérente avec un positionnement diagonal haut-gauche/bas-droite).
- `opacity="40"` (la valeur la plus discrète des 3 proposées par le composant) — section dense en contenu chiffré, le filigrane ne doit jamais concurrencer la lisibilité des stats.
- Taille réduite (`w-12 h-12` / `w-16 h-16`, vs le SVG natif `96×96`) car la section `StatsBar` est basse (`py-12 md:py-16`) — un filigrane à pleine taille par défaut serait disproportionné.
- `class="relative"` ajouté au `<section>` pour ancrer le positionnement `absolute` des filigranes (seul changement structurel sur le conteneur).

### Wireframe complet (avec filigranes + arrivée du diviseur)

**Mobile 375px** : grille `grid-cols-2` (2×2), filigranes réduits (`w-12 h-12`) mais **conservés** (pas masqués) — à taille réduite ils restent discrets même sur petit écran, cf. `US-072` §8 *(« filigranes réduits/masqués si surcharge »*, ici réduits suffit, pas besoin de masquer totalement).
**Tablet 768px** : grille `grid-cols-4`, filigranes `w-16 h-16`.
**Desktop 1440px** : identique tablet, `StarDivider variant="stat"` passe à 100px de diamètre (déjà géré en interne par le composant).

### États

| État | Rendu |
|---|---|
| Default | 4 médaillons statiques + 2 filigranes discrets |
| Scroll dans le viewport | Stagger d'entrée GSAP (`opacity: 0, y: 24, scale: 0.85 → 1`, `stagger: 0.12`) + compteur GSAP interne à `StarDivider` pour les stats `animateOnVisible: true` |
| Sans valeur (donnée non chargée) | Skeleton pulse `bg-cgws-surface-2` — géré nativement par `StarDivider` (cf. `US-072` §2), rien à faire côté `StatsBar` |
| `prefers-reduced-motion` | Stagger et compteurs désactivés, valeurs affichées directement (guard déjà en place dans `StatsBar.vue` et `StarDivider.vue`) |

### Accessibilité

- Filigranes : `aria-hidden="true"` déjà intégré à `FiligreeCorner` (composant livré `US-072`, rien à changer).
- Chaque stat : `role="img"` + `aria-label` déjà géré par `StarDivider` (`US-072` §2), aucune action ici.
- Contraste valeur (`accent` sur `ground`) : ≥5.6:1 dans les 3 rendus (doc maître §2.6, déjà validé pour `StarDivider`).

---

## 3. Notre Histoire — `OurStorySection.vue`

### Ce qui est déjà conforme (aucune action)

- H2 `font-serif font-bold` — "L'histoire de Camille & CGWS" fait 6 mots, dépasse la limite de 4 mots pour Rye : le choix de Playfair Display (pas `font-heading`) est **déjà correct**, conforme à la règle §3 du doc maître.
- Eyebrow "Notre Passion" (2 mots) en `font-eyebrow` — conforme.
- Corps de texte `font-sans text-cgws-ink`.
- Colonne image : conteneur `bg-cgws-surface` — c'est déjà le rôle "fond de carte" attendu par le cadrage (*« `CgwsCard` fond `surface` »*, voir décision §3.1 ci-dessous pour la nuance sur l'usage littéral de `CgwsCard`).
- CTA `CgwsButton variant="secondary"` → déjà re-skinné en outline `accent` (`text-cgws-accent border-cgws-accent`, cf. `CgwsButton.vue` actuel et `US-072` §5) — pas de denim ici, cohérent avec la règle "denim réservé Rugueux".
- Animations GSAP scroll-triggered (glissement latéral texte/image, `once: true`) — inchangées.

### 3.1 Décision — ne pas envelopper littéralement dans `<CgwsCard>`

Le cadrage mentionne *« `CgwsCard` fond `surface`, texte `ink` »* pour cette section. **Décision** : ne **pas** envelopper le bloc texte (ni la section entière) dans le composant `<CgwsCard>` littéral.

Justification :
- `CgwsCard.vue` (`app/components/ui/CgwsCard.vue`) est un panneau bordé compact (`bg-cgws-ground border border-cgws-hairline rounded-[4px] shadow-sm`, padding `p-4`/`p-6`/`p-8`) — pensé pour des blocs de contenu encadrés (ex. panneaux admin), **pas** pour une section pleine largeur en grille 2 colonnes texte/image comme "Notre Histoire".
- L'envelopper littéralement romprait la mise en page existante (marges `max-w-[1280px]`, grille `md:grid-cols-2`) et introduirait une bordure/ombre visuellement redondante autour d'une section qui a déjà son propre rythme (colonne image déjà encadrée en `bg-cgws-surface` avec ombre portée `shadow-[0_8px_32px_rgba(61,26,6,0.12)]`).
- Le **rôle sémantique** visé par le cadrage (fond `surface`, texte `ink`) est déjà appliqué où c'est pertinent : la colonne image utilise `bg-cgws-surface`, le corps de texte utilise `text-cgws-ink`. `CgwsCard` reste réservé aux panneaux de contenu encadrés (admin, blocs `TagCard`-like), pas aux sections de mise en page pleine largeur.

> Point à signaler à `product-owner`, non bloquant : si Camille souhaite explicitement un cadre visible autour du bloc texte (pas seulement autour de l'image), cela nécessiterait une refonte structurelle de la section plutôt qu'un simple re-skin — hors périmètre de cette US qui préserve la structure existante.

### 3.2 Correction requise — barre verticale décorative (`accent` → `accent-deco`)

```html
<!-- Actuel -->
<span class="block w-0.5 h-5 bg-cgws-accent flex-shrink-0" aria-hidden="true" />
```

Cette petite barre verticale devant l'eyebrow "Notre Passion" est **purement décorative** (`aria-hidden="true"`, ne porte aucun texte, aucune fonction d'état). Selon la règle de contraste non négociable (§2.1 doc maître), un élément décoratif ne doit **jamais** utiliser `accent` — c'est exactement le type d'élément que `accent-deco` est censé porter (bordures, coutures, ornements).

**Correction** :
```html
<span class="block w-0.5 h-5 bg-cgws-accent-deco flex-shrink-0" aria-hidden="true" />
```

### 3.3 Arche fine optionnelle autour du portrait (nouveau, optionnel)

Le cadrage propose : *« portrait/illustration encadré d'une arche fine optionnelle »*. Traitement cohérent avec le Hero (§1.2) : `accent-deco`, ornemental (l'encadrement fonctionnel de l'image existe déjà via `overflow-hidden rounded-lg shadow-[...] bg-cgws-surface` — l'arche n'ajoute rien de structurel, uniquement une touche signature).

**Décision** : arche fine positionnée en surimpression du coin supérieur de l'image, **optionnelle** (peut être retirée en implémentation si le rendu final la juge superflue une fois la vraie photo de Camille en place — actuellement un placeholder Unsplash).

```html
<div class="story-image-col order-1 md:order-2 relative">
  <svg
    class="pointer-events-none absolute -top-3 -left-3 w-16 h-16 md:w-20 md:h-20 z-10"
    viewBox="0 0 80 80" fill="none" aria-hidden="true"
  >
    <path d="M4 40 C4 16 24 4 40 4" stroke="var(--cgws-accent-deco)" stroke-width="1.5" stroke-linecap="round" />
  </svg>
  <div class="overflow-hidden rounded-lg shadow-[...] bg-cgws-surface">
    <!-- NuxtImg inchangé -->
  </div>
</div>
```
- Un simple quart d'arc en coin (pas un cadre complet autour de l'image, pour rester discret et ne pas concurrencer la photo elle-même).
- `aria-hidden="true"`, `pointer-events-none`.
- **Note produit, non bloquante** : à retirer si jugé redondant visuellement une fois la vraie photo de Camille livrée (actuellement un placeholder Unsplash, cf. commentaire existant dans le fichier).

### Wireframe (ASCII)

**Mobile 375px** (`order-1`/`order-2` : image d'abord, texte ensuite) :
```
┌─────────────────────────┐
│ ﹌ [photo Camille]       │  ← arche coin optionnelle
│    aspect-[4/5]         │
├─────────────────────────┤
│ ┃ Notre Passion         │  ← barre accent-deco + eyebrow
│ L'histoire de Camille   │  ← H2 Playfair 700
│ & CGWS                  │
│ Cavalière depuis…       │  ← corps de texte, max-w-[52ch]
│ [En savoir plus →]      │  ← CTA secondary (outline accent)
└─────────────────────────┘
```

**Tablet 768px / Desktop 1440px** : grille 2 colonnes, texte à gauche (`md:order-1`), image à droite (`md:order-2`), `items-center`, `gap-12 lg:gap-20`.

### Tailwind classes clés (récapitulatif, y compris corrections §3.2/§3.3)

```
Section: bg-cgws-ground pt-[clamp(3rem,8vw,6rem)] pb-8 md:pb-12
Barre eyebrow (corrigée): block w-0.5 h-5 bg-cgws-accent-deco flex-shrink-0
Eyebrow: font-eyebrow text-[13px] text-cgws-ink-soft uppercase tracking-[0.2em]
H2: font-serif font-bold text-cgws-ink leading-tight text-[28px] md:text-[36px] lg:text-[44px] max-w-[20ch]
Corps: font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed max-w-[52ch]
CTA: CgwsButton variant="secondary" → bg-transparent text-cgws-accent border-2 border-cgws-accent
Colonne image: relative (nouveau, pour ancrer l'arche optionnelle)
Cadre image: overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)] bg-cgws-surface
Arche coin (nouveau, optionnelle): pointer-events-none absolute -top-3 -left-3 w-16 h-16 md:w-20 md:h-20 z-10 — stroke var(--cgws-accent-deco)
```

### États

| État | Rendu |
|---|---|
| Default | Grille 2 colonnes, image + texte statiques |
| Scroll dans le viewport | Glissement latéral GSAP (`x: ±60`/`y: 40` mobile, `opacity: 0 → 1`, `once: true`) |
| `prefers-reduced-motion` | Animation désactivée, contenu visible directement (guard déjà en place) |
| Image en chargement | `NuxtImg loading="lazy"` — pas de skeleton dédié actuellement (section hors fold, lazy-load acceptable, pas de LCP ici) |

### Accessibilité

- H2 lié à la section via `aria-labelledby="story-heading"` — déjà en place, inchangé.
- Barre décorative et arche : `aria-hidden="true"` (existant pour la barre, à ajouter pour l'arche §3.3).
- Contraste corps de texte `ink` sur `ground` : 14.07:1 Élégante Jour / 14.18:1 Élégante Nuit / 13.45:1 Rugueux (AAA, doc maître §2.6) — marge très large.
- Contraste CTA secondary (`accent` sur `bg-transparent`, donc en pratique sur `ground`) : ≥5.6:1 dans les 3 rendus (doc maître §2.6).

---

## 4. Illustration selle — `SaddleIllustration.vue`

### Constat détaillé (audit du SVG actuel)

Le fichier a déjà été re-tokenisé mécaniquement (v2 `cgws-leather`/`cgws-copper` → v3), mais **sans audit fonctionnel décoratif/lisible** — hors périmètre puisque tout le SVG est un seul bloc `aria-hidden="true"` (aucun texte n'est jamais porté par cette illustration). Répartition actuelle :

| Élément | Classe actuelle | Rôle réel | Conforme ? |
|---|---|---|---|
| Contours des jupes, troussequin, pommeau, sous-fenders (structure de la selle) | `fill-cgws-edge stroke-cgws-ink` | Silhouette structurelle du dessin | ✓ `edge` correct pour un remplissage de forme structurelle ; `stroke-cgws-ink` fonctionne visuellement (trait fin sombre) mais **`ink` est sémantiquement le rôle "texte principal"**, pas un rôle de trait graphique — voir note mineure ci-dessous |
| Anneaux du médaillon (concho décoratif sur la jupe), points de sellier (tooling dots) | `stroke-cgws-accent` / `fill-cgws-accent` | 100% décoratif (ornement gravé, aucune information) | ✗ **à corriger** — `accent` réservé au texte lisible, jamais à un ornement dans un SVG entièrement `aria-hidden` |
| Coiffe du cornet (horn cap) | `fill-cgws-accent stroke-cgws-ink` | Élément de forme (accessoire métallique décoratif du dessin) | ✗ **à corriger** — même raisonnement, aucune information portée |
| Étriers (oxbow) | `fill-cgws-accent stroke-cgws-ink` | Élément de forme | ✗ **à corriger** |
| Ouverture intérieure des étriers | `fill-cgws-brand-tack` | Détail sombre, littéral de marque fixe | Acceptable en l'état (petit détail interne, littéral déjà défini, pas de nouveau token à introduire) mais **incohérent avec le reste de l'illustration qui est theme-aware** — voir §4.2 |

### 4.1 Correction requise — décoratif `accent` → `accent-deco`

Tous les éléments purement ornementaux (médaillon/couture, points de sellier, coiffe du cornet, étriers) doivent passer de `accent`/`stroke-cgws-accent`/`fill-cgws-accent` à `accent-deco`/`stroke-cgws-accent-deco`/`fill-cgws-accent-deco`. C'est une application directe de la règle §2.1 du doc maître : l'intégralité de ce SVG est `aria-hidden="true"`, aucun élément ne porte jamais de texte ou d'information fonctionnelle — tout doit donc être `accent-deco`, jamais `accent`.

```
Avant : stroke-cgws-accent (anneaux médaillon), fill-cgws-accent (points tooling, coiffe cornet, étriers)
Après : stroke-cgws-accent-deco, fill-cgws-accent-deco (mêmes éléments)
```

### 4.2 Recolorage vers un traitement silhouette theme-aware — décision de conception

Le tableau de cadrage `US-073` demandait littéralement : *« Remplacer/adapter la teinte vers `text-cgws-edge/30` »* (reprenant le traitement v2 `text-cgws-leather/30`, c'est-à-dire une silhouette monochrome en filigrane à opacité réduite). Le fichier actuel a évolué au-delà de ce traitement : il utilise désormais un dégradé radial (`seat-highlight`, valeurs hex fixes `#C8AB82`/`#7B3B1C` — **résidu v2 non migré**, voir §4.3) et des tons pleins multiples (`edge`, `ink`, `accent`), pas une silhouette monotone à `/30`.

**Décision retenue** : conserver le traitement multi-teintes actuel (silhouette de selle avec ombrage et détails, pas un simple filigrane plat) plutôt que de revenir à une silhouette `/30` uniforme, **sous réserve de la correction §4.1**. Justification : le dessin actuel a une lisibilité graphique (ombrage, reliefs) supérieure à un simple aplat à 30% d'opacité, et reste discret par sa position (`opacity-70 md:opacity-75` sur le wrapper parent dans `HeroSection.vue`, `hidden md:block`, coin de la photo). La demande `text-cgws-edge/30` du cadrage visait le traitement v2 d'origine (un seul `fill-current` à opacité réduite) — obsolète face à l'état actuel du fichier, plus élaboré. Ce n'est pas un refus de la directive mais une constatation que le fichier a été enrichi entre-temps et que revenir à un simple filigrane serait une régression visuelle.

### 4.3 Correction requise — dégradé radial en hex fixes (résidu v2 non migré)

```html
<!-- Actuel — hex v2 en dur, jamais migré -->
<radialGradient id="seat-highlight" cx="50%" cy="40%" r="50%">
  <stop offset="0%" stop-color="#C8AB82" />
  <stop offset="100%" stop-color="#7B3B1C" />
</radialGradient>
```

Ces deux valeurs hex correspondent exactement aux anciens tokens v2 `cgws-rope` (`#C8AB82`) et `cgws-leather` (`#7B3B1C`) codés en dur — un `<radialGradient>` SVG ne peut pas référencer une classe Tailwind, mais **peut** référencer une variable CSS via `stop-color="var(--cgws-...)"`. **Correction** :

```html
<radialGradient id="seat-highlight" cx="50%" cy="40%" r="50%">
  <stop offset="0%" stop-color="var(--cgws-surface-2)" />
  <stop offset="100%" stop-color="var(--cgws-edge)" />
</radialGradient>
```
- `surface-2` (ton clair de carte/survol) au lieu de l'ancien `rope` clair — cohérent avec le rôle "ton intermédiaire clair" que jouait `rope` en v2.
- `edge` (déjà utilisé pour les contours de l'illustration) au lieu de `leather` — cohérence avec le reste du dessin qui utilise déjà `edge` pour les mêmes surfaces adjacentes (jupes, pommeau, cornet).
- Rend le dégradé lui-même theme-aware (il variera desormais entre les 3 rendus comme le reste du SVG), corrigeant l'incohérence relevée en `SaddleIllustration.vue` où seul ce dégradé restait figé en v2 alors que tous les autres remplissages avaient déjà été migrés.

### Récapitulatif des classes (après corrections §4.1/§4.3)

```
Contours structurels (jupes, troussequin, pommeau, sous-fenders) : fill-cgws-edge stroke-cgws-ink
Dégradé assise : stop-color var(--cgws-surface-2) → var(--cgws-edge)
Médaillon/couture (anneaux, points tooling) : stroke-cgws-accent-deco / fill-cgws-accent-deco
Coiffe du cornet : fill-cgws-accent-deco stroke-cgws-ink
Étriers (oxbow) : fill-cgws-accent-deco stroke-cgws-ink
Ouverture intérieure étriers : fill-cgws-brand-tack (littéral fixe, inchangé — détail interne mineur)
```

### Point produit à confirmer Nathan/Camille (signalé, non bloquant)

> **Asset définitif à confirmer** : `SaddleIllustration.vue` est un SVG dessiné pour l'identité v2 ("sellerie western brute", silhouette de selle isolée). Le nouveau logo v3 s'articule autour d'une **cavalière de reining** — un vocabulaire visuel différent (figure humaine + cheval en mouvement, pas un objet de sellerie statique). Cette spec recolore l'asset existant à titre **conservatoire pour ce sprint** (corrections §4.1/§4.2/§4.3 ci-dessus, cohérence chromatique v3 uniquement) sans en remettre en cause la pertinence narrative. Décision finale (conserver la selle recolorée vs. commander/produire un nouvel asset aligné sur la cavalière du logo) à trancher par `product-owner`/Camille — déjà signalé dans `US-073-074-075-pages-outline.md` §US-073 et `DESIGN_SYSTEM_v3.md` §8.2, repris ici pour traçabilité au niveau composant.

### Animations GSAP (inchangées, déjà conformes)

- Flottement vertical du groupe (`saddle-group`, `y: -10`, yoyo infini, 3s).
- Rotation légère du cornet (`saddle-horn`, `rotationZ: 1.5`, 4.5s).
- Rotation légère des étriers (`saddle-stirrups`, `rotationZ: 2`, 2.8s).
- Toutes désactivées si `prefers-reduced-motion` (guard déjà en place) — pas de changement requis.

### Accessibilité

- `aria-hidden="true"` sur le `<svg>` racine — déjà en place, confirmé correct (illustration purement décorative, l'information "sellerie western" est déjà portée textuellement par le H1/eyebrow du Hero).
- Aucune mesure de contraste requise (élément 100% décoratif) — les corrections `accent → accent-deco` sont motivées par la **cohérence de rôle sémantique**, pas par un échec de contraste (`accent` passerait AA de toute façon s'il portait du texte, ce n'est pas le cas ici).

---

## 5. Diviseurs de section — synthèse

| Emplacement | Composant | `bgClass` | Justification |
|---|---|---|---|
| Entre `HeroSection` et `StatsBar` | `<StarDivider />` (nouveau) | `bg-cgws-ground` (défaut) | Fond identique des deux sections adjacentes |
| Entre `StatsBar` et `OurStorySection` | `<StarDivider />` (nouveau) | `bg-cgws-ground` (défaut) | Idem |
| Fin de page (après `OurStorySection`) | `<StarDivider />` (existant, conservé) | `bg-cgws-ground` (défaut) | Flourish de clôture éditoriale, déjà présent dans `index.vue` |

Aucun override de `bgClass` n'est nécessaire sur cette page : les trois sections partagent le même fond `bg-cgws-ground`, contrairement à une page qui alternerait `ground`/`surface` (auquel cas le `bgClass` du `StarDivider` devrait être ajusté section par section pour que la ligne `hairline` et le disque central `ground` du médaillon restent cohérents avec le fond réel derrière le diviseur).

---

## 6. Vérification dans les 3 rendus — checklist par section

| Section | `elegante-jour` | `elegante-nuit` | `rugueux` |
|---|---|---|---|
| Hero | Scrim/texte identiques (littéraux fixes, §1.3) — vérifier que le CTA primaire (`accent` = mauve `#8C4A56`) et l'arche (`accent-deco` = rose `#B76E79`) restent visibles sur le scrim sombre malgré un fond de page global clair | Idem visuellement — le Hero ne doit **pas** paraître "cassé" par rapport à un fond de page sombre alentour (transition Hero → premier `StarDivider` → `StatsBar` sombre doit rester fluide) | CTA primaire en laiton (`#CF8438`), arche en copper (`#B8650A`) — vérifier l'absence de confusion visuelle avec l'univers cuir/laiton du reste de la peau |
| `StarDivider` (×3) | Ligne `hairline` claire (`#D8C4A8`) sur fond `ground` clair — contraste de séparation visuelle suffisant (pas une mesure de texte, un repère visuel) | Ligne `hairline` sombre (`#4B3527`) sur fond `ground` sombre | Idem, `hairline` Rugueux (`#463322`) |
| StatsBar | Filigranes rose clair discrets, valeurs stat en mauve (`accent`) lisibles ≥4.5:1 (déjà mesuré §2.6) | Filigranes/valeurs en tons Nuit, vérifier que les filigranes `accent-deco` (`#C98B94`) ne se fondent pas trop dans un fond `ground` sombre proche (`#241811`) — contraste décoratif à confirmer visuellement | Filigranes copper sur fond très sombre — bon contraste décoratif attendu (`#1E140D` vs `#B8650A`) |
| Notre Histoire | Barre décorative + arche optionnelle en rose clair, cohérent avec le ton pastel de la peau | Barre/arche en rose Nuit — vérifier lisibilité sur la photo (fond image, pas un aplat) | Barre/arche en copper — bien distinct du reste (accent laiton) |
| SaddleIllustration | Dégradé assise clair→moyen (`surface-2` très clair Jour → `edge` brun) — silhouette assez pâle sur fond photo, vérifier qu'elle reste visible à `opacity-70/75` | Dégradé `surface-2`/`edge` Nuit, plus sombres — vérifier que la silhouette ne se fond pas trop dans une photo de fond potentiellement sombre elle-même | Dégradé `surface-2`/`edge` Rugueux, cohérent avec l'univers cuir sombre |

---

## 7. Accessibilité transversale (récapitulatif)

| Paire | Ratio (doc maître §2.6) | Statut |
|---|---|---|
| `ink` sur `ground` (corps de texte Notre Histoire) | 14.07:1 / 14.18:1 / 13.45:1 (Jour/Nuit/Rugueux) | ✓ AAA, marge large |
| `accent` sur `ground` (CTA primaire Hero, CTA secondary Notre Histoire, valeurs StatsBar) | 5.60:1 / 6.88:1 / 6.04:1 | ✓ AA |
| `on-accent` sur `accent` (texte bouton primary) | 6.13:1 / 6.88:1 / 5.70:1 | ✓ AA |
| `ink-soft` sur `ground` (labels StatsBar, eyebrow Notre Histoire) | 7.78:1 / — / 6.49:1 (Nuit non isolée dans le tableau, mesurée via `ink` uniquement — à confirmer QA) | ✓ AA (large marge) |
| `accent-deco` en usage texte (référence, ne s'applique à rien dans cette US — tout usage `accent-deco` ici est décoratif : arches, filigranes, barre verticale, médaillon selle) | 3.28:1 / — / 4.22:1 | ✗ sous AA — **conforme à l'usage**, aucun texte ne porte `accent-deco` sur la homepage après corrections §3.2/§4.1 |
| Littéraux `brand-cream`/`brand-espresso`/`brand-sand` (Hero, texte sur photo) | Non mesurés dans le doc maître (littéraux hors §2.6) | **À mesurer en implémentation/QA** — cf. §1.3, contraste attendu large mais non pré-calculé |

- Navigation clavier : les deux CTA du Hero et le CTA de Notre Histoire sont des `<NuxtLink>` rendus via `CgwsButton`, focusables nativement, `focus-visible:ring-2` déjà géré par le composant.
- `prefers-reduced-motion: reduce` : respecté dans les 3 fichiers (`HeroSection`, `StatsBar`, `OurStorySection`, `SaddleIllustration`) via le guard `window.matchMedia(...)` déjà en place avant tout `import('gsap')` — aucun changement requis.
- Décoratif : `aria-hidden="true"` sur l'arche Hero (nouveau), l'arche Notre Histoire (nouveau, optionnelle), les `FiligreeCorner` StatsBar (déjà géré par le composant), la barre verticale Notre Histoire (déjà en place), le SVG `SaddleIllustration` entier (déjà en place), les `StarDivider variant="divider"` (déjà géré par le composant).
- Hiérarchie de titres : un seul H1 (Hero), un seul H2 (`#story-heading`) — conforme, aucune section supplémentaire n'introduit de titre.

---

## Critères d'acceptation

```gherkin
Fonctionnalité : Homepage v3 "Cowgirl élégante"

  Contexte :
    Étant donné que je visite la page d'accueil ("/")

  Scénario : Rendu correct dans les 3 peaux
    Quand j'active successivement "Élégante Jour", "Élégante Nuit" et "Rugueux"
    Alors le Hero, la StatsBar, la section Notre Histoire et les diviseurs
      affichent des couleurs de rôle (ground/surface/ink/accent/accent-deco)
      cohérentes avec la peau active
    Et aucune classe Tailwind de token v2 (cgws-tack/leather/copper/rope/
      parchment/cream-v2/denim/rust/charcoal) n'est présente dans le rendu

  Scénario : Lisibilité du H1, de la tagline et des CTA du Hero
    Étant donné que le Hero est affiché avec sa photo de fond et son scrim
    Quand je mesure le contraste du H1 ("text-cgws-brand-cream") et de la
      tagline contre le scrim ("brand-espresso/90" à "/40")
    Alors le ratio est supérieur ou égal à 4.5:1 dans les 3 rendus
    Et le CTA primaire ("accent"/"on-accent") atteint un ratio ≥ 4.5:1
    Et le H1 s'affiche en Playfair Display graisse 700 ("font-bold" présent)

  Scénario : Lisibilité des statistiques
    Étant donné que la StatsBar est visible à l'écran
    Quand les compteurs GSAP se déclenchent
    Alors chaque valeur numérique ("text-cgws-accent") atteint un contraste
      ≥ 4.5:1 sur le fond "ground" dans les 3 rendus
    Et chaque médaillon expose un "role=img" avec un "aria-label" complet
      ("{valeur}{suffixe} {label}")

  Scénario : Diviseurs StarDivider en place
    Alors la page affiche exactement 3 instances de "StarDivider"
      en "variant=divider" : après le Hero, après la StatsBar,
      après la section Notre Histoire
    Et chaque diviseur porte "aria-hidden=true"

  Scénario : Filigranes discrets et non envahissants
    Étant donné que la StatsBar est affichée
    Alors au maximum 2 "FiligreeCorner" sont visibles simultanément dans le viewport
    Et chaque filigrane porte "aria-hidden=true" et une opacité ≤ 60%
    Et aucun filigrane ne chevauche visuellement le texte des statistiques

  Scénario : Éléments purement décoratifs jamais en "accent"
    Alors la barre verticale décorative de l'eyebrow "Notre Passion" utilise
      "bg-cgws-accent-deco" (pas "bg-cgws-accent")
    Et le médaillon, les points de tooling, la coiffe de cornet et les étriers
      de "SaddleIllustration" utilisent "accent-deco" (pas "accent")
    Et l'arche fine du Hero et l'arche optionnelle de Notre Histoire utilisent
      "stroke: var(--cgws-accent-deco)"

  Scénario : Arche fine du Hero correctement cadrée
    Étant donné que le Hero est affiché
    Alors l'arche SVG encadre uniquement le bloc eyebrow + H1
    Et une marge d'au moins 24px sépare le trait de l'arche du texte
    Et l'arche porte "aria-hidden=true"

  Scénario : Animations respectent la préférence de mouvement réduit
    Étant donné que le système signale "prefers-reduced-motion: reduce"
    Quand je charge la page d'accueil
    Alors aucune animation GSAP ne se déclenche (Hero, StatsBar, Notre
      Histoire, SaddleIllustration)
    Et tout le contenu (texte, stats, image) est immédiatement visible
      sans état intermédiaire "opacity: 0"

  Plan du scénario : Responsive
    Étant donné que j'affiche la page d'accueil à la largeur <largeur>
    Alors le Hero occupe "h-[100svh]" avec le contenu ancré <position>
    Et la StatsBar affiche une grille <grille>
    Et Notre Histoire affiche <colonnes> avec l'image en <ordre_image>

    Exemples :
      | largeur | position                | grille          | colonnes | ordre_image |
      | 375px   | bas (justify-end)       | grid-cols-2     | 1 colonne | en premier   |
      | 768px   | bas (justify-end)       | grid-cols-4     | 1 colonne | en premier   |
      | 1440px  | centré (justify-center) | grid-cols-4     | 2 colonnes | à droite     |
```
