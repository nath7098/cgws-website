# Dashboard Admin — Spec UX (US-031)

**Purpose**: Tableau de bord central du backoffice — vue synthétique immédiate pour Camille (P1) : CA et activité du mois, consignations à traiter, raccourcis vers les actions fréquentes.
**Location**: `app/pages/admin/dashboard.vue` (remplace le stub `app/pages/admin/dashboard/index.vue`)

---

## Contexte layout

Le contenu s'insère dans `<slot />` du layout `admin.vue` — soit dans `<main id="admin-content" class="flex-1 p-4 md:p-6 lg:p-8">`. La sidebar (w-64, `cgws-tack`) et la topbar (h-14, `cgws-parchment`) sont gérées par le layout. La page n'a pas besoin de définir son propre fond — il hérite de `bg-cgws-cream`.

Le `definePageMeta` existant du stub (`middleware: 'admin'`, `layout: 'admin'`, `title: 'Dashboard'`) doit être conservé à l'identique dans le nouveau fichier.

---

## Layout page — wireframe ASCII (desktop 1280px+)

```
┌─ contenu de <slot /> ─────────────────────────────────────────────┐
│                                                                     │
│  H2 "Tableau de bord"          [date courante, Inter xs right]     │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│  │ CA ce mois   │ │Produits      │ │Consignations │ │Ventes    │ │
│  │              │ │actifs        │ │en attente    │ │ce mois   │ │
│  │  3 240 €     │ │    47        │ │     3        │ │   12     │ │
│  │  [i-euro]    │ │  [i-pkg]     │ │[i-inbox] ⚠  │ │[i-receipt│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │
│                                                                     │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐  │
│  │ Consignations récentes      │  │ Ventes récentes            │  │
│  │─────────────────────────────│  │────────────────────────────│  │
│  │ Déposant    Article  Statut │  │ Produit   Prix   Paiement  │  │
│  │ ────────────────────────── │  │ ──────────────────────────  │  │
│  │ Dupont M.   Selle Bo [pill] │  │ Selle W…  480€   Carte     │  │
│  │ Martin A.   Bride K  [pill] │  │ Botte X…  120€   Espèces   │  │
│  │ …           …        …      │  │ …         …      …         │  │
│  │               [Voir tout →] │  │               [Voir tout →]│  │
│  └─────────────────────────────┘  └────────────────────────────┘  │
│                                                                     │
│  ┌─── Accès rapides ─────────────────────────────────────────────┐ │
│  │  [+ Ajouter un produit]  [Gérer les consignations]  [Catalogue]│ │
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

**Mobile (< 768px)**: KPI cards en grille 2 colonnes. Les deux tableaux d'activité s'empilent verticalement (colonne unique). Liens rapides en colonne.

**Tablet (768px–1023px)**: KPI en grille 2×2. Activité en colonne (desktop layout s'active à lg:).

---

## Composant KpiCard

**Fichier** : `app/components/admin/KpiCard.vue`

### Props

```ts
interface KpiCardProps {
  label: string            // "CA ce mois", "Produits actifs", etc.
  value: string | number   // "3 240 €" ou 47
  icon?: string            // nom UIcon, ex. "i-lucide-euro"
  variant?: 'default' | 'warning'  // warning = consignations en attente > 0
  loading?: boolean
}
```

### Anatomie

```
┌─────────────────────────────────────────┐
│  [icon 20px cgws-copper/cgws-rust]      │  ← top-right, optionnel
│                                         │
│  3 240 €                                │  ← Bebas Neue, text-5xl
│                                         │
│  CA CE MOIS                             │  ← Inter 11px, uppercase,
│                                         │    tracking-widest, cgws-leather
└─────────────────────────────────────────┘
```

- **Conteneur** : `bg-white border border-cgws-leather/30 rounded-[4px] shadow-sm p-5`
- **Variant `default`** : valeur en `text-cgws-charcoal font-display`
- **Variant `warning`** : bordure gauche `border-l-4 border-cgws-rust`, valeur en `text-cgws-rust`, icône en `text-cgws-rust`
- **Hover** : aucun (c'est une stat, pas un lien)
- **CgwsCard existant** : ne pas réutiliser `CgwsCard` — KpiCard a son propre padding léger (p-5) et son propre layout interne. `CgwsCard` convient aux blocs généraux ; KpiCard est spécialisé pour les chiffres.

### État loading (skeleton)

Quand `loading = true`, remplacer le contenu par deux blocs pulsants :

```html
<!-- valeur -->
<div class="h-10 w-24 bg-cgws-leather/10 rounded animate-pulse mb-3" />
<!-- label -->
<div class="h-3 w-20 bg-cgws-leather/10 rounded animate-pulse" />
```

### Tailwind classes clés

```
bg-white border border-cgws-leather/30 rounded-[4px] shadow-sm p-5
flex flex-col gap-1
font-display text-5xl leading-none          ← valeur
font-sans text-[11px] uppercase tracking-widest text-cgws-leather  ← label
text-cgws-rust border-l-4 border-cgws-rust  ← variant warning
```

---

## Composant RecentActivity

**Fichier** : `app/components/admin/RecentActivity.vue`

### Props

```ts
type ActivityType = 'consignments' | 'sales'

interface RecentActivityProps {
  type: ActivityType
  items: RecentConsignment[] | RecentSale[]
  loading?: boolean
}

// Shapes internes (sous-ensemble des types globaux)
interface RecentConsignment {
  id: string
  depositorName: string
  itemDescription: string
  status: ConsignmentStatus
  createdAt: string
}

interface RecentSale {
  id: string
  productTitle: string   // jointure products.title
  salePrice: number
  paymentMethod: PaymentMethod
  saleDate: string
}
```

### Anatomie (deux colonnes desktop via CSS Grid dans la page)

```
┌─────────────────────────────────────────────────┐
│  Titre section ("Consignations récentes")        │
│  ─────────────────────────────────────────────  │
│  DÉPOSANT      ARTICLE         STATUT    DATE    │  ← thead Inter 10px uppercase
│  ─────────────────────────────────────────────  │  ← border-b cgws-leather/20
│  Dupont M.     Selle Bob...    [pending] 28/06   │
│  Martin A.     Bride King...   [accepted]27/06   │
│  ─────────────────────────────────────────────  │
│                               Voir tout →        │
└─────────────────────────────────────────────────┘
```

**Colonnes `type='consignments'`** : Déposant | Article (truncate max-w-[160px]) | Statut (pill) | Date

**Colonnes `type='sales'`** : Produit (truncate) | Prix (`font-display text-cgws-copper`) | Paiement | Date

### Statut pills consignations

| Status | Classe |
|--------|--------|
| `pending` | `bg-cgws-copper/15 text-cgws-copper` |
| `accepted` | `bg-green-100 text-green-700` |
| `rejected` | `bg-cgws-rust/15 text-cgws-rust` |
| `sold` | `bg-cgws-charcoal/10 text-cgws-charcoal` |
| `returned` | `bg-cgws-leather/15 text-cgws-leather` |

Labels FR : pending → "En attente" / accepted → "Acceptée" / rejected → "Refusée" / sold → "Vendue" / returned → "Retournée"

### Labels paiement FR

`cash` → "Espèces" | `card` → "Carte" | `transfer` → "Virement" | `check` → "Chèque"

### État loading (skeleton)

5 lignes de skeleton : `<div class="h-4 bg-cgws-leather/10 rounded animate-pulse my-2" />`

### État vide

Message centré : `font-sans text-sm text-cgws-leather italic` — "Aucune activité récente."

### Lien "Voir tout"

`CgwsButton` variant `ghost` size `sm` aligné à droite, as `NuxtLink` :
- Consignations → `to="/admin/consignations"`
- Ventes → `to="/admin/ventes"`

### Tailwind classes clés

```
bg-white border border-cgws-leather/30 rounded-[4px] shadow-sm
p-5
table w-full text-sm font-sans
th: font-sans text-[10px] uppercase tracking-widest text-cgws-leather pb-2 text-left
td: py-2 border-t border-cgws-leather/10 text-cgws-charcoal align-middle
truncate max-w-[160px]
```

---

## Section liens rapides

Pas de composant dédié — inline dans `dashboard.vue`. Titre "Accès rapides" en `font-serif font-semibold text-base text-cgws-charcoal mb-3`.

Trois `CgwsButton` en `flex flex-wrap gap-3` :

| Bouton | Variant | as | to | Icon |
|--------|---------|----|----|------|
| "+ Ajouter un produit" | `primary` | NuxtLink | `/admin/produits/nouveau` | `i-lucide-plus` (slot before) |
| "Gérer les consignations" | `secondary` | NuxtLink | `/admin/consignations` | `i-lucide-arrow-left-right` |
| "Voir le catalogue" | `ghost` | NuxtLink | `/catalogue` | `i-lucide-external-link` |

Size `sm` pour tous les trois — le dashboard n'est pas une page CTA.

---

## Requêtes Supabase

Six requêtes parallèles lancées via `Promise.all` dans `onMounted` (ou via `useAsyncData` avec `parallel: true` si SSR requis). Toutes ignorent les erreurs non-fatales et affichent `—` sur la KPI si la requête échoue.

### 1. CA ce mois (KPI)

```ts
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

supabase
  .from('sales')
  .select('sale_price')
  .gte('sale_date', firstDay)
// Sommer client-side : items.reduce((acc, r) => acc + r.sale_price, 0)
// Formater : toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
```

### 2. Produits actifs (KPI)

```ts
supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'active')
// Utiliser data.count
```

### 3. Consignations en attente (KPI)

```ts
supabase
  .from('consignments')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'pending')
// Si count > 0 → variant 'warning' sur la KpiCard
```

### 4. Ventes ce mois (KPI)

```ts
supabase
  .from('sales')
  .select('id', { count: 'exact', head: true })
  .gte('sale_date', firstDay)
```

### 5. 5 dernières consignations (RecentActivity)

```ts
supabase
  .from('consignments')
  .select('id, depositor_name, item_description, status, created_at')
  .order('created_at', { ascending: false })
  .limit(5)
```

### 6. 5 dernières ventes (RecentActivity)

```ts
supabase
  .from('sales')
  .select('id, sale_price, payment_method, sale_date, products(title)')
  .order('created_at', { ascending: false })
  .limit(5)
// products(title) = jointure implicite Supabase → mapper vers productTitle
```

---

## Structure de la page `dashboard.vue`

```
<template>
  <div class="space-y-8">

    <!-- En-tête page -->
    <div class="flex items-baseline justify-between">
      <h2 font-serif font-bold text-2xl text-cgws-charcoal>Tableau de bord</h2>
      <span font-sans text-xs text-cgws-leather>{{ dateLabel }}</span>
    </div>

    <!-- KPI grid -->
    <section aria-label="Indicateurs clés">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard v-for="kpi in kpis" :key="kpi.id" v-bind="kpi" :loading="loadingKpis" />
      </div>
    </section>

    <!-- Activité récente -->
    <section aria-label="Activité récente">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity type="consignments" :items="recentConsignments" :loading="loadingActivity" />
        <RecentActivity type="sales"        :items="recentSales"        :loading="loadingActivity" />
      </div>
    </section>

    <!-- Liens rapides -->
    <section aria-label="Accès rapides">
      <p font-serif font-semibold text-base text-cgws-charcoal mb-3>Accès rapides</p>
      <div class="flex flex-wrap gap-3"> ... </div>
    </section>

  </div>
</template>
```

---

## États de chargement

`loadingKpis` et `loadingActivity` sont deux `ref<boolean>` séparés, permettant d'afficher les skeletons KPI immédiatement puis les listes dès qu'elles arrivent. Les deux groupes de requêtes partent en parallèle mais leurs états sont indépendants pour un affichage progressif.

---

## Accessibilité

- Chaque `<section>` a un `aria-label` décrivant son contenu
- `KpiCard` : valeur + label concaténés dans un `aria-label` sur le conteneur (`aria-label="CA ce mois : 3 240 €"`)
- Tableau activité : balise `<table>` avec `<caption class="sr-only">` (ex. "5 dernières consignations")
- En-têtes `<th scope="col">` pour chaque colonne
- Statut pills : `aria-label="Statut : En attente"` (pas seulement la couleur)
- Focus : ring `ring-2 ring-cgws-copper ring-offset-2` sur tous les éléments interactifs (hérité de `CgwsButton`)
- Contraste : valeurs KPI `cgws-charcoal #1A0B03` sur `white` — ratio > 18:1 (AAA). Variant warning `cgws-rust #943218` sur `white` — ratio ~6.2:1 (AA).
