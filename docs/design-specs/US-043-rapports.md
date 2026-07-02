# Rapports & Exports — Spec UX (US-043)

**Purpose**: Page d'administration permettant à Camille d'exporter les ventes en CSV sur une période choisie, de consulter l'évolution du chiffre d'affaires sur 12 mois et, depuis la fiche d'une consignation acceptée, de générer un bon de dépôt PDF à remettre au déposant.

**Locations**:
- `app/pages/admin/rapports.vue` — page principale rapports
- `app/components/admin/RevenueChart.vue` — composant graphique CA (réutilisable sur dashboard)
- `app/pages/admin/consignations/[id].vue` — ajout bouton PDF dans section "accepted" et "sold"
- `app/layouts/admin.vue` — ajout lien "Rapports" dans navLinks

---

## Librairie graphique recommandée

**Choix : `vue-chartjs` v5 + `chart.js` v4**

Justification :
- Wrapper Vue 3 officiel — TypeScript natif, composition API
- SSR-safe avec `<ClientOnly>` (pas de `window` côté serveur) — critique pour Nuxt 4
- Tree-shakeable : n'importer que `Bar` → ~70 KB gzipped total
- Configuration déclarative via props (datasets, options) — alignée sur le pattern des composants existants
- Thémable via `datasets.backgroundColor` avec des valeurs hexadécimales (tokens cgws-*)
- Recharts est React-only, incompatible avec ce projet
- `echarts` / `vue-echarts` : ~1 MB, trop lourd pour un seul graphique

Installation requise :
```bash
npm install chart.js vue-chartjs
```

**Génération PDF — choix : `pdfmake` v0.2.x (Nitro server route)**

Justification :
- Pure JS, pas de dépendance headless browser (incompatible Vercel serverless)
- `puppeteer` interdit sur Vercel (dépassement mémoire + taille bundle)
- `@vercel/og` génère des images PNG, pas des PDFs multi-pages structurés
- `pdfmake` : layout structuré, support des colonnes, bordures et zones de signature
- S'exécute uniquement côté serveur (Nitro), aucun impact bundle client

Installation requise :
```bash
npm install pdfmake
npm install --save-dev @types/pdfmake
```

---

## 1. Page /admin/rapports

### Layout (ASCII wireframe — desktop 1440px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [← sidebar 256px]  MAIN CONTENT (flex-1, p-8)                      │
│                                                                     │
│  Rapports & Exports                               [date du jour]    │
│  ─────────────────────────────────────────                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ EXPORT VENTES CSV                                           │   │
│  │ ──────────────────────────────                              │   │
│  │  Du [  date  ]    Au [  date  ]   [Export CSV  ↓]          │   │
│  │                                                             │   │
│  │  [zone feedback : idle / loading / success / error]         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ÉVOLUTION DU CHIFFRE D'AFFAIRES — 12 DERNIERS MOIS         │   │
│  │                                                             │   │
│  │  2 500 ┤                              ██                    │   │
│  │  2 000 ┤                    ██        ██                    │   │
│  │  1 500 ┤        ██          ██   ██   ██                    │   │
│  │  1 000 ┤   ██   ██    ██   ██   ██   ██   ██               │   │
│  │    500 ┤   ██   ██    ██   ██   ██   ██   ██               │   │
│  │      0 └──────────────────────────────────────────────────  │   │
│  │         Juil Août Sep  Oct  Nov  Déc  Jan  Fév  Mar  Avr … │   │
│  │                                                             │   │
│  │  [■ CA propre (cuivre)]   [■ CA consignation (denim)]       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout mobile 375px

```
┌──────────────────────────────┐
│ [☰]  Rapports & Exports      │
├──────────────────────────────┤
│ EXPORT VENTES CSV            │
│  Du [    date    ]           │
│  Au [    date    ]           │
│  [ Export CSV ↓  ] (full w.) │
│  [zone feedback]             │
├──────────────────────────────┤
│ ÉVOLUTION DU CA              │
│  [chart — 375px, scrollable] │
│  [légende en colonne]        │
└──────────────────────────────┘
```

Sur mobile, le chart est rendu dans un conteneur `overflow-x-auto` avec une largeur minimale interne de 560px pour que les 12 barres restent lisibles. L'utilisateur peut scroller horizontalement.

### Layout tablet 768px

Identique au mobile mais sans scroll horizontal (560px < 768px viewport). Export card pleine largeur, chart pleine largeur.

---

### Structure de la page

#### En-tête de page

```
h2 : "Rapports & Exports"
     font-serif font-bold text-2xl text-cgws-charcoal

span : date du jour (SSR-safe, calculée en onMounted)
       font-sans text-xs text-cgws-leather
```

#### Card "Export Ventes CSV"

Conteneur : `bg-white border border-cgws-leather/30 rounded-[4px] p-5`

Label de section :
```
font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper mb-4
```
Texte : "Export Ventes CSV"

Contrôles de période :
```html
<div class="flex flex-col sm:flex-row gap-3 items-end">
  <div class="flex-1">
    <label> Du </label>
    <CgwsInput type="date" v-model="exportFrom" />
  </div>
  <div class="flex-1">
    <label> Au </label>
    <CgwsInput type="date" v-model="exportTo" />
  </div>
  <CgwsButton variant="primary" :loading="isExporting" @click="handleExport">
    <UIcon name="i-lucide-download" />
    Export CSV
  </CgwsButton>
</div>
```

Valeurs par défaut : `exportFrom` = premier jour du mois courant, `exportTo` = date du jour.

Zone de feedback (sous les contrôles) — états :
- **Idle** : vide (rien affiché)
- **Loading** : `font-sans text-xs text-cgws-leather` — "Génération en cours…"
- **Succès** : badge vert `bg-green-100 text-green-700 rounded-sm px-2 py-1 font-sans text-xs` — "Fichier téléchargé (N ventes, période du JJ/MM/AAAA au JJ/MM/AAAA)" — auto-disparaît après 5 s
- **Erreur** : `text-cgws-rust font-sans text-xs` — "Erreur lors de l'export. Vérifiez la période sélectionnée."
- **Aucune donnée** : `text-cgws-leather/70 font-sans text-xs` — "Aucune vente sur cette période."

Validation côté client avant appel API :
- `exportFrom` et `exportTo` doivent être renseignés
- `exportFrom` ≤ `exportTo`
- Si invalide : afficher `text-cgws-rust font-sans text-xs` sous le champ concerné

Mécanisme de téléchargement :
```ts
// Créer un lien <a> temporaire avec blob URL
const blob = await $fetch<Blob>('/api/admin/exports/sales', {
  query: { from: exportFrom.value, to: exportTo.value },
  responseType: 'blob',
})
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `cgws-ventes-${exportFrom.value}-${exportTo.value}.csv`
a.click()
URL.revokeObjectURL(url)
```

#### Card "Évolution du CA"

Conteneur : `bg-white border border-cgws-leather/30 rounded-[4px] p-5`

Label de section : "Évolution du Chiffre d'Affaires — 12 derniers mois"

Contient le composant `<RevenueChart>` (spécifié en section 2).

---

## 2. Composant RevenueChart

**Location** : `app/components/admin/RevenueChart.vue`

**Purpose** : Graphique en barres empilées affichant l'évolution mensuelle du CA sur 12 mois glissants, avec distinction visuelle CA propre / CA consignation. Conçu pour être intégré sur `/admin/rapports` et éventuellement sur `/admin/dashboard`.

### Props

```typescript
interface Props {
  // Données préchargées par la page parente (évite double fetch si sur dashboard)
  data?: MonthlyRevenue[]
  loading?: boolean
  height?: number  // hauteur du canvas en px, défaut 280
}
```

Nouveau type à ajouter dans `app/types/index.ts` :
```typescript
export interface MonthlyRevenue {
  month: string            // format "YYYY-MM"
  ownRevenue: number       // CA hors consignation (€)
  consignmentRevenue: number  // CA consignation (€)
}
```

Le composant fetche lui-même les données si `props.data` n'est pas fourni, via `GET /api/admin/stats/revenue-monthly` (endpoint à créer, retourne les 12 derniers mois).

### Layout (ASCII wireframe)

```
┌──────────────────────────────────────────────────────────────┐
│  [skeleton 280px de hauteur si loading]                      │
│                                                              │
│  <ClientOnly>                                                │
│    <Bar :data="chartData" :options="chartOptions"            │
│         aria-label="Évolution du CA sur 12 mois" />         │
│  </ClientOnly>                                               │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│  [■ cgws-copper]  CA propre        [■ cgws-denim] Consignation│
└──────────────────────────────────────────────────────────────┘
```

### Configuration Chart.js

```typescript
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const chartData = computed(() => ({
  labels: props.data?.map(d => formatMonthLabel(d.month)) ?? [],
  datasets: [
    {
      label: 'CA propre',
      data: props.data?.map(d => d.ownRevenue) ?? [],
      backgroundColor: '#B8650A',   // cgws-copper
      borderRadius: 3,
      borderSkipped: false,
    },
    {
      label: 'CA consignation',
      data: props.data?.map(d => d.consignmentRevenue) ?? [],
      backgroundColor: '#2C4A72',   // cgws-denim
      borderRadius: 3,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },  // légende custom HTML ci-dessous
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label} : ${ctx.parsed.y.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: { font: { family: 'Inter', size: 11 }, color: '#7B3B1C' },  // cgws-leather
    },
    y: {
      stacked: true,
      grid: { color: '#F0DDB8' },   // cgws-parchment — grille subtile
      border: { dash: [4, 4] },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#7B3B1C',
        callback: (value) => `${Number(value).toLocaleString('fr-FR')} €`,
      },
    },
  },
}))
```

Fonction helper `formatMonthLabel` :
```typescript
function formatMonthLabel(month: string): string {
  // "2024-07" → "Juil."
  const [year, m] = month.split('-')
  const d = new Date(Number(year), Number(m) - 1, 1)
  return d.toLocaleDateString('fr-FR', { month: 'short' })
}
```

### Légende custom HTML (sous le canvas)

```html
<div class="flex items-center gap-6 mt-4 justify-center" aria-hidden="true">
  <div class="flex items-center gap-2">
    <span class="w-3 h-3 rounded-sm bg-cgws-copper inline-block flex-shrink-0" />
    <span class="font-sans text-xs text-cgws-leather">CA propre</span>
  </div>
  <div class="flex items-center gap-2">
    <span class="w-3 h-3 rounded-sm bg-cgws-denim inline-block flex-shrink-0" />
    <span class="font-sans text-xs text-cgws-leather">CA consignation</span>
  </div>
</div>
```

### États du composant

- **Loading** : skeleton `animate-pulse bg-cgws-leather/10 rounded h-[280px]` pleine largeur
- **Data vide** (tous les mois à 0) : canvas affiché normalement avec barres à 0, pas d'empty state spécifique (la gérante voit que les mois sont à 0 €)
- **Erreur fetch** : message `font-sans text-xs text-cgws-rust` centré dans la zone — "Impossible de charger les données. Actualisez la page."
- **Default** : canvas affiché avec données, hauteur fixe via `style="height: 280px"`

### Tailwind classes (clés)

```
// Wrapper scroll mobile
overflow-x-auto

// Inner container fixant la largeur minimale
min-w-[560px]

// Canvas wrapper
relative h-[280px]

// Légende
flex items-center gap-6 mt-4 justify-center

// Puce légende
w-3 h-3 rounded-sm bg-cgws-copper  (ou bg-cgws-denim)

// Label légende
font-sans text-xs text-cgws-leather
```

---

## 3. Bouton "Bon de dépôt PDF" — /admin/consignations/[id]

### Emplacement exact dans la page

Le bouton s'insère dans **deux** sections conditionnelles existantes :

**A. Section `status === 'accepted'`** (lignes 662-701 du fichier actuel)

Après le lien "Voir le produit au catalogue", ajouter en dessous :

```html
<div class="mt-4 pt-4 border-t border-cgws-leather/15">
  <p class="font-sans text-xs text-cgws-leather/70 mb-2">
    Documents
  </p>
  <button
    type="button"
    :disabled="isGeneratingPdf"
    class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-cgws-leather/40
           bg-cgws-parchment text-cgws-charcoal font-sans text-sm font-medium
           hover:border-cgws-copper hover:text-cgws-copper hover:bg-cgws-parchment
           transition-colors duration-150
           disabled:opacity-40 disabled:cursor-not-allowed
           focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none"
    aria-label="Générer et télécharger le bon de dépôt PDF"
    @click="handleDownloadReceipt"
  >
    <span
      v-if="isGeneratingPdf"
      class="w-4 h-4 rounded-full border-2 border-cgws-copper border-t-transparent animate-spin"
      aria-hidden="true"
    />
    <UIcon v-else name="i-lucide-file-text" class="w-4 h-4" aria-hidden="true" />
    {{ isGeneratingPdf ? 'Génération…' : 'Bon de dépôt PDF' }}
  </button>
</div>
```

**B. Section `status === 'sold'`** (lignes 738-776 du fichier actuel)

Même bouton ajouté après le paragraphe "Taux de commission CGWS fixe : 20 %", dans un séparateur identique.

Le bouton n'apparaît PAS pour les statuts `pending`, `rejected`, `returned`.

### Variables d'état à ajouter dans le script

```typescript
const isGeneratingPdf = ref(false)

async function handleDownloadReceipt(): Promise<void> {
  if (!consignment.value) return
  isGeneratingPdf.value = true
  try {
    const token = await getAccessToken()
    const blob = await $fetch<Blob>(
      `/api/admin/exports/consignment-receipt`,
      {
        query: { id: consignationId.value },
        headers: buildAuthHeaders(token),
        responseType: 'blob',
      },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bon-depot-${consignment.value.id.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    showToast('success', 'Bon de dépôt téléchargé.')
  }
  catch {
    showToast('error', 'Impossible de générer le bon de dépôt. Réessayez.')
  }
  finally {
    isGeneratingPdf.value = false
  }
}
```

### Contenu du PDF (spécification pour le développeur)

Le PDF généré par `server/api/admin/exports/consignment-receipt.get.ts` doit contenir les blocs suivants (format A4 portrait) :

```
┌──────────────────────────────────────────────────────────┐
│  CGWS                           BON DE DÉPÔT             │
│  Camille Guignon Western Shop   N° [id.slice(0,8)]       │
│  Brèches, 37340                 Date : JJ/MM/AAAA        │
│  [email contact]                                         │
├──────────────────────────────────────────────────────────┤
│  DÉPOSANT                                                │
│  Nom :    [depositorName]                                │
│  Email :  [depositorEmail]                               │
│  Tél. :   [depositorPhone]                               │
├──────────────────────────────────────────────────────────┤
│  ARTICLE DÉPOSÉ                                          │
│  Description : [itemDescription]                         │
│  Marque :      [brand]                                   │
│  État :        [condition label FR]                      │
│  Prix convenu de mise en vente : XX,XX €                 │
│  Commission CGWS (20 %) :       XX,XX €                  │
│  Montant à reverser au déposant : XX,XX €                │
├──────────────────────────────────────────────────────────┤
│  CONDITIONS                                              │
│  Date de dépôt :  JJ/MM/AAAA                            │
│  Durée de consignation : 6 mois (jusqu'au JJ/MM/AAAA)   │
│  Au-delà, l'article est retourné au déposant.            │
├──────────────────────────────────────────────────────────┤
│  SIGNATURES                                              │
│                                                          │
│  Le déposant :                 CGWS :                    │
│  ___________________           ___________________       │
│  Date :                        Date :                    │
└──────────────────────────────────────────────────────────┘
```

Note sur la durée de consignation : 6 mois depuis `consignment.createdAt` → à calculer dans le serveur (`new Date(createdAt).getTime() + 6 * 30 * 24 * 60 * 60 * 1000`).

---

## 4. Mise à jour du Sidebar — admin.vue

Ajouter l'entrée suivante dans `navLinks` après "Ventes" :

```typescript
{ href: '/admin/rapports', label: 'Rapports', icon: 'i-lucide-bar-chart-2' }
```

---

## Breakpoints

### Page /admin/rapports

- **Mobile 375px** : colonne unique ; period inputs empilés en colonne ; bouton Export pleine largeur ; chart dans `overflow-x-auto` avec `min-w-[560px]` interne
- **Tablet 768px** : period inputs et bouton sur une ligne (`flex-row`) ; chart pleine largeur sans scroll (560px < 768px)
- **Desktop 1440px** : sidebar 256px fixe, contenu `pl-64 p-8` ; cards pleine largeur du contenu ; chart avec les 12 barres confortablement espacées

### Bouton PDF (consignations/[id])

Suit le layout existant de la page : `flex-col sm:flex-row` sur la zone actions. Le bouton PDF apparaît sous le lien produit, pas en ligne avec lui.

---

## États (page rapports)

### Bouton Export CSV

- **Default** : `bg-cgws-copper text-white` — "Export CSV" + icône `i-lucide-download`
- **Hover** : `hover:bg-cgws-leather` — transition 150ms
- **Focus** : `focus-visible:ring-2 focus-visible:ring-cgws-copper ring-offset-2`
- **Loading** : spinner `border-t-transparent animate-spin` inline gauche du texte — texte "Export en cours…" — bouton `disabled` + `opacity-40`
- **Succès** : badge feedback vert sous les contrôles, bouton revient à default
- **Erreur** : texte `text-cgws-rust` sous les contrôles, bouton revient à default

### Chart RevenueChart

- **Loading** : skeleton pleine hauteur `animate-pulse bg-cgws-leather/10 rounded h-[280px]`
- **Default** : canvas Chart.js avec données, tooltips natifs Chart.js
- **Hover sur barre** : tooltip Chart.js natif, fond `cgws-charcoal`, texte `cgws-rope`, padding `12px`
- **Erreur fetch** : message centré dans la zone, lien de retry optionnel

### Bouton "Bon de dépôt PDF"

- **Default** : `border border-cgws-leather/40 bg-cgws-parchment text-cgws-charcoal`
- **Hover** : `hover:border-cgws-copper hover:text-cgws-copper` — transition 150ms
- **Focus** : `focus-visible:ring-2 focus-visible:ring-cgws-copper`
- **Loading** : spinner cuivre + texte "Génération…" + `disabled opacity-40`
- **Succès** : toast existant de la page (`showToast('success', …)`)
- **Erreur** : toast existant de la page (`showToast('error', …)`)

---

## Tailwind classes (clés)

```
// Page wrapper
space-y-8

// En-tête page
flex items-baseline justify-between mb-0

// H2 page
font-serif font-bold text-2xl text-cgws-charcoal

// Card conteneur (Export + Chart)
bg-white border border-cgws-leather/30 rounded-[4px] p-5 space-y-4

// Label section (eyebrow)
font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper

// Contrôles période (row)
flex flex-col sm:flex-row gap-3 items-end

// Chart wrapper scroll mobile
overflow-x-auto

// Chart inner (min-width pour lisibilité des 12 mois)
min-w-[560px] relative h-[280px]

// Légende custom
flex items-center gap-6 mt-4 justify-center flex-wrap

// Puce légende
w-3 h-3 rounded-sm flex-shrink-0 bg-cgws-copper (ou bg-cgws-denim)

// Label légende
font-sans text-xs text-cgws-leather

// Bouton PDF (consignation detail)
inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-cgws-leather/40
bg-cgws-parchment text-cgws-charcoal font-sans text-sm font-medium
hover:border-cgws-copper hover:text-cgws-copper
transition-colors duration-150
disabled:opacity-40 disabled:cursor-not-allowed
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none

// Spinner générique
w-4 h-4 rounded-full border-2 border-cgws-copper border-t-transparent animate-spin

// Feedback succès CSV
inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-green-100 text-green-700 font-sans text-xs
```

---

## Animations

Pas d'animation GSAP sur cette page (interface fonctionnelle backoffice, pas de site public). Le feedback visuel repose sur :
- `animate-pulse` pour les skeletons
- `animate-spin` pour les spinners
- `transition-colors duration-150` sur les boutons
- Chart.js anime nativement les barres au montage (`animation.duration: 800`)

Pour désactiver l'animation Chart.js si `prefers-reduced-motion` :
```typescript
const chartOptions = computed(() => ({
  animation: {
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800,
  },
  // ...
}))
```

---

## Accessibilité

### Page /admin/rapports

- `<main>` hérité du layout admin (`id="admin-content"`)
- `<h2>` pour le titre de page
- Chaque card : `<section aria-labelledby="[id]">` avec `<h3 id="[id]">` pour le label de section
- Inputs date : `<label for="…">` explicite + `aria-required="true"` si obligatoire
- Bouton Export : `aria-busy="true"` pendant le loading, `aria-disabled` si invalide
- Zone de feedback : `role="status"` (succès) / `role="alert"` (erreur)
- Chart : `aria-label="Évolution du chiffre d'affaires sur les 12 derniers mois"` sur le canvas + `<ClientOnly>` avec fallback texte pour SSR
- Légende chart : `aria-hidden="true"` (décorative, l'info est dans l'aria-label du canvas)

### Bouton "Bon de dépôt PDF"

- `aria-label="Générer et télécharger le bon de dépôt PDF"` (explicite sur l'action)
- `aria-busy="true"` pendant `isGeneratingPdf === true`
- Focus : `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none`
- La section parente a déjà un `aria-labelledby` dans le code existant

### Contrastes

| Élément | Foreground | Background | Ratio |
|---|---|---|---|
| Texte corps (Inter) | `cgws-charcoal` #1A0B03 | `white` #FFFFFF | 19.5:1 — AAA |
| Label section (eyebrow) | `cgws-copper` #B8650A | `white` #FFFFFF | 4.6:1 — AA |
| Bouton Export (primary) | `white` #FFFFFF | `cgws-copper` #B8650A | 4.6:1 — AA |
| Bouton PDF (outline) | `cgws-charcoal` #1A0B03 | `cgws-parchment` #F0DDB8 | 12.4:1 — AAA |
| Légende chart | `cgws-leather` #7B3B1C | `white` #FFFFFF | 6.2:1 — AA |
| Ticks chart | `cgws-leather` #7B3B1C | `white` #FFFFFF | 6.2:1 — AA |
| Feedback erreur | `cgws-rust` #943218 | `white` #FFFFFF | 7.1:1 — AAA |

---

## Nouveaux fichiers à créer (rappel pour le développeur)

| Fichier | Description |
|---|---|
| `app/pages/admin/rapports.vue` | Page principale |
| `app/components/admin/RevenueChart.vue` | Composant graphique CA |
| `server/api/admin/exports/sales.get.ts` | Route CSV — params `from`, `to` (dates ISO) |
| `server/api/admin/exports/consignment-receipt.get.ts` | Route PDF — param `id` (consignment UUID) |
| `server/api/admin/stats/revenue-monthly.get.ts` | Route données graphique — 12 mois glissants |

## Fichiers à modifier

| Fichier | Modification |
|---|---|
| `app/layouts/admin.vue` | Ajouter `{ href: '/admin/rapports', label: 'Rapports', icon: 'i-lucide-bar-chart-2' }` dans `navLinks` après l'entrée "Ventes" |
| `app/pages/admin/consignations/[id].vue` | Ajouter bouton PDF + handler `handleDownloadReceipt` + state `isGeneratingPdf` |
| `app/types/index.ts` | Ajouter interface `MonthlyRevenue` |
