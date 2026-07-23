# États de stock — Fiche produit & catalogue — Spec UX (US-096 + US-097)

**Purpose** : Spec unique et cohérente pour le système complet d'états de stock d'un produit non-consigné (« en stock » → « stock bas » → « épuisé » → « de nouveau disponible ») sur la fiche produit publique et sur `ProductCard` (catalogue). US-096 (quantité + achat multiple) et US-097 (rupture + notification email) touchent la même surface UI et doivent former **un seul continuum visuel**, pas quatre traitements sans rapport.
**Dépend de** : `DESIGN_SYSTEM_v3.md` (tokens de rôle en vigueur), `US-072-signature-components.md` (badges, boutons), composants existants `ProductInfo.vue` / `ProductCard.vue` / `CgwsBadge.vue` / `CgwsButton.vue` / `CgwsInput.vue`.
**Rappel permanent** : `accent-deco` = décoratif uniquement, jamais de texte lisible. `accent`, `danger`, `success` = tout texte/pilule lisible, toujours ≥4.5:1 mesuré, **y compris en usage `/15` translucide** (le fond composité doit être vérifié, pas le fond opaque). Tout ring de focus spécifié ici porte un `ring-offset-color` theme-aware explicite (`ring-offset-cgws-ground` ou `ring-offset-cgws-surface` selon le fond réel du composant) — **jamais un ring-offset sans couleur précisée**, pour ne pas aggraver le défaut transverse ouvert en issue #30.

---

## 0. Vue d'ensemble — deux axes orthogonaux, pas un seul continuum à 4 états

Le diagnostic du Sprint Plan mélange implicitement deux choses qui doivent rester **visuellement et sémantiquement distinctes** :

```
AXE 1 — Cycle de stock (produits NON consignés, isConsignment=false)
        C'est un cycle : le produit peut revenir en arrière.

   [ En stock ]──stock≤3──▶[ Stock bas ]──stock=0──▶[ Épuisé ]──réappro──▶[ En stock ]
   (badge condition          (même badge,             (badge neutre        (retour à l'état
    Neuf/Occasion,            + ligne d'urgence         "Épuisé" +          initial, email
    ligne "X en stock")       discrète)                 formulaire          envoyé aux inscrits)
                                                         d'alerte email)

AXE 2 — Statut transactionnel (produits CONSIGNÉS, isConsignment=true, pièce unique)
        C'est un état terminal : pas de retour en arrière, pas de notion de stock.

   [ Disponible ]──vente──▶[ Vendu ]  (badge accent plein, carte non-navigable,
                                        comportement 100% inchangé par cette US)
```

**Règle de non-régression absolue** : un produit `isConsignment=true` ne rentre JAMAIS dans l'axe 1. Aucun sélecteur de quantité, aucune ligne "X en stock", aucun badge "Épuisé" ne doit jamais s'afficher sur une pièce de consignation, quelle que soit la valeur de `stock` en base. Le badge "Vendu" reste exclusivement réservé à `Consignment`/pièce unique — jamais utilisé pour un produit non-consigné en rupture (c'est tout l'objet de la distinction "Épuisé" vs "Vendu" ci-dessous).

### 0.1 Contrat de composant recommandé — `isOutOfStock` dérivé, pas un nouveau statut figé dans les props

Le Sprint Plan laisse explicitement ouvert le choix technique (nouvelle valeur `ProductStatus` type `'out_of_stock'` vs état dérivé `status==='active' && stock===0`), à trancher "en design/dev selon ce qui minimise le risque de régression". Recommandation **côté contrat de composant** (le choix de modélisation DB/migration reste à `nuxt-developer`/`product-owner`) :

- Tous les composants de cette spec consomment un booléen calculé **`isOutOfStock`**, jamais une chaîne de statut en dur. Calcul suggéré : `!product.isConsignment && product.stock === 0 && product.status !== 'sold'`.
- Avantage : que le dev choisisse une vraie colonne DB ou une dérivation pure, aucun composant de cette spec n'a besoin d'être réécrit — seul le point de calcul de `isOutOfStock` change.
- Conséquence directe sur `ProductInfo.vue` : la variable existante `isPurchasable` doit devenir `status === 'active' && !isOutOfStock` (aujourd'hui `status === 'active'` seul) pour que la nouvelle branche "Épuisé" puisse s'insérer sans toucher aux branches `reserved`/`sold` déjà correctes.
- Conséquence sur `app/types/index.ts` : ajouter la valeur `'out-of-stock'` à `BadgeVariant` (voir §4) — c'est un ajout au vocabulaire de badge, indépendant du choix `ProductStatus`.

### 0.2 Ce que cette US NE couvre PAS (hors périmètre explicite)

- `CartLineItem.vue` / `CartDrawer.vue` — l'affichage de la quantité par ligne et du sous-total ligne (qty × prix unitaire) dans le panier n'est **pas couvert par cette spec** (hors périmètre demandé : "fiche produit publique"). `CartItem.quantity` existera côté données (US-096, notes techniques du Sprint Plan) mais son rendu visuel dans le panier n'a pas de spec ici — à signaler à `product-owner`/planifier si jugé nécessaire avant la fin du Sprint 10 (voir §7 "Points laissés au dev").
- Toute surface admin (liste produits, `ProductForm.vue`, dashboard) — non listée dans les fichiers impactés du Sprint Plan pour ces deux US, non spécifiée ici.
- Le contenu de l'email de notification retour en stock (template `sendRestockNotification`) — c'est un artefact serveur (Resend), pas une surface UI de la fiche produit.

---

## 1. `ProductInfo.vue` — modifications (fichier existant)

**Location** : `app/components/product/ProductInfo.vue`

### 1.1 Layout — ASCII wireframe, état "En stock" (stock > 3, non-consigné)

```
┌─────────────────────────────────────────┐
│ [Neuf]                                    │  ← badges row (inchangé)
│                                           │
│ Selle western Prestige                   │  ← H1 (inchangé)
│ Ébène · Selles                            │  ← meta (inchangé)
│ ─────────────────────────────────        │
│ 1 250 €                                   │  ← prix (inchangé)
│                                           │
│ 🏷 Article neuf — jamais utilisé          │  ← condition (inchangé)
│ 📦 5 en stock                             │  ← NOUVEAU — icône i-lucide-package
│ 📏 Taille : 17"                           │  ← taille (inchangé, si présent)
│ ─────────────────────────────────        │
│ Description…                              │  ← inchangé
│                                           │
│ ┌─ Quantité ──────────────┐              │  ← NOUVEAU — QuantitySelector
│ │ Quantité   [−]  2  [+]  │              │
│ └──────────────────────────┘              │
│ ┌───────────────────────────────────────┐│
│ │      🧺 AJOUTER AU PANIER              ││  ← inchangé (CgwsButton primary)
│ └───────────────────────────────────────┘│
│ [📞 Appeler]     [Contacter par message]  │  ← inchangé
└─────────────────────────────────────────┘
```

### 1.2 État "Stock bas" (1 ≤ stock ≤ 3, non-consigné)

Seule la ligne stock change (même position, même icône) — **aucun nouveau bloc, aucune couleur d'alarme**. Ton discret : un point plein `accent` + texte `accent`, pas de `danger` (le token `danger` est réservé aux erreurs/refus/destructif, une rupture imminente n'en est pas une).

```
│ ● Plus que 2 en stock                     │  ← texte + point text-cgws-accent (pas danger)
```

Libellés exacts (accord grammatical français, au-delà du seul exemple Gherkin "stock=3") :

| `stock` | Libellé | Style |
|---|---|---|
| > 3 | `"{n} en stock"` | `text-cgws-ink-soft`, icône `i-lucide-package` |
| 3 | `"Plus que 3 en stock"` | `text-cgws-accent` + point plein `accent` |
| 2 | `"Plus que 2 en stock"` | idem |
| 1 | `"Dernier exemplaire en stock"` | idem (évite l'élision maladroite "Plus qu'1 en stock") |
| 0 | *(ligne masquée — remplacée par le badge "Épuisé" + `RestockNotifyForm`, voir §1.4)* | — |

Cette ligne (et le `QuantitySelector`, §2) ne s'affichent **que si `!product.isConsignment`** — pour une pièce en consignation, cette information n'a pas de sens (pièce unique), le comportement reste celui documenté dans `US-013-fiche-produit.md`/l'encart consignation existant.

### 1.3 État "Consignation" (isConsignment=true) — non-régression explicite

Aucune ligne stock, aucun `QuantitySelector`. Le CTA reste strictement l'existant : `CgwsButton` "Ajouter au panier" si `isPurchasable`, bouton désactivé "Article vendu" si `isSold`. **Aucune modification de template dans la branche consignation.** Ce paragraphe existe uniquement pour que le développeur ait une confirmation explicite écrite qu'il ne doit *rien* toucher ici, au-delà du recalcul de `isPurchasable` défini en §0.1 (qui, par construction, reste `status === 'active'` pour une pièce en consignation puisque `isOutOfStock` est toujours `false` quand `isConsignment=true`).

### 1.4 État "Épuisé" (`isOutOfStock === true`)

```
┌─────────────────────────────────────────┐
│ [Épuisé]                                  │  ← badge neutre, remplace le badge condition
│                                           │     (priorité : sold > out-of-stock > reserved > new/occasion)
│ Selle western Prestige                   │
│ Ébène · Selles                            │
│ ─────────────────────────────────        │
│ 1 250 €                                   │  ← prix conservé, PAS grisé (contrairement à "Vendu" —
│                                           │     le prix reste l'info pertinente, l'article va revenir)
│ 🏷 Article neuf — jamais utilisé          │  ← condition conservée (info toujours vraie)
│ ─────────────────────────────────        │  ← pas de ligne "X en stock" (remplacée par le badge)
│ Description…                              │
│                                           │
│ ┌───────────────────────────────────────┐│
│ │ Cet article est actuellement épuisé.   ││  ← NOUVEAU — RestockNotifyForm (remplace le
│ │ Votre adresse email                    ││    bouton "Ajouter au panier", PAS le reste)
│ │ [_____________________]                ││
│ │ [ 🔔 M'AVERTIR DU RETOUR EN STOCK ]     ││
│ └───────────────────────────────────────┘│
│ [📞 Appeler]     [Contacter par message]  │  ← CONSERVÉS — canal alternatif toujours utile
└─────────────────────────────────────────┘
```

Différence volontaire avec l'état "Vendu" (consignation) : le prix et l'état/condition restent affichés en couleur normale (pas de `text-cgws-ink-soft` grisé), la carte/fiche reste pleinement "vivante" — ce n'est pas une fin de vie du produit, juste une pause. Les CTA secondaires (téléphone, message) restent visibles, contrairement à l'état "Vendu" où ils disparaissent entièrement (le bien n'existe plus).

### 1.5 Différenciation "Épuisé" vs "Vendu" — tableau de référence obligatoire

| | **Épuisé** (nouveau, produits non-consignés uniquement) | **Vendu** (existant, pièces de consignation) |
|---|---|---|
| Déclencheur | `!isConsignment && stock === 0` | `status === 'sold'` (toujours consignation dans les faits) |
| Badge (`CgwsBadge`) | `variant="out-of-stock"` — **neutre** `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` (identique à Réservé/Occasion — traitement "provisoire", cf. taxonomie `DESIGN_SYSTEM_v3.md` §4.1) | `variant="sold"` — **plein accent** `bg-cgws-accent text-cgws-on-accent` (existant, inchangé) |
| Image produit | Légère désaturation `grayscale-[70%] opacity-90`, **pas d'overlay sombre** | Désaturation totale `grayscale` + overlay sombre `bg-cgws-ink/30` (existant) |
| Fiche produit | **Reste consultable et navigable** (exigence Gherkin US-097 : "N'EST PAS retiré du catalogue") | Reste consultable mais carte catalogue **non-navigable** (`<div>` au lieu de `<NuxtLink>`, comportement existant inchangé) |
| Prix / condition | Couleur normale (`text-cgws-accent` / `text-cgws-ink-soft`) — rien n'est grisé | Grisés (`text-cgws-ink-soft` sur le prix — comportement existant) |
| CTA | Remplacé par `RestockNotifyForm` ; téléphone/message **conservés** | Remplacé par bouton désactivé "Article vendu" ; téléphone/message **masqués** |
| Retour possible | Oui — réapprovisionnement admin repasse l'état à "En stock" automatiquement | Non — état terminal (pièce unique vendue) |
| Sémantique | "en pause, revient bientôt" | "n'existe plus à la vente" |

Ce tableau doit être respecté à la lettre en implémentation — c'est le point de vigilance explicite demandé par la User Story : les deux badges ne doivent jamais être confondus ni visuellement ni fonctionnellement.

### 1.6 Breakpoints (`ProductInfo.vue`)

Le composant est déjà en colonne unique à toutes les tailles (`flex flex-col gap-5`), inséré dans une grille `flex-col lg:flex-row` au niveau de la page (`pages/catalogue/[slug].vue`). Aucune restructuration nécessaire pour les nouveaux blocs — seuls les gabarits internes (`QuantitySelector`, `RestockNotifyForm`) ajustent leurs cibles tactiles :

- **Mobile 375px** : ligne stock + `QuantitySelector` sur une seule ligne horizontale (tient dans ~343px de large utile après padding) ; boutons −/+ `w-10 h-10` (40px, cible tactile confortable) ; `RestockNotifyForm` — champ email pleine largeur, bouton pleine largeur empilé dessous.
- **Tablet 768px** : identique à mobile (la page reste en colonne unique jusqu'à `lg:` = 1024px) ; boutons −/+ passent à `w-11 h-11`.
- **Desktop 1440px** : `ProductInfo` occupe ~45% du conteneur 1280px (colonne sticky) ; `QuantitySelector` et `RestockNotifyForm` gardent la même largeur relative à leur conteneur (`w-full` dans leur bloc), pas de plafond de largeur fixe supplémentaire à ajouter.

### 1.7 Tailwind — ligne stock (clé)

```html
<!-- stock > 3 -->
<p class="font-sans text-sm text-cgws-ink-soft flex items-center gap-1.5">
  <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-cgws-ink-soft/60 flex-shrink-0" aria-hidden="true" />
  {{ product.stock }} en stock
</p>

<!-- 1 ≤ stock ≤ 3 -->
<p class="font-sans font-medium text-sm text-cgws-accent flex items-center gap-2">
  <span class="w-1.5 h-1.5 rounded-full bg-cgws-accent flex-shrink-0" aria-hidden="true" />
  {{ stockUrgencyLabel }}
</p>
```

### 1.8 Badge "Épuisé" dans `.product-info-badges`

```html
<div class="product-info-badges flex flex-wrap items-center gap-2">
  <CgwsBadge :variant="isOutOfStock ? 'out-of-stock' : conditionBadgeVariant" />
  <CgwsBadge v-if="showConsignmentBadge" variant="consignment" />
</div>
```

`conditionBadgeVariant` computed existant étendu : priorité `sold > out-of-stock > reserved > new/occasion` (le badge "Épuisé" prend le pas sur "Neuf"/"Occasion" tant que le stock n'est pas revenu, l'info condition reste disponible dans la ligne condition juste en dessous qui, elle, n'est jamais masquée).

---

## 2. `QuantitySelector.vue` (nouveau composant)

**Purpose** : sélecteur de quantité 1..min(stock,10) pour l'achat multiple d'un produit non-consigné. Remplace la notion implicite "1 ligne = 1 exemplaire" pour les produits à stock réel (huile de sabot, bas de contention…).
**Location** : `app/components/product/QuantitySelector.vue`

### Vérification MCP et décision de conception (composant custom, pas `UInputNumber`)

Vérifié via `mcp__nuxt-ui-remote__get-component("InputNumber")` : Nuxt UI v4 fournit `UInputNumber`, un stepper natif basé sur Reka UI `NumberField` (props `min`/`max`/`step`, boutons increment/decrement configurables, orientation horizontale/verticale). Fonctionnellement, c'est exactement le besoin.

**Décision : composant custom `QuantitySelector.vue`, pas `UInputNumber` directement.** Justification, vérifiée dans le code du projet :

1. `app/app.config.ts` documente explicitement la décision de **ne pas** relier `ui.colors.primary`/`neutral` aux tokens CGWS (Nuxt UI v4 exige une échelle 50–950 complète, les rôles CGWS sont des tokens plats à valeur unique par peau — hors périmètre). Conséquence écrite noir sur blanc dans ce fichier : *"les composants Nuxt UI natifs utilisés tels quels... gardent leur palette neutre Nuxt UI par défaut. Tous les composants CGWS custom... utilisent directement les classes bg-cgws-accent / text-cgws-danger etc."* Un `UInputNumber` non re-thémé rendrait en palette "stone" Nuxt UI, juste à côté d'un `CgwsButton` "Ajouter au panier" en `cgws-accent` — rupture visuelle immédiate sur l'écran le plus proche de la conversion.
2. Re-thémer `UInputNumber` via `:ui` prop (slots `root`/`base`/`increment`/`decrement`) pour un seul composant, sur trois peaux theme-aware, représente plus de surface de risque (hydration/slot overrides à vérifier dans les 3 rendus) que d'écrire un composant de ~40 lignes qui réutilise exactement le vocabulaire visuel déjà validé de `CgwsInput` (bordure `border-cgws-edge`, focus `ring-cgws-accent/20`) et `CgwsButton` (boutons carrés `−`/`+`).
3. Le besoin réel est un entier borné 1..10 maximum — aucune des capacités avancées d'`UInputNumber` (formatage `Intl.NumberFormat`, locales, `@internationalized/number`) n'apporte de valeur ici et ajoute du poids JS non justifié pour ce cas d'usage.
4. Convention déjà établie dans le projet : les composants Nuxt UI natifs bruts sont réservés aux briques à modèle d'interaction complexe où réimplémenter serait risqué (`USlideover` pour le panier — focus trap, `UTable`, `UModal` en admin) ; les atomes de formulaire simples restent des composants CGWS custom (`CgwsInput`, `CgwsSelect`, `CgwsTextarea`, `CgwsButton`). Un stepper 1-10 est un atome simple, pas une brique complexe : il suit la même convention.

**Ce point reste à confirmer par `nuxt-developer`** si l'estimation de charge de re-thémage `UInputNumber` s'avère en pratique plus faible qu'anticipé ici — mais la préférence design est le composant custom, pour la cohérence visuelle immédiate avec `CgwsButton`/`CgwsInput` sans travail de theming supplémentaire.

### Props / Emits TypeScript

```ts
interface Props {
  modelValue: number
  min?: number        // défaut 1
  max: number          // = Math.min(product.stock, 10), calculé par l'appelant (ProductInfo)
  disabled?: boolean   // défaut false
}
defineEmits<{ 'update:modelValue': [value: number] }>()
```

### Layout (ASCII wireframe)

```
Quantité   ┌───┬─────┬───┐
           │ − │  2  │ + │
           └───┴─────┴───┘
             ↑    ↑    ↑
      décrément  input  incrément
      (désactivé   (type=number,   (désactivé
       si value      centré,        si value
       ≤ min)         clampé         ≥ max)
                       au blur)
```

Un seul bloc visuel continu (comme un `CgwsInput` dont les bords gauche/droit seraient occupés par les boutons) : `border border-cgws-edge rounded-sm` enveloppant les 3 éléments, séparateurs internes `border-cgws-hairline`.

### Breakpoints

- **Mobile 375px** : boutons `w-10 h-10` (40px), input `w-10` texte `text-base` (16px minimum — évite le zoom automatique iOS Safari sur focus d'un `<input>` avec une taille de police < 16px).
- **Tablet 768px** : boutons `w-11 h-11`, input `w-12`.
- **Desktop 1440px** : identique tablet, pas de changement (le composant n'a pas vocation à s'agrandir au-delà, c'est un contrôle utilitaire pas un élément hero).

### États

| État | Rendu |
|---|---|
| Défaut | Boutons et input actifs, `text-cgws-ink`, bordure `border-cgws-edge` |
| `value === min` | Bouton `−` : `disabled` natif + `aria-disabled="true"` + `opacity-40 cursor-not-allowed` |
| `value === max` | Bouton `+` : idem, `opacity-40 cursor-not-allowed` |
| Saisie clavier | Input `type="number" inputmode="numeric" min max step="1"` — saisie libre autorisée pendant la frappe (pas de clamp au keystroke, seulement au `blur`/`Enter`, pour ne pas bloquer un utilisateur en train de retaper un nombre à 2 chiffres) |
| Saisie hors bornes ou non-numérique au blur | Clampée silencieusement à la borne la plus proche (pas de message d'erreur — cohérent avec la nature "réglage", pas "validation formulaire") |
| Focus (boutons ou input) | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground` (le composant vit sur `bg-cgws-ground` dans `ProductInfo`, cf. `pages/catalogue/[slug].vue` — offset explicitement theme-aware, pas de valeur par défaut Tailwind blanche) |
| `disabled` (prop globale) | Toute la rangée `opacity-50 cursor-not-allowed`, boutons et input `disabled` natifs |
| Loading | N/A — état purement synchrone côté client, pas d'appel réseau tant qu'on ne clique pas sur "Ajouter au panier" |
| Empty | N/A — valeur initiale toujours définie par l'appelant (`ProductInfo` initialise à `1`) |

### Tailwind classes (clés)

```html
<div role="group" aria-label="Quantité" class="inline-flex items-stretch border border-cgws-edge rounded-sm overflow-hidden w-fit">
  <button
    type="button"
    :disabled="modelValue <= min"
    aria-label="Diminuer la quantité"
    :aria-controls="inputId"
    class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-cgws-ink
           hover:bg-cgws-surface-2 active:bg-cgws-surface-2/80 transition-colors duration-150
           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
           border-r border-cgws-hairline
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
           focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground"
    @click="decrement"
  >
    <UIcon name="i-lucide-minus" class="w-4 h-4" aria-hidden="true" />
  </button>

  <input
    :id="inputId"
    type="number"
    inputmode="numeric"
    :min="min"
    :max="max"
    step="1"
    :value="modelValue"
    aria-label="Quantité désirée"
    class="w-10 sm:w-12 text-center bg-cgws-ground text-cgws-ink font-sans font-semibold text-base
           outline-none [appearance:textfield]
           [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    @input="onInput"
    @blur="clamp"
  >

  <button
    type="button"
    :disabled="modelValue >= max"
    aria-label="Augmenter la quantité"
    :aria-controls="inputId"
    class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-cgws-ink
           hover:bg-cgws-surface-2 active:bg-cgws-surface-2/80 transition-colors duration-150
           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
           border-l border-cgws-hairline
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
           focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground"
    @click="increment"
  >
    <UIcon name="i-lucide-plus" class="w-4 h-4" aria-hidden="true" />
  </button>
</div>
<span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
  Quantité sélectionnée : {{ modelValue }}
</span>
```

### Animations

Aucune animation GSAP — c'est un contrôle utilitaire, pas un élément de narration de marque. Seule une transition CSS `transition-colors duration-150` sur le hover/active des boutons (cohérent avec `CgwsButton`). Respecte nativement `prefers-reduced-motion` via le kill-switch global déjà en place (`app/assets/css/main.css`), aucune media query supplémentaire nécessaire côté composant.

### Accessibilité

- `role="group"` + `aria-label="Quantité"` sur le conteneur — regroupe sémantiquement les 3 contrôles pour la navigation par lecteur d'écran.
- Boutons `−`/`+` : `type="button"` (jamais `submit`, évite une soumission de formulaire accidentelle), `aria-label` explicite en français, `aria-controls` pointant vers l'`id` de l'input.
- État désactivé porté à la fois par l'attribut natif `disabled` (empêche le focus clavier, comportement natif correct) et `aria-disabled="true"` en redondance pour les lecteurs d'écran qui exposent l'état avant l'attribut natif.
- Annonce de la valeur : span `sr-only` `role="status" aria-live="polite" aria-atomic="true"` reflétant `modelValue` — se déclenche à chaque clic ou saisie validée, sans interrompre l'utilisateur (poli, pas assertif).
- `<input type="number">` porte nativement la sémantique `spinbutton` exposée aux lecteurs d'écran (valeur, min, max) — pas besoin de `role="spinbutton"` explicite qui dupliquerait/entrerait en conflit avec la sémantique native.
- Taille de police input ≥16px (`text-base`) — évite le zoom involontaire au focus sur iOS Safari, un vrai piège d'accessibilité/UX mobile fréquent sur les stepper numériques.
- Focus visible en `cgws-accent`, `ring-offset-color` theme-aware explicite (`ring-offset-cgws-ground`) dans les 3 rendus — voir rappel permanent en tête de document (issue #30).
- Contraste : `text-cgws-ink` sur `bg-cgws-ground` = 14.07:1 / 14.18:1 / 13.45:1 (Jour/Nuit/Rugueux, mesures `DESIGN_SYSTEM_v3.md` §2.6, largement AAA) ; icônes `−`/`+` en `currentColor` (`text-cgws-ink`) donc même ratio.

---

## 3. `RestockNotifyForm.vue` (nouveau composant)

**Purpose** : formulaire minimal "M'avertir du retour en stock", remplace le CTA d'achat quand `isOutOfStock === true`. Un seul champ (email), idempotent côté serveur.
**Location** : `app/components/product/RestockNotifyForm.vue`

### Props TypeScript

```ts
interface Props {
  productId: string
  productTitle: string   // pour aria-label uniquement, jamais affiché en dur dans le composant
}
```

Pas d'`emit` — le composant est autonome, appelle directement `POST /api/products/[id]/notify-restock` via `$fetch`, à l'identique du pattern déjà établi dans `ConsignmentForm.vue` (`isSubmitting` ref, `$fetch` direct dans le composant, pas de composable intermédiaire — cohérence avec l'existant plutôt qu'introduction d'un nouveau pattern).

### Layout (ASCII wireframe)

**État idle** :
```
┌───────────────────────────────────────────┐
│ Cet article est actuellement épuisé.        │  ← font-sans text-sm text-cgws-ink-soft
│                                             │
│ Votre adresse email                         │  ← CgwsInput label
│ ┌─────────────────────────────────────────┐│
│ │ vous@exemple.fr                          ││
│ └─────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────┐│
│ │   🔔  M'AVERTIR DU RETOUR EN STOCK        ││  ← CgwsButton primary, w-full
│ └─────────────────────────────────────────┘│
└───────────────────────────────────────────┘
```

**État succès** (remplace le bloc ci-dessus par transition, ne l'empile pas dessous) :
```
┌───────────────────────────────────────────┐
│  ✓  Vous serez averti(e) par email dès que  │  ← bg-cgws-success/15 border border-cgws-success/40
│     cet article sera de nouveau disponible. │     rounded-sm p-4, icône + texte text-cgws-success
│                                             │
│     Vous inscrire avec une autre adresse ?  │  ← lien ghost, optionnel, réinitialise le formulaire
└───────────────────────────────────────────┘
```

**État erreur (format email invalide)** — porté par `CgwsInput` lui-même (`error` prop), pas de bloc séparé :
```
│ Votre adresse email                         │
│ ┌─────────────────────────────────────────┐│
│ │ pas-un-email                             ││  ← border-cgws-danger
│ └─────────────────────────────────────────┘│
│ ⚠ Adresse email invalide                    │  ← text-cgws-danger text-xs, role="alert"
```

**État erreur (échec serveur/réseau)** — bandeau distinct au-dessus du bouton, même famille visuelle que `ConsignmentForm.vue` :
```
│ ⚠ Une erreur est survenue lors de l'envoi.   │  ← role="alert", text-cgws-danger
│   Veuillez réessayer.                        │
│ ┌─────────────────────────────────────────┐│
│ │   🔔  M'AVERTIR DU RETOUR EN STOCK        ││
```

### Breakpoints

- **Mobile 375px / Tablet 768px** : champ email pleine largeur, bouton pleine largeur en dessous (empilé) — identique aux autres formulaires du site (`ConsignmentForm`, `contact.vue`).
- **Desktop 1440px** : le composant vit dans la colonne `ProductInfo` (~45% de 1280px, cf. §1.6) — reste en pleine largeur de cette colonne, pas de mise en ligne champ+bouton côte à côte (garde une cible tactile bouton confortable, cohérent avec le CTA "Ajouter au panier" qu'il remplace, lui aussi `w-full`).

### États détaillés

| État | Comportement |
|---|---|
| Idle | Formulaire visible, bouton actif |
| Soumission (`isSubmitting`) | `CgwsButton :loading="isSubmitting"` (spinner intégré existant), champ email `disabled`, empêche double-soumission |
| Succès | `Transition` (fade, ~200ms, `mode="out-in"` — réutilise le pattern `fade-form` déjà existant dans `ConsignmentForm.vue`) vers le bloc de confirmation. Message **exact, repris mot pour mot du critère Gherkin US-097** : *« Vous serez averti(e) par email dès que cet article sera de nouveau disponible »* — ne pas paraphraser. `role="status" aria-live="polite" aria-atomic="true"` sur le conteneur du message. |
| Déjà inscrit (idempotence serveur) | Le serveur renvoie un succès identique (pas d'erreur "déjà inscrit") — le client ne distingue pas ce cas, il affiche le même état "succès" que pour une première inscription. Aucune UI dédiée à prévoir. |
| Erreur — email invalide | Validation avant envoi réseau (regex simple ou `type="email"` + `checkValidity()`), portée par `CgwsInput` (`error="Adresse email invalide"`), focus reste sur le champ, pas de `$fetch` déclenché |
| Erreur — échec serveur/réseau | Bandeau `role="alert"` au-dessus du bouton, texte *"Une erreur est survenue lors de l'envoi. Veuillez réessayer."* (cohérent avec le message déjà utilisé dans `ConsignmentForm.vue`), formulaire reste rempli (ne pas vider le champ email au échec) |
| Loading (skeleton) | N/A — le formulaire n'a pas d'état de chargement initial, il s'affiche immédiatement quand `isOutOfStock === true` (pas de fetch au montage) |
| Empty | N/A — pas de liste, un seul champ |

### Tailwind classes (clés)

```html
<!-- Idle -->
<div class="flex flex-col gap-3">
  <p class="font-sans text-sm text-cgws-ink-soft">
    Cet article est actuellement épuisé.
  </p>
  <CgwsInput
    v-model="email"
    type="email"
    label="Votre adresse email"
    placeholder="vous@exemple.fr"
    :error="emailError"
    required
    :disabled="isSubmitting"
  />
  <p v-if="submitError" role="alert" class="font-sans text-xs text-cgws-danger flex items-center gap-1.5">
    <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
    Une erreur est survenue lors de l'envoi. Veuillez réessayer.
  </p>
  <CgwsButton
    type="submit"
    variant="primary"
    size="md"
    class="w-full justify-center"
    :loading="isSubmitting"
    :aria-label="`M'avertir du retour en stock de ${productTitle}`"
  >
    <UIcon name="i-lucide-bell-ring" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
    M'avertir du retour en stock
  </CgwsButton>
</div>

<!-- Succès -->
<div role="status" aria-live="polite" aria-atomic="true"
     class="bg-cgws-success/15 border border-cgws-success/40 rounded-sm p-4 flex flex-col gap-2">
  <p class="font-sans text-sm text-cgws-success flex items-start gap-2">
    <UIcon name="i-lucide-check-circle" class="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
    <span>Vous serez averti(e) par email dès que cet article sera de nouveau disponible.</span>
  </p>
  <button
    type="button"
    class="self-start font-sans text-xs text-cgws-ink-soft hover:text-cgws-accent underline
           underline-offset-2 transition-colors duration-150 rounded-sm
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
           focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground"
    @click="reset"
  >
    Vous inscrire avec une autre adresse ?
  </button>
</div>
```

### Animations

`<Transition name="fade-form" mode="out-in">` entre l'état idle/erreur et l'état succès — réutilise exactement la classe de transition déjà définie pour `ConsignmentForm.vue` (pas de nouvelle keyframe à créer). Durée ~200ms, `ease-in-out`. Respecte `prefers-reduced-motion` via le kill-switch global (`animation-duration: 0.01ms !important` déjà appliqué à `*`).

### Accessibilité

- `<CgwsInput type="email" required>` porte déjà `aria-required`, `aria-invalid`, `aria-describedby` vers le message d'erreur (comportement du composant existant, réutilisé tel quel).
- Bouton soumission : `aria-label` explicite incluant le nom du produit (`M'avertir du retour en stock de {productTitle}`) — utile car le libellé visible seul ("M'avertir du retour en stock") est ambigu hors contexte pour un lecteur d'écran qui naviguerait par liste de boutons.
- Message de succès : `role="status" aria-live="polite" aria-atomic="true"` — annoncé automatiquement sans déplacer le focus (cohérent avec le pattern déjà utilisé dans `ConsignmentForm.vue` ligne ~405-408).
- Message d'erreur serveur : `role="alert"` (assertif — contrairement au succès, une erreur doit interrompre pour être sûr qu'elle soit perçue).
- Contraste `text-cgws-success` sur fond composite `bg-cgws-success/15` : 5.38:1 / 6.38:1 / 5.39:1 sur `ground`-composited, 4.89:1 / 5.49:1 / 4.69:1 sur `surface`-composited (Jour/Nuit/Rugueux — mesures `DESIGN_SYSTEM_v3.md` §2.6, déjà validées pour cet usage exact de pilule translucide). Le composant vivant sur `bg-cgws-ground` (cf. §1.6), c'est la paire `ground`-composited qui s'applique — marge confortable dans les 3 rendus.
- Focus visible en `cgws-accent`, `ring-offset-cgws-ground` explicite sur le lien "Vous inscrire avec une autre adresse ?".

---

## 4. `CgwsBadge.vue` — extension (fichier existant)

**Location** : `app/components/ui/CgwsBadge.vue`, `app/types/index.ts`

Ajout d'une valeur à `BadgeVariant` :

```ts
export type BadgeVariant =
  | 'new'
  | 'occasion'
  | 'consignment'
  | 'sold'
  | 'rejected'
  | 'reserved'
  | 'pending'
  | 'accepted'
  | 'out-of-stock'   // NOUVEAU — US-097
```

Ajout au `labels` et `variantClasses` de `CgwsBadge.vue` :

```ts
const labels: Record<BadgeVariant, string> = {
  // ...existant inchangé
  'out-of-stock': 'Épuisé',
}

const variantClasses: Record<BadgeVariant, string> = {
  // ...existant inchangé
  // Traitement neutre — cohérent avec la taxonomie §4.1 DESIGN_SYSTEM_v3.md :
  // un état "provisoire/en pause" (comme reserved/pending), jamais une couleur
  // chaude (accent/danger/success) puisqu'il ne s'agit ni d'un succès ni d'un
  // échec ni d'une transaction — juste une disponibilité temporairement à zéro.
  'out-of-stock': 'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline',
}
```

Contraste identique aux paires déjà mesurées pour `reserved`/`occasion`/`pending` (`ink-soft` sur `surface-2`) : 6.34:1 / 6.13:1 / 4.94:1 (Jour/Nuit/Rugueux, `DESIGN_SYSTEM_v3.md` §2.6) — aucune nouvelle mesure nécessaire, réutilisation d'une paire déjà validée AA.

---

## 5. `ProductCard.vue` — modifications (catalogue, fichier existant)

**Location** : `app/components/catalogue/ProductCard.vue`

### 5.1 Principe — ne pas surcharger la carte

La carte "étiquette de selle" a déjà un badge (haut du bloc couture) et un prix. On ajoute **un seul signal supplémentaire selon l'état**, jamais les deux en même temps (stock bas ET épuisé ne peuvent pas être simultanément vrais) :

- **Stock bas (1-3)** : pas de nouveau badge (éviterait la confusion avec un vrai statut) — petite ligne texte discrète, sous le prix, dans le bloc couture existant. Ne s'affiche que si le badge actuel n'est ni "Vendu" ni "Épuisé" (mutuellement exclusifs par construction).
- **Épuisé (stock=0)** : remplace le badge condition (`new`/`occasion`) par `variant="out-of-stock"` dans le même emplacement — **aucun nouvel emplacement créé**, la carte garde exactement sa structure actuelle.

### 5.2 Layout — ASCII wireframe, carte "Épuisé"

```
     ●                          ← perforation (inchangée)
┌────┴────────────────────┐
│                         │
│  [   image, légère       │  ← grayscale-[70%] opacity-90 (PAS le traitement "Vendu")
│    désaturation   ]      │     PAS de ruban diagonal (réservé exclusivement à "Réservé")
│                         │
│ ╔ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╗ │
│ ╎ [Épuisé]              ╎ │  ← badge neutre, même emplacement que Neuf/Occasion
│ ╎ Selle western          ╎ │
│ ╎ Prestige                ╎ │
│ ╎              1 250 €    ╎ │  ← prix NON grisé (contrairement à Vendu)
│ ╚ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╌ ╝ │
└─────────────────────────┘
   Carte reste NAVIGABLE (NuxtLink, pas de <div> figé comme pour "Vendu")
```

### 5.3 Layout — carte "Stock bas"

```
│ ╎ [Neuf]                  ╎ │  ← badge condition INCHANGÉ (pas remplacé)
│ ╎ Bidon huile de sabot    ╎ │
│ ╎ CDG                     ╎ │
│ ╎ ● Plus que 2 en stock    ╎ │  ← NOUVEAU, text-[11px] text-cgws-accent, sous le titre
│ ╎                  18 €    ╎ │
```

### 5.4 Computed étendus

```ts
const isOutOfStock = computed(
  () => !props.product.isConsignment && props.product.stock === 0 && !isSold.value,
)
const isLowStock = computed(
  () => !props.product.isConsignment && props.product.stock > 0 && props.product.stock <= 3,
)

const badgeVariant = computed(() => {
  if (isSold.value) return 'sold' as const
  if (isOutOfStock.value) return 'out-of-stock' as const
  if (props.product.isConsignment) return 'consignment' as const
  return props.product.condition === 'new' ? 'new' as const : 'occasion' as const
})
```

`ariaLabel` étendu à l'identique du pattern déjà en place (`— Produit vendu` / `— Produit réservé`) :

```ts
if (isOutOfStock.value) label += ' — Actuellement épuisé'
if (isLowStock.value) label += ` — Plus que ${props.product.stock} en stock`
```

### 5.5 Tailwind — image désaturée (Épuisé, distincte de Vendu)

```html
<NuxtImg
  ...
  class="w-full h-full object-cover"
  :class="isOutOfStock ? 'grayscale-[70%] opacity-90' : 'transition-transform duration-300 group-hover:scale-105'"
/>
```

Pas d'overlay `bg-cgws-ink/30` (réservé à "Vendu"), pas de ruban diagonal (réservé à "Réservé") — c'est la **seule** différence de traitement image entre "Épuisé" et l'état actif normal, volontairement légère.

### 5.6 Ligne "stock bas" dans le bloc couture

```html
<p
  v-if="isLowStock"
  class="font-sans font-medium text-[11px] text-cgws-accent flex items-center gap-1.5"
>
  <span class="w-1.5 h-1.5 rounded-full bg-cgws-accent flex-shrink-0" aria-hidden="true" />
  Plus que {{ product.stock }} en stock
</p>
```

Placée entre la ligne taille (`v-if="product.size"`) et le prix (`mt-auto`), dans le même `<div class="stitching-block ...">` — pas de nouveau conteneur.

### 5.7 Navigabilité — carte "Épuisé" reste dans la branche `NuxtLink`

Contrairement à "Vendu" (branche `<div>` non-navigable, `v-if="isSold"`), une carte "Épuisé" **doit** rester dans la branche `NuxtLink` existante (`v-else`) — c'est une exigence Gherkin explicite ("N'EST PAS retiré du catalogue... reste consultable"). Aucune nouvelle branche de template n'est nécessaire : `isActive` (aujourd'hui `status === 'active'`) reste vrai pour un produit épuisé si l'approche "dérivée" du §0.1 est retenue, donc le hover existant (`group-hover:-translate-y-1`, overlay "Voir le produit") continue de fonctionner sans modification — c'est un argument de plus en faveur de cette approche (voir §0.1).

### 5.8 Breakpoints (`ProductCard.vue`)

- **Mobile 375px** : grille 1 colonne (déjà en place) — ligne "stock bas" en `text-[11px]`, badge "Épuisé" identique en taille aux autres badges (`text-[11px]` déjà défini dans `CgwsBadge`).
- **Tablet 768px** : grille 2 colonnes (déjà en place) — aucun changement de taille.
- **Desktop 1440px** : grille 3-4 colonnes (déjà en place) — aucun changement.

---

## 6. Continuum visuel — tableau récapitulatif transverse

| État | Badge | Image | Prix | CTA fiche produit | Carte catalogue |
|---|---|---|---|---|---|
| En stock (>3) | Condition (Neuf/Occasion) | Normale | `accent`, normal | Ajouter au panier + `QuantitySelector` | Navigable, hover normal |
| Stock bas (1-3) | Condition (inchangé) + ligne discrète `accent` | Normale | `accent`, normal | Idem + ligne "Plus que N en stock" | Idem + ligne discrète |
| Épuisé (0, non-consigné) | **"Épuisé"** neutre `surface-2`/`ink-soft` | Désaturation légère `grayscale-[70%]`, pas d'overlay | `accent`, normal (pas grisé) | `RestockNotifyForm` (CTA achat remplacé, téléphone/message conservés) | Navigable, hover normal, image désaturée |
| De nouveau disponible | Retour à "Condition" | Retour normal | Retour normal | Retour à `QuantitySelector` + Ajouter au panier | Retour normal |
| Vendu (consignation) | **"Vendu"** plein `accent`/`on-accent` | Grayscale total + overlay `ink/30` | `ink-soft`, grisé | Bouton désactivé "Article vendu" seul | **Non-navigable** (`<div>`), pas de hover |

La colonne "Vendu" est délibérément la plus visuellement différente des quatre autres lignes — c'est la seule qui est un état terminal sans retour, et la seule spécifique à la consignation. Les quatre premières lignes forment un unique dégradé d'intensité (couleur pleine → discrète → neutre → retour) qui doit se lire comme un cycle continu, jamais comme des traitements indépendants.

---

## 7. Points laissés au dev (non tranchés ici, ou hors périmètre design)

1. **Modélisation `ProductStatus` / nouvelle valeur DB vs dérivation pure** — recommandation donnée en §0.1 (contrat de composant `isOutOfStock` dérivé), mais le choix final base de données (migration, CHECK constraint, audit des requêtes filtrant par statut) reste à trancher par `nuxt-developer` selon le risque réel de régression sur `useCatalogue.ts` et les autres requêtes filtrant par `status`.
2. **`CartLineItem.vue` / `CartDrawer.vue`** — affichage de `CartItem.quantity` (qty × prix unitaire, total ligne) explicitement hors périmètre de cette spec (voir §0.2). Recommandé de vérifier avec `product-owner` si une US de suivi est nécessaire avant la fin du Sprint 10, sans quoi un panier avec 3 exemplaires d'un même produit affichera un prix de ligne ambigu (unitaire ou total ? — le composant actuel n'affiche qu'un seul prix par ligne, jamais pensé pour une quantité > 1).
3. **Sémantique exacte de "je modifie la quantité désirée" sur une fiche déjà en panier** (dernier critère Gherkin US-096) — ambiguïté entre "remplacer la quantité de la ligne existante par la nouvelle valeur choisie" et "ajouter la nouvelle quantité à l'existante". Recommandation design (à valider `product-owner`) : **remplacer**, pas cumuler — un utilisateur qui revient sur une fiche et repositionne le sélecteur à 5 s'attend à repartir avec 5 exemplaires au total, pas à en additionner. Le toast de confirmation devrait alors se différencier du toast "Ajouté au panier" existant (ex. "Quantité mise à jour : 5") pour ne pas prêter à confusion — ce texte de toast n'est pas fixé par le Gherkin, laissé à l'appréciation du dev en cohérence avec les toasts déjà en place dans `ProductInfo.vue`.
4. **Re-thémage éventuel de `UInputNumber`** si le custom `QuantitySelector` s'avère finalement plus coûteux que prévu en implémentation (peu probable vu sa simplicité, mais la porte n'est pas fermée — voir §2, justification 2).
5. **Visibilité "Épuisé" côté admin** (liste produits, `ProductForm.vue`) — non demandée explicitement par le Sprint Plan pour ces deux US, non spécifiée ici ; probable amélioration opérationnelle utile à Camille pour repérer d'un coup d'œil les produits en rupture, mais à cadrer comme US séparée si souhaité plutôt qu'ajoutée informellement ici.
