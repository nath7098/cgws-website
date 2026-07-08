# SalesIndex + SaleForm — Spec UX (US-041)

**Purpose**: Page de suivi des ventes pour Camille. Elle visualise son chiffre d'affaires (mois en cours et total), filtre par période, consulte l'historique complet des ventes, et enregistre une nouvelle vente via un formulaire modal. La page est le tableau de bord financier quotidien de la gérante depuis mobile (à l'écurie) ou desktop (en boutique).

**Fichiers concernés**:
- `app/pages/admin/ventes/index.vue`
- `app/components/admin/SaleForm.vue`
- `server/api/admin/sales/index.get.ts`
- `server/api/admin/sales/index.post.ts`

---

## 1. Layout global — `/admin/ventes`

### ASCII wireframe — Mobile 375px

```
┌─────────────────────────────────────┐
│ [← sidebar icon]  CGWS Admin        │  ← admin layout header (bg-cgws-tack)
├─────────────────────────────────────┤
│                                     │
│  Ventes                    [+ Vente]│  ← page header
│  12 ventes ce mois                  │
│                                     │
│  ┌──────────┐  ┌──────────┐         │  ← KPI summary bar
│  │ 4 820 €  │  │ 18 340 € │         │    2-col grid (mobile)
│  │ CA mois  │  │ CA total │         │
│  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐         │
│  │    12    │  │    47    │         │
│  │ Ventes/m │  │ Ventes ∑ │         │
│  └──────────┘  └──────────┘         │
│                                     │
│  ┌─────────────────────────────┐    │  ← toolbar
│  │ [📅] Juillet 2026     [×]  │    │
│  │ [Type ▾]                   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │  ← mobile sale cards
│  │ Selle Circle Y Quarter Horse│    │
│  │ 02/07/26      [CONSIGNATION]│    │
│  │ 850,00 €       Espèces      │    │
│  │ Client: Marie Dupont        │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Bottes Sendra T.40          │    │
│  │ 01/07/26         [PROPRE]   │    │
│  │ 210,00 €       Carte CB     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ◀  1  2  3  ▶    12 ventes / p.1  │  ← pagination
│                                     │
└─────────────────────────────────────┘
```

### ASCII wireframe — Tablet 768px

```
┌────────────────────────────────────────────────────────┐
│  Ventes                              [+ Enregistrer]   │
│  12 ventes ce mois                                     │
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  ← 4-col KPI
│  │ 4 820 €  │ │ 18 340 € │ │    12    │ │    47    │  │
│  │ CA mois  │ │ CA total │ │ Ventes/m │ │ Ventes ∑ │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│  ┌──[📅 Juillet 2026]── [Type ▾] ──────────── [×] ──┐  │
│  └────────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │  ← table
│  │ ARTICLE       DATE   TYPE   PRIX     PAIEMENT  │   │
│  │─────────────────────────────────────────────── │   │
│  │ Selle C.Y.  02/07  [CONS] 850 €   Espèces     │   │
│  │ Bottes S.   01/07  [PROP] 210 €   Carte       │   │
│  └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### ASCII wireframe — Desktop 1440px

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Ventes                                          [+ Enregistrer une vente]│
│  12 ventes ce mois · CA mensuel : 4 820,00 €                             │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ 4 820 €  │ │ 18 340 € │ │    12    │ │    47    │                   │
│  │ CA mois  │ │ CA total │ │ Ventes/m │ │ Ventes ∑ │                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
│                                                                          │
│  ┌──[📅 Juillet 2026]──────────────── [Type : Tous ▾] ── [Réinitialiser]┐│
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ARTICLE             DATE     TYPE       PRIX VENTE  PAIEMENT  CLIENT  │
│  │──────────────────────────────────────────────────────────────────│   │
│  │ Selle Circle Y      02/07/26 CONSIGN.   850,00 €    Espèces  —  │   │
│  │ Bottes Sendra T.40  01/07/26 PROPRE     210,00 €    Carte    J. Martin│
│  │ ...                                                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  47 ventes au total   ◀  1  2  3  ▶   page 1 de 3                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Composant SummaryBar — 4 KpiCards

Reuse du composant existant `app/components/admin/KpiCard.vue`. Les 4 cartes sont rendues dans une grille.

### Données affichées

| ID | Label | Valeur | Icône | Variant |
|----|-------|--------|-------|---------|
| `ca-month` | CA ce mois | `4 820,00 €` (formaté) | `i-lucide-trending-up` | `default` |
| `ca-total` | CA total | `18 340,00 €` (formaté) | `i-lucide-euro` | `default` |
| `sales-month` | Ventes ce mois | `12` | `i-lucide-receipt` | `default` |
| `sales-total` | Ventes au total | `47` | `i-lucide-bar-chart-2` | `default` |

Les valeurs CA sont formatées `toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })`. Pendant le chargement, les 4 cartes passent en `loading: true` pour afficher le skeleton interne à KpiCard.

### Tailwind classes — grille

```
grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4
```

Les KpiCards héritent de leurs classes internes existantes (`bg-white border border-cgws-leather/30 rounded-[4px] shadow-sm p-5`).

### Subtitle sous le titre de page

Quand les données sont chargées, le sous-titre affiche :
```
{{ salesMonth }} vente{{ salesMonth !== 1 ? 's' : '' }} ce mois · CA mensuel : {{ caMonth }}
```
Pendant le chargement : ligne de skeleton `h-3 w-48 bg-cgws-leather/10 rounded animate-pulse`.

---

## 3. Filtres

### Toolbar

Container identique au pattern consignations :
```
bg-white border border-cgws-leather/30 rounded-[4px] p-3
flex flex-col sm:flex-row gap-3 mb-4
```

### Filtre de période — `<input type="month">`

Un seul champ `<input type="month">` suffit. Il donne nativement une valeur `YYYY-MM` exploitable directement comme paramètre API.

```html
<input
  id="filter-month"
  v-model="filterMonth"
  type="month"
  aria-label="Filtrer par mois"
  class="px-3 py-2 bg-cgws-cream border border-cgws-leather/40 rounded-sm
         font-sans text-sm text-cgws-charcoal
         focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
         focus:outline-none"
/>
```

Quand `filterMonth` change, déclenche immédiatement un refetch (pas de debounce — c'est une sélection discrète). Remet `currentPage` à 1.

### Filtre de type

`<select>` identique au pattern consignations :
```
Options : '' (Tous les types) | 'own' (Propre) | 'consignment' (Consignation)
```

Classes :
```
py-2 px-3 pr-9 bg-cgws-cream border border-cgws-leather/40 rounded-sm
font-sans text-sm text-cgws-charcoal appearance-none
focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 focus:outline-none
min-w-[160px]
```

Avec chevron icon positionné en absolu : `i-lucide-chevron-down w-4 h-4 text-cgws-leather/60 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2`.

### Bouton reset

Visible seulement si `filterMonth || filterType`. Texte "Réinitialiser" :
```
font-sans text-xs text-cgws-copper hover:underline
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper
```

---

## 4. Liste des ventes

### Colonnes table desktop (`hidden sm:block`)

En-têtes : `font-sans text-[10px] uppercase tracking-widest text-cgws-leather py-3`
Fond en-tête : `bg-cgws-parchment/40 border-b border-cgws-leather/20`
Lignes : `divide-y divide-cgws-leather/10`, hover `hover:bg-cgws-parchment/20 transition-colors duration-100`

| Colonne | Classes td | Contenu | Breakpoint |
|---------|-----------|---------|-----------|
| Article | `py-3 pl-4 pr-3 max-w-[240px]` | Titre (bold cgws-charcoal) + marque (xs cgws-leather/70) | Toujours visible |
| Date | `py-3 px-3 text-sm text-cgws-leather whitespace-nowrap` | `formatDate(saleDate)` → `JJ/MM/AA` | `sm:` |
| Type | `py-3 px-3` | Badge pill (voir ci-dessous) | `sm:` |
| Prix vente | `py-3 px-3 text-right font-display text-base text-cgws-copper whitespace-nowrap` | `formatPrice(salePrice)` | Toujours visible |
| Paiement | `hidden md:table-cell py-3 px-3 text-sm text-cgws-leather` | Label lisible (Espèces/Carte CB/Virement/Chèque) | `md:` |
| Client | `hidden lg:table-cell py-3 px-3 text-sm text-cgws-leather` | Nom client ou `—` (em dash) | `lg:` |

Pas de colonne "Actions" — les ventes sont immuables une fois enregistrées (lecture seule).

### Badges de type (pills)

Classe de base commune :
```
inline-flex items-center px-2.5 py-0.5 font-sans font-medium text-[11px]
uppercase tracking-wider rounded-full
```

- **Propre** : `bg-cgws-denim/15 text-cgws-denim`
- **Consignation** : `bg-cgws-copper/20 text-cgws-copper`

### Cartes mobile (`block sm:hidden`)

Chaque carte :
```
bg-white border border-cgws-leather/30 rounded-[4px] p-4 space-y-1
```

Contenu par carte :
```
┌─ [Article title — font-sans text-sm font-medium text-cgws-charcoal] ──┐
│  [Date: font-sans text-xs text-cgws-leather]  [BADGE TYPE]            │
│  [Prix: font-display text-base text-cgws-copper]                       │
│  [Moyen de paiement: font-sans text-xs text-cgws-leather]              │
│  [Client: font-sans text-xs text-cgws-leather italic] (si présent)     │
└────────────────────────────────────────────────────────────────────────┘
```

La ligne titre + badge est en `flex items-start justify-between gap-2`.

### Tri par défaut

`saleDate DESC` — la vente la plus récente en premier. Pas de tri interactif dans cette version (pas de colonnes cliquables).

---

## 5. Modal SaleForm — `app/components/admin/SaleForm.vue`

Ce composant est distinct du `SaleModal.vue` existant (qui est un "quick sale" contextualisé depuis la fiche produit). `SaleForm.vue` part de zéro sans produit présélectionné — c'est le point d'entrée depuis la page ventes.

### Props / Emits

```typescript
// Props
interface Props {
  isOpen: boolean
}

// Emits
const emit = defineEmits<{
  close: []
  submitted: [payload: QuickSalePayload]
}>()
```

Réutilise le type `QuickSalePayload` déjà défini dans `app/types/index.ts`.

### Structure de la modal

```
┌───────────────────────────────────────────┐
│  [◉]  Enregistrer une vente          [×]  │  ← header sticky
├───────────────────────────────────────────┤
│                                           │  ← scrollable body
│  PRODUIT *                                │
│  ┌─────────────────────────────────────┐  │
│  │ Sélectionner un article…        [▾] │  │  ← select produits disponibles
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌── recap produit sélectionné ────────┐  │  ← bloc récap conditionnel
│  │ Selle Circle Y Quarter Horse        │  │     (masqué si aucune sélection)
│  │ Marque: Circle Y · Selles           │  │
│  │ Prix catalogue: 950,00 €            │  │
│  │ [CONSIGNATION]                      │  │     badge si isConsignment
│  └─────────────────────────────────────┘  │
│                                           │
│  DATE DE VENTE *      PRIX DE VENTE (€) * │
│  ┌──────────────┐    ┌────────────────┐   │
│  │  2026-07-02  │    │  850,00        │   │
│  └──────────────┘    └────────────────┘   │
│                                           │
│  ┌── COMMISSION (visible si consignation) ┐│
│  │ Prix accordé au déposant : 750,00 €   ││  ← bg-cgws-parchment/60
│  │ Commission boutique     :  100,00 €   ││     border border-cgws-copper/20
│  │ Net à reverser          :  750,00 €   ││     rounded-sm p-3
│  └───────────────────────────────────────┘│
│                                           │
│  MOYEN DE PAIEMENT *                      │
│  ┌─────────────────────────────────────┐  │
│  │ Espèces                         [▾] │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  CLIENT (optionnel)                       │
│  ┌─────────────────────────────────────┐  │
│  │ Nom du client…                      │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  NOTES INTERNES (optionnel)               │
│  ┌─────────────────────────────────────┐  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
├───────────────────────────────────────────┤
│  [Annuler]           [Enregistrer ──────▶]│  ← footer sticky
└───────────────────────────────────────────┘
```

### Champs du formulaire

#### 1. Sélecteur de produit (requis)

`<select>` chargé à l'ouverture de la modal via `GET /api/admin/products?status=active&limit=200`. Options triées par titre. Format option : `"Titre — marque (catégorie) · prix€"`. En état de chargement, le select est disabled et affiche "Chargement des produits…".

```
w-full px-3 py-2 pr-9 bg-cgws-cream border border-cgws-leather/40 rounded-sm
font-sans text-sm text-cgws-charcoal appearance-none
focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 focus:outline-none
disabled:opacity-50
```

Erreur si soumission sans sélection : bordure `border-cgws-rust`, message `font-sans text-xs text-cgws-rust mt-1`.

#### 2. Bloc récap produit (conditionnel)

Apparaît quand un produit est sélectionné. Transition `<Transition name="recap">` avec `opacity 0→1 + translateY(4px)→0` sur 200ms.

Classes container :
```
mt-2 p-3 bg-cgws-parchment/40 border border-cgws-leather/20 rounded-sm
```

Contient : titre (`font-sans text-sm font-medium text-cgws-charcoal`), marque + catégorie (`font-sans text-xs text-cgws-leather`), prix catalogue (`font-display text-sm text-cgws-charcoal`), badge type (même pills que la table — Propre ou Consignation).

#### 3. Date de vente (requis)

`<input type="date">` pré-rempli avec la date du jour (`new Date().toISOString().split('T')[0]`). Même classes que SaleModal existant.

#### 4. Prix de vente (requis)

`<input type="number" min="0.01" step="0.01">` pré-rempli avec `product.price` à la sélection du produit. Texte en `font-display text-base text-cgws-copper`. Classe d'erreur `border-cgws-rust`. Date + Prix en grille 2 colonnes sur sm+ : `grid grid-cols-1 sm:grid-cols-2 gap-4`.

#### 5. Bloc commission consignation (conditionnel)

Visible seulement quand le produit sélectionné a `isConsignment === true`. Calculé automatiquement depuis `salePrice` et `product.consignment.agreedPrice` (chargé avec le produit via l'API ou depuis la liste des produits si `agreedPrice` est disponible).

Animation d'entrée : `<Transition name="commission-panel">` avec `max-height 0→auto` + `opacity 0→1` sur 250ms via `@vueuse/motion` ou CSS transition sur max-height.

Classes container :
```
p-3 bg-cgws-parchment/60 border border-cgws-copper/20 rounded-sm space-y-1.5
```

Contenu — 3 lignes de calcul :
```
┌─────────────────────────────────────────────────┐
│  Prix accordé au déposant   750,00 €  (gris)    │
│  Commission boutique        100,00 €  (copper)  │
│  ─────────────────────────────────────────────  │
│  Net à reverser             750,00 €  (bold)    │
└─────────────────────────────────────────────────┘
```

Chaque ligne : `flex items-center justify-between font-sans text-sm`. Valeur commission en `text-cgws-copper font-semibold`. Net à reverser en `text-cgws-charcoal font-semibold`. Trait de séparation : `border-t border-cgws-leather/20 mt-1 pt-1`.

Formule : `commissionAmount = salePrice - agreedPrice`. Si `agreedPrice` est null ou indisponible, affiche `—` et message `font-sans text-xs text-cgws-leather italic "Prix accordé non défini — vérifiez la fiche de consignation."`.

Le champ `commissionAmount` est calculé côté client et envoyé dans le payload POST.

#### 6. Moyen de paiement (requis)

`<select>` identique au SaleModal existant. Options : Espèces / Carte bancaire / Virement / Chèque.

#### 7. Client (optionnel)

`<input type="text">` placeholder "Nom du client…". Même pattern que SaleModal existant.

#### 8. Notes internes (optionnel)

`<textarea rows="2">` — même pattern que SaleModal existant.

### Payload émis

```typescript
const payload: QuickSalePayload = {
  productId: selectedProduct.id,
  salePrice: form.salePrice,
  saleDate: form.saleDate,
  paymentMethod: form.paymentMethod,
  clientName: form.clientName || undefined,
  notes: form.notes || undefined,
}
// commissionAmount is handled server-side when isConsignment is true
```

### Validation côté client

| Champ | Règle | Message d'erreur |
|-------|-------|-----------------|
| productId | Requis | "Sélectionnez un article à vendre." |
| salePrice | > 0 | "Le prix de vente doit être supérieur à 0." |
| saleDate | Requis, format date valide | "Saisissez une date valide." |
| paymentMethod | Requis | (toujours rempli car select avec défaut) |

Les erreurs s'affichent directement sous le champ concerné en `font-sans text-xs text-cgws-rust mt-1` avec `role="alert"`.

### Overlay et animation modal

Même pattern que `SaleModal.vue` existant :

```
Backdrop : fixed inset-0 bg-cgws-charcoal/60 backdrop-blur-sm
Modal box : bg-white border-2 border-cgws-charcoal rounded-sm shadow-xl
            w-full max-w-lg max-h-[90dvh] sm:max-h-[80vh]
            flex flex-col overflow-hidden
```

Transition CSS (reprendre `.modal-enter-from` / `.modal-leave-to`) :
```css
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box { transform: scale(0.96) translateY(8px); }
```
Durée : `0.2s` backdrop, `0.2s cubic-bezier(0.34, 1.56, 0.64, 1)` box.

Fermeture : clic backdrop, touche `Escape`, bouton "Annuler" / "×".

Reset à l'ouverture : `watch(isOpen, (val) => { if (val) resetForm() })`.

---

## 6. Bouton d'action principal — "Enregistrer une vente"

Dans le page header, aligné à droite :

```
px-4 py-2 rounded-sm bg-cgws-copper text-white
font-sans text-sm font-semibold
inline-flex items-center gap-2
hover:bg-cgws-leather transition-colors duration-150
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2
focus-visible:outline-none
```

Icône : `i-lucide-plus w-4 h-4` en préfixe.

Texte mobile court (375px) : "+ Vente" / Desktop : "+ Enregistrer une vente". Géré par `<span class="hidden sm:inline"> une vente</span>`.

---

## 7. États vides et chargement

### Skeleton — table desktop

Pendant `isLoading === true`, afficher 8 lignes skeleton identiques au pattern consignations :

```html
<tr v-for="i in 8" :key="i">
  <td class="py-3 pl-4 pr-3">
    <div class="h-4 w-40 bg-cgws-leather/10 rounded animate-pulse mb-1" />
    <div class="h-3 w-20 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
  <td class="py-3 px-3">
    <div class="h-4 w-16 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
  <td class="py-3 px-3">
    <div class="h-5 w-20 bg-cgws-leather/10 rounded-full animate-pulse" />
  </td>
  <td class="py-3 px-3 text-right">
    <div class="h-5 w-20 bg-cgws-leather/10 rounded animate-pulse ml-auto" />
  </td>
  <td class="hidden md:table-cell py-3 px-3">
    <div class="h-4 w-14 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
  <td class="hidden lg:table-cell py-3 px-3">
    <div class="h-4 w-24 bg-cgws-leather/10 rounded animate-pulse" />
  </td>
</tr>
```

### Skeleton — cartes mobile

Pendant `isLoading`, 5 cartes avec blocs `animate-pulse` :

```html
<div class="bg-white border border-cgws-leather/30 rounded-[4px] p-4 animate-pulse">
  <div class="h-4 w-44 bg-cgws-leather/10 rounded mb-2" />
  <div class="flex justify-between mb-2">
    <div class="h-3 w-16 bg-cgws-leather/10 rounded" />
    <div class="h-5 w-20 bg-cgws-leather/10 rounded-full" />
  </div>
  <div class="h-5 w-24 bg-cgws-leather/10 rounded" />
</div>
```

### État vide — aucune vente

Icône : `i-lucide-receipt` `w-10 h-10 mx-auto mb-3 text-cgws-leather/30`.

Message principal :
- Si filtres actifs : `"Aucune vente pour cette période."` + bouton "Réinitialiser les filtres" (`text-cgws-copper hover:underline text-xs`)
- Si aucune vente du tout : `"Aucune vente enregistrée pour l'instant."` + bouton `"Enregistrer la première vente"` (reprend les classes du CTA primaire)

Container empty state : `py-16 text-center` en cellule `colspan="6"` (table) ou div seul (mobile).

### Toast de confirmation / erreur

Pattern identique aux autres pages admin :

```
fixed top-4 right-4 z-[60]
flex items-center gap-3
bg-cgws-tack text-cgws-rope
px-4 py-3 rounded-sm shadow-lg border-l-4
transition-all duration-300
```

- Succès : `border-cgws-copper` + icône `i-lucide-check-circle text-cgws-copper`
- Erreur : `border-cgws-rust` + icône `i-lucide-x-circle text-cgws-rust`

Messages :
- Succès vente : `"Vente enregistrée avec succès."`
- Erreur : `"Erreur lors de l'enregistrement de la vente."`

Auto-dismiss 4 000ms. `Teleport to="body"`. Animation `toast-enter-from / leave-to` : `opacity: 0; transform: translateY(-0.5rem)`.

---

## 8. Tailwind classes récapitulatif

### Page container

```
space-y-4
```

### Page header

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h2 class="font-serif font-bold text-2xl text-cgws-charcoal">Ventes</h2>
    <p class="font-sans text-sm mt-0.5 text-cgws-leather">…subtitle…</p>
  </div>
  <button class="px-4 py-2 rounded-sm bg-cgws-copper text-white font-sans text-sm
                 font-semibold inline-flex items-center gap-2 hover:bg-cgws-leather
                 transition-colors focus-visible:ring-2 focus-visible:ring-cgws-copper
                 focus-visible:ring-offset-2 focus-visible:outline-none">
    <UIcon name="i-lucide-plus" class="w-4 h-4" />
    + <span class="hidden sm:inline">Enregistrer une</span> vente
  </button>
</div>
```

### KPI grid

```
grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4
```

### Toolbar

```
bg-white border border-cgws-leather/30 rounded-[4px] p-3
flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4
```

### Table wrapper

```
bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden
```

### Table head

```
bg-cgws-parchment/40 border-b border-cgws-leather/20
```

### Table head cells

```
py-3 pl-4 pr-3 (first) / py-3 px-3 (others)
text-left font-sans text-[10px] uppercase tracking-widest text-cgws-leather
```

### Table rows

```
transition-colors duration-100 hover:bg-cgws-parchment/20
divide-y divide-cgws-leather/10
```

### Type badge — Propre

```
inline-flex items-center px-2.5 py-0.5 rounded-full
font-sans font-medium text-[11px] uppercase tracking-wider
bg-cgws-denim/15 text-cgws-denim
```

### Type badge — Consignation

```
inline-flex items-center px-2.5 py-0.5 rounded-full
font-sans font-medium text-[11px] uppercase tracking-wider
bg-cgws-copper/20 text-cgws-copper
```

### Commission panel

```
p-3 mt-3 bg-cgws-parchment/60 border border-cgws-copper/20 rounded-sm space-y-1.5
```

### Modal header icon

```
flex-shrink-0 w-10 h-10 rounded-full bg-cgws-copper/10
flex items-center justify-center
```

### Footer bouton cancel

```
w-full sm:w-auto px-4 py-2 rounded-sm border border-cgws-leather/40
font-sans text-sm font-medium text-cgws-leather
hover:bg-cgws-parchment/40 hover:text-cgws-charcoal transition-colors
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none
disabled:opacity-40 disabled:cursor-not-allowed
```

### Footer bouton submit

```
w-full sm:w-auto inline-flex items-center justify-center gap-2
px-5 py-2 rounded-sm bg-cgws-copper text-white
font-sans text-sm font-semibold
hover:bg-cgws-leather transition-colors
disabled:opacity-40 disabled:cursor-not-allowed
focus-visible:ring-2 focus-visible:ring-cgws-copper
focus-visible:ring-offset-2 focus-visible:outline-none
```

---

## 9. Animations

### Entry animations — page (GSAP)

Dans `onMounted()`, après que `isLoading` passe à `false` et que les lignes du tableau sont rendues :

```typescript
// Dans le watch(isLoading, (loading) => { if (!loading) { nextTick(() => { ... }) } })
gsap.from('.sale-row', {
  opacity: 0,
  y: 12,
  stagger: 0.04,
  duration: 0.28,
  ease: 'power2.out',
  clearProps: 'all',
})
```

Les lignes de skeleton ne portent pas la classe `.sale-row`. Seules les vraies lignes de données la portent.

### Entry animations — KPI cards (`@vueuse/motion`)

Les 4 KpiCards recoivent une directive `v-motion` :

```html
<KpiCard
  v-motion="{
    initial: { opacity: 0, y: 8 },
    visibleOnce: { opacity: 1, y: 0, transition: { delay: index * 80, duration: 300 } }
  }"
/>
```

`index` = 0,1,2,3 pour le stagger.

### Commission panel slide-down (CSS transition)

```css
.commission-enter-active,
.commission-leave-active {
  transition: opacity 0.25s ease, max-height 0.25s ease;
  max-height: 120px;
  overflow: hidden;
}
.commission-enter-from,
.commission-leave-to {
  opacity: 0;
  max-height: 0;
}
```

### Modal — reprend `.modal-*` de SaleModal.vue existant

```css
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box { transform: scale(0.96) translateY(8px); }
```

### Toast — reprend `.toast-*` du pattern consignations

```css
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-0.5rem); }
```

---

## 10. Accessibilité

### Page

- `<h2>` "Ventes" est le titre de région — dans le layout admin, le `<main>` a `aria-label="Contenu principal"`.
- La table porte `aria-label="Liste des ventes"` et une `<caption class="sr-only">` : `"{{ totalCount }} vente{{ totalCount !== 1 ? 's' : '' }}, triées par date décroissante"`.
- Les en-têtes de colonnes sont des `<th scope="col">`.
- La colonne prix n'a pas de bouton de tri — aucun `aria-sort` nécessaire.

### Filtres

- `<input type="month">` : `aria-label="Filtrer par mois"`.
- `<select>` type : `aria-label="Filtrer par type de vente"`.
- Bouton reset : `aria-label="Réinitialiser les filtres"`.

### Pagination

```html
<nav aria-label="Pagination des ventes">
  <button aria-label="Page précédente" :disabled="currentPage === 1">…</button>
  <button :aria-current="p === currentPage ? 'page' : undefined">{{ p }}</button>
  <button aria-label="Page suivante" :disabled="currentPage === totalPages">…</button>
</nav>
```

### Modal SaleForm

- `role="dialog"` `aria-modal="true"` `aria-labelledby="sale-form-title"`.
- `@keydown.esc="$emit('close')"` sur le wrapper.
- **Focus trap** : même implémentation que SaleModal existant (`handleModalKeydown` Tab/Shift+Tab cyclique sur les focusables).
- Au close : retour focus sur le bouton "Enregistrer une vente" qui a ouvert la modal (`document.querySelector('[data-open-sale-form]')?.focus()`).
- Spinner soumission : `aria-hidden="true"` sur le spinner, texte du bouton change en "Enregistrement…" (lisible par les lecteurs d'écran sans besoin d'`aria-live` supplémentaire car c'est le texte du bouton lui-même).

### Focus visible — pattern global

Toujours `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper` (avec `focus-visible:ring-offset-2` sur boutons primaires sur fond blanc).

### Contraste

| Paire | Ratio | Validation |
|-------|-------|-----------|
| `text-cgws-charcoal (#1A0B03)` sur `bg-white` | ~19:1 | AA + AAA |
| `text-cgws-copper (#B8650A)` sur `bg-white` | ~4.6:1 | AA |
| `text-cgws-copper (#B8650A)` sur `bg-cgws-parchment (#F0DDB8)` | ~3.5:1 | AA Large (prix en Bebas Neue ≥ 18px) |
| `text-cgws-denim (#2C4A72)` sur `bg-cgws-denim/15 (~#E8EEF5)` | ~5.2:1 | AA |
| `text-white` sur `bg-cgws-copper (#B8650A)` | ~4.6:1 | AA |

---

## Breakpoints résumé

### Mobile 375px
- KPI : grille 2×2 (`grid-cols-2`)
- Toolbar : colonne (`flex-col`)
- Table : masquée (`hidden sm:block`)
- Cartes mobiles : visibles (`block sm:hidden`)
- Bouton header : texte court "+ Vente"
- Modal : `max-h-[90dvh]`, items-end pour ancrage en bas sur très petit écran (`sm:items-center`)

### Tablet 768px
- KPI : grille 2×2 → bascule à 4 colonnes en `lg:`
- Toolbar : ligne (`sm:flex-row`)
- Table visible, colonnes Paiement masquées jusqu'à `md:`
- Modal : centrée, `max-h-[80vh]`, formulaire grille 2 colonnes pour Date+Prix

### Desktop 1440px
- KPI : 4 colonnes
- Table : toutes colonnes visibles (Paiement `md:`, Client `lg:`)
- Bouton : texte complet "+ Enregistrer une vente"
- Modal : centrée, `max-w-lg`
