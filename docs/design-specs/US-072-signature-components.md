# Composants signature v3 — Spec UX (US-072)

**Purpose** : Spec détaillée des composants qui portent l'identité visuelle "Cowgirl élégante" : `TagCard` (re-skin), `StarDivider` (nouveau, remplace `ConchoDivider` + `ConchoStat`), arabesques filigranées, boutons, badges (y compris l'état "Refusé" et les états d'erreur de formulaire, portés par le nouveau rôle `danger`). Tous doivent être beaux et lisibles dans les 3 rendus (`elegante-jour`, `elegante-nuit`, `rugueux`).
**Dépend de** : `US-070` (tokens en place, y compris `danger`/`on-danger`).
**Rappel permanent** : `accent-deco` (rose/copper) = décoratif uniquement, jamais de texte lisible. `accent` (mauve/laiton) et `danger` (bordeaux/rose clair/brique) = tout texte lisible (CTA, prix, liens, erreurs, refus). Cf. `DESIGN_SYSTEM_v3.md` §2.1 et §2.6 pour les ratios mesurés.

---

## 1. TagCard (re-skin)

**Location** : `app/components/ui/TagCard.vue` (fichier existant, re-skin en place — pas de renommage, props/emits inchangés : `product: Product`, `emit('click', product)`).

### Layout (ASCII wireframe, ~240px de large)

```
         ●                      ← perforation : bg-cgws-ground border border-cgws-edge
┌────────┴────────────────────┐  ← bg-cgws-surface border-2 border-cgws-edge rounded-[6px]
│                             │
│  ┌──────────────────────┐   │  ← NuxtImg aspect-[4/3] object-cover rounded-t-[4px]
│  │       [image]         │   │
│  └──────────────────────┘   │
│                             │
│  ╔ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╗  │  ← border-dashed border-cgws-accent-deco (décoratif)
│  ╎  [CONSIGNATION]       ╎  │  ← badge statut
│  ╎  Selle western        ╎  │  ← Playfair Display 600, text-cgws-ink
│  ╎  Prestige             ╎  │  ← Inter 13px, text-cgws-ink-soft
│  ╎              850 €    ╎  │  ← Playfair Display 700 tabular-nums, text-cgws-accent
│  ╚ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╝  │
└─────────────────────────────┘
```

### Breakpoints

- Mobile 375px : grille 1 colonne, carte pleine largeur.
- Tablet 768px : grille 2 colonnes.
- Desktop 1440px : grille 3–4 colonnes.

### États

| État | Rendu |
|---|---|
| Default | `shadow-sm` |
| Hover | `translateY(-4px)`, `shadow-lg shadow-cgws-edge/20`, transition 200ms `ease-in-out` |
| Focus | `ring-2 ring-cgws-accent` (pas `accent-deco` — le focus ring porte une fonction, donc doit rester lisible/repérable à ≥3:1 UI) |
| Vendu (`status === 'sold'`) | Overlay `bg-cgws-ink/20`, image en `grayscale`, badge "Vendu" en `accent` plein |
| Image manquante | Fond `bg-cgws-surface-2`, icône selle SVG `text-cgws-edge/40` centrée |
| Chargement (skeleton) | `ProductCardSkeleton.vue` — pulse `bg-cgws-surface-2`, forme identique à la carte finale (perforation + bloc couture en placeholders gris) |

### Tailwind classes (clés)

**Carte** :
```
relative flex flex-col
bg-cgws-surface border-2 border-cgws-edge rounded-[6px]
overflow-hidden cursor-pointer
transition-transform transition-shadow duration-200 ease-in-out
hover:-translate-y-1 hover:shadow-lg hover:shadow-cgws-edge/20
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
```

**Perforation** :
```
absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full
bg-cgws-ground border border-cgws-edge z-10
```

**Bloc couture** :
```
m-2 p-3 border border-dashed border-cgws-accent-deco rounded-sm
flex flex-col gap-1.5
```

**Titre produit** :
```
font-serif font-semibold text-base text-cgws-ink leading-snug line-clamp-2 mt-1.5
```
> Note : le titre produit utilise **Playfair Display, jamais Rye** (règle typographique v3 — titre potentiellement long/dynamique). Voir `DESIGN_SYSTEM_v3.md` §3.

**Marque** :
```
font-sans text-[13px] text-cgws-ink-soft
```

**Prix** :
```
font-display text-2xl tabular-nums text-cgws-accent text-right mt-auto
```
> Rupture volontaire vs v2 : le prix utilisait `text-cgws-copper` (3.03:1, tolérance "large text" uniquement). En v3, le prix utilise `text-cgws-accent`, qui atteint ≥5.6:1 dans les 3 rendus — plus de tolérance nécessaire, l'AA texte normal est respecté même si la taille de police change.

### Accessibilité

- `role="article"`, `aria-label="Produit : {title}, {brand}, Prix : {price} €"` (inchangé).
- Contraste titre `ink` sur `surface` : à vérifier en implémentation (paire non pré-calculée dans le doc maître qui mesure `ink` sur `ground`, pas `surface` — `surface` étant plus clair/proche de `ground`, l'écart est mineur mais QA doit confirmer ≥4.5:1 réel).
- Contraste prix `accent` sur `surface` : idem, à re-vérifier (mesuré sur `ground` dans le doc maître).

### Animation GSAP (inchangée du v2, `onMounted`)

```
Entrée en scroll (ScrollTrigger, once: true) : { opacity: 0, y: 20 } → { opacity: 1, y: 0 }, 400ms, power2.out
Nettoyage du contexte GSAP dans onUnmounted (déjà en place dans TagCard.vue actuel)
```

---

## 2. StarDivider (nouveau — remplace ConchoDivider + ConchoStat)

**Location** : `app/components/ui/StarDivider.vue` (nouveau fichier) — supprime `ConchoDivider.vue` et `ConchoStat.vue`.
**Décision de conception** (cf. `DESIGN_SYSTEM_v3.md` §8.2) : un seul composant, deux variantes, plutôt que deux composants séparés — les deux usages partagent le même motif géométrique (étoile 8 branches), seule l'échelle et le contenu central changent.

### Props TypeScript

```ts
interface Props {
  variant?: 'divider' | 'stat'   // défaut: 'divider'
  // — props actives seulement si variant === 'stat' —
  value?: number | string
  label?: string
  suffix?: string
  animateOnVisible?: boolean
  // — commun —
  bgClass?: string   // classe de fond derrière le diviseur, défaut bg-cgws-ground
}
```

### Motif géométrique — étoile-boussole 8 branches

- 4 branches longues cardinales (N/S/E/W), 4 branches courtes diagonales (NE/SE/SW/NW).
- Remplissage (`fill`) : `accent-deco` — usage décoratif pur, conforme à la règle de contraste (aucun texte porté par l'étoile elle-même).
- Centre : petit disque "poinçonné" couleur `ground` (donne l'effet métal découpé/repoussé), bordure fine `edge`.

### Layout — `variant="divider"` (remplace ConchoDivider)

```
────────────────────  ✦  ────────────────────
   ↑ border-t hairline   ↑ étoile 20px, fill accent-deco
```

Classes clés :
```
Conteneur: flex items-center gap-4 max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] py-6 md:py-8
Lignes: flex-1 border-t border-cgws-hairline
Étoile: w-5 h-5 flex-shrink-0 (SVG inline, fill="var(--cgws-accent-deco)", centre fill="var(--cgws-ground)")
```

### Layout — `variant="stat"` (remplace ConchoStat)

```
        ✦ (branche N, longue)
   ↖         ↗
 ⟨   ╭─────────╮   ⟩
     │         │
     │   250   │  ← Playfair Display 700 tabular-nums, text-cgws-accent
     │  selles │  ← font-eyebrow, text-cgws-ink-soft (onDark: text-cgws-ink-soft reste valide, cf. accessibilité)
     ╰─────────╯
   ↙         ↘
        ✦ (branche S, longue)
```

Dimensions :

| Breakpoint | Diamètre |
|---|---|
| Mobile 375px | 80px |
| Desktop 1024px+ | 100px |

Classes clés :
```
Wrapper: relative inline-flex items-center justify-center w-20 h-20 md:w-[100px] md:h-[100px]
Cercle extérieur: absolute inset-0 rounded-full border-2 border-cgws-accent-deco
Anneau intérieur pointillé: absolute inset-[6px] rounded-full border border-dashed border-cgws-accent-deco/50
Branches (SVG, 8 polygones, fill accent-deco): 4 longues cardinales (N/S/E/W) + 4 courtes diagonales (NE/SE/SW/NW)
Contenu central: relative z-10 flex flex-col items-center justify-center
Valeur: font-display text-3xl md:text-[32px] tabular-nums text-cgws-accent leading-none
Label: font-eyebrow text-[10px] md:text-[11px] text-cgws-ink-soft uppercase tracking-wider text-center
```

> Rupture volontaire vs v2 ConchoStat : la valeur numérique utilisait `text-cgws-copper` (décoratif à l'époque, sans distinction de rôle) ; en v3 elle utilise `text-cgws-accent` car c'est un texte lisible porteur d'information (statistique), conformément à la règle de contraste. Les branches et cercles restent `accent-deco` car purement décoratifs.

### États

| État | Rendu (variant="stat") |
|---|---|
| Default | Cercle et branches statiques |
| `animateOnVisible` | Counter GSAP `0 → value`, 1.5s, `power2.out`, déclenché par ScrollTrigger, `once: true` |
| Sans valeur | Skeleton pulse `bg-cgws-surface-2` |

| État | Rendu (variant="divider") |
|---|---|
| Default | Statique, `aria-hidden="true"` (purement décoratif entre sections) |

### Accessibilité

- `variant="divider"` : `aria-hidden="true"` sur tout le composant (rôle purement visuel de séparation, la structure de titres HTML porte déjà la hiérarchie).
- `variant="stat"` : `role="img"` + `aria-label="{value}{suffix} {label}"` sur le conteneur ; le SVG décoratif interne reste `aria-hidden="true"`.
- Contraste label (`ink-soft` sur le fond de section, généralement `ground`) : cf. mesures §2.6 du doc maître (7.78:1 Élégante Jour, marge large).
- Contraste valeur (`accent` sur `ground`) : ≥5.6:1 dans les 3 rendus (cf. doc maître §2.6) — conforme même en petite taille, pas besoin de la tolérance "large text".

### Animation GSAP

Identique au `ConchoStat` v2 (compteur), nettoyage `onUnmounted` obligatoire.

---

## 3. Arabesques filigranées (nouveau)

**Location** : `app/components/ui/FiligreeCorner.vue` (nouveau, décoratif).

- SVG statique, motif végétal/linéaire fin inspiré de la gravure de selle, `stroke="var(--cgws-accent-deco)"` `fill="none"`, `stroke-width` 1–1.5px.
- Usage : coins de section (`absolute top-0 left-0`, `rotate-90`/`scale-x-[-1]` pour varier les coins), en-têtes de bloc (`Certificat élégant`, hero).
- Toujours `aria-hidden="true"`, jamais porteur d'information.
- Opacité réduite recommandée (`opacity-40` à `opacity-60`) pour rester discret — ne doit jamais concurrencer le texte en lisibilité.
- Ne pas dupliquer plus de 2 filigranes visibles simultanément par viewport (risque de surcharge visuelle, contraire au principe "premium, generous whitespace").

---

## 4. Arche fine (nouveau — cadre de hero et d'en-têtes)

**Location** : utilisé en `HeroSection.vue` et en-têtes de page (`CatalogueHeader.vue`, etc.) — pas un composant séparé, un motif SVG/CSS réutilisable via un composant `ArchFrame.vue` optionnel si dupliqué ≥3 fois.

- Ligne fine (1–1.5px) en arc, `stroke="var(--cgws-edge)"` (structurel, pas décoratif pur — peut aussi servir de cadre fonctionnel) ou `accent-deco` si purement ornemental sans fonction de cadrage.
- Positionnée en haut du hero, englobant le titre H1, sans jamais toucher le texte (marge intérieure ≥24px).
- `aria-hidden="true"`.

---

## 5. Boutons — `CgwsButton.vue` (re-skin)

**Location** : `app/components/ui/CgwsButton.vue` (fichier existant, props inchangées : `variant: 'primary'|'secondary'|'ghost'|'outline-light'`, `size`, `disabled`, `loading`, `as`, `href`, `to`).

### Variants — classes Tailwind

**Primary** (action principale — CTA catalogue, consignation) :
```
bg-cgws-accent text-cgws-on-accent
font-display uppercase tracking-widest text-[18px]
px-6 py-3 rounded-[--ui-radius]
transition-colors duration-150 ease-in-out
hover:bg-cgws-accent/90 active:bg-cgws-accent/80
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2
disabled:opacity-40 disabled:cursor-not-allowed
```
> Rupture vs v2 : plus de `text-cgws-charcoal`/`hover:bg-cgws-leather` — le couple `accent`/`on-accent` est conçu dès l'origine pour rester AA quel que soit le rendu actif (cf. doc maître §2.6, 5.6 à 6.9:1 selon rendu), donc pas de correction ad hoc nécessaire comme en v2.

**Secondary** (action alternative — réservé Rugueux, contre-accent denim ; en Élégante devient un outline `accent`, cf. décision `US-070` §6) :
```
/* Rugueux */
bg-transparent text-cgws-denim border-2 border-cgws-denim
font-sans font-semibold uppercase tracking-wide
hover:bg-cgws-denim/10 active:bg-cgws-denim/20
focus-visible:ring-cgws-accent

/* Élégante — outline accent (pas de denim hors Rugueux, cf. règle "denim très parcimonieux, Rugueux uniquement") */
bg-transparent text-cgws-accent border-2 border-cgws-accent
font-sans font-semibold uppercase tracking-wide
hover:bg-cgws-accent/10 active:bg-cgws-accent/20
focus-visible:ring-cgws-accent
```
> Point à confirmer avec `product-owner` (cf. `DESIGN_SYSTEM_v3.md` §7) : cette double implémentation "secondary" theme-aware (denim en Rugueux, outline accent en Élégante) est une proposition, pas une prescription client explicite — le brief ne mentionne le bouton secondary qu'implicitement via "boutons (primary/secondary/ghost)" sans détail chromatique par peau.

**Ghost** :
```
bg-transparent text-cgws-ink-soft
font-sans font-medium text-sm
underline-offset-4 hover:text-cgws-accent hover:underline
focus-visible:ring-cgws-accent
```

**Destructive** (nouveau variant, non présent dans les props actuelles — cf. note ci-dessous) — action irréversible : suppression produit/consignation, confirmation de refus (`RejectModal`, `US-075`) :
```
bg-cgws-danger text-cgws-on-danger
font-sans font-semibold uppercase tracking-wide text-sm
px-5 py-2 rounded-[--ui-radius]
transition-colors duration-150 ease-in-out
hover:bg-cgws-danger/90 active:bg-cgws-danger/80
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-danger focus-visible:ring-offset-2
disabled:opacity-40 disabled:cursor-not-allowed
```
> `CgwsButton.vue` n'a actuellement pas de variant `destructive` dans ses props (`'primary'|'secondary'|'ghost'|'outline-light'`). Le bouton "Confirmer le refus" de `RejectModal.vue` est aujourd'hui codé en dur (`bg-cgws-rust text-white hover:bg-cgws-charcoal`, cf. `US-075`) plutôt que de passer par `CgwsButton`. Recommandation : ajouter formellement `variant: 'destructive'` à `CgwsButton` dans le cadre de `US-075` (plutôt que de laisser `RejectModal` avec des classes en dur remappées 1:1), pour que toute action destructive future (suppression produit en admin, etc.) réutilise le même composant. Décision d'implémentation à confirmer avec `nuxt-developer`, pas bloquante pour `US-072`.

### États

Identiques structurellement au v2 (hover/active/focus/loading/disabled), seules les couleurs changent — cf. tableau `US-003` §4.1 pour la structure, remplacer chaque token v2 par son équivalent v3 selon §7 du doc maître.

### Accessibilité

- Contraste bouton primary : `on-accent` sur `accent` ≥5.6:1 dans les 3 rendus (mesuré, doc maître §2.6) — **aucune exception nécessaire**, contrairement à v2 qui devait corriger `text-white` en `text-cgws-charcoal`.
- Contraste bouton destructive : `on-danger` sur `danger` ≥5.0:1 dans les 3 rendus (mesuré, doc maître §2.6, y compris la valeur Rugueux ajustée) — même garantie que le bouton primary, aucune exception nécessaire.

---

## 6. Badges statut — `CgwsBadge.vue` (re-skin)

**Location** : `app/components/ui/CgwsBadge.vue` (existant, props à étendre : `variant: 'new'|'occasion'|'consignment'|'sold'` → ajouter `'rejected'` pour couvrir le statut "Refusé" des consignations, cf. `ConsignmentStatus` dans `app/types/index.ts`).

| Variant | Rendu | Classes clés |
|---|---|---|
| `new` (Neuf) | Outline `ink`, fond transparent | `bg-transparent text-cgws-ink border border-cgws-ink/60` |
| `occasion` | Neutre — **reste neutre, jamais `danger`** (occasion n'est pas une alerte) | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` |
| `consignment` (Consignation) | Accent signature — fond doux + bordure décorative | Élégante : `bg-cgws-brand-blush text-cgws-ink border border-cgws-accent-deco` · Rugueux : `bg-cgws-accent/15 text-cgws-ink border border-cgws-accent-deco` (décision §8.2 doc maître — `brand-blush` remplacé en Rugueux, incohérent dans l'univers cuir/laiton) |
| `sold` (Vendu) | Accent plein | `bg-cgws-accent text-cgws-on-accent` |
| `rejected` (Refusé) — **nouveau** | Danger plein | `bg-cgws-danger text-cgws-on-danger` |

Structure commune :
```
inline-flex items-center gap-1.5 rounded-full px-3 py-1
font-sans font-medium text-[11px] uppercase tracking-wider
```

### 6.1 États d'erreur de formulaire (`danger`) — `CgwsInput`/`CgwsTextarea`/`CgwsSelect`

**Location** : `app/components/ui/CgwsInput.vue`, `CgwsTextarea.vue`, `CgwsSelect.vue` (re-skin, props inchangées, notamment `error?: string`).

Remplacement direct de l'ancien état d'erreur `cgws-rust` par `cgws-danger`, sans changement de structure :

```
Label (inchangé) : block font-sans font-medium text-sm text-cgws-ink mb-1.5

Input — état default :
w-full bg-cgws-ground text-cgws-ink border border-cgws-edge rounded-[--ui-radius]
px-3 py-2.5 font-sans text-sm
placeholder:text-cgws-ink-soft/60
focus:border-cgws-accent focus:ring-3 focus:ring-cgws-accent/20 outline-none
disabled:opacity-50 disabled:cursor-not-allowed

Input — état error (classes ajoutées) :
border-cgws-danger focus:border-cgws-danger focus:ring-cgws-danger/20

Message d'erreur :
mt-1 font-sans text-xs text-cgws-danger
role="alert" (si le message apparaît dynamiquement après validation, cf. RejectModal §US-075)
```

### Accessibilité

- Contraste `new` : `ink` sur transparent → dépend du fond parent, vérifier en contexte (généralement `surface` de TagCard, `ink` y est mesuré ≥4.5:1 par extension du calcul `ink`/`ground`).
- Contraste `occasion` : `ink-soft` sur `surface-2` — **à mesurer en implémentation**, paire non pré-calculée dans le doc maître (qui mesure `ink-soft` sur `ground`, pas `surface-2`).
- Contraste `consignment` : `ink` sur `brand-blush` (#E8C4CB, Élégante) — **à mesurer en implémentation**, `brand-blush` est un littéral non inclus dans les mesures §2.6 du doc maître ; probable passage AA vu la clarté du fond mais non vérifié analytiquement ici, bloquant pour QA avant merge.
- Contraste `sold` : `on-accent` sur `accent` ≥5.6:1 (déjà mesuré, doc maître §2.6).
- Contraste `rejected` : `on-danger` sur `danger` ≥5.0:1 dans les 3 rendus (déjà mesuré, doc maître §2.6, y compris la valeur Rugueux ajustée `#D66F3E`).
- Contraste message d'erreur formulaire : `danger` sur `ground` ≥5.34:1 et sur `surface` ≥4.72:1 dans les 3 rendus (déjà mesuré, doc maître §2.6) — aucune vérification supplémentaire requise, contrairement aux paires `occasion`/`consignment` ci-dessus qui restent à mesurer.

---

## 7. Certificat élégant (section consignation)

**Location** : section dans `app/pages/consignation.vue` (remplace le bloc "wanted poster" existant, spec complète page par page dans `US-075` — ici uniquement le motif visuel du cadre).

### Layout (ASCII, desktop)

```
╔═══════════════════════════════════════════════════╗   ← double bordure accent-deco
║ ┌───────────────────────────────────────────────┐ ║
║ │                    ✦                           │ ║   ← StarDivider variant="divider" (grand format) ou étoile seule
║ │           LE CERTIFICAT DE CONSIGNATION         │ ║   ← Rye, font-heading, text-cgws-heading, court
║ │                                                 │ ║
║ │   Confiez-nous votre selle. Nous évaluons,      │ ║   ← Playfair Display Italic, tagline
║ │   valorisons, et vendons pour vous.             │ ║
║ │                                                 │ ║
║ │   [Texte explicatif Inter — corps]              │ ║   ← Inter, text-cgws-ink
║ │                                                 │ ║
║ │        [ Déposer ma selle → ]                   │ ║   ← CgwsButton primary — accent/on-accent
║ └───────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════╝
```

### Classes clés

```
Conteneur externe: border-2 border-cgws-accent-deco rounded-lg p-1
Conteneur interne: border border-cgws-accent-deco/60 rounded-md p-8 md:p-12 bg-cgws-surface
Titre: font-heading text-3xl md:text-4xl text-cgws-heading text-center uppercase tracking-wide
Tagline: font-serif italic text-lg text-cgws-ink-soft text-center max-w-prose mx-auto
Corps: font-sans text-base text-cgws-ink leading-relaxed max-w-prose mx-auto
CTA: CgwsButton variant="primary" (accent/on-accent, jamais accent-deco — c'est du texte lisible)
```

### Accessibilité

- Titre Rye ≤4 mots ("Le Certificat de Consignation" = 4 mots, limite acceptable ; si le contenu final dépasse, basculer sur Playfair Display 700 selon la règle §3 du doc maître).
- Double bordure = purement décorative (`accent-deco`), `aria-hidden` non nécessaire sur les bordures elles-mêmes (elles font partie du fond visuel, pas de balise dédiée) mais le SVG étoile interne doit être `aria-hidden="true"`.
- CTA en `accent`/`on-accent`, jamais en `accent-deco` — la consignation étant "LE différenciateur métier", le bouton doit être impeccablement lisible, pas seulement décoratif.

---

## 8. Breakpoints généraux (rappel, tous composants de cette US)

| Breakpoint | Comportement |
|---|---|
| Mobile 375px | Composants en colonne unique, `StarDivider variant="stat"` en 80px, certificat en `p-8`, filigranes réduits/masqués si surcharge |
| Tablet 768px | TagCard 2 colonnes, certificat `p-10` |
| Desktop 1440px | TagCard 3–4 colonnes, `StarDivider variant="stat"` en 100px, certificat `p-12`, filigranes visibles aux coins |

## 9. Rendu dans les 3 peaux — vérification requise

Chaque composant de cette US doit être vérifié visuellement (captures ou revue QA) dans les 3 rendus avant merge : `elegante-jour`, `elegante-nuit`, `rugueux`. Points d'attention particuliers :
- `TagCard` et le `Certificat élégant` en Rugueux — s'assurer que `brand-blush` n'y apparaît nulle part (cf. §6) et que l'esthétique reste cohérente avec le monde cuir/laiton (pas de résidu visuel "pastel").
- Badge `rejected` et bouton `destructive` en Rugueux — vérifier visuellement que `#D66F3E` (danger ajusté) reste lisible comme "alerte/refus" et ne se confond pas avec `accent` (laiton `#CF8438`) ou `accent-deco` (copper `#B8650A`), les trois étant dans la même famille chromatique chaude. Si la distinction visuelle est jugée insuffisante en revue, remonter à `product-owner`/client avant généralisation — ce n'est pas un problème de contraste texte (les trois passent AA indépendamment) mais un risque de confusion sémantique entre rôles.
