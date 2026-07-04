# Header / Footer / Contact / Cohérence Admin v3 « Cowgirl élégante » — Spec UX (US-075)

**Purpose** : (A) rendre `AppHeader`/`AppFooter`/`MobileMenu` theme-aware (suivent jour/nuit, plus de bandeau sombre fixe) ; (B) re-skin de la page Contact et de `ContactMap` ; (C) mise en cohérence de tout le backoffice admin — switcher disponible partout, sidebar/topbar non figées, taxonomie de statuts `DESIGN_SYSTEM_v3.md` §4.1 appliquée sans divergence, `RejectModal` migré vers `danger`/`CgwsButton variant="destructive"`. C'est la dernière US de fond du rebranding Sprint 6 — après elle, plus aucun écran du site (public ou admin) ne doit contenir de token v2 ni de fond figé sur une seule peau.
**Location** (fichiers audités/corrigés, re-skin en place — pas de refonte structurelle) :
- `app/components/layout/AppHeader.vue`, `AppFooter.vue`, `MobileMenu.vue`, `ThemeSwitcher.vue`
- `app/composables/useScrollHeader.ts` (lecture seule, aucun changement)
- `app/pages/contact.vue`, `app/components/ui/ContactMap.vue`
- `app/layouts/admin.vue`
- `app/components/admin/*.vue` (`KpiCard`, `StatusDropdown`, `SaleModal`, `SaleForm`, `RejectModal`, `ProductForm`, `RecentActivity`, `ClientCard`, `ClientAutocomplete`, `ImageUploader`, `CategoryPanel`, `CategoryTree`, `CategoryTreeItem`, `RevenueChart`)
- `app/pages/admin/**/*.vue` (dashboard, produits, consignations, ventes, clients, rapports, login, categories)

**Dépend de** : `US-070` (tokens), `US-071` (`ThemeSwitcher`, `useCgwsSkin`), `US-072` (`CgwsButton variant="destructive"`, `CgwsBadge`, états d'erreur `danger`).

**Constat de départ (audit du code actuel — important)** : contrairement à l'hypothèse de `US-073-074-075-pages-outline.md` (qui décrivait un état v2 attendu — `bg-cgws-tack` fixe, `bg-cgws-parchment` figée), l'essentiel du code a **déjà été re-tokenisé** vers les rôles v3 lors des passages `US-070`/`US-071` : header/footer utilisent déjà des rôles theme-aware, la sidebar/topbar admin ne sont **pas** figées sur `tack`/`parchment`, `ThemeSwitcher` est déjà intégré en desktop/mobile/topbar admin, `CgwsButton` a déjà un variant `destructive`, `CgwsInput`/`RejectModal` utilisent déjà `danger`. Cette spec **audite** donc cet état réel plutôt que de partir d'une hypothèse v2, et documente quatre catégories de corrections réelles trouvées :
1. **Tranchage manquant** — header/footer sur `bg-cgws-ground` (identique au fond de page) au lieu de `bg-cgws-surface` (bande de chrome distincte), contredisant la justification même de la décision client §8.1 ("légèrement distinct du fond de page pour la lisibilité au scroll").
2. **Régression d'accessibilité non théorique** — `bg-white` codé en dur dans **~35 emplacements** à travers la quasi-totalité des composants et pages admin (cartes, panneaux, modales, tables, dropdowns) : ces fonds ne suivent aucune peau, restent blancs même en Nuit/Rugueux.
3. **Violations de taxonomie de statut** (`DESIGN_SYSTEM_v3.md` §4.1) dans **trois implémentations locales divergentes** (`StatusDropdown.vue`, `app/pages/admin/consignations/index.vue`, `RecentActivity.vue`) qui chacune réinventent leur propre mapping statut→couleur au lieu de réutiliser `CgwsBadge.vue` (déjà conforme, cf. §C.8).
4. **Points déjà résolus, à ne pas re-corriger** — le point US-071 "reporté" (`ClientOnly` sans garde `colorMode.forced`) est **partiellement** résolu (la garde `skin === 'elegante'` existe mais pas `!colorMode?.forced`) ; `RejectModal` utilise déjà `danger` pour l'icône/astérisque/bordure mais **pas** encore `CgwsButton variant="destructive"` pour le bouton de confirmation.

Chaque section liste : ce qui est déjà conforme (aucune action), ce qui doit changer (correction précise avec classes), et les points à confirmer avec `product-owner`.

---

# BLOC A — Header / Footer / MobileMenu (public, theme-aware)

## A.0 Décision client rappelée et tranchage retenu

`DESIGN_SYSTEM_v3.md` §8.1 décision 2 : *« Header & footer suivent jour/nuit (pas de bandeau sombre fixe) »*. Le tableau `US-073-074-075-pages-outline.md` §US-075 propose `bg-cgws-surface` pour le header et laisse `bg-cgws-ground`/`bg-cgws-surface` ouvert pour le footer.

**Décision tranchée par cette spec** : **header ET footer utilisent `bg-cgws-surface`** — une bande de chrome visuellement distincte du canevas de page `bg-cgws-ground` (utilisé par toutes les sections de contenu, cf. `US-073`/`US-074`). Justification :
- C'est l'analogue le plus fidèle de la hiérarchie v2 (`bg-cgws-tack` chrome sombre vs `bg-cgws-cream` contenu clair) : un rôle dédié au "chrome" distinct du contenu, pas une simple continuité de fond.
- Cohérent avec la justification donnée par le client lui-même pour le header ("distinct du fond de page pour la lisibilité au scroll") — un header en `ground` sur un site où **toutes** les sections publiques sont déjà en `ground` (cf. `US-073` §5, `US-074` §0) ne serait, dans les faits, jamais distinct de rien.
- Symétrie éditoriale header/footer : le site est "encadré" par une bande `surface` en haut et en bas, le contenu défile en `ground` entre les deux — lecture visuelle cohérente à travers les 3 rendus.
- `surface` reste proche de `ground` dans les 3 rendus (écart de luminance faible, cf. `DESIGN_SYSTEM_v3.md` §2.2–§2.4) : aucune rupture de contraste texte à anticiper, mais **à confirmer visuellement** (paires `ink`/`ink-soft`/`accent` sur `surface` non pré-mesurées dans le doc maître qui mesure surtout sur `ground`, même remarque que `US-072` §1 pour `TagCard`).

## A.1 `AppHeader.vue`

### Ce qui est déjà conforme (aucune action)
- Structure sticky, `useScrollHeader(50)`, transition `duration-300 ease-in-out` — inchangées.
- Bordure : `border-cgws-hairline` — déjà conforme à la prescription outline.
- Logo : `font-display text-cgws-accent` (wordmark), sous-titre `text-cgws-ink-soft` — déjà conforme.
- Liens nav : `text-cgws-ink-soft hover:text-cgws-accent`, `active-class="text-cgws-accent"` — déjà conforme (correspond exactement à la table de l'outline).
- Skip-link : `focus:bg-cgws-accent focus:text-cgws-on-accent` — bloc plein, pas de ring, donc **pas concerné** par la correction de `ring-offset` (contrairement à ce qu'anticipait l'outline, cf. §A.5 note).
- `ThemeSwitcher` déjà intégré desktop (`hidden lg:flex`, avant l'icône téléphone) — position conforme à `US-071` §2, aucune action.
- Icône téléphone, bouton hamburger, focus rings `ring-cgws-accent` — déjà conformes.

### Correction requise — fond `ground` → `surface` (§A.0)

```html
<!-- Avant -->
:class="[
  'sticky top-0 z-50 h-14 lg:h-16 flex items-center justify-between',
  'border-b transition-all duration-300 ease-in-out',
  isScrolled
    ? 'bg-cgws-ground/90 backdrop-blur-md border-cgws-hairline shadow-lg shadow-cgws-ink/20'
    : 'bg-cgws-ground border-cgws-hairline',
]"

<!-- Après -->
:class="[
  'sticky top-0 z-50 h-14 lg:h-16 flex items-center justify-between',
  'border-b transition-all duration-300 ease-in-out',
  isScrolled
    ? 'bg-cgws-surface/90 backdrop-blur-md border-cgws-hairline shadow-lg shadow-cgws-ink/20'
    : 'bg-cgws-surface border-cgws-hairline',
]"
```
Mécanique de scroll (`useScrollHeader`, seuil 50px) **inchangée** — seul le token change, pas le comportement. `useScrollHeader.ts` ne référence aucun token, aucune action sur ce fichier.

### Accessibilité
- Contraste `text-cgws-accent`/`text-cgws-ink-soft` sur `bg-cgws-surface` : à confirmer visuellement en implémentation (paires mesurées sur `ground` dans le doc maître, `surface` en est visuellement très proche dans les 3 rendus — écart mineur attendu, non bloquant mais à vérifier par QA comme pour `TagCard`, `US-072` §1).
- Focus visible `ring-cgws-accent` sur tous les liens/boutons — déjà conforme, aucune modification requise par le changement de fond (le ring ne dépend pas du fond sous-jacent ici, pas d'offset utilisé sur ces éléments).

## A.2 `AppFooter.vue`

### Ce qui est déjà conforme (aucune action)
- `StarDivider` déjà en place avant la barre de copyright (remplace l'ancien `ConchoDivider`) — conforme à la prescription outline, aucune action.
- Grille responsive 2/2/4 colonnes, `order-*` de réordonnancement — structure inchangée.
- Liens nav/légal : `text-cgws-ink-soft hover:text-cgws-accent`, `active-class="text-cgws-accent"` — conformes.
- Icônes de contact (`map-pin`, `phone`, `clock`, `mail`) : `text-cgws-accent` — conformes (icônes associées à un texte réel, pas de la pure décoration).
- Liens cliquables (téléphone, email, mentions légales, réseaux sociaux) : `text-cgws-ink-soft hover:text-cgws-accent` (ou `text-cgws-accent` direct pour tel/mailto) — conformes.
- Texte statique (adresse, horaires) : `text-cgws-ink-soft` — conforme.
- Séparateurs de colonnes mobile : `border-cgws-hairline` — conformes.

### Correction requise — fond `ground` → `surface` (§A.0)

```html
<!-- Avant -->
<footer class="bg-cgws-ground border-t-2 border-cgws-accent" aria-label="Pied de page CGWS">

<!-- Après -->
<footer class="bg-cgws-surface border-t-2 border-cgws-accent-deco" aria-label="Pied de page CGWS">
```

### Correction requise — bordure supérieure `accent` → `accent-deco`

Conforme à la table de l'outline (*« border-t-2 border-cgws-accent-deco (footer — décoratif) »*) : la bordure supérieure du footer est un simple filet décoratif, elle ne porte aucun texte. `accent` est réservé au texte lisible (§2.1 doc maître) ; un filet structurel/décoratif doit utiliser `accent-deco`, cohérent avec le traitement du filet du `Certificat élégant` (`US-072` §7) et de la barre verticale `OurStorySection` (`US-073` §3.2, correction identique `accent`→`accent-deco`). Voir bloc de code ci-dessus (changement combiné avec le fond).

### Correction requise — `focus-visible:ring-offset-cgws-ground` → `ring-offset-cgws-surface` (7 occurrences)

Conséquence directe du changement de fond §A.0 : tous les liens du footer (réseaux sociaux ×2, nav ×4, contact téléphone/email ×2, légal ×1 — 9 occurrences au total du motif `focus-visible:ring-offset-cgws-ground`) doivent recevoir un offset calé sur le **nouveau** fond réel du footer.

**Point d'implémentation initialement anticipé par l'outline (`focus-visible:ring-offset-cgws-tack` figé), mais constat différent en audit** : le code actuel n'utilise **pas** `ring-offset-cgws-tack` (déjà corrigé en amont, probablement lors de `US-070`/`US-071`) — il utilise déjà `focus-visible:ring-offset-cgws-ground`, cohérent avec le fond `ground` du footer *avant* la présente spec. Le point de vigilance de l'outline reste donc valide dans son principe (l'offset doit suivre le token de fond réel du composant) mais sa cible change : ce n'est plus `tack`→`ground`/`surface` à corriger, c'est **`ground`→`surface`** suite à la décision §A.0 ci-dessus.

```
Avant (×9 occurrences dans AppFooter.vue) :
focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground

Après :
focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-surface
```

### Accessibilité
- Contraste liens/textes sur `surface` : même remarque qu'`AppHeader` §A.1 — à confirmer visuellement, écart attendu mineur.
- `StarDivider` : `aria-hidden="true"` intégré au composant (`US-072` §2), aucune action.
- Hiérarchie de titres : aucun heading dans le footer (eyebrows `Navigation`/`Boutique`/`Informations` sont `aria-hidden="true"`, portés par des `<p>` — décision déjà en place, la structure `<ul role="list" aria-label="...">` porte l'information pour les lecteurs d'écran). Aucune action.

## A.3 `MobileMenu.vue`

### Ce qui est déjà conforme (aucune action)
- `ThemeSwitcher layout="stacked"` déjà intégré, au-dessus du bloc téléphone/email — position conforme à `US-071` §2 (*« mobile : dans MobileMenu »*).
- Panneau `bg-cgws-ground` (drawer) — **décision volontairement différente du header/footer** : contrairement à `AppHeader`/`AppFooter` (bande de chrome permanente, →`surface`, §A.0), `MobileMenu` est un panneau transitoire (overlay) qui doit rester cohérent avec le traitement déjà établi des autres drawers du site (`FilterDrawer` via `UDrawer`, `US-074` §2 : `content: 'bg-cgws-ground ...'`). Aucune action — la distinction chrome permanent (`surface`) vs overlay transitoire (`ground`) est une convention à documenter, pas une incohérence.
- Liens nav, séparateur "concho" central (cercle + trait `hairline`), contacts téléphone/email, `CgwsButton variant="primary"` (CTA consignation) — tous déjà conformes aux rôles v3.
- Focus trap clavier (`Tab`/`Shift+Tab`), fermeture `Escape`, restitution du focus au bouton hamburger — logique fonctionnelle inchangée, hors périmètre design.

### Point mineur signalé, non bloquant — backdrop en littéral fixe

```html
<div ref="backdropRef" class="fixed inset-0 z-60 bg-cgws-brand-espresso/60 backdrop-blur-sm" aria-hidden="true" @click="close" />
```

Ce backdrop utilise un littéral de marque fixe (`brand-espresso`, §2.5 doc maître) plutôt qu'un rôle theme-aware. **Incohérence mineure** avec le backdrop du `FilterDrawer` catalogue qui utilise `bg-cgws-ink/40` (theme-aware, `US-074` §2.2). Un backdrop d'overlay n'a pas d'obligation de rester fixe comme un scrim photo (contrairement au Hero, `US-073` §1.3, où le fond réel est une photographie) : ici il recouvre le contenu de page, qui est theme-aware. **Recommandation, non bloquante** : aligner sur `bg-cgws-ink/60 backdrop-blur-sm` pour cohérence avec `FilterDrawer` — à confirmer visuellement en implémentation (l'effet visuel actuel avec `brand-espresso/60` est déjà sombre et fonctionnel, ce n'est pas un défaut d'accessibilité, juste une incohérence de convention entre deux overlays du même site).

### Accessibilité
- `role="dialog"`, `aria-modal="true"`, `aria-label="Menu de navigation"` — déjà conformes.
- Focus trap et restitution de focus déjà implémentés et corrects — aucune action.

## A.4 `ThemeSwitcher.vue` — correction transversale (header + admin)

### Correction requise — garde `colorMode?.forced` manquante

**Constat** : le point US-071 "reporté, non bloquant" (cf. brief) est **partiellement** résolu. Le code actuel a bien la garde métier (`v-if="skin === 'elegante'"`, masque le toggle jour/nuit quand Rugueux est actif — correct et conforme à `US-071` §5) mais **pas** la garde technique documentée dans `DESIGN_SYSTEM_v3.md` §6.2 (`v-if="!colorMode?.forced"`), qui protège contre le cas où une page force explicitement un `colorMode` (via `definePageMeta({ colorMode: 'dark' })` ou équivalent Nuxt UI) — dans ce cas le contrôle ne devrait pas non plus être rendu, car il n'aurait aucun effet.

```html
<!-- Avant -->
<ClientOnly v-if="skin === 'elegante'">
  ...
</ClientOnly>

<!-- Après -->
<ClientOnly v-if="skin === 'elegante' && !colorMode?.forced">
  ...
</ClientOnly>
```
Aucune page du site actuel ne force `colorMode` à ce jour (audit : aucune occurrence de `colorMode.forced` ni de meta `colorMode` dans `app/pages/**`), donc cette correction n'a **aucun effet visible immédiat** — c'est une garde défensive pour l'avenir (ex. une future page d'impression de facture forçant le mode clair), conforme à la règle transversale §9 du doc maître et au pattern officiel documenté (`mcp__nuxt-ui-remote`, cf. `US-071` §6, `DESIGN_SYSTEM_v3.md` §6.2). **Non bloquant pour le merge de cette US** mais à corriger dans le même passage puisque le fichier est de toute façon touché pour la variante `compact` (§C.2).

### Accessibilité
- `role="radiogroup"`/`role="radio"`, navigation flèches, `aria-live` d'annonce — déjà conformes à `US-071` §8, aucune action.

## A.5 Wireframes

### Desktop ≥1024px — header

```
┌────────────────────────────────────────────────────────────────────┐ ← bg-cgws-surface (corrigé)
│ CGWS          Catalogue  Consignation  À Propos  Contact  [✦|⚙]☀📞 │   border-b border-cgws-hairline
└────────────────────────────────────────────────────────────────────┘
```
État scrolled (>50px) : `bg-cgws-surface/90 backdrop-blur-md shadow-lg shadow-cgws-ink/20` — mêmes éléments, fond semi-transparent flouté.

### Mobile <1024px — drawer ouvert

```
┌─────────────────────────┐
│ CGWS                 ✕  │ ← bg-cgws-ground (drawer, cf. A.3), border-b hairline
├─────────────────────────┤
│ Catalogue             › │
│ Consignation           › │
│ À Propos               › │
│ Contact                 › │
├──────── ⊙ ──────────────┤ ← séparateur "concho"
│ Apparence                │
│ [✦ Élégante│⚙ Rugueux]   │ ← ThemeSwitcher layout="stacked"
│ [ ☀ Clair            ]   │
├─────────────────────────┤
│ 📞 02 47 XX XX XX        │
│ ✉ contact@cgws.fr        │
│ [Consigner une selle]    │ ← CgwsButton primary, pleine largeur
└─────────────────────────┘
```

### Footer — desktop 1440px (4 colonnes)

```
┌────────────────────────────────────────────────────────────────────┐ ← bg-cgws-surface (corrigé)
│ border-t-2 border-cgws-accent-deco (corrigé)                       │
│ CGWS          Navigation      Boutique         Informations         │
│ Sellerie...   Catalogue       Adresse           Mentions légales    │
│ ...           Consignation    Téléphone         CGV (à venir)       │
│ [IG][FB]      Contact         Horaires          Conf. (à venir)     │
│               À propos        Email                                 │
│                        ✦ (StarDivider)                              │
│ © 2026 CGWS...                       Fait avec ♥ en Indre-et-Loire  │
└────────────────────────────────────────────────────────────────────┘
```

### Breakpoints (récapitulatif)
- **Mobile 375px** : header 56px (`h-14`), drawer plein écran `w-[85vw] max-w-[340px]`, footer grille `grid-cols-2`.
- **Tablet 768px** : header identique mobile (breakpoint nav `lg`), footer grille `grid-cols-2` réordonnée (`sm:` order).
- **Desktop 1440px** : header 64px (`h-16`), nav inline, footer `grid-cols-4`.

## A.6 Vérification dans les 3 rendus

| Élément | `elegante-jour` | `elegante-nuit` | `rugueux` |
|---|---|---|---|
| Header (défaut) | `surface` clair (`#EFE1CC`), logo mauve (`accent`), lisible | `surface` sombre (`#33231A`), logo rose clair, vérifier que le header reste perceptible du fond `ground` juste en dessous (léger écart de luminance attendu) | `surface` très sombre (`#2C1F15`), logo laiton |
| Header (scrolled) | `surface/90` + blur — vérifier lisibilité du contenu qui défile dessous à travers le flou | idem | idem |
| Footer | `surface` clair, bordure rose (`accent-deco`) | `surface` sombre, bordure rose clair | `surface` très sombre, bordure copper — vérifier absence de confusion avec `accent` laiton (même remarque que `US-072` §9 pour `danger`/`accent`/`accent-deco` en Rugueux) |
| `ThemeSwitcher` (header + mobile) | segment actif `accent`/`on-accent` mauve | idem, teintes Nuit | segment actif laiton, toggle jour/nuit **absent** (Rugueux) |
| `MobileMenu` | panneau `ground` clair, distinct du header `surface` juste au-dessus (léger contraste de bande attendu à l'ouverture) | panneau `ground` sombre | panneau `ground` très sombre |

## A.7 Accessibilité transversale (Bloc A)

- Navigation clavier complète : `Tab` traverse skip-link → logo → nav → `ThemeSwitcher` → téléphone → hamburger (desktop) ; drawer mobile avec trap de focus déjà en place.
- Contraste : voir notes par sous-section (§A.1/§A.2) — paires `ink`/`ink-soft`/`accent` sur `surface` à confirmer visuellement par QA dans les 3 rendus (non pré-calculées analytiquement dans le doc maître, écart mineur attendu vs `ground`).
- `prefers-reduced-motion` : transitions CSS (`duration-300`, `duration-150`) restent courtes et non-essentielles, pas de garde spécifique requise (contrairement aux animations GSAP substantielles du Hero) — cohérent avec le traitement existant.

---

# BLOC B — Contact

## B.1 `app/pages/contact.vue`

### Ce qui est déjà conforme (aucune action)
- Hero : `bg-cgws-ground`, eyebrow `font-eyebrow text-cgws-accent`, H1 `font-display text-cgws-ink`, tagline `font-serif italic text-cgws-ink-soft` — tous déjà migrés vers les rôles v3.
- `StarDivider` entre le hero et la section principale, et entre le bloc infos et la carte — conforme.
- Formulaire : `CgwsInput`/`CgwsSelect`/`CgwsTextarea` déjà utilisés (pas de champs HTML bruts), `error` bindé sur chaque champ — déjà conforme à `US-072` §6.1 (état d'erreur `danger` géré nativement par ces composants, cf. audit `CgwsInput.vue` ci-dessous).
- Alerte serveur : `bg-cgws-danger/10 border border-cgws-danger`, texte `text-cgws-danger`, `role="alert"` — déjà conforme.
- État succès : `bg-cgws-surface border-2 border-cgws-hairline`, icône `text-cgws-accent`, `role="status" aria-live="polite"` — déjà conforme.
- Bloc infos (adresse/téléphone/horaires/email) : `bg-cgws-surface border-2 border-cgws-hairline`, icônes `text-cgws-accent`, labels `text-cgws-ink-soft`, valeurs statiques `text-cgws-ink`, liens cliquables (tél/email) `text-cgws-accent hover:underline` — **déjà conforme à la règle outline** (*« label d'adresse... ink/accent selon qu'il est statique ou cliquable »*) : l'adresse (non cliquable) est en `ink`, le téléphone et l'email (cliquables) sont en `accent`.
- Lien externe OSM ("Ouvrir dans OpenStreetMap") : `text-cgws-accent hover:underline` — conforme (lien cliquable réel).
- Animations GSAP (stagger hero, slide latéral colonnes, fade carte) : `prefers-reduced-motion` déjà gardé, `ctx.revert()` en `onUnmounted` — aucune action.

### Correction requise — cadre de la carte : `border-hairline` → `border-edge`

```html
<!-- Avant -->
<div class="contact-map w-full h-[220px] sm:h-[240px] md:h-[200px] lg:h-[280px]
       border border-cgws-hairline rounded-[4px] overflow-hidden bg-cgws-surface">

<!-- Après -->
<div class="contact-map w-full h-[220px] sm:h-[240px] md:h-[200px] lg:h-[280px]
       border border-cgws-edge rounded-[4px] overflow-hidden bg-cgws-surface">
```
Conforme à la prescription outline (*« ContactMap.vue : cadre border-edge »*) : le cadre de la carte est une bordure structurelle qui délimite un composant fonctionnel (widget interactif Leaflet), pas un simple séparateur de liste — `edge` est le rôle prévu pour ce cas (cf. `DESIGN_SYSTEM_v3.md` §2.1, *« edge : bordures de carte, contours de bouton outline »*), `hairline` est réservé aux séparateurs fins (`<hr>`, listes). Le fallback de chargement (`bg-cgws-surface animate-pulse`, à l'intérieur du même conteneur) hérite du même cadre corrigé sans changement propre.

### Accessibilité
- Contraste `ink`/`ink-soft`/`accent` sur `bg-cgws-ground` (hero, formulaire) — déjà mesuré, ≥4.5:1 dans les 3 rendus (doc maître §2.6).
- Contraste sur `bg-cgws-surface` (bloc infos, carte, succès) — même remarque que Bloc A, à confirmer visuellement (écart mineur vs `ground`).
- Formulaire : labels associés (`for`/`id`), `aria-required`, `aria-invalid`, `aria-describedby` déjà gérés par `CgwsInput`/`CgwsSelect`/`CgwsTextarea` — aucune action.

## B.2 `ContactMap.vue`

### Correction requise — hex v2 en dur dans le marker/popup Leaflet (résidu non migré)

**Constat** : contrairement aux templates Vue/Tailwind, ce composant génère du HTML/CSS **inline** pour Leaflet (`L.divIcon`, `bindPopup`) — un `<div>` stylé en `style="..."` ne peut pas porter de classe Tailwind `bg-cgws-*`, mais **peut** référencer une variable CSS via `var(--cgws-*)`, exactement comme `SaddleIllustration.vue` l'a fait pour son `<radialGradient>` (`US-073` §4.3, même pattern de correction). Le fichier actuel n'a **jamais été migré** : il contient 4 valeurs hex v2 codées en dur.

```ts
// Avant
const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px;
    background: #B8650A;               /* v2 cgws-copper */
    border: 3px solid #FAF3E3;         /* v2 cgws-cream */
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 3px 10px rgba(61,26,6,0.45);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

L.marker([BRECHES_LAT, BRECHES_LNG], { icon: markerIcon })
  .addTo(mapInstance)
  .bindPopup(
    '<strong style="font-family:Georgia,serif;color:#1A0B03;">CGWS</strong><br>' +   // v2 cgws-charcoal
    '<span style="font-size:12px;color:#7B3B1C;">Brèches · Indre-et-Loire</span>',    // v2 cgws-leather
  )
```

```ts
// Après
const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px;
    background: var(--cgws-accent-deco);   /* marker = purement décoratif, jamais de texte porté */
    border: 3px solid var(--cgws-ground);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 3px 10px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

L.marker([BRECHES_LAT, BRECHES_LNG], { icon: markerIcon })
  .addTo(mapInstance)
  .bindPopup(
    '<strong style="font-family:Georgia,serif;color:var(--cgws-ink);">CGWS</strong><br>' +
    '<span style="font-size:12px;color:var(--cgws-ink-soft);">Brèches · Indre-et-Loire</span>',
  )
```

Justification du mapping (conforme à la règle outline *« marker en accent-deco (décoratif), label ink/accent »*) :
- **Fond du marker** → `accent-deco` : le pin lui-même ne porte aucun texte (purement décoratif/géo-localisant), conforme à la règle de contraste §2.1.
- **Bordure du marker** (halo autour du pin) → `--cgws-ground` (au lieu du littéral cream v2) : reste cohérent avec le fond de page environnant plutôt qu'un blanc/crème figé.
- **`box-shadow`** : assombri en `rgba(0,0,0,0.35)` neutre (au lieu de `rgba(61,26,6,...)`, teinte brune v2 figée) — une ombre portée neutre fonctionne visuellement dans les 3 rendus sans favoriser une teinte de marque particulière.
- **"CGWS" (popup, titre)** → `var(--cgws-ink)` (texte fort, statique, pas cliquable) — remplace le littéral charcoal v2.
- **"Brèches · Indre-et-Loire" (popup, sous-titre)** → `var(--cgws-ink-soft)` (texte secondaire) — remplace le littéral leather v2.

### Point de vigilance signalé, non bloquant — fond du popup Leaflet lui-même

Le popup Leaflet (`.leaflet-popup-content-wrapper`) a son **propre** fond blanc par défaut, injecté par `leaflet.css` (import dynamique `await import('leaflet/dist/leaflet.css')`, ligne 16) — ce fond n'est **pas** couvert par les variables CSS `--cgws-*` et resterait blanc dans les 3 rendus, y compris en Nuit/Rugueux, créant un popup "flash blanc" au clic sur le marker.

**Recommandation, non bloquante (à trancher par `nuxt-developer`)** : ajouter un léger override CSS scoped (ou global, `main.css`) ciblant `.leaflet-popup-content-wrapper`/`.leaflet-popup-tip` avec `background: var(--cgws-surface)` et `color: var(--cgws-ink)`, cohérent avec le fond de carte du conteneur (`bg-cgws-surface` déjà appliqué au conteneur `.contact-map` dans `contact.vue`). Non traité dans le détail ici car cela touche du CSS global Leaflet plutôt qu'un template Vue — signalé pour que `nuxt-developer` ne le découvre pas seulement en QA visuelle Nuit/Rugueux.

### Ce qui est déjà conforme (aucune action)
- `role="application" aria-label="Carte OpenStreetMap centrée sur Brèches, Indre-et-Loire"` — conforme.
- Zoom desactivé au scroll (`scrollWheelZoom: false`) — évite le vol de scroll de la page, bon comportement UX déjà en place.
- Cleanup `mapInstance.remove()` en `onUnmounted` — conforme.

## B.3 Wireframes (rappel, page déjà en place structurellement)

**Mobile 375px** : hero centré → formulaire pleine largeur → bloc infos → carte 220px de haut, empilés verticalement (`flex-col`).
**Tablet 768px** : identique mobile (breakpoint colonnes à `md`).
**Desktop 1440px** : 2 colonnes (`md:flex-row`), formulaire `flex-1`, colonne infos+carte `md:w-[280px] lg:w-[400px]` fixe à droite.

## B.4 Vérification dans les 3 rendus

| Élément | `elegante-jour` | `elegante-nuit` | `rugueux` |
|---|---|---|---|
| Hero + formulaire | `ground` clair, champs `edge`/`accent` | `ground` sombre | `ground` très sombre |
| Bloc infos + carte | `surface` clair, icônes mauves | `surface` sombre, icônes rose clair | `surface` très sombre, icônes laiton |
| Marker carte | rose clair (`accent-deco` Élégante Jour `#B76E79`) sur fond `ground` clair (`#F6EDDF`) — bon contraste visuel décoratif | rose (`#C98B94`) sur `ground` sombre | copper (`#B8650A`) sur `ground` très sombre |
| Popup Leaflet | **à corriger** (§B.2 point de vigilance) — sinon fond blanc figé visible dans les 3 rendus | idem | idem |

## B.5 Accessibilité (Bloc B)

- Contraste texte popup (`ink`/`ink-soft` sur fond `surface` recommandé, ou blanc actuel non corrigé) : à mesurer une fois le point de vigilance §B.2 tranché.
- Le lien externe OSM sert de "bypass" accessible à la carte interactive (utile aux lecteurs d'écran/clavier qui ne peuvent pas interagir avec le canvas Leaflet) — déjà en place, aucune action.

---

# BLOC C — Cohérence Admin

## C.0 Décision client rappelée

`DESIGN_SYSTEM_v3.md` §8.1 décision 3 : *« Switcher disponible aussi en admin — le backoffice n'est pas figé sur une peau »*. **Constat d'audit positif** : `app/layouts/admin.vue` **n'a pas** de fond figé `bg-cgws-tack`/`bg-cgws-parchment` (contrairement à l'hypothèse de l'outline) — la sidebar (`bg-cgws-ground`) et la topbar (`bg-cgws-surface`) sont **déjà** theme-aware, cohérentes avec la convention chrome/contenu établie au Bloc A (`surface` = bande de chrome, `ground` = canevas). Aucune action sur ce point précis. Les corrections réelles nécessaires portent sur : le `ThemeSwitcher` masqué en mobile (§C.1), la garde `colorMode.forced` (couverte au Bloc A, §A.4, car le composant est partagé), et surtout la régression `bg-white` généralisée + les violations de taxonomie de statut (§C.3 à §C.8).

## C.1 `app/layouts/admin.vue` — sidebar + topbar

### Ce qui est déjà conforme (aucune action)
- Sidebar desktop (`lg:fixed lg:w-64`) : `bg-cgws-ground border-r border-cgws-hairline` — theme-aware, aucune action.
- Drawer mobile (`<768px`... en réalité `<1024px`, breakpoint `lg`) : `bg-cgws-ground`, focus trap clavier, fermeture `Escape`, restitution de focus — logique déjà correcte.
- Lien nav actif : `bg-cgws-accent/15 text-cgws-accent border-l-2 border-cgws-accent` — conforme (indicateur d'état fonctionnel, `accent`, jamais `accent-deco`).
- Bouton déconnexion : `text-cgws-ink-soft/50 hover:bg-cgws-danger/10 hover:text-cgws-danger` — conforme à la migration `rust`→`danger` de la table `US-070` §6 (*« hover destructif bouton déconnexion admin »*), déjà appliquée.
- Topbar : `bg-cgws-surface border-b border-cgws-hairline` — déjà cohérent avec la décision de chrome §A.0/§C.0.
- Avatar : `bg-cgws-accent` + initiales `text-cgws-on-accent` — conforme.
- Skip-link admin : `focus:bg-cgws-accent focus:text-cgws-on-accent` — bloc plein comme le header public, pas de ring-offset concerné.

### Correction requise — `ThemeSwitcher` masqué en mobile topbar (`hidden sm:flex`)

**Constat (point US-071 reporté, cf. brief)** :
```html
<!-- Actuel -->
<div class="hidden sm:flex">
  <ThemeSwitcher />
</div>
```
Sous 640px (`sm`), le contrôle d'apparence **disparaît totalement** de la topbar admin — hors du périmètre acceptable pour la décision client §C.0 : *« l'admin n'a pas de drawer de menu séparé pour l'apparence [...] le contrôle doit tenir dans la topbar à toutes les largeurs »*. Contrairement au site public où `MobileMenu` offre un emplacement dédié en dessous de `lg`, l'admin n'a que la topbar — la masquer revient à priver Camille du switcher sur mobile/tablette portrait.

**Correction** — remplacer le masquage par une transition vers la nouvelle variante compacte du `ThemeSwitcher` (§C.2) :
```html
<!-- Après -->
<ThemeSwitcher layout="compact" class="flex sm:hidden" />
<ThemeSwitcher class="hidden sm:flex" />
```
Le seuil `sm` (640px) est conservé identique à l'existant (pas de nouveau breakpoint introduit) — seul le comportement sous ce seuil change (icône compacte au lieu de rien).

### Accessibilité
- Le hamburger, le titre de page, et le groupe droit (switcher/email/avatar) restent dans le même ordre de tabulation qu'actuellement — aucun changement d'ordre de focus, uniquement l'ajout d'un élément focusable supplémentaire sous 640px (là où rien n'était focusable avant).

## C.2 `ThemeSwitcher.vue` — nouvelle variante `compact` (spec de composant)

**Besoin** : sur la topbar admin en mobile (<640px), le segment skin à 2 boutons libellés (`✦ Élégante` / `⚙ Rugueux`, ~140px de large chacun) ne tient pas à côté du hamburger + titre de page + email + avatar sur un viewport de 375px. Il faut une représentation **icône-seule** du même contrôle, sans perdre la fonctionnalité (bascule de peau + bascule jour/nuit).

### Props (extension, rétrocompatible)

```ts
interface Props {
  layout?: 'inline' | 'stacked' | 'compact'   // ajout de 'compact', défaut inchangé 'inline'
}
```

### Comportement `layout="compact"`

- Le segment skin (`radiogroup` à 2 boutons libellés) est remplacé par **un seul bouton icône** qui *bascule* la peau au clic (pas un choix binaire affiché simultanément) :
  - Icône affichée = celle de la peau **active** (`i-lucide-compass` si `elegante`, `i-lucide-circle-dot` si `rugueux`) — au clic, bascule vers l'autre peau.
  - `aria-label` dynamique : `"Basculer vers l'apparence Rugueux"` / `"Basculer vers l'apparence Élégante"` (annonce la *destination*, pas l'état actuel — cohérent avec un bouton toggle, différent du `radiogroup` qui annonce l'état actuel).
  - **Ne remplace pas** le `radiogroup` ARIA (qui reste le pattern `inline`/`stacked`, cf. `US-071` §8) — en `compact`, le contrôle redevient un simple `<button>` togglable, pattern ARIA plus simple adapté à un espace contraint (cohérent avec le pattern déjà utilisé pour le toggle jour/nuit lui-même, qui est déjà un bouton simple dans tous les layouts).
- Le toggle jour/nuit reste **identique** à la version `inline` (déjà un bouton icône-seule `w-9 h-9`) — aucun changement nécessaire pour cet axe, il est déjà compact par nature. Reste masqué si `skin === 'rugueux'` (règle inchangée).
- Les deux contrôles (bascule peau + jour/nuit) sont posés côte à côte, `gap-1`, sans le conteneur `radiogroup` arrondi (`rounded-full border ...`) qui n'a plus lieu d'être avec un seul bouton — remplacé par un simple `flex items-center gap-1`.

### Wireframe

```
Inline (desktop, existant)     Compact (nouveau, topbar admin mobile)
┌─────────┬─────────┐ ┌────┐   ┌────┐┌────┐
│✦ Élégante│⚙ Rugueux│ │☀/☾│   │ ✦  ││☀/☾ │
└─────────┴─────────┘ └────┘   └────┘└────┘
                                 ↑ bouton unique, toggle peau    ↑ inchangé
```

### Tailwind classes (bouton bascule peau, `compact`)

```
inline-flex items-center justify-center w-9 h-9 rounded-full
text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-surface-2
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2
```
Dimensions identiques au toggle jour/nuit (`w-9 h-9`) pour une paire visuellement cohérente dans la topbar compacte.

### États

| État | Rendu |
|---|---|
| Peau Élégante active | Icône `i-lucide-compass`, `aria-label="Basculer vers l'apparence Rugueux"` |
| Peau Rugueux active | Icône `i-lucide-circle-dot`, `aria-label="Basculer vers l'apparence Élégante"` |
| Clic / Entrée / Espace | Bascule immédiate (`setSkin`), annonce `aria-live` identique aux autres layouts (`announce()`, réutilisé tel quel) |
| Focus clavier | Ring `cgws-accent` 2px offset 2px — identique aux autres boutons du composant |

### Accessibilité

- Le bouton compact reste un simple `<button>` (pas de `role="radio"`/`radiogroup"` — pattern ARIA "toggle" standard, cohérent avec le toggle jour/nuit déjà présent dans tous les layouts).
- `aria-live` d'annonce de changement (`liveMessage`, région `sr-only`) réutilisé sans modification — déjà générique aux 3 layouts.
- Cible tactile : `w-9 h-9` (36px) est **sous** la cible recommandée de 44px pour le mobile — **point de vigilance, non bloquant** : identique à la taille déjà en place pour le toggle jour/nuit existant en layout `inline` (précédent déjà accepté implicitement par `US-071`), donc pas une régression introduite par cette US, mais à signaler pour un futur ajustement transversal (augmenter à `w-11 h-11` sur mobile pour tous les boutons icône-seule du site, hors périmètre de cette US).

## C.3 Correction transversale — `bg-white` codé en dur (régression majeure, ~35 emplacements)

### Constat

Une recherche exhaustive (`bg-white`/`text-white`/`border-white`) dans `app/` révèle que la quasi-totalité des cartes, panneaux, modales, tables et dropdowns de l'admin utilisent un fond **`bg-white` Tailwind générique**, jamais migré vers un rôle CGWS. Contrairement à l'hypothèse de départ de cette US (fond `bg-cgws-tack`/`bg-cgws-parchment` figé), le problème réel est **plus grave et plus répandu** : ces éléments ne portent **aucun token CGWS de fond** du tout — ils restent blancs (`#FFFFFF`) dans les 3 rendus, y compris en Élégante Nuit et Rugueux où un panneau blanc pur contrasterait violemment (et de façon non intentionnelle) avec le reste de l'interface sombre.

### Règle de correction (une seule règle, appliquée partout)

| Contexte | `bg-white` → |
|---|---|
| Fond de carte/panneau/table/dropdown/modale (conteneur) | `bg-cgws-surface` |
| Bordure de spinner de chargement (`border-2 border-white border-t-transparent`) sur bouton à fond coloré (`accent`/`danger`) | `border-current` (hérite `text-cgws-on-accent`/`text-cgws-on-danger` du bouton parent — pattern déjà utilisé par `CgwsButton.vue`, cf. §5, ligne `border-2 border-current border-t-transparent`) |
| Poignée de toggle switch (`CategoryPanel`/`CategoryTreeItem`, cercle mobile du switch) | `bg-cgws-on-accent` (contraste garanti contre une piste `accent`, cf. `DESIGN_SYSTEM_v3.md` §2.1 — rôle conçu spécifiquement pour "poser du contenu clair/lisible sur `accent`") — **à confirmer visuellement**, cas non couvert explicitement par le doc maître, non bloquant |

### Table exhaustive des fichiers concernés

| Fichier | Emplacement(s) | Correction |
|---|---|---|
| `app/components/admin/KpiCard.vue` | conteneur (×2 variantes) | `bg-white` → `bg-cgws-surface` (détail §C.7) |
| `app/components/admin/StatusDropdown.vue` | popover desktop, bottom-sheet mobile | `bg-white` → `bg-cgws-surface` (détail §C.6) |
| `app/components/admin/RejectModal.vue` | boîte modale, spinner bouton | `bg-white`→`bg-cgws-surface`, `border-white`→`border-current` (détail §C.4) |
| `app/components/admin/SaleModal.vue` | boîte modale, spinner bouton | idem (détail §C.5) |
| `app/components/admin/SaleForm.vue` | `.modal-box`, spinner bouton | `bg-white`→`bg-cgws-surface`, `border-white`→`border-current` |
| `app/components/admin/ProductForm.vue` | 3 `<fieldset>` de section | `bg-white` → `bg-cgws-surface` |
| `app/components/admin/RecentActivity.vue` | conteneur carte | `bg-white` → `bg-cgws-surface` |
| `app/components/admin/ClientCard.vue` | ligne client (`.client-row`) | `bg-white` → `bg-cgws-surface` |
| `app/components/admin/ClientAutocomplete.vue` | liste de suggestions | `bg-white` → `bg-cgws-surface` |
| `app/components/admin/ImageUploader.vue` | conteneur de zone d'upload | `bg-white` → `bg-cgws-surface` |
| `app/components/admin/CategoryPanel.vue` | header/footer de panneau (×2), inputs (×2), poignée de switch | `bg-white`→`bg-cgws-surface` (panneaux/inputs), poignée switch → `bg-cgws-on-accent` (cf. table ci-dessus) |
| `app/components/admin/CategoryTree.vue` | conteneur arbre | `bg-white` → `bg-cgws-surface` |
| `app/components/admin/CategoryTreeItem.vue` | ligne survolée, poignée de switch | `bg-white`→`bg-cgws-surface` (ligne), poignée → `bg-cgws-on-accent` |
| `app/pages/admin/produits/index.vue` | barre de filtres, cartes mobile (×2), table desktop, modale suppression, spinner | `bg-white`→`bg-cgws-surface`, `border-white`→`border-current` |
| `app/pages/admin/produits/[id].vue` | panneau formulaire | `bg-white` → `bg-cgws-surface` |
| `app/pages/admin/consignations/index.vue` | barre filtres, cartes mobile, table, en-tête `<thead>`, ligne alternée, modale refus, spinner | `bg-white`→`bg-cgws-surface` (**note** : ligne alternée `'bg-white hover:bg-cgws-surface/20'` → `'bg-cgws-surface hover:bg-cgws-surface-2/60'`, cf. détail ci-dessous) |
| `app/pages/admin/consignations/[id].vue` | 6 panneaux de section, spinner | `bg-white`→`bg-cgws-surface`, `border-white`→`border-current` |
| `app/pages/admin/ventes/index.vue` | barre filtres, table desktop, cartes mobile (×2) | `bg-white` → `bg-cgws-surface` |
| `app/pages/admin/clients/index.vue` | table desktop, cartes mobile | `bg-white` → `bg-cgws-surface` |
| `app/pages/admin/clients/[id].vue` | 6 panneaux de section, spinner | `bg-white`→`bg-cgws-surface`, `border-white`→`border-current` |
| `app/pages/admin/rapports.vue` | 2 panneaux de section, spinner | `bg-white`→`bg-cgws-surface`, `border-white`→`border-current` |
| `app/pages/admin/categories/index.vue` | 2 modales, spinner | `bg-white`→`bg-cgws-surface`, `border-white`→`border-current` |

**Note sur `consignations/index.vue` ligne 453** (`item.status === 'pending' ? '...' : 'bg-white hover:bg-cgws-surface/20'`) : le ternaire compare une ligne "en attente" tintée (`bg-cgws-accent/5` — cf. §C.8 pour la discussion sur ce tintage) à une ligne normale actuellement en `bg-white`. Correction : la ligne "normale" doit utiliser le même rôle de fond que le reste de la table (`bg-cgws-surface`), avec un survol légèrement plus marqué (`hover:bg-cgws-surface-2/60`, en cohérence avec le token de survol déjà défini pour ce rôle ailleurs dans le design system, `surface-2`).

**Recommandation d'implémentation** : vu le nombre d'occurrences identiques (~30 sur le seul motif `bg-white border border-cgws-hairline rounded-[4px]`), un remplacement par recherche/remplace global de `bg-white` → `bg-cgws-surface` dans `app/components/admin/**` et `app/pages/admin/**` est sûr et mécanique — **à l'exception** des poignées de toggle switch (`CategoryPanel`/`CategoryTreeItem`, → `bg-cgws-on-accent`) et des bordures de spinner (`border-white` → `border-current`), qui doivent être traitées séparément selon la table ci-dessus.

### Accessibilité

- Contraste `text-cgws-ink`/`text-cgws-ink-soft` sur `bg-cgws-surface` (au lieu de blanc pur) : très légèrement réduit en Élégante Jour (`surface` `#EFE1CC` vs blanc `#FFFFFF`) mais reste largement AA (même ordre de grandeur que `ink`/`ink-soft` sur `ground`, déjà mesuré ≥7.78:1 dans le doc maître) — aucune régression d'accessibilité, seulement un ton légèrement plus chaud. **À confirmer visuellement par QA**, non bloquant.
- Aucune régression de focus/aria — cette correction ne touche que des classes de fond, aucune structure/attribut ARIA n'est modifiée.

## C.4 `RejectModal.vue`

### Ce qui est déjà conforme (aucune action)
- Icône d'alerte : `bg-cgws-danger/10 text-cgws-danger` — **déjà conforme** à la prescription outline (remplace `bg-cgws-rust/10`/`text-cgws-rust`), aucune action requise sur ce point précis.
- Astérisque "Motif de refus *" : `text-cgws-danger` — déjà conforme.
- Bordure de champ en erreur : `:class="rejectErrors.reason ? 'border-cgws-danger' : ''"` — déjà conforme.
- Message d'erreur : `text-cgws-danger role="alert"` — déjà conforme.
- Backdrop : `bg-cgws-ink/60 backdrop-blur-sm` — déjà theme-aware, aucune action.
- Focus trap clavier, fermeture `Escape`, restitution de focus — logique inchangée.

### Correction requise — fond de la boîte modale (`bg-white` → `bg-cgws-surface`, cf. §C.3)

```html
<!-- Avant -->
<div class="relative bg-white border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-md flex flex-col max-h-[90dvh]">

<!-- Après -->
<div class="relative bg-cgws-surface border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-md flex flex-col max-h-[90dvh]">
```

### Correction requise — bouton de confirmation → `CgwsButton variant="destructive"`

**Constat** : le bouton "Confirmer le refus" est actuellement un `<button>` brut avec classes dupliquées, **pas** le composant `CgwsButton` — exactement le point signalé par `US-072` §5 comme motivation de la création du variant `destructive`.

```html
<!-- Avant -->
<button
  type="button"
  :disabled="loading || !rejectForm.reason.trim()"
  class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-sm bg-cgws-danger text-cgws-on-danger font-sans text-sm font-semibold hover:bg-cgws-brand-espresso transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2 focus-visible:outline-none"
  @click="handleConfirm"
>
  <span v-if="loading" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
  {{ loading ? 'Envoi…' : 'Confirmer le refus' }}
</button>

<!-- Après -->
<CgwsButton
  variant="destructive"
  size="sm"
  :loading="loading"
  :disabled="loading || !rejectForm.reason.trim()"
  @click="handleConfirm"
>
  Confirmer le refus
</CgwsButton>
```

Bénéfices de la migration (au-delà de la simple cohérence de composant) :
- Corrige un **résidu v2 non détecté par l'audit initial** : le hover actuel (`hover:bg-cgws-brand-espresso`) mélange un littéral de marque fixe avec un fond `danger` theme-aware — incohérent (le hover ne varie pas de teinte selon la peau active, contrairement au reste du bouton). `CgwsButton variant="destructive"` utilise `hover:bg-cgws-danger/90` (simple opacité du même rôle, cf. `US-072` §5), cohérent dans les 3 rendus.
- Corrige le `focus-visible:ring-cgws-accent` actuel (incohérent — un bouton destructif devrait recevoir un ring `danger`, pas `accent`) : `CgwsButton variant="destructive"` utilise déjà `focus-visible:ring-cgws-danger` (vérifié dans `CgwsButton.vue` actuel, ligne `destructive: '... focus-visible:ring-cgws-danger'`).
- Le spinner de chargement de `CgwsButton` utilise déjà `border-current` (hérite `text-cgws-on-danger`), corrigeant du même geste le `border-white` codé en dur du bouton actuel — pas de correction séparée nécessaire une fois la migration faite.
- `size="sm"` aligné sur les autres boutons de la modale (`px-4 py-2` bouton "Annuler").

**Note** : le bouton "Annuler" (à gauche) reste un `<button>` brut stylé manuellement — hors périmètre strict de cette correction (ce n'est pas une action destructive), mais **pourrait** être migré vers `CgwsButton variant="ghost"` ou `variant="secondary"` par souci de cohérence totale. Non requis par le brief, signalé comme piste d'harmonisation future, non bloquant.

## C.5 `SaleModal.vue`

### Correction requise — fond de la boîte modale (`bg-white` → `bg-cgws-surface`, cf. §C.3)

```html
<!-- Avant -->
<div class="relative bg-white border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-lg flex flex-col max-h-[90dvh] sm:max-h-[80vh]">

<!-- Après -->
<div class="relative bg-cgws-surface border-2 border-cgws-ink rounded-sm shadow-xl w-full max-w-lg flex flex-col max-h-[90dvh] sm:max-h-[80vh]">
```

### Ce qui est déjà conforme (aucune action)
- Icône d'en-tête : `bg-cgws-accent/10 text-cgws-accent` — conforme (action positive "Enregistrer la vente", pas une alerte, `accent` est le bon rôle).
- Tous les champs (`bg-cgws-ground border-cgws-hairline`, focus `accent`) — conformes.
- Erreur prix de vente : `border-cgws-danger` conditionnel + message `text-cgws-danger role="alert"` — conforme.
- Backdrop `bg-cgws-ink/60` — conforme.

### Point mineur signalé, non bloquant — bouton "Enregistrer la vente" pas via `CgwsButton`

Comme pour `RejectModal` (§C.4), le bouton de soumission est un `<button>` brut (`bg-cgws-accent text-cgws-on-accent hover:bg-cgws-edge`) plutôt que `<CgwsButton variant="primary">`. **Différence avec `RejectModal`** : ce n'est pas une action destructive (pas de variant `destructive` concerné), donc pas la même urgence de correction que §C.4. Recommandation identique par souci de cohérence (éviter la duplication de classes déjà encapsulées dans `CgwsButton`), mais **non bloquante** pour cette US — le rendu actuel est déjà theme-aware et fonctionnellement correct (`hover:bg-cgws-edge` est un choix de hover alternatif au `hover:bg-cgws-accent/90` habituel de `CgwsButton primary`, visuellement acceptable, pas une erreur). Le spinner `border-2 border-white` de ce bouton doit néanmoins être corrigé en `border-current` indépendamment de la migration ou non vers `CgwsButton` (cf. table §C.3).

## C.6 `StatusDropdown.vue`

### Correction requise — fonds `bg-white` (popover desktop + bottom-sheet mobile, cf. §C.3)

```
Popover desktop  : bg-white → bg-cgws-surface
Bottom-sheet mobile : bg-white → bg-cgws-surface
```

### Correction requise — taxonomie de statut produit (§4.1 doc maître)

**Constat** : `STATUS_OPTIONS`/`statusPillClass` définissent un mapping **local et partiellement divergent** de la taxonomie figée `DESIGN_SYSTEM_v3.md` §4.1 (et de l'implémentation déjà correcte de `CgwsBadge.vue`, cf. §C.8).

| `ProductStatus` | Dot actuel | Pill actuel | Taxonomie §4.1 | Correction |
|---|---|---|---|---|
| `active` | `bg-cgws-success` | `bg-cgws-success/15 text-cgws-success border border-cgws-success/40` | `success` (pilule translucide) | **✓ déjà conforme, aucune action** |
| `reserved` | `bg-cgws-accent` | `bg-cgws-accent/15 text-cgws-accent` | Neutre (`ink-soft`/`surface-2`) | **✗ à corriger** — dot → `bg-cgws-ink-soft`, pill → `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` |
| `sold` | `bg-cgws-ink` | `bg-cgws-ink/10 text-cgws-ink` | `accent` plein (`bg-cgws-accent text-cgws-on-accent`) | **✗ à corriger** — dot → `bg-cgws-accent`, pill → `bg-cgws-accent text-cgws-on-accent` |
| `inactive` | `bg-cgws-hairline` | `bg-cgws-hairline text-cgws-ink-soft` | Neutre (`ink-soft`/`surface-2`) | **✗ à corriger** — dot → `bg-cgws-ink-soft/40` (nuance discrète, cf. note), pill → `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` |

```ts
// Après
const STATUS_OPTIONS: Array<{ value: ProductStatus; label: string; dotClass: string }> = [
  { value: 'active', label: 'Disponible', dotClass: 'bg-cgws-success' },
  { value: 'reserved', label: 'Réservé', dotClass: 'bg-cgws-ink-soft' },
  { value: 'sold', label: 'Vendu', dotClass: 'bg-cgws-accent' },
  { value: 'inactive', label: 'Inactif', dotClass: 'bg-cgws-ink-soft/40' },
]

function statusPillClass(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    active: `${BASE_PILL} bg-cgws-success/15 text-cgws-success border border-cgws-success/40`,
    reserved: `${BASE_PILL} bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline`,
    sold: `${BASE_PILL} bg-cgws-accent text-cgws-on-accent`,
    inactive: `${BASE_PILL} bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline`,
  }
  return map[status]
}
```
**Point de vigilance visuel, non bloquant** : `reserved` et `inactive` utilisent désormais la **même** pilule neutre (conforme à §4.1, qui ne prévoit pas de nuance supplémentaire entre les deux) — seul le `dotClass` diffère légèrement (`ink-soft` plein vs `ink-soft/40` estompé) pour une distinction visuelle minimale dans le menu déroulant lui-même. À confirmer visuellement que cette distinction est suffisante ; sinon, une différenciation plus marquée nécessiterait une revalidation produit (cf. `DESIGN_SYSTEM_v3.md` §8.2, point déjà signalé *"statut inactive... à confirmer avec product-owner"*).

### Ce qui est déjà conforme (aucune action)
- Backdrop mobile `bg-cgws-ink/40`, ring de focus `ring-cgws-accent`, comportement popover/bottom-sheet — tous déjà conformes.
- Trigger badge : réutilise `statusPillClass` (corrigé ci-dessus), pas de changement structurel.

## C.7 `KpiCard.vue`

### Correction requise — fond (`bg-white` → `bg-cgws-surface`, cf. §C.3)

```ts
// Avant
const containerClasses = computed<string>(() => {
  const base = 'rounded-[4px] shadow-sm p-5 flex flex-col gap-1'
  if (props.variant === 'warning') {
    return `bg-white border border-cgws-hairline border-l-4 border-l-cgws-danger ${base}`
  }
  return `bg-white border border-cgws-hairline ${base}`
})
```

### Correction requise — variant `warning` actuellement mappé sur `danger` (faux positif d'alerte)

**Constat (bug fonctionnel, pas seulement esthétique)** : `KpiCard` a un prop `variant: 'default' | 'warning'`, utilisé sur le dashboard (`app/pages/admin/dashboard.vue`) pour la carte **"Consignations en attente"** — bascule sur `'warning'` dès que le compte est `> 0`. Le code actuel implémente ce `'warning'` en réutilisant intégralement le rôle **`danger`** (`border-l-cgws-danger`, `text-cgws-danger`, icône `text-cgws-danger`).

C'est une confusion sémantique : *"5 consignations en attente de traitement"* n'est ni une erreur, ni un refus, ni une action destructive — `danger` (§4.1 doc maître) est réservé aux statuts négatifs/destructifs (`rejected`/`returned`) et aux messages d'erreur de formulaire. Une file d'attente à traiter est une information **actionnable**, pas une alerte critique — utiliser `danger` ici crispe visuellement Camille à chaque connexion dès qu'une seule consignation est en attente (état pourtant courant/normal de l'activité).

**Clarification importante sur la piste "couleurs sémantiques natives Nuxt UI `success`/`warning`"** (cf. §C.11 pour la discussion complète) : `app/app.config.ts` documente une décision déjà tranchée en `US-070` — `ui.colors.primary`/`neutral` ne sont **volontairement pas** reliés aux tokens CGWS (limitation Nuxt UI v4 : nécessite une échelle 50–950 par couleur, non générée pour les rôles plats CGWS). **Conséquence directe pour ce point précis** : les couleurs sémantiques natives Nuxt UI (`color="warning"` sur un composant `U*`) ne sont **pas** theme-aware via `data-skin` — elles resteraient figées sur la palette Tailwind par défaut (ambre) quelle que soit la peau active, ce qui **violerait** la règle transversale non négociable §9 du doc maître (*"Navigation clavier complète, focus visible en accent... y compris en admin"* — et plus largement, toute couleur visible doit suivre la peau). `KpiCard` étant un composant 100% custom (pas un wrapper Nuxt UI), la correction ne doit **pas** introduire `color="warning"` Nuxt UI ici — elle doit rester sur les rôles CGWS theme-aware existants.

**Correction retenue (par défaut, à confirmer avec `product-owner`, non bloquante)** : renommer conceptuellement la variante en **`attention`** (le prop reste `'default' | 'warning'` pour ne pas casser l'API du composant dans cette US — renommage du prop lui-même hors périmètre, simple correction de mapping chromatique) et la remapper sur **`accent`** plutôt que `danger` :

```ts
// Après
const containerClasses = computed<string>(() => {
  const base = 'rounded-[4px] shadow-sm p-5 flex flex-col gap-1'
  if (props.variant === 'warning') {
    return `bg-cgws-surface border border-cgws-hairline border-l-4 border-l-cgws-accent ${base}`
  }
  return `bg-cgws-surface border border-cgws-hairline ${base}`
})

const valueClasses = computed<string>(() => {
  const base = 'font-display text-5xl leading-none tabular-nums'   // + tabular-nums, cf. règle §3 doc maître sur les chiffres/KPI
  if (props.variant === 'warning') return `${base} text-cgws-accent`
  return `${base} text-cgws-ink`
})

const iconClasses = computed<string>(() => {
  if (props.variant === 'warning') return 'w-5 h-5 text-cgws-accent flex-shrink-0'
  return 'w-5 h-5 text-cgws-accent flex-shrink-0'
})
```
Justification du choix `accent` (plutôt qu'un nouveau token dédié "attention"/"warning" CGWS, qui n'existe pas dans la grille de rôles v3 et ne doit pas être improvisé sans validation, cf. avertissement §4.1 doc maître) : c'est déjà la convention observée ailleurs dans le code admin pour signaler "ceci mérite l'attention de Camille" sans impliquer une erreur — cf. `consignations/index.vue`, `pendingCount > 0 ? 'text-cgws-accent font-medium' : ...` (compteur d'en-tête déjà en `accent` pour le même cas d'usage). Réutiliser `accent` pour `KpiCard` unifie ce langage visuel plutôt que d'introduire un cinquième rôle chromatique.

**Correction connexe** — classe `tabular-nums` manquante sur la valeur KPI (`font-display text-5xl leading-none`) : violation directe de la règle §3 du doc maître (*"tout affichage... de statistique numérique (StarDivider stat, KpiCard admin) doit porter tabular-nums"*) — ajoutée dans le bloc de code ci-dessus.

### Ce qui est déjà conforme (aucune action)
- Skeleton de chargement : `bg-cgws-hairline animate-pulse` — conforme.
- `role="region"`, `aria-label` dynamique — conforme.

## C.8 Consolidation des mappings de statut dupliqués — `CgwsBadge.vue` comme référence canonique

### Constat d'architecture (dette réelle, au-delà des corrections ponctuelles ci-dessus)

Trois implémentations **indépendantes** du même mapping statut→couleur coexistent dans le code admin, chacune divergente de `CgwsBadge.vue` (déjà 100% conforme à `DESIGN_SYSTEM_v3.md` §4.1, cf. audit ci-dessous) et divergentes **entre elles** :

| Statut | `CgwsBadge.vue` (référence, conforme) | `StatusDropdown.vue` (corrigé §C.6) | `consignations/index.vue` (`consignmentPillClass`) | `RecentActivity.vue` (`STATUS_CONFIG`) |
|---|---|---|---|---|
| `pending` | — (pas de variant produit équivalent) | — | `bg-cgws-accent/20 text-cgws-accent` **✗ à corriger** | `bg-cgws-accent/15 text-cgws-accent` **✗ à corriger** |
| `accepted`/`active` | — | `success/15` ✓ | `success/15` ✓ | `success/15` ✓ |
| `rejected` | `bg-cgws-danger text-cgws-on-danger` (plein) ✓ | — | `bg-cgws-danger/15 text-cgws-danger` **✗ à corriger (doit être plein)** | `bg-cgws-danger/15 text-cgws-danger` **✗ à corriger (doit être plein)** |
| `sold` | `bg-cgws-accent text-cgws-on-accent` (plein) ✓ | corrigé §C.6 ✓ | — (pas dans ce fichier) | `bg-cgws-ink/10 text-cgws-ink` **✗ à corriger (doit être accent plein)** |
| `returned` | — (pas de variant produit équivalent) | — | — (pas dans ce fichier) | `bg-cgws-hairline text-cgws-ink-soft` **✗ à corriger (doit être danger plein, même traitement que rejected, §4.1)** |
| `reserved`/`inactive` | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` ✓ | corrigé §C.6 ✓ | — | — |

### Corrections requises

**`consignations/index.vue`, `consignmentPillClass` :**
```ts
// Avant
function consignmentPillClass(status: ConsignmentStatus): string {
  const map: Record<ConsignmentStatus, string> = {
    pending: `${BASE_PILL} bg-cgws-accent/20 text-cgws-accent`,
    accepted: `${BASE_PILL} bg-cgws-success/15 text-cgws-success border border-cgws-success/40`,
    rejected: `${BASE_PILL} bg-cgws-danger/15 text-cgws-danger`,
    // ... (sold/returned non gérés dans ce fichier — page dédiée aux consignations pending/accepted/rejected)
  }
}

// Après
function consignmentPillClass(status: ConsignmentStatus): string {
  const map: Record<ConsignmentStatus, string> = {
    pending: `${BASE_PILL} bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline`,
    accepted: `${BASE_PILL} bg-cgws-success/15 text-cgws-success border border-cgws-success/40`,
    rejected: `${BASE_PILL} bg-cgws-danger text-cgws-on-danger`,
    sold: `${BASE_PILL} bg-cgws-accent text-cgws-on-accent`,
    returned: `${BASE_PILL} bg-cgws-danger text-cgws-on-danger`,
  }
}
```

**`RecentActivity.vue`, `STATUS_CONFIG` :**
```ts
// Après
const STATUS_CONFIG: Record<ConsignmentStatus, StatusConfig> = {
  pending: { classes: 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline', label: 'En attente' },
  accepted: { classes: 'bg-cgws-success/15 text-cgws-success border border-cgws-success/40', label: 'Acceptée' },
  rejected: { classes: 'bg-cgws-danger text-cgws-on-danger', label: 'Refusée' },
  sold: { classes: 'bg-cgws-accent text-cgws-on-accent', label: 'Vendue' },
  returned: { classes: 'bg-cgws-danger text-cgws-on-danger', label: 'Retournée' },
}
```

**Point d'accessibilité important sur `rejected`/`returned` translucides (`/15`) actuels** : contrairement à `success/15`, dont le contraste composité a été spécifiquement mesuré et corrigé (`DESIGN_SYSTEM_v3.md` §2.1/§2.6, incident `#4E6B34`→`#3D5A28`), **aucune mesure équivalente n'existe pour `danger/15`**. Utiliser `bg-cgws-danger/15 text-cgws-danger` sans validation de contraste sur le fond composité réel est exactement le type d'improvisation que le doc maître met en garde contre (§2.1, §4.1 préambule) — **raison supplémentaire, indépendante de la simple cohérence de taxonomie**, de corriger vers le `danger` **plein** déjà validé (`on-danger` sur `danger` ≥5.0:1 dans les 3 rendus, §2.6), qui élimine le risque plutôt que d'introduire une nouvelle paire non mesurée.

### Recommandation d'architecture (non bloquante, à discuter avec `nuxt-developer`/`product-owner`)

Les trois implémentations divergentes ci-dessus existent parce que chaque fichier maintient sa **propre** fonction `statusPillClass`/`consignmentPillClass`/`STATUS_CONFIG` plutôt que de consommer un point unique de vérité. **Recommandation, non bloquante pour cette US** (le brief demande un re-skin, pas une refonte d'architecture) : envisager d'étendre `CgwsBadge.vue` pour couvrir également les valeurs `ConsignmentStatus` (`pending`/`accepted`/`rejected`/`sold`/`returned`, en plus des `ProductStatus` déjà couverts) et de faire consommer `StatusDropdown`/`consignations/index.vue`/`RecentActivity.vue` ce composant unique plutôt que de dupliquer les classes localement — éliminerait la classe de bug illustrée ci-dessus à la source. Point à signaler à `product-owner`/`nuxt-developer`, cohérent avec la remarque déjà faite en `US-074` §4.1 sur la duplication `ProductCard`/`TagCard`.

## C.9 Mapping "besoin d'attention" (row tint, compteurs) — distinct de la taxonomie de statut, laissé en l'état

**Constat** : au-delà des pilules de statut corrigées ci-dessus, `consignations/index.vue` utilise `accent` à deux autres endroits pour signaler "ceci mérite l'attention de Camille" — indépendamment du badge de statut lui-même :
- Teinte de ligne "en attente" dans la liste : `item.status === 'pending' ? 'bg-cgws-accent/5 border-cgws-accent/30' : ...`
- Compteur d'en-tête : `pendingCount > 0 ? 'text-cgws-accent font-medium' : 'text-cgws-ink-soft'`

**Décision** : **aucune correction requise** sur ces deux points. Contrairement à la pilule de statut (qui *nomme* l'état et doit suivre strictement §4.1), ces deux usages sont des **affordances de mise en avant** ("regarde ici en premier"), une catégorie distincte non couverte par la taxonomie de statut — `accent` y est approprié (texte/tinte lisible, AA garanti, cf. §2.1) et cohérent avec le remapping de `KpiCard` retenu en §C.7 (même convention "attention = accent" appliquée uniformément). **Point à signaler pour clarté QA** : ne pas confondre ce tintage de ligne (légitime, conservé) avec la pilule de statut `pending` elle-même (corrigée en neutre, §C.8) — les deux se trouvent sur la même ligne de tableau mais répondent à des règles différentes.

## C.10 Pages admin — vérification exhaustive dans les 3 rendus (obligatoire, aucune exemption)

| Écran | Fichier(s) | Corrections appliquées ci-dessus | Statut après correction |
|---|---|---|---|
| Dashboard | `app/pages/admin/dashboard.vue` | `KpiCard` (§C.7), `RecentActivity` (§C.3/§C.8) | À revalider 3 rendus |
| Produits — liste | `app/pages/admin/produits/index.vue` | `bg-white` (§C.3), `StatusDropdown` (§C.6), modale suppression → `CgwsButton destructive` recommandé (même logique que §C.4) | À revalider 3 rendus |
| Produits — fiche | `app/pages/admin/produits/[id].vue` | `bg-white` (§C.3), `ProductForm` (§C.3) | À revalider 3 rendus |
| Produits — création | `app/pages/admin/produits/nouveau.vue` | `ProductForm` (§C.3) | À revalider 3 rendus |
| Consignations — liste | `app/pages/admin/consignations/index.vue` | `bg-white` (§C.3), `consignmentPillClass` (§C.8), `RejectModal` (§C.4) | À revalider 3 rendus |
| Consignations — fiche | `app/pages/admin/consignations/[id].vue` | `bg-white` (§C.3), `RejectModal` (§C.4) | À revalider 3 rendus |
| Ventes | `app/pages/admin/ventes/index.vue` | `bg-white` (§C.3), `SaleModal`/`SaleForm` (§C.5) | À revalider 3 rendus |
| Clients — liste | `app/pages/admin/clients/index.vue` | `bg-white` (§C.3) | À revalider 3 rendus |
| Clients — fiche | `app/pages/admin/clients/[id].vue` | `bg-white` (§C.3), `ClientCard`/`ClientAutocomplete` (§C.3) | À revalider 3 rendus |
| Rapports | `app/pages/admin/rapports.vue` | `bg-white` (§C.3), `RevenueChart` (cf. note ci-dessous) | À revalider 3 rendus |
| Catégories | `app/pages/admin/categories/index.vue` | `bg-white` (§C.3), `CategoryPanel`/`CategoryTree`/`CategoryTreeItem` (§C.3) | À revalider 3 rendus |
| Login | `app/pages/admin/login.vue` | **Aucune** — déjà 100% conforme (`bg-cgws-ground`/`surface`/`edge`, `CgwsButton primary`, alerte `danger`) | Référence de conformité, à revalider tout de même par principe (aucune exemption) |

### Point signalé, non bloquant — `RevenueChart.vue` (graphique Chart.js, littéraux figés)

**Constat** : `RevenueChart.vue` (consommé par `app/pages/admin/rapports.vue`) définit ses couleurs de barres en hex **littéraux figés sur Élégante Jour** (`backgroundColor: '#8C4A56'`/`'#B76E79'`, ticks `color: '#5B4436'`, grille `'#EFE1CC'`), avec des commentaires explicites reconnaissant la limitation (*"Chart.js ne lit pas les CSS vars"*). **Conséquence** : si Camille bascule vers Élégante Nuit ou Rugueux, le graphique de chiffre d'affaires **reste rendu avec les couleurs Jour**, en rupture avec le reste de la page (déjà theme-aware après correction §C.3).

**Recommandation, non bloquante (à confirmer avec `nuxt-developer`, dépasse le périmètre design pur)** : Chart.js ne supporte pas nativement les variables CSS, mais peut être rendu theme-aware en lisant les valeurs résolues via `getComputedStyle(document.documentElement).getPropertyValue('--cgws-accent')` (etc.) au montage **et** en réagissant aux changements de peau/mode (ex. `watch` sur un `useCgwsSkin()`/`useColorMode()` combiné, recalcul de `chartData`/`chartOptions` à chaque changement). C'est un changement de logique JS (pas seulement de classes Tailwind), donc **hors périmètre strict d'un re-skin de classes** — signalé ici pour que ce ne soit pas découvert seulement en QA visuelle lors du basculement de peau sur l'écran Rapports, mais son implémentation complète (si retenue) dépasse le cadre de cette spec de design et devrait faire l'objet d'un point technique dédié avec `nuxt-developer`.

## C.11 Mapping statut → couleur sémantique — table récapitulative finale (à valider `product-owner`)

Table de référence unique, résultat de la consolidation des sections C.6/C.7/C.8/C.9 ci-dessus — **remplace** toute divergence locale identifiée dans le code audité :

| Domaine | Statut | Rôle | Classe |
|---|---|---|---|
| Consignation | `pending` | Neutre | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` |
| Consignation | `accepted` | `success` | `bg-cgws-success/15 text-cgws-success border border-cgws-success/40` |
| Consignation | `rejected` | `danger` (plein) | `bg-cgws-danger text-cgws-on-danger` |
| Consignation | `sold` | `accent` (plein) | `bg-cgws-accent text-cgws-on-accent` |
| Consignation | `returned` | `danger` (plein) | `bg-cgws-danger text-cgws-on-danger` |
| Produit | `active` | `success` | `bg-cgws-success/15 text-cgws-success border border-cgws-success/40` |
| Produit | `reserved` | Neutre | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` |
| Produit | `sold` | `accent` (plein) | `bg-cgws-accent text-cgws-on-accent` |
| Produit | `inactive` | Neutre | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` |
| *(hors taxonomie de statut)* KPI/ligne "besoin d'attention" | — | `accent` | `text-cgws-accent` / `border-l-cgws-accent` (cf. §C.7/§C.9) |

**Clarification sur "couleurs sémantiques natives Nuxt UI" (point explicitement signalé comme à trancher par le brief)** : cette spec **ne recommande pas** d'utiliser les props `color="success"`/`color="warning"` natives de Nuxt UI (`UBadge`, `USelect`, etc.) pour ces statuts, malgré la suggestion initiale de l'outline. Raison technique concrète découverte en audit (`app/app.config.ts`, décision `US-070` déjà actée) : `ui.colors.primary`/`neutral` ne sont volontairement **pas** reliés aux tokens CGWS, ce qui signifie que les couleurs sémantiques Nuxt UI natives ne varient **pas** selon `data-skin` — les utiliser romprait la règle transversale non négociable (§9 doc maître) selon laquelle toute couleur visible doit être theme-aware dans les 3 rendus. De plus, **aucun composant admin audité dans cette US n'utilise de composant Nuxt UI natif pour l'affichage de statut** (`StatusDropdown`, `CgwsBadge`, les pilules de liste sont tous 100% custom) — il n'y a donc pas de `color` prop à renseigner : la voie déjà empruntée par `CgwsBadge.vue` (classes Tailwind directes sur les tokens CGWS `success`/`danger`/neutre) est la **seule** cohérente avec le reste du design system, et c'est celle que cette table généralise.

**À confirmer avec `product-owner` avant merge, non bloquant** :
1. Le statut `inactive` (produit) partage le traitement neutre de `reserved` sans distinction visuelle — cf. `DESIGN_SYSTEM_v3.md` §8.2, point déjà signalé, non tranché par cette US.
2. Le remapping de `KpiCard variant="warning"` vers `accent` (§C.7) au lieu de `danger` — décision par défaut de cette spec, cohérente avec l'usage déjà existant ailleurs dans le code (`consignations/index.vue`), mais jamais explicitement validée par le client/`product-owner` pour ce cas précis.
3. Le futur `RevenueChart.vue` theme-aware (§C.10) — dépend d'un arbitrage technique (`nuxt-developer`) sur la faisabilité/le coût de lecture réactive des CSS custom properties dans Chart.js, pas un point de design.

---

# Critères d'acceptation (Gherkin)

```gherkin
Fonctionnalité : Header/Footer/MobileMenu theme-aware, Contact re-skinné, Admin cohérent (US-075)

  # ─── BLOC A — Header / Footer ────────────────────────────────────────────

  Scénario : Header et footer suivent la peau active
    Quand j'active successivement "Élégante Jour", "Élégante Nuit" et "Rugueux"
    Alors le header ("AppHeader") et le footer ("AppFooter") affichent tous deux
      un fond "bg-cgws-surface" cohérent avec la peau active
    Et aucun des deux n'affiche de couleur figée (ancien "bg-cgws-tack")
      quelle que soit la peau

  Scénario : État "scrolled" du header
    Étant donné que je suis sur n'importe quelle page publique
    Quand je fais défiler la page de plus de 50px
    Alors le header applique "bg-cgws-surface/90 backdrop-blur-md"
      et une ombre portée, sans changement de mise en page

  Scénario : Bordure décorative du footer
    Alors le filet supérieur du footer utilise "border-cgws-accent-deco"
      (jamais "border-cgws-accent", réservé au texte lisible)

  Scénario : Anneaux de focus du footer cohérents avec son nouveau fond
    Quand je navigue au clavier jusqu'à un lien du footer
    Alors l'anneau de focus utilise "focus-visible:ring-offset-cgws-surface"
      (jamais "-ground" ni "-tack"), visible dans les 3 rendus

  Scénario : ThemeSwitcher présent header desktop et mobile
    Alors le "ThemeSwitcher" est visible dans "AppHeader" (desktop, avant l'icône
      téléphone) et dans "MobileMenu" (layout="stacked", au-dessus du bloc contact)
    Et le contrôle jour/nuit est masqué quand la peau "rugueux" est active

  Scénario : Garde technique colorMode.forced
    Étant donné que le "ThemeSwitcher" est monté sur une page où "colorMode.forced"
      serait vrai (cas hypothétique/futur)
    Alors le contrôle jour/nuit n'est pas rendu, quelle que soit la peau active

  # ─── BLOC B — Contact ─────────────────────────────────────────────────────

  Scénario : Formulaire de contact re-skinné
    Alors les champs "CgwsInput"/"CgwsSelect"/"CgwsTextarea" affichent un état
      d'erreur en "border-cgws-danger" et un message "text-cgws-danger role=alert"
    Et le bouton d'envoi est un "CgwsButton variant=primary"

  Scénario : Cadre de la carte de contact
    Alors le conteneur ".contact-map" utilise "border-cgws-edge"
      (jamais "border-cgws-hairline")

  Scénario : Marker de carte décoratif, jamais porteur de texte
    Alors le marker Leaflet utilise "var(--cgws-accent-deco)" en fond
    Et le texte du popup ("CGWS", "Brèches...") utilise
      "var(--cgws-ink)"/"var(--cgws-ink-soft)"
    Et aucune valeur hexadécimale v2 codée en dur ("#B8650A", "#FAF3E3",
      "#1A0B03", "#7B3B1C") ne subsiste dans "ContactMap.vue"

  # ─── BLOC C — Admin ───────────────────────────────────────────────────────

  Scénario : Sidebar et topbar admin non figées sur une peau
    Quand j'active successivement les 3 rendus depuis le backoffice
    Alors la sidebar ("bg-cgws-ground") et la topbar ("bg-cgws-surface")
      de "app/layouts/admin.vue" suivent la peau active
    Et aucune classe "bg-cgws-tack"/"bg-cgws-parchment" n'est présente

  Scénario : ThemeSwitcher accessible à toutes les largeurs en admin
    Étant donné que je consulte le backoffice sur un viewport de 375px
    Alors un "ThemeSwitcher" (variante icône-seule "compact") est visible
      dans la topbar, jamais totalement masqué
    Et sur un viewport ≥640px, la variante complète ("inline") est affichée

  Scénario : Aucun fond blanc codé en dur dans l'admin
    Alors aucun composant ni page sous "app/components/admin/**" ou
      "app/pages/admin/**" n'utilise la classe Tailwind "bg-white"
    Et tous les conteneurs de carte/panneau/modale/table utilisent
      "bg-cgws-surface"

  Scénario : RejectModal migré vers le rôle danger et CgwsButton destructive
    Étant donné que j'ouvre "RejectModal" depuis une consignation en attente
    Alors l'icône d'alerte utilise "bg-cgws-danger/10 text-cgws-danger"
    Et l'astérisque requis et la bordure d'erreur du champ utilisent
      "text-cgws-danger"/"border-cgws-danger"
    Et le bouton de confirmation est un "CgwsButton variant=destructive"
      (plus de classes "bg-cgws-danger" codées en dur sur un "<button>" brut)

  Scénario Plan : Taxonomie de statut cohérente à travers tous les composants
    Étant donné le statut "<statut>" du domaine "<domaine>"
    Alors sa représentation visuelle (pilule/dot) dans "CgwsBadge",
      "StatusDropdown", la liste des consignations et "RecentActivity"
      utilise systématiquement la classe "<classe>"

    Exemples :
      | domaine      | statut    | classe                                                          |
      | Consignation | pending   | bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline |
      | Consignation | accepted  | bg-cgws-success/15 text-cgws-success border border-cgws-success/40 |
      | Consignation | rejected  | bg-cgws-danger text-cgws-on-danger                               |
      | Consignation | sold      | bg-cgws-accent text-cgws-on-accent                               |
      | Consignation | returned  | bg-cgws-danger text-cgws-on-danger                               |
      | Produit      | active    | bg-cgws-success/15 text-cgws-success border border-cgws-success/40 |
      | Produit      | reserved  | bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline |
      | Produit      | sold      | bg-cgws-accent text-cgws-on-accent                               |
      | Produit      | inactive  | bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline |

  Scénario : Aucune couleur sémantique Nuxt UI native non theme-aware introduite
    Alors aucun composant de statut admin n'utilise une prop "color=success"
      ou "color=warning" d'un composant Nuxt UI natif ("UBadge", "USelect"...)
    Et tous les statuts utilisent des classes Tailwind sur les rôles CGWS
      ("bg-cgws-success", "bg-cgws-danger", "bg-cgws-surface-2")

  Scénario Plan : Validation obligatoire dans les 3 rendus, tous les écrans admin
    Étant donné que je consulte l'écran admin "<écran>"
    Quand j'active successivement "elegante-jour", "elegante-nuit" et "rugueux"
    Alors tous les fonds, textes, badges et boutons de l'écran restent lisibles
      et cohérents avec la peau active, sans résidu "bg-white" ni token v2

    Exemples :
      | écran                          |
      | dashboard                      |
      | produits (liste + fiche + création) |
      | consignations (liste + fiche)  |
      | ventes                         |
      | clients (liste + fiche)        |
      | rapports                       |
      | catégories                     |
      | login                          |

  Scénario Plan : Responsive
    Étant donné que j'affiche le site à la largeur <largeur>
    Alors le header/footer public et la topbar/sidebar admin s'adaptent
      selon <comportement>

    Exemples :
      | largeur | comportement                                                        |
      | 375px   | header h-14, drawer mobile plein écran, topbar admin + ThemeSwitcher compact |
      | 768px   | header h-14, footer 2 colonnes réordonnées, topbar admin + ThemeSwitcher inline |
      | 1440px  | header h-16, nav inline, footer 4 colonnes, sidebar admin fixe desktop |
```

---

# Résumé des décisions tranchées par cette spec (à confirmer/non bloquant)

| # | Décision | Statut |
|---|---|---|
| 1 | Header **et** footer sur `bg-cgws-surface` (pas `ground`) — bande de chrome distincte du canevas de page | Tranché par cette spec, cohérent avec la justification client §8.1 — **à valider visuellement**, non bloquant |
| 2 | `focus-visible:ring-offset` du footer : `cgws-surface` (suit la décision #1) | Conséquence directe de #1 |
| 3 | `MobileMenu` reste sur `bg-cgws-ground` (convention "drawer/overlay transitoire", distincte du chrome permanent) | Tranché par cette spec |
| 4 | Nouvelle variante `ThemeSwitcher layout="compact"` (icône-seule bascule peau) pour la topbar admin mobile | Spécifiée en détail §C.2, **à implémenter** (n'existe pas encore dans le code) |
| 5 | `bg-white` → `bg-cgws-surface` généralisé (~35 emplacements), `border-white` → `border-current` sur les spinners | Correction transversale, **priorité haute** — régression d'accessibilité réelle, pas seulement esthétique |
| 6 | `KpiCard variant="warning"` remappé sur `accent` (pas `danger`) | Décision par défaut de cette spec — **à confirmer avec `product-owner`**, non bloquant |
| 7 | Statuts `rejected`/`returned` : plein (`bg-cgws-danger text-cgws-on-danger`), jamais `/15` translucide (non mesuré en contraste, contrairement à `success/15`) | Tranché par cette spec pour raison d'accessibilité, pas seulement de goût |
| 8 | Pas d'usage de `color="success"`/`color="warning"` Nuxt UI natif — tous les statuts restent sur classes Tailwind CGWS custom | Tranché par cette spec, fondé sur la décision déjà actée dans `app.config.ts` (`US-070`) |
| 9 | `RevenueChart.vue` reste figé sur les couleurs Élégante Jour (non theme-aware) | **Signalé, non résolu par cette US** — nécessite un arbitrage technique avec `nuxt-developer` |
| 10 | Statut `inactive` (produit) partage le traitement neutre de `reserved` | Hérité de `DESIGN_SYSTEM_v3.md` §8.2, non re-tranché ici — **à confirmer `product-owner`** |
