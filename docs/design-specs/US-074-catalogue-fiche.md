# Catalogue + Fiche produit v3 « Cowgirl élégante » — Spec UX (US-074)

**Purpose** : re-skin/audit du parcours de découverte produit (liste catalogue filtrable + fiche produit) vers la grille de rôles sémantiques v3, en réutilisant tels quels les composants signature livrés en `US-072` (`StarDivider`, `FiligreeCorner`, `CgwsButton`, `CgwsBadge`) et en consommant `useCatalogue()`/`CATALOGUE_CONTEXT_KEY` sans modification de structure. C'est le cœur du tunnel de conversion CGWS — filtrer, comparer, se décider — il doit rester impeccablement lisible dans les 3 rendus.
**Location** (fichiers concernés, re-skin/correction en place — structure/props/emits/composables existants préservés) :
- `app/pages/catalogue/index.vue`
- `app/pages/catalogue/[slug].vue`
- `app/components/catalogue/CatalogueHeader.vue`
- `app/components/catalogue/FilterPanel.vue`
- `app/components/catalogue/FilterDrawer.vue`
- `app/components/catalogue/SortSelect.vue`
- `app/components/catalogue/ProductGrid.vue`
- `app/components/catalogue/ProductCard.vue`
- `app/components/catalogue/EmptyState.vue`
- `app/components/ui/ProductCardSkeleton.vue`
- `app/components/ui/CgwsBadge.vue` (extension de variant, cf. §6.2)
- `app/components/product/ProductGallery.vue`
- `app/components/product/ProductInfo.vue`
- `app/components/product/RelatedProducts.vue`

**Dépend de** : `US-070` (tokens), `US-071` (switcher), `US-072` (`StarDivider`, `FiligreeCorner`, `CgwsButton`, `CgwsBadge` déjà livrés et consommés ici, pas redéfinis).

**Constat de départ (audit du code actuel)** : comme pour `US-073`, l'essentiel des fichiers de cette US a **déjà été re-tokenisé mécaniquement** vers les noms de classes v3 (`bg-cgws-ground`, `text-cgws-accent`, `border-cgws-hairline`, `font-eyebrow`…), vraisemblablement lors du passage `US-070`/`US-071`/`US-072`. Cette spec n'est donc pas une refonte : elle **audite** ce re-tokenage et corrige quatre catégories de problèmes réels trouvés dans le code actuel :
1. un badge de statut **mal mappé sur le mauvais rôle sémantique** (`reserved` → `danger` au lieu de neutre, §5.4) — violation directe de la taxonomie `DESIGN_SYSTEM_v3.md` §4.1 ;
2. une **classe utilitaire manquante** (`tabular-nums` absent du prix de fiche, §7.2) — violation directe de la règle §3 ;
3. deux **composants Nuxt UI natifs non re-thémés** (`USlider`, `USelect`) dont le focus-ring et la couleur active restent sur la palette neutre "stone" de `app.config.ts` plutôt que sur `accent` — violation de la règle transversale §9 du doc maître ("focus visible en accent dans les deux peaux") ;
4. une **duplication d'architecture** entre `ProductCard.vue` (catalogue) et `TagCard.vue` (`ui/`, `US-072` §1) — les deux composants réimplémentent la même carte étiquette indépendamment. Décision explicite prise §5.1 : ne pas fusionner dans le cadre de cette US.

Chaque section liste : ce qui est déjà conforme (aucune action), ce qui doit changer (correction précise avec classes), et les points d'attention d'accessibilité — en particulier le **point critique n°1 de cette US** : chips de filtre actifs et vignettes de galerie sélectionnées = indicateurs d'état fonctionnels, `accent` uniquement, jamais `accent-deco`.

---

## 0. Assemblage de page — audit des deux fichiers de page

### `app/pages/catalogue/index.vue` — déjà conforme

- Skip link `focus:bg-cgws-accent focus:text-cgws-on-accent` — correct, CTA de focus toujours en accent/on-accent.
- `CatalogueHeader` → `StarDivider` (défaut `bgClass="bg-cgws-ground"`) → conteneur `max-w-[1280px]` → mobile `FilterDrawer` + `SortSelect` en ligne / desktop `FilterPanel` sidebar sticky + `ProductGrid`. Structure, `provide(CATALOGUE_CONTEXT_KEY, …)` et composable `useCatalogue()` **inchangés**.
- `#catalogue-results` : `role="status" aria-live="polite"` sur le compteur desktop — déjà conforme.
- Aucun override de `bgClass` nécessaire sur le `StarDivider` : `CatalogueHeader` et la zone de résultats partagent `bg-cgws-ground` (cf. `US-073` §5, même principe d'homogénéité de fond).

### `app/pages/catalogue/[slug].vue` — déjà conforme

- Breadcrumb `bg-cgws-ground border-b border-cgws-hairline`, liens `text-cgws-ink-soft/70 hover:text-cgws-accent`, séparateurs `›` en `text-cgws-ink-soft/40 aria-hidden` — déjà correct, contraste lien `accent` sur `ground` ≥5.6:1 (doc maître §2.6).
- Layout `flex-col lg:flex-row` : galerie `lg:w-[55%]` + info `flex-1 lg:sticky lg:top-[calc(4rem+2rem)]` — préservé tel quel (cf. wireframes §8).
- `StarDivider` par défaut entre section produit et `RelatedProducts` — fond `ground` des deux côtés, pas d'override nécessaire.

**Aucun changement structurel requis sur les deux fichiers de page** — toutes les corrections de cette US portent sur les composants enfants.

---

## 1. `CatalogueHeader.vue`

### Wireframe (ASCII, desktop 1440px)

```
┌──────────────────────────────────────────────────────────────┐
│ ﹌                                                             │ ← FiligreeCorner top-left (nouveau)
│  SELLERIE DE BRÈCHES                                          │ ← eyebrow, font-eyebrow, text-cgws-accent
│  LE CATALOGUE                                                 │ ← H1, font-heading (Rye) — CORRIGÉ (était font-display)
│  128 produits disponibles                                     │ ← statut, role=status aria-live
│                                                          ﹌   │ ← FiligreeCorner bottom-right (nouveau)
└──────────────────────────────────────────────────────────────┘
```

### 1.1 Correction requise — H1 `font-display` → `font-heading` (Rye)

**Constat** : le H1 actuel affiche le texte statique **"Catalogue"** (1 mot) en `font-display` (Playfair Display, réservé par `DESIGN_SYSTEM_v3.md` §3 au H1 hero plein écran de la homepage). Ce n'est pas un hero plein écran mais un bandeau de section compact (`py-8 md:py-14`) — le cadrage `US-073-074-075-pages-outline.md` §US-074 prescrit explicitement : *« Titre H2 court possible en `font-heading` (Rye) si ≤4 mots (ex. "Le Catalogue"), sinon Playfair »*.

**Décision** : "Catalogue" (1 mot) → **`font-heading`** (Rye), pas `font-display`. Le tag sémantique reste `<h1>` (un seul H1 par page, inchangé) — seule la classe de police change, la règle Rye du §3 du doc maître porte sur le **nombre de mots et le contexte** (hero plein écran vs bandeau de section), pas sur le niveau de heading HTML.

```html
<!-- Avant -->
<h1 class="font-display text-[56px] md:text-[64px] text-cgws-ink leading-none tracking-wide uppercase mb-3">
  Catalogue
</h1>

<!-- Après -->
<h1 class="font-heading text-[44px] md:text-[52px] text-cgws-heading leading-none tracking-wide uppercase mb-3">
  Catalogue
</h1>
```
- Taille réduite (`56/64px` → `44/52px`) : Rye est une police plus dense/large à corps égal que Playfair, un même corps en Rye occuperait visuellement plus de place — ajustement cohérent avec le rendu des autres titres `font-heading` du site (`US-072` §7, "Le Certificat de Consignation" en `text-3xl md:text-4xl`).
- Couleur : `text-cgws-heading` (rôle dédié aux titres Rye, §2.1 doc maître — mesuré 5.79:1 Élégante Jour, large text ≥3:1 requis), au lieu de `text-cgws-ink` (rôle générique texte fort, prévu pour le corps/H2 Playfair, pas les titres Rye).
- **Garde-fou pour l'avenir** : si ce H1 devient un jour dynamique par catégorie (ex. filtrage par URL affichant "Selles" en titre), vérifier le nombre de mots avant d'appliquer Rye — tous les libellés actuels de `CATEGORY_LABELS` (`useCatalogue.ts`) sont ≤3 mots ("Brides & Licols", "Bottes & Chaussures"), donc Rye resterait valide, mais toute évolution du contenu doit revalider cette règle (§3 doc maître : Rye jamais sur un titre potentiellement long/dynamique sans vérification).

### 1.2 Ajout requis — `FiligreeCorner` discret (nouveau)

Le cadrage demande un *« filigrane discret en fond d'en-tête »*. Absent actuellement. Traitement identique à `StatsBar` (`US-073` §2.1) : 2 filigranes maximum, coins diagonalement opposés, opacité réduite.

```html
<section class="relative bg-cgws-ground py-8 md:py-14" role="region" aria-label="En-tête du catalogue">
  <FiligreeCorner class="absolute top-3 left-3 md:top-5 md:left-5 w-10 h-10 md:w-14 md:h-14" :opacity="40" />
  <FiligreeCorner class="absolute bottom-3 right-3 md:bottom-5 md:right-5 w-10 h-10 md:w-14 md:h-14 rotate-180" :opacity="40" />
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <!-- eyebrow / H1 / compteur inchangés -->
  </div>
</section>
```
- `class="relative"` ajouté au `<section>` pour ancrer les filigranes (seul changement structurel, identique à `StatsBar`).
- Taille réduite (`w-10 h-10`/`w-14 h-14`) car le bandeau est bas (`py-8 md:py-14`), cohérent avec la réduction déjà actée en `StatsBar` (`US-073` §2.1).
- `aria-hidden="true"` géré nativement par `FiligreeCorner` (`US-072` §3), rien à ajouter ici.

### Ce qui est déjà conforme (aucune action)

- Eyebrow "Sellerie de Brèches" (3 mots) en `font-eyebrow text-cgws-accent` — texte lisible réel (pas décoratif), `accent` est donc le bon choix (≥5.6:1 dans les 3 rendus, doc maître §2.6), cohérent avec le traitement de l'eyebrow de `RelatedProducts` ("Vous pourriez aussi aimer").
- Compteur `role="status" aria-live="polite" aria-atomic="true"` en `text-cgws-ink-soft` — déjà correct.

### Tailwind classes clés (récapitulatif)

```
Section (corrigé): relative bg-cgws-ground py-8 md:py-14
Filigranes (nouveau): absolute top-3 left-3 / bottom-3 right-3 (rotate-180) w-10 h-10 md:w-14 md:h-14, opacity 40
Eyebrow: font-eyebrow text-[12px] text-cgws-accent uppercase tracking-[0.2em] mb-2
H1 (corrigé): font-heading text-[44px] md:text-[52px] text-cgws-heading leading-none tracking-wide uppercase mb-3
Compteur: font-sans font-medium text-sm text-cgws-ink-soft
```

### Accessibilité

- Contraste H1 : `heading` sur `ground` — 5.79:1 Élégante Jour (doc maître §2.6, seuil large text 3:1 largement dépassé, texte affiché ≥44px). **Nuit/Rugueux : à mesurer en implémentation** — le doc maître ne pré-calcule `heading` sur `ground` que pour Élégante Jour (les tables §2.3/§2.4 donnent les hex mais §2.6 ne liste pas la paire pour Nuit/Rugueux) — QA doit confirmer ≥3:1 réel dans les 3 rendus avant merge.
- Filigranes : `aria-hidden="true"` intégré au composant, opacité ≤60% (40 utilisé ici) — conforme `US-072` §3 et §8.2.

---

## 2. `FilterPanel.vue` (sidebar desktop) / `FilterDrawer.vue` (mobile)

### 2.1 POINT CRITIQUE A11Y — qu'est-ce qu'un « chip de filtre actif » dans le code actuel ?

**Constat important** : le code actuel **n'a pas** de composant "chip" au sens pastille-bouton-toggle-avec-nom-de-filtre. Les filtres (`Catégorie`, `État`, `Marque`, `Disponibilité`) sont rendus en **cases à cocher natives + label**, pas en pilules sélectionnables. L'indicateur fonctionnel d'« état actif » d'un filtre existe sous deux formes concrètes dans le code, toutes deux à auditer contre la règle `accent`/jamais `accent-deco` :

1. **Le badge de comptage par section** (le vrai "chip" au sens de l'outline — il porte un texte lisible, un nombre) :
   ```html
   <span v-if="categoryActiveCount() > 0" class="font-sans font-semibold text-[11px] text-cgws-accent bg-cgws-accent/10 rounded-full px-2 py-0.5">
     {{ categoryActiveCount() }}
   </span>
   ```
   Présent pour Catégorie / État / Marque / Disponibilité, identique dans `FilterPanel.vue` et `FilterDrawer.vue`, plus sur le bouton déclencheur du `FilterDrawer` (`activeFilterCount`).
2. **La coche native du checkbox** : `accent-cgws-accent` (propriété CSS `accent-color`, pilotée par le token `--cgws-accent`) — indicateur d'état natif du navigateur, pas un chip mais un indicateur fonctionnel au même titre.

**Verdict d'audit** : les deux utilisent déjà `accent`, **jamais `accent-deco`** — conforme à l'exigence n°1 de cette US. **Aucune correction structurelle requise** (pas de nouveau composant `FilterChip` à créer — ce serait une refonte, hors périmètre "re-skin en place").

**Point de vigilance à verrouiller pour QA** : `bg-cgws-accent/10 text-cgws-accent` est un **fond composité à opacité réduite** — exactement le type de paire que `DESIGN_SYSTEM_v3.md` §2.1 identifie comme nécessitant une vérification systématique du contraste sur le fond composité réel, pas une présomption de conformité par analogie avec `accent` sur fond opaque (cf. l'incident `success/15` §2.6 du doc maître, qui a nécessité un ajustement de teinte). **À mesurer en implémentation/QA** : contraste de `text-cgws-accent` sur `bg-cgws-accent/10` composité sur `ground` (Élégante Jour) et sur `surface`/`ground` selon le fond du panneau (`FilterPanel` est sur `bg-cgws-ground`), dans les 3 rendus — non pré-calculé dans le doc maître. Si la mesure échoue, la correction attendue est identique à celle de `success` §2.2 : assombrir/éclaircir la valeur `accent` utilisée spécifiquement pour ce fond, pas introduire `accent-deco`.

### 2.2 Correction requise — `USlider` (prix) non re-thémé (Nuxt UI natif)

**Constat (vérifié via `mcp__nuxt-ui-remote__get-component-metadata` sur `USlider`)** : `app.config.ts` documente explicitement la décision `US-070` de **ne pas** relier `ui.colors.primary`/`neutral` aux tokens CGWS (`primary: 'stone'`, `neutral: 'stone'`) — les composants Nuxt UI natifs non stylés custom gardent donc la palette neutre "stone" par défaut. Le `USlider` de prix (`FilterPanel.vue`, `FilterDrawer.vue`) n'a **aucune prop `color` ni `:ui` override** → il hérite du défaut `color="primary"` → rendu en **stone neutre**, pas en `accent`.

C'est exactement le cas que `app.config.ts` invite à documenter comme dette *("si des composants Nuxt UI natifs non stylés custom apparaissent [...] et doivent suivre la peau active")* — et c'est précisément le cas ici : le slider de prix représente une **plage de filtre active** (fonctionnelle), sur une page publique theme-aware. Un rendu figé en gris "stone" romprait à la fois l'identité de marque (aucune trace de rose/mauve/laiton) et la cohérence avec la règle "indicateur d'état actif = accent".

**Correction recommandée** (override `:ui`, slots confirmés via MCP : `root`/`track`/`range`/`thumb`) :
```html
<USlider
  v-model="priceRange"
  :min="0" :max="maxPrice" :step="10" :min-steps-between-thumbs="50"
  aria-label="Fourchette de prix"
  class="mt-2 mb-4"
  :ui="{
    track: 'bg-cgws-hairline',
    range: 'bg-cgws-accent',
    thumb: 'bg-cgws-accent ring-2 ring-cgws-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2',
  }"
/>
```
> Classes de base exactes du slot `thumb`/`track` de la version installée à re-confirmer par `nuxt-developer` via `mcp__nuxt-ui-remote__get-component` (section `theme`) au moment de l'implémentation — le principe (les rôles `hairline`/`accent`/`on-accent` remplacent le "stone" par défaut) est la partie prescriptive de cette spec, pas la classe Tailwind exacte du twMerge sous-jacent.

### 2.3 Correction requise — `USelect` (tri) : focus-ring neutre, pas `accent`

**Constat (vérifié via `mcp__nuxt-ui-remote__get-component` sur `USelect`, section `theme`)** : `SortSelect.vue` utilise `color="neutral" variant="outline"`. Le thème officiel du composant a une `compoundVariant` explicite : `{ color: 'neutral', variant: ['outline','subtle'], class: 'outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted' }` — le focus-ring rendu est donc **`ring-inverted`** (couleur neutre "stone" inversée), pas `accent`.

C'est une violation directe de la règle transversale non négociable §9 du doc maître : *« Navigation clavier complète, focus visible en `accent` (ring 2px) dans les deux peaux — y compris en admin »*. Le rôle "neutre" du `color`/`variant` chrome (fond, bordure, texte du select) est un choix délibéré et acceptable — le tri n'est pas un "état de filtre actif" nécessitant `accent` en fond — **mais le focus-ring, lui, n'a aucune exception** : c'est une règle transversale de navigation clavier, indépendante du rôle chromatique du composant.

**Correction recommandée** :
```html
<USelect
  v-model="modelValue"
  :items="sortItems"
  placeholder="Trier par"
  trailing-icon="i-lucide-chevrons-up-down"
  size="sm"
  color="neutral"
  variant="outline"
  aria-label="Trier les produits"
  class="min-w-[160px]"
  :ui="{ base: 'focus-visible:ring-cgws-accent' }"
/>
```
- `focus-visible:ring-cgws-accent` dans `:ui.base` est fusionné par `tailwind-merge` par-dessus `focus-visible:ring-inverted` du thème par défaut (même groupe d'utilitaire `ring-color`, la classe la plus à droite dans l'arbre de merge l'emporte) — pas de changement de `color`/`variant` nécessaire, uniquement le ring.
- Même correction à appliquer à **tout** composant Nuxt UI natif utilisé ailleurs dans le catalogue/fiche avec `color="neutral"` si un focus-ring y est rendu par défaut (aucun autre cas identifié dans le périmètre de cette US au moment de l'audit — `UDrawer`, lui, n'a pas de ring de focus propre, cf. §3).

### Ce qui est déjà conforme (aucune action)

- `FilterPanel` (sidebar) : `bg-cgws-ground border border-cgws-hairline`, sections `border-b border-cgws-hairline`, boutons de section `text-cgws-ink hover:text-cgws-accent`, `focus-visible:ring-2 focus-visible:ring-cgws-accent` — déjà entièrement conforme.
- Checkboxes : `border border-cgws-hairline cursor-pointer accent-cgws-accent` — coche native pilotée par `accent`, conforme (≥3:1 UI garanti puisque `accent` est toujours ≥4.5:1 texte, donc a fortiori ≥3:1 UI).
- `FilterDrawer` : `UDrawer` déjà correctement thémé via `:ui="{ content: 'bg-cgws-ground rounded-t-[12px] ...', overlay: 'bg-cgws-ink/40 backdrop-blur-sm' }"` — aucune action. Bouton déclencheur, header, footer (`CgwsButton ghost` + `CgwsButton primary`) déjà conformes.
- Bouton "Réinitialiser" (sidebar) : `text-cgws-accent hover:text-cgws-ink-soft ... disabled:opacity-30` — lien fonctionnel réel, `accent` correct.

### Tableau d'états — filtres

| Élément | Inactif | Actif | Hover | Focus |
|---|---|---|---|---|
| Checkbox natif | `border-cgws-hairline`, non coché | `accent-cgws-accent` (coche colorée) | `hover:text-cgws-accent` sur le label parent | ring natif navigateur (à vérifier visuellement, non stylé explicitement) |
| Badge de comptage (chip) | absent (`v-if="count > 0"`) | `text-cgws-accent bg-cgws-accent/10 rounded-full` — **à mesurer, §2.1** | n/a (non interactif, affichage seul) | n/a |
| Bouton d'en-tête de section (accordéon) | `text-cgws-ink` | `aria-expanded="true"`, chevron `rotate-180` | `hover:text-cgws-accent` | `focus-visible:ring-2 ring-cgws-accent ring-inset` |
| `USlider` prix | `range`/`thumb` neutre stone (état actuel, **à corriger §2.2**) | idem, sur toute la plage | — | **à corriger** : `focus-visible:ring-cgws-accent` (§2.2) |
| `USelect` tri | `variant="outline" color="neutral"` (chrome neutre, intentionnel) | valeur sélectionnée affichée | `hover:bg-elevated` (thème Nuxt UI par défaut) | **à corriger** : `focus-visible:ring-cgws-accent` (§2.3), pas `ring-inverted` |

### Accessibilité

- Chip/badge de comptage : `aria-label` non requis en plus (le nombre est déjà visuellement adjacent au libellé de section, ex. "Catégorie [2]" — le contexte textuel suffit pour un lecteur d'écran qui lit la section dans l'ordre).
- Accordéons : `aria-expanded`, `aria-controls` déjà présents (sidebar uniquement — `FilterDrawer` n'a pas d'`aria-controls`, **écart mineur à corriger en implémentation** pour cohérence avec `FilterPanel`, non bloquant).
- `USlider`/`USelect` : `aria-label` déjà fournis ("Fourchette de prix", "Trier les produits") — conformes, seul le focus-ring visuel est à corriger (§2.2/§2.3).

---

## 3. `SortSelect.vue`

Couvert intégralement en §2.3 (correction focus-ring). Aucune autre action — `size="sm"`, `min-w-[160px]`, placeholder, items (Pertinence/Prix croissant/Prix décroissant/Nouveautés) inchangés.

---

## 4. `ProductGrid.vue` + `ProductCard.vue` (grille catalogue) + `ProductCardSkeleton.vue` + `EmptyState.vue`

### 4.1 Décision de conception — `ProductCard.vue` vs `TagCard.vue` : ne pas fusionner dans cette US

Le cadrage `US-073-074-075-pages-outline.md` §US-074 prescrit *« Grille de `TagCard` v3 (cf. `US-072` §1) »*. **Constat d'audit** : `ProductGrid.vue` consomme en réalité `app/components/catalogue/ProductCard.vue` — un composant **distinct** de `app/components/ui/TagCard.vue`, qui réimplémente indépendamment le même motif (perforation, bloc couture pointillée `accent-deco`, badge, prix `font-display tabular-nums text-cgws-accent`) et qui est **déjà re-tokenisé v3** intégralement.

**Décision retenue (assumée)** : conserver `ProductCard.vue` tel quel plutôt que de forcer un remplacement par `TagCard.vue` dans `ProductGrid`/`RelatedProducts`. Justification :
1. `ProductCard.vue` porte des comportements métier que `TagCard.vue` n'a pas et qui sont indispensables au catalogue : rendu **non-cliquable** en `<div>` pour les produits vendus (`isSold` → pas de `NuxtLink`, empêche la navigation vers une fiche "morte"), **bannière diagonale "Réservé"** (absente de `TagCard`), affichage conditionnel de la **taille** (`product.size`), et un overlay hover "Voir le produit" dédié.
2. Forcer `TagCard.vue` à la place nécessiterait soit de lui ajouter toutes ces variantes (grossissant un composant générique censé rester réutilisable pour d'autres contextes futurs, ex. une éventuelle sélection "produits vedettes" en homepage), soit de perdre ces comportements — les deux sont des changements fonctionnels, pas un simple re-skin.
3. `ProductCard.vue` est déjà conforme aux classes v3 prescrites par `US-072` §1 pour la carte (perforation, couture, badge, prix) — la duplication est une dette d'architecture réelle, mais **pas un problème de design tokens**.

**Point à signaler à `product-owner`/`nuxt-developer`, non bloquant pour cette US** : évaluer en debt technique si `TagCard.vue` doit à terme absorber les variantes de `ProductCard.vue` (props `sold`/`reserved`/`showSize`) pour n'avoir plus qu'un seul composant carte dans tout le site, ou si les deux composants doivent officiellement rester séparés avec une responsabilité documentée (`TagCard` = carte générique minimaliste, `ProductCard` = carte catalogue avec logique de statut complète). Cette US ne tranche pas ce point d'architecture, elle documente la carte telle qu'elle existe.

### 4.2 Correction requise — bannière "Réservé" : `danger` → neutre

**Constat (violation de taxonomie)** : le ruban diagonal "Réservé" de `ProductCard.vue` utilise actuellement :
```html
<span class="rotate-[-25deg] bg-cgws-danger/90 px-8 py-1.5 w-[200%] font-sans font-bold text-[11px] uppercase tracking-widest text-cgws-on-danger text-center">
  Réservé
</span>
```
`DESIGN_SYSTEM_v3.md` §4.1 (taxonomie des statuts) tranche explicitement : *« Produit `reserved` → Neutre (`ink-soft`/`surface-2`) »* — **pas** `danger`. `danger` est réservé aux statuts négatifs/destructifs (refusé, rendu) ; "réservé" est un état normal du cycle de vente (quelqu'un a posé une option), pas une alerte. C'est exactement le type d'improvisation que le doc maître signale comme un piège récurrent (cf. l'incident `bg-cgws-heading/15` en préambule de §4.1, "aucun rôle validé n'existait [...] le développeur a [...] improvisé").

**Correction** :
```html
<span class="rotate-[-25deg] bg-cgws-ink-soft/90 px-8 py-1.5 w-[200%] font-sans font-bold text-[11px] uppercase tracking-widest text-cgws-ground text-center">
  Réservé
</span>
```
- `bg-cgws-ink-soft` (au lieu de `bg-cgws-danger`) + `text-cgws-ground` (au lieu de `text-cgws-on-danger`) : conserve un ruban à fort contraste (fond plein sombre/moyen + texte clair) mais dans la famille **neutre**, cohérente avec le badge "Occasion"/"En attente" (`ink-soft`/`surface-2`) plutôt que dans la famille "alerte".
- **Contraste à mesurer en implémentation** : la paire `ground` (texte) sur `ink-soft` (fond plein) est l'**inverse** de la paire pré-calculée dans le doc maître (§2.6 mesure `ink-soft` *sur* `ground`/`surface-2`, pas `ground` *sur* `ink-soft` comme fond). Les deux sens d'une paire de couleurs ont le même ratio de contraste (la formule WCAG est symétrique), donc la mesure `ink-soft`/`ground` = 7.78:1 (Élégante Jour, §2.6) s'applique **telle quelle** ici — ✓ conforme sans nouvelle mesure requise, à confirmer par QA sur le rendu réel néanmoins (principe de vérification systématique).

### 4.3 Correction requise — `CgwsBadge` : ajouter le variant `reserved` (gap fiche produit, cf. §7.1)

Cf. §7.1 pour le détail complet (concerne `ProductInfo.vue`, pas la grille) — mentionné ici car `CgwsBadge.vue` est un fichier partagé entre grille et fiche.

### Ce qui est déjà conforme (aucune action) — `ProductCard.vue`

- Carte : `bg-cgws-surface border-2 border-cgws-edge rounded-[6px]`, perforation `bg-cgws-ground border-cgws-edge`, bloc couture `border-dashed` avec bordure dynamique (`cardContent.borderClass` : `border-cgws-accent` actif / `border-cgws-hairline` vendu) — **note** : cette bordure de bloc couture utilise `accent`/`hairline`, pas `accent-deco` comme dans `TagCard.vue` (`border-dashed border-cgws-accent-deco` fixe). C'est une divergence mineure entre les deux composants (cf. §4.1) mais **pas une erreur en soi** : la bordure de couture ici est volontairement liée à l'état (actif vs vendu), un signal fonctionnel discret, cohérent avec le principe "état = accent". Aucune action requise, juste noté pour traçabilité entre les deux implémentations de carte.
- Badge statut via `CgwsBadge` (variants `new`/`occasion`/`consignment`/`sold`) — déjà conforme à `US-072` §6.
- Prix : `font-display text-2xl` + `cardContent.priceClass` (`text-cgws-accent` actif / `text-cgws-ink-soft` vendu) — **`tabular-nums` absent ici aussi**, cf. correction transversale ci-dessous.
- Hover actif : `group-hover:-translate-y-[4px] group-hover:shadow-xl group-hover:shadow-cgws-edge/25 group-hover:border-cgws-accent` + overlay "Voir le produit" `bg-cgws-brand-espresso/50 text-cgws-brand-cream` (littéral fixe, cohérent avec le traitement "overlay sur photo" déjà validé Hero/Gallery, §1.3 `US-073`).
- Focus (lien actif) : `focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2` — conforme.

### 4.4 Correction requise — `tabular-nums` manquant sur le prix (grille + skeleton n/a)

`ProductCard.vue` (grille) : le prix `<p class="product-price font-display text-2xl text-right mt-auto" :class="cardContent.priceClass">` n'a pas `tabular-nums`, contrairement à `TagCard.vue` qui l'a déjà (`font-display text-2xl tabular-nums text-cgws-accent`). Règle §3 doc maître : *« tout affichage de prix [...] doit porter la classe utilitaire Tailwind `tabular-nums` »*.

```
Avant : font-display text-2xl text-right mt-auto
Après : font-display text-2xl tabular-nums text-right mt-auto
```
À appliquer aux deux occurrences du prix dans `ProductCard.vue` (bloc "vendu" non-cliquable et bloc "actif/réservé" cliquable — actuellement dupliqué entre les deux branches `v-if`/`v-else` du template).

### `ProductCardSkeleton.vue` — déjà conforme

`bg-cgws-surface border-2 border-cgws-hairline animate-pulse`, placeholders `bg-cgws-surface-2`, structure identique à la carte finale (perforation, bloc couture pointillé, badge/titre/marque/prix en barres) — conforme à `US-072` §1 ("skeleton pulse `bg-cgws-surface-2`, forme identique à la carte finale"). Aucune action.

### `EmptyState.vue`

#### Correction requise — CTA `primary` → `ghost`

Le cadrage prescrit *« CTA "Réinitialiser les filtres" en `ghost`/`accent` »*. Le code actuel utilise `<CgwsButton variant="primary" size="sm">`. **Correction** :
```html
<!-- Avant -->
<CgwsButton variant="primary" size="sm" @click="$emit('reset')">Réinitialiser les filtres</CgwsButton>

<!-- Après -->
<CgwsButton variant="ghost" @click="$emit('reset')">Réinitialiser les filtres</CgwsButton>
```
- `size` retiré : le variant `ghost` de `CgwsButton` ignore la prop `size` et applique ses propres classes fixes (`px-2 py-1 text-sm`, cf. `CgwsButton.vue` — `sizeClass = variant === 'ghost' ? '' : sizeClasses[size]`).
- Justification du choix `ghost` (moins appuyé qu'un bouton plein `accent`) : un état vide est une invitation discrète à revenir en arrière, pas une action de conversion primaire — cohérent avec la hiérarchie visuelle de la page (le vrai CTA de conversion est ailleurs, sur les fiches produit). **Point de vigilance visuel, non bloquant** : `ghost` (texte `ink-soft`, pas de fond) est plus discret que l'actuel `primary` (fond `accent` plein) — à valider visuellement en implémentation que le CTA reste suffisamment repérable dans le vide de la zone (concho ornement + H2 + texte au-dessus l'entourent déjà, ce qui aide à l'ancrer visuellement).

#### Ce qui est déjà conforme (aucune action)

- Concho ornement décoratif : `border-cgws-accent/40 ring-cgws-hairline` + disque intérieur `bg-cgws-accent/30`, `aria-hidden="true"` — élément décoratif, aucune obligation de contraste texte (§2.1 doc maître, s'applique aux éléments qui ne portent jamais de texte). **Nuance** : cet ornement utilise `accent` (pas `accent-deco`) à opacité réduite — ce n'est pas une violation de la règle de contraste (la règle interdit `accent-deco` en texte lisible, elle n'interdit pas `accent` en décoration ponctuelle), mais ce n'est pas non plus l'usage le plus "pur" du système de rôles (un pur ornement gagnerait en cohérence à utiliser `accent-deco`, réservé exactement à cet usage). **Point mineur, non bloquant** : signalé pour cohérence future, pas une correction requise dans le cadre de cette US (l'élément n'est ni un texte ni un indicateur d'état, donc aucune règle n'est violée au sens strict).
- H2 "Aucun résultat" `font-serif font-semibold text-cgws-ink`, texte `text-cgws-ink-soft` — conformes.

### Tableau d'états — carte produit / grille

| État | Rendu |
|---|---|
| Default (actif) | `bg-cgws-surface border-2 border-cgws-edge`, prix `accent` |
| Hover (actif) | `-translate-y-1`, `shadow-xl shadow-cgws-edge/25`, `border-cgws-accent`, image `scale-105`, overlay "Voir le produit" |
| Focus | `ring-2 ring-cgws-accent ring-offset-2` |
| Vendu | non-cliquable (`<div>`), image `grayscale`, overlay `bg-cgws-ink/30`, badge `sold` (accent plein), prix `ink-soft` |
| Réservé | cliquable, ruban diagonal neutre (**corrigé §4.2**), badge normal (condition/consignation) superposé |
| Skeleton (chargement) | `ProductCardSkeleton` — `animate-pulse`, `bg-cgws-surface-2` |
| Image manquante | `bg-cgws-hairline` + icône selle `text-cgws-ink-soft/30` |
| Grille vide (0 résultat) | `EmptyState` — concho + texte + CTA `ghost` (**corrigé**) |
| Chargement infini (scroll) | spinner `border-cgws-accent border-t-transparent animate-spin` + texte `ink-soft`, `aria-live="polite"` |
| Fin de liste | `StarDivider` + texte `font-serif italic text-cgws-ink-soft` |

### Accessibilité

- `role="article"` implicite via balise `<article>`, `aria-label` complet (titre, marque, prix, statut vendu/réservé) — déjà conforme sur les deux branches du template.
- `aria-busy` sur la grille pendant chargement — déjà conforme.
- Contraste titre `ink`/`ink/60` (vendu) sur `surface` : **à mesurer en implémentation** (paire non pré-calculée sur `surface`, cf. `US-072` §1 note identique).
- Contraste prix `accent`/`ink-soft` (vendu) sur `surface` : idem, à re-vérifier.
- Animation GSAP stagger : inchangée (`.product-card`, `ScrollTrigger` non utilisé ici — stagger direct au montage + sur nouvelles cartes via `watch`), guard `prefers-reduced-motion` déjà en place.

---

## 5. `ProductGallery.vue` (fiche produit)

### 5.1 POINT CRITIQUE A11Y — vignettes actives déjà conformes, verrouiller tel quel

**Constat d'audit (bonne nouvelle)** : la vignette active de la galerie est **déjà** correctement traitée :
```html
:class="currentIndex === idx
  ? 'border-cgws-accent ring-1 ring-cgws-accent/30 opacity-100'
  : 'border-transparent opacity-60 hover:opacity-90 hover:border-cgws-hairline'"
```
`accent` pour l'état sélectionné (indicateur d'état fonctionnel — quelle photo est actuellement affichée), jamais `accent-deco`. **Aucune correction requise** — cette section verrouille ce comportement comme référence de conformité pour QA, exactement l'exigence n°1 du cadrage `US-074`.

### Ce qui est déjà conforme (aucune action)

- Cadre principal : `overflow-hidden rounded-[6px] bg-cgws-hairline aspect-[4/3]` — cadre `hairline` (fond de secours pendant chargement), pas `border-edge` explicite mais le fond `hairline` joue un rôle équivalent de délimitation visuelle avant chargement de l'image. **Nuance mineure** : le cadrage `US-074` demandait *« cadre image `border-edge` »* — la galerie actuelle n'a pas de bordure visible autour du cadre principal (juste un fond `hairline` sous l'image, invisible une fois l'image chargée). Ce n'est pas un défaut fonctionnel (le rectangle image est déjà clairement délimité par sa propre géométrie/coins arrondis sur le fond de page), mais **point mineur signalé, non bloquant** : ajouter `border border-cgws-edge` autour du conteneur principal renforcerait la cohérence littérale avec le cadrage sans changer le comportement (à trancher par `nuxt-developer`/QA visuellement, la galerie fonctionne déjà sans).
- Overlay "VENDU" : `bg-cgws-brand-espresso/40` (littéral fixe, cohérent avec la logique "overlay sur photo" déjà validée §1.3 `US-073`) + texte `text-cgws-brand-cream border-4 border-cgws-brand-cream/60`, `role="img" aria-label="Produit vendu"` — déjà conforme structurellement.
- Compteur d'image, boutons prev/next : `bg-cgws-brand-espresso/60 backdrop-blur-sm` + icônes/texte `text-cgws-brand-cream`, hover `hover:bg-cgws-accent/80` — **littéraux fixes intentionnels**, même raisonnement que le Hero homepage (`US-073` §1.3) : ces contrôles sont posés sur une photo produit arbitraire (pas un fond de page theme-aware), ils doivent rester lisibles quelle que soit la photo et la peau active — utiliser `ground`/`ink` romprait la lisibilité si la photo est déjà claire. Confirmé cohérent, aucune action.
- Vignettes : `focus-visible:ring-2 focus-visible:ring-cgws-accent`, `aria-pressed`, `aria-label` par vignette — déjà conformes.
- `aria-live="polite"` sur la région sr-only de changement de slide — préservé, `role="region"` sur le conteneur principal avec `aria-label` dynamique — déjà conforme.

### 5.2 Point de vigilance — contraste overlay "VENDU" sur photo produit variable

**Différence avec le Hero** : le Hero (`US-073` §1.3) utilise un gradient scrim allant jusqu'à **90%** d'opacité sur une photographie de marque **curée** spécifiquement pour la lisibilité du texte. L'overlay "VENDU" de la galerie n'utilise que **40%** d'opacité (`bg-cgws-brand-espresso/40`) sur une **photo produit quelconque** (non curée pour le contraste — peut être un fond très clair comme une selle claire sur fond blanc, ou très sombre). Le texte "VENDU" est en `text-cgws-brand-cream` (clair), avec un support supplémentaire (`border-4 border-cgws-brand-cream/60`, taille large 40-56px = "large text" ≥3:1 requis plutôt que 4.5:1).

**Recommandation, non bloquante** : le contraste réel dépend de la photo sous-jacente, ce qui n'est **pas mesurable analytiquement** (contrairement aux rôles theme-aware). Point de vigilance QA explicite : vérifier visuellement le rendu "VENDU" sur au moins un produit à fond très clair et un produit à fond très sombre avant merge. Si la lisibilité est jugée insuffisante sur les fonds clairs, la correction recommandée serait d'augmenter l'opacité de l'overlay (`/40` → `/55` ou `/60`, alignée sur la logique du Hero) plutôt que de changer les couleurs elles-mêmes (littéraux déjà cohérents avec le reste du site).

### Tableau d'états — galerie

| Élément | État | Rendu |
|---|---|---|
| Slide principal | Default | image pleine largeur `aspect-[4/3]` |
| Slide principal | Vendu | `grayscale` + overlay "VENDU" (cf. §5.2) |
| Vignette | Inactive | `border-transparent opacity-60` |
| Vignette | Hover | `hover:opacity-90 hover:border-cgws-hairline` |
| Vignette | **Active (fonctionnel, `accent`)** | `border-cgws-accent ring-1 ring-cgws-accent/30 opacity-100` — **conforme, verrouillé §5.1** |
| Vignette | Focus | `focus-visible:ring-2 focus-visible:ring-cgws-accent` |
| Prev/Next | Default → Hover | `opacity-0 group-hover:opacity-100`, `hover:bg-cgws-accent/80` |
| Aucune image | — | placeholder icône `text-cgws-ink-soft/20` + `aria-label="Aucune photo disponible"` |

### Accessibilité

- Contraste vignette active `accent`/`accent/30` sur fond `hairline`/image — décoratif indicateur UI, seuil ≥3:1 requis (pas 4.5:1, ce n'est pas du texte) : `accent` est toujours ≥4.5:1 sur `ground` dans les 3 rendus (doc maître §2.6), donc *a fortiori* ≥3:1 UI — conforme par transitivité, pas de nouvelle mesure requise.
- Littéraux `brand-espresso`/`brand-cream` (contrôles + overlay) : non mesurés analytiquement (photos arbitraires) — cf. §5.2, vigilance QA visuelle requise, cohérent avec le traitement déjà accepté pour le Hero (`US-073` §1.3, §7 tableau récapitulatif "à mesurer en implémentation").

---

## 6. `ProductInfo.vue` (fiche produit)

### 6.1 Correction requise — prix sans `tabular-nums`

```html
<!-- Avant -->
<p class="product-info-price font-display text-[48px] leading-none mt-1" :class="priceColorClass">

<!-- Après -->
<p class="product-info-price font-display text-[48px] tabular-nums leading-none mt-1" :class="priceColorClass">
```
Violation directe de la règle §3 doc maître (« tout affichage de prix [...] doit porter `tabular-nums` ») — c'est le prix le plus visible du site (fiche produit, `text-[48px]`), la correction est prioritaire.

### 6.2 Correction requise — statut `reserved` : gap complet sur la fiche

**Constat (gap fonctionnel, pas seulement token)** : `ProductInfo.vue` ne traite que deux états (`isSold` / actif), via :
```ts
const conditionBadgeVariant = computed((): 'sold' | 'new' | 'occasion' => {
  if (isSold.value) return 'sold'
  return props.product.condition === 'new' ? 'new' : 'occasion'
})
```
Un produit avec `status === 'reserved'` (qui **peut** atterrir sur la fiche : le catalogue inclut les réservés si `filters.includeReserved`, et la fiche `[slug].vue` ne filtre par aucun statut à la récupération) s'affiche **exactement comme un produit actif normal** : badge condition classique, CTA "Appeler pour acquérir" pleinement actif — alors que la grille catalogue affiche déjà un ruban "Réservé" pour ce même produit (`ProductCard.vue`). **Incohérence entre la carte grille et la fiche détaillée d'un même produit.**

**Corrections recommandées** :

1. **Ajouter le variant `reserved` à `CgwsBadge.vue`** (fichier partagé, actuellement `'new' | 'occasion' | 'consignment' | 'sold' | 'rejected'`) :
   ```ts
   type BadgeVariant = 'new' | 'occasion' | 'consignment' | 'sold' | 'rejected' | 'reserved'
   // ...
   reserved: 'Réservé',
   // ...
   reserved: 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline',
   ```
   Traitement neutre, identique à `occasion` (déjà mesuré 6.34:1/6.13:1/4.94:1 §2.6, conforme à la taxonomie `reserved` = neutre du §4.1 doc maître) — **pas** de nouvelle mesure requise, réutilise une paire déjà validée.

2. **Étendre `ProductInfo.vue`** :
   ```ts
   const conditionBadgeVariant = computed((): 'sold' | 'reserved' | 'new' | 'occasion' => {
     if (isSold.value) return 'sold'
     if (props.product.status === 'reserved') return 'reserved'
     return props.product.condition === 'new' ? 'new' : 'occasion'
   })
   ```
   Le badge `reserved` remplace alors le badge condition (comme `sold` le fait déjà) — cohérent avec la logique existante où le statut du cycle de vie prime sur l'état neuf/occasion dans l'affichage du badge principal.

3. **Point produit à confirmer, non bloquant** : faut-il désactiver/adapter le CTA "Appeler pour acquérir" quand `status === 'reserved'` (ex. libellé "Réservé — nous contacter" au lieu du CTA plein actif) ? Cette spec ne tranche **pas** ce point de logique métier (au-delà du design token) — à confirmer avec `product-owner`/Camille avant implémentation. Le minimum requis par cette US est l'ajout du badge (point 1-2 ci-dessus), qui seul résout l'incohérence visuelle grille/fiche.

### 6.3 Point mineur — icône `i-lucide-tag` en `accent/70`

L'icône décorative accolée au libellé de condition (`<UIcon name="i-lucide-tag" class="... text-cgws-accent/70" aria-hidden="true">`) est purement décorative (aucune information non déjà portée par le texte adjacent). Par souci de pureté du système de rôles, un ornement purement décoratif devrait utiliser `accent-deco`, pas `accent` (même à opacité réduite) — cf. la même remarque faite sur l'ornement `EmptyState` (§4, "ce qui est déjà conforme"). **Non bloquant, signalé pour cohérence future** — ce n'est pas une violation de la règle de contraste (aucun texte n'est porté par l'icône elle-même), juste une occasion manquée de cohérence de rôle. Recommandation si retouché : `text-cgws-accent-deco/70`.

### Ce qui est déjà conforme (aucune action)

- Badges (rangée) : `CgwsBadge` variants condition + consignation optionnelle — conformes à `US-072` §6.
- H1 unique `font-serif font-bold text-cgws-ink` — conforme (nom de produit potentiellement long/dynamique, jamais Rye).
- Séparateurs `hr border-cgws-hairline` — conformes.
- Encart consignation : `bg-cgws-surface border border-cgws-hairline`, badge `consignment`, lien `text-cgws-accent hover:text-cgws-ink-soft` — conforme.
- CTA zone : `primary` (appel), `secondary` (message), `disabled` + `aria-disabled="true"` si vendu — conforme à `US-072` §5.
- Animation GSAP stagger (`onMounted`, `clearProps: 'all'`, guard `prefers-reduced-motion`) — inchangée.

### Tableau — statut produit → badge (fiche + grille, consolidé)

| `Product.status` | Badge grille (`ProductCard`) | Badge fiche (`ProductInfo`, **après correction §6.2**) | CTA fiche |
|---|---|---|---|
| `active` + `condition: 'new'` | `new` (outline ink) | `new` (outline ink) | Actif : Appeler / Message |
| `active` + occasion (`excellent`/`good`/`fair`) | `occasion` (neutre) | `occasion` (neutre) | Actif : Appeler / Message |
| `active` + `isConsignment: true` | `consignment` (accent signature) **en plus** du badge condition | idem | Actif : Appeler / Message + encart consignation |
| `reserved` | ruban diagonal neutre (**corrigé §4.2**) | **`reserved`, neutre — gap comblé §6.2** | Actif (inchangé) — **point produit à confirmer §6.2.3** |
| `sold` | `sold` (accent plein), overlay grayscale | `sold` (accent plein), overlay galerie "VENDU" | Désactivé "Article vendu" |
| `inactive` | n'apparaît jamais dans la grille (fetch limité à `active`/`reserved`) | **non géré si accès direct par slug — cf. note ci-dessous** | Comportement actuel = comme actif (gap potentiel) |

**Note sur `inactive`** : la page fiche (`[slug].vue`) ne filtre par aucun statut lors du fetch (`select('*').eq('slug', slug).single()`), donc un produit `inactive` (masqué du catalogue) resterait accessible par URL directe et s'afficherait comme un produit actif normal, sans aucune indication. `DESIGN_SYSTEM_v3.md` §8.2 signale déjà ce point comme *"extension non explicitement demandée [...] à confirmer avec `product-owner`"* pour la taxonomie des badges — cette spec ne l'étend pas davantage : traiter `inactive` (masquer la fiche ? rediriger en 404 ? afficher un badge "Inactif" neutre ?) est une décision produit, pas un choix de token, à trancher hors de cette US.

### Accessibilité

- Contraste prix `accent`/`ink-soft` sur `ground` : ≥5.6:1 (accent) déjà mesuré §2.6, `ink-soft` sur `ground` 7.78:1 — conformes.
- Badge `reserved` (nouveau) : réutilise la paire déjà mesurée `ink-soft`/`surface-2` (§2.6) — aucune nouvelle mesure requise.
- Icône décorative condition : `aria-hidden="true"` déjà présent, aucune obligation de contraste (élément non porteur d'info, cf. §6.3).

---

## 7. `RelatedProducts.vue`

### Ce qui est déjà conforme (aucune action)

- `StarDivider` présent en amont dans la page (`[slug].vue`, entre section produit et cette section) — cf. cadrage *« séparateur `StarDivider variant="divider"` au-dessus de la section »*, déjà en place au niveau page, pas besoin de dupliquer dans le composant lui-même.
- Eyebrow "Vous pourriez aussi aimer" `font-eyebrow text-cgws-accent` — texte réel, `accent` conforme (cf. même raisonnement que `CatalogueHeader` §1).
- H2 "Articles similaires" `font-serif font-bold text-cgws-ink` — conforme (titre potentiellement dynamique par catégorie à l'avenir, jamais Rye par précaution).
- Grille `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, `ProductCard` (cf. §4 pour l'audit du composant carte lui-même — mêmes corrections §4.2/§4.4 s'appliquent transitivement ici puisque c'est le même composant).
- `ProductCardSkeleton` pendant chargement (`relatedPending`) — conforme.
- Animation GSAP stagger scroll-triggered (`ScrollTrigger`, `once: true`) — inchangée, guard `prefers-reduced-motion` en place.
- `aria-labelledby="related-products-heading"` sur la section, `aria-busy` sur la grille — conformes.

**Aucune correction spécifique à ce composant** au-delà de celles déjà documentées pour `ProductCard.vue` (§4.2 ruban réservé, §4.4 `tabular-nums`), qui s'appliquent automatiquement ici puisque le composant est partagé.

---

## 8. Wireframes par breakpoint

### 8.1 Catalogue — liste + filtres

**Mobile 375px** :
```
┌─────────────────────────┐
│ ﹌ SELLERIE DE BRÈCHES   │ ← CatalogueHeader + filigrane
│    LE CATALOGUE          │ ← H1 Rye (corrigé)
│    128 produits          │
├─────────────────────────┤
│ [Filtrer ▾ 2] [Trier ▾] │ ← FilterDrawer trigger + SortSelect, ligne
├─────────────────────────┤
│ ┌──────┐                │
│ │ Card │  (1 colonne)   │ ← ProductCard, grid-cols-1
│ └──────┘                │
│ ┌──────┐                │
│ │ Card │                │
│ └──────┘                │
│  [Chargement scroll]     │
└─────────────────────────┘
```
`FilterDrawer` en `UDrawer direction="bottom" snap-points=['85%']`, plein écran quasi.

**Tablet 768px** : identique mobile pour le layout filtre (drawer conservé, `FilterPanel` sidebar reste masqué `hidden lg:flex`), grille `sm:grid-cols-2`.

**Desktop 1440px** :
```
┌────────────────────────────────────────────────────────────┐
│ ﹌ SELLERIE DE BRÈCHES · LE CATALOGUE · 128 produits    ﹌  │
├───────────┬──────────────────────────────────────────────┤
│ Filtres   │  128 produits              [Trier par ▾]      │
│ (sticky)  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ □ Cat. [2]│  │ Card │ │ Card │ │ Card │ │ Card │          │ ← xl:grid-cols-4
│ □ État    │  └──────┘ └──────┘ └──────┘ └──────┘          │
│ ▬▬●───●▬ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ Prix      │  │ Card │ │ Card │ │ Card │ │ Card │          │
│ [Réinit.] │  └──────┘ └──────┘ └──────┘ └──────┘          │
└───────────┴──────────────────────────────────────────────┘
```
`FilterPanel` : `w-[260px] sticky top-[calc(4rem+1px)]`, `ProductGrid` : `lg:grid-cols-3 xl:grid-cols-4`.

### 8.2 Fiche produit

**Mobile 375px** (empilé) :
```
┌─────────────────────────┐
│ Accueil › Catalogue › … │ ← breadcrumb
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │   [Galerie 4:3]     │ │ ← ProductGallery, swiper
│ │  ‹  1/4  ›           │ │
│ └─────────────────────┘ │
│ [▫][▫][▪ active][▫]     │ ← vignettes, scroll horizontal
├─────────────────────────┤
│ [Occasion] [Consignation]│ ← badges
│ Selle Western Prestige   │ ← H1
│ Prestige · Selles        │
│ ──────────────────────  │
│ 850 €                    │ ← prix, tabular-nums (corrigé)
│ 🏷 Bon état               │
│ 📏 Taille : 17"           │
│ ──────────────────────  │
│ Description...           │
│ [Encart consignation]     │
│ [Appeler pour acquérir]  │ ← CTA pleine largeur
│ [Contacter par message]  │
└─────────────────────────┘
      ✦ (StarDivider)
┌─────────────────────────┐
│ Vous pourriez aussi...   │
│ ┌──────┐ ┌──────┐        │ ← RelatedProducts, grid-cols-1
│ └──────┘ └──────┘        │
└─────────────────────────┘
```

**Tablet 768px** : identique mobile (empilé, `lg` non encore actif), `RelatedProducts` passe en `sm:grid-cols-2`.

**Desktop 1440px** (2 colonnes) :
```
┌──────────────────────────────────────────────────────────────┐
│ Accueil › Catalogue › Selle Western Prestige                 │
├───────────────────────────┬────────────────────────────────┤
│  [Galerie 55% largeur]    │  [Occasion][Consignation]      │ ← ProductInfo,
│  [▫][▫][▪][▫]              │  Selle Western Prestige (H1)   │   sticky top
│                            │  Prestige · Selles              │
│                            │  850 €                          │
│                            │  🏷 Bon état · 📏 Taille 17"     │
│                            │  Description...                 │
│                            │  [Appeler] [Message]            │
└───────────────────────────┴────────────────────────────────┘
                          ✦ (StarDivider)
┌──────────────────────────────────────────────────────────────┐
│ Articles similaires — grid-cols-4                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Vérification dans les 3 rendus — checklist

| Section | `elegante-jour` | `elegante-nuit` | `rugueux` |
|---|---|---|---|
| `CatalogueHeader` | H1 Rye en `heading` (mauve-brun `#8A4B2F`), filigranes rose clair | H1 `heading` clair rosé (`#E8B9C0`) sur fond sombre — vérifier lisibilité | H1 `heading` laiton clair (`#E8B57E`) sur fond très sombre |
| Chips/badges comptage filtre | `accent` mauve sur `accent/10` très pâle — **mesurer contraste réel (§2.1)** | `accent` rose clair sur `accent/10` sombre — **mesurer** | `accent` laiton sur `accent/10` sombre — **mesurer** |
| `USlider` prix (corrigé) | `range`/`thumb` en `accent` mauve, plus de gris "stone" | idem teintes nuit | idem teintes laiton |
| `USelect` tri (corrigé) | focus-ring `accent` mauve, chrome neutre stone conservé | focus-ring `accent` rose clair | focus-ring `accent` laiton |
| `ProductCard` ruban "Réservé" (corrigé) | `ink-soft`/`ground` — brun moyen/crème, neutre, distinct du rouge d'alerte | `ink-soft`/`ground` clair sur sombre | `ink-soft`/`ground` — vérifier que le ruban reste bien "neutre cuir" et ne se confond pas avec `accent-deco` (copper) du reste de l'univers Rugueux |
| `ProductGallery` vignette active | `accent` mauve — déjà conforme | `accent` rose clair | `accent` laiton — bien distinct de `accent-deco` copper |
| Overlay "VENDU" galerie | littéral fixe, identique dans les 3 rendus (comme le Hero, §5.2) — vérifier lisibilité sur photos variées | idem | idem |
| `ProductInfo` prix (48px, corrigé tabular-nums) | `accent` mauve ≥5.6:1 | `accent` rose clair ≥6.9:1 | `accent` laiton ≥6.0:1 |
| Badge `reserved` (nouveau) | neutre `surface-2`/`ink-soft`, cohérent avec `occasion` | idem | idem |
| `RelatedProducts` | `TagCard`-équivalent (`ProductCard`) + `StarDivider` — cohérent avec grille principale | idem | idem, vérifier absence de résidu `brand-blush` sur badge consignation (`US-072` §9) |
| `EmptyState` CTA (corrigé `ghost`) | texte `ink-soft` discret, hover `accent` | idem | idem — vérifier que le CTA reste repérable sur fond très sombre |

---

## 10. Accessibilité transversale (récapitulatif)

| Paire | Ratio (doc maître §2.6) | Statut |
|---|---|---|
| `heading` sur `ground` (H1 CatalogueHeader) | 5.79:1 (Élégante Jour uniquement mesuré) | ✓ Jour · **Nuit/Rugueux à mesurer** |
| `accent` sur `ground`/`surface` (eyebrows, prix, liens, CTA) | 5.60–6.88:1 selon rendu | ✓ AA dans les 3 rendus |
| `ink-soft` sur `ground` (métadonnées, ruban réservé inversé) | 7.78:1 Jour / 6.49:1 Rugueux (Nuit non isolée, cf. `US-073` §7) | ✓ AA large marge |
| `ink-soft` sur `surface-2` (badge `occasion`/`reserved` neutre) | 6.34:1 / 6.13:1 / 4.94:1 | ✓ AA dans les 3 rendus |
| `on-accent` sur `accent` (badge `sold`, CTA primary) | 6.13:1 / 6.88:1 / 5.70:1 | ✓ AA |
| `on-danger` sur `danger` (badge `rejected`, hors périmètre produit mais partagé via `CgwsBadge`) | 6.13:1 / 6.29:1 / 5.04:1 | ✓ AA |
| `text-cgws-accent` sur `bg-cgws-accent/10` (badge de comptage filtre) | Non pré-calculé — fond composité `/10` | **À mesurer en implémentation (§2.1)** |
| `ground` sur `ink-soft` plein (ruban "Réservé" corrigé) | Symétrique de `ink-soft`/`ground` = 7.78:1 Jour | ✓ par transitivité, à reconfirmer visuellement |
| Littéraux `brand-espresso`/`brand-cream` (contrôles galerie, overlay vendu) | Non mesurés (photos arbitraires) | **À mesurer visuellement, cf. §5.2** |
| `accent-deco` en usage texte (référence, ne s'applique à aucun texte après corrections de cette US) | 3.28:1 Jour / 4.22:1 Rugueux | ✗ sous AA — conforme à l'usage (jamais du texte) |

- Navigation clavier : tous les CTA (`CgwsButton`), liens (`NuxtLink`), vignettes galerie, checkboxes, accordéons de filtre sont focusables nativement, `focus-visible:ring-2 ring-cgws-accent` — **hors `USlider`/`USelect` avant correction §2.2/§2.3**.
- `prefers-reduced-motion: reduce` : respecté partout (`ProductGrid`, `TagCard`/`ProductCard`, `ProductGallery`, `ProductInfo`, `RelatedProducts`) via guard `window.matchMedia(...)` déjà en place avant tout `import('gsap')` — aucun changement requis.
- Décoratif : `aria-hidden="true"` sur perforations, overlays, séparateurs, filigranes (nouveaux inclus), icônes de chevron — cohérent partout.
- Hiérarchie de titres : un seul H1 par page (`CatalogueHeader` / `ProductInfo`), H2 pour `EmptyState` (contextuel, dans la grille) et `RelatedProducts` — conforme.

---

## Critères d'acceptation

```gherkin
Fonctionnalité : Catalogue + Fiche produit v3 "Cowgirl élégante"

  Contexte :
    Étant donné que je visite le catalogue ("/catalogue") ou une fiche produit ("/catalogue/:slug")

  Scénario : Rendu correct dans les 3 peaux
    Quand j'active successivement "Élégante Jour", "Élégante Nuit" et "Rugueux"
    Alors l'en-tête catalogue, les filtres, la grille, la galerie et les
      informations produit affichent des couleurs de rôle cohérentes avec
      la peau active
    Et aucune classe Tailwind de token v2 n'est présente dans le rendu

  Scénario : Titre du catalogue en Rye (règle des ≤4 mots)
    Étant donné que le titre affiché est "Catalogue" (1 mot)
    Alors le H1 utilise la classe "font-heading" (Rye), pas "font-display"
    Et sa couleur est "text-cgws-heading"

  Scénario : Chips de filtre actifs lisibles en "accent", jamais "accent-deco"
    Étant donné qu'au moins un filtre de catégorie/état/marque est actif
    Alors le badge de comptage affiché utilise "text-cgws-accent" sur un fond
      "bg-cgws-accent/10"
    Et aucun badge de filtre actif n'utilise "accent-deco"
    Et la coche native des cases cochées utilise "accent-cgws-accent"

  Scénario : Vignettes de galerie actives lisibles en "accent"
    Étant donné qu'une fiche produit affiche plusieurs photos
    Quand je sélectionne une vignette différente
    Alors la vignette active porte "border-cgws-accent" et
      "ring-1 ring-cgws-accent/30"
    Et aucune vignette n'utilise "accent-deco" pour signaler son état actif

  Scénario : Focus clavier en "accent" sur les composants Nuxt UI natifs
    Quand je navigue au clavier jusqu'au slider de prix ("USlider")
      et jusqu'au sélecteur de tri ("USelect")
    Alors l'anneau de focus visible ("focus-visible:ring") est "cgws-accent"
      dans les deux cas, jamais la couleur neutre "stone" par défaut

  Scénario : Statut "réservé" cohérent entre grille et fiche, jamais en "danger"
    Étant donné qu'un produit a le statut "reserved"
    Alors la grille catalogue affiche un ruban "Réservé" en tons neutres
      ("bg-cgws-ink-soft"/"text-cgws-ground"), jamais "bg-cgws-danger"
    Et la fiche produit affiche un badge "Réservé" au variant neutre
      "reserved" de "CgwsBadge" (pas seulement le badge condition neuf/occasion)

  Scénario : Prix affichés avec "tabular-nums"
    Alors le prix de chaque carte produit ("ProductCard") et le prix de la
      fiche produit ("ProductInfo") portent la classe "tabular-nums"
    Et le prix de la fiche produit est affiché en grand format
      ("font-display", 48px) avec "text-cgws-accent" (actif) ou
      "text-cgws-ink-soft" (vendu)

  Scénario : Badge statut correct sur la fiche produit
    Alors un produit vendu affiche le badge "sold" (accent plein)
    Et un produit neuf actif affiche le badge "new" (outline ink)
    Et un produit d'occasion actif affiche le badge "occasion" (neutre)
    Et un produit en consignation affiche en plus le badge "consignment"
    Et un produit réservé affiche le badge "reserved" (neutre)

  Scénario : Overlay "vendu" sur la galerie
    Étant donné qu'un produit a le statut "sold"
    Alors la galerie affiche l'image en "grayscale"
    Et un overlay avec le texte "VENDU" est visible avec
      "role=img" et "aria-label=Produit vendu"

  Scénario : État vide fonctionnel
    Étant donné qu'aucun produit ne correspond aux filtres actifs
    Alors la grille affiche "EmptyState" avec un CTA "Réinitialiser les filtres"
      au variant "ghost"
    Et le CTA déclenche l'événement "reset" vers "useCatalogue().resetFilters()"

  Scénario : TagCard v3 (ProductCard) dans la grille
    Alors chaque carte produit affiche la perforation, le bloc de couture
      pointillé et le badge de statut conformes à "US-072" §1
    Et la bordure du bloc de couture n'utilise jamais "accent-deco" pour un
      produit vendu (utilise "hairline" à la place)

  Scénario : StarDivider au-dessus des produits similaires
    Alors un "StarDivider variant=divider" est affiché entre la section
      produit et "RelatedProducts"
    Et il porte "aria-hidden=true"

  Scénario : Filigrane discret en en-tête de catalogue
    Alors au maximum 2 "FiligreeCorner" sont visibles simultanément dans
      l'en-tête du catalogue
    Et chaque filigrane porte "aria-hidden=true" et une opacité ≤ 60%

  Scénario : Animations respectent la préférence de mouvement réduit
    Étant donné que le système signale "prefers-reduced-motion: reduce"
    Alors aucune animation GSAP ne se déclenche sur la grille, la galerie,
      les informations produit ou les produits similaires
    Et tout le contenu est immédiatement visible sans état "opacity: 0"

  Plan du scénario : Responsive catalogue
    Étant donné que j'affiche le catalogue à la largeur <largeur>
    Alors les filtres sont rendus via <composant_filtre>
    Et la grille affiche <grille>

    Exemples :
      | largeur | composant_filtre | grille          |
      | 375px   | FilterDrawer      | grid-cols-1     |
      | 768px   | FilterDrawer      | sm:grid-cols-2  |
      | 1440px  | FilterPanel       | xl:grid-cols-4  |

  Plan du scénario : Responsive fiche produit
    Étant donné que j'affiche une fiche produit à la largeur <largeur>
    Alors la disposition de la galerie et des informations est <disposition>

    Exemples :
      | largeur | disposition                                   |
      | 375px   | empilée, galerie puis informations            |
      | 768px   | empilée, galerie puis informations            |
      | 1440px  | 2 colonnes, galerie 55% + informations sticky |
```
