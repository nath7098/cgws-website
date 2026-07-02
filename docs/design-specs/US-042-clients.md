# Gestion des Clients — Spec UX (US-042)

**Purpose**: Permettre à Camille de consulter, rechercher et annoter ses clients depuis le backoffice, et de lier un client existant (ou d'en créer un à la volée) lors de l'enregistrement d'une vente.
**Locations**:
- `app/pages/admin/clients/index.vue`
- `app/pages/admin/clients/[id].vue`
- `app/components/admin/ClientCard.vue`
- `app/components/admin/ClientAutocomplete.vue`
- `app/components/admin/SaleForm.vue` (modification du champ client uniquement)

---

## 1. Page `/admin/clients` — Liste

### Layout (ASCII wireframe)

**Mobile 375px**
```
┌─────────────────────────────────────────────┐
│  Clients                    [+ Nouveau]     │
│  47 clients                                 │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ [i-lucide-search] Rechercher…       │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │  Marie Dupont              12       │    │
│  │  marie@email.fr         achats      │    │
│  │  06 12 34 56 78  Dernier: 15/06/26  │    │
│  │                            Voir →   │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  Jean Martin                3       │    │
│  │  jean@mail.fr            achats     │    │
│  │  —                Dernier: 02/04/26 │    │
│  │                            Voir →   │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  47 clients · page 1 de 3    < 1 2 3 >      │
└─────────────────────────────────────────────┘
```

**Desktop 1440px**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Clients                                       [+ Nouveau client]    │
│  47 clients                                                          │
├──────────────────────────────────────────────────────────────────────┤
│  [i-lucide-search] Rechercher un client (nom ou email)…              │
├──────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  NOM                 EMAIL            TÉL.    ACHATS  DERNIER  │   │
│ │  ──────────────────────────────────────────────────────────    │   │
│ │  Marie Dupont        marie@email.fr   06…     12      15/06/26 │   │
│ │  Jean Martin         jean@email.fr    —        3      02/04/26 │   │
│ │  Camille Grd…        cg@mail.fr       07…      1      10/01/26 │   │
│ └────────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  47 clients · page 1 de 3                           < 1  2  3 >      │
└──────────────────────────────────────────────────────────────────────┘
```

### Breakpoints

- **Mobile 375px**: header empilé (titre + sous-titre à gauche / bouton à droite), search pleine largeur, liste de `ClientCard`, pagination compacte
- **Tablet 768px**: header sur une ligne (titre + bouton alignés), table visible (colonnes Téléphone masquées jusqu'à md), cartes mobiles disparaissent
- **Desktop 1440px**: table complète avec 6 colonnes, search en ligne dans toolbar dédiée

### Données affichées dans la table / carte

Le type `Client` ne contient pas `purchaseCount` ni `lastPurchaseDate`. Ces valeurs sont des agrégats retournés par l'API (`/api/admin/clients?page=&search=`). L'API doit enrichir chaque client avec :
- `purchaseCount: number`
- `lastPurchaseDate: string | null`

### Columns table desktop

| Colonne | Classe `th` | Visibilité | Rendu |
|---------|-------------|------------|-------|
| Nom | `pl-4 pr-3 text-left` | toujours | Lien `NuxtLink` vers `/admin/clients/[id]`, `font-sans text-sm font-medium text-cgws-charcoal` |
| Email | `px-3 text-left` | toujours | `text-sm text-cgws-leather` |
| Téléphone | `px-3 text-left` | `hidden md:table-cell` | `text-sm text-cgws-leather` ou `—` |
| Achats | `px-3 text-right` | toujours | `font-display text-base text-cgws-copper` |
| Dernier achat | `px-3 text-left` | `hidden lg:table-cell` | date FR ou `—` |
| Voir | `px-3 text-right pr-4` | toujours | Bouton icône `i-lucide-arrow-right` `text-cgws-copper hover:text-cgws-leather` |

### States

- **Loading**: 8 skeleton rows — chaque cellule un div `h-4 bg-cgws-leather/10 rounded animate-pulse`
- **Vide (aucun client)**: icône `i-lucide-users` 40px `text-cgws-leather/30`, texte `"Aucun client enregistré."`, bouton `+ Nouveau client`
- **Vide (recherche sans résultat)**: icône + `"Aucun client ne correspond à « [terme] »."`, lien `"Effacer la recherche"` `text-cgws-copper text-xs hover:underline`
- **Erreur**: icône `i-lucide-alert-triangle text-cgws-rust`, message + bouton `"Réessayer"`

### Tailwind classes clés

```
Page wrapper:         space-y-4
Header row:           flex items-center justify-between mb-6
Titre:                font-serif font-bold text-2xl text-cgws-charcoal
Sous-titre:           font-sans text-sm text-cgws-leather mt-0.5
Bouton nouveau:       px-4 py-2 rounded-sm bg-cgws-copper text-white font-sans text-sm
                      font-semibold inline-flex items-center gap-2
                      hover:bg-cgws-leather transition-colors duration-150
                      focus-visible:ring-2 focus-visible:ring-cgws-copper
                      focus-visible:ring-offset-2 focus-visible:outline-none
Search wrapper:       relative mb-4
Search input:         w-full pl-9 pr-3 py-2 bg-cgws-cream border border-cgws-leather/40
                      rounded-sm font-sans text-sm text-cgws-charcoal
                      placeholder:text-cgws-rope
                      focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                      focus:outline-none
Search icon:          absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cgws-leather/50
                      pointer-events-none
Table container:      hidden sm:block bg-white border border-cgws-leather/30
                      rounded-[4px] overflow-hidden
Table thead:          bg-cgws-parchment/40 border-b border-cgws-leather/20
Table th:             py-3 font-sans text-[10px] uppercase tracking-widest text-cgws-leather
Table tbody rows:     client-row transition-colors duration-100 hover:bg-cgws-parchment/20
Mobile list:          block sm:hidden space-y-2
```

### Animations (GSAP)

Après chaque chargement (watch `isLoading` → false) :
```js
gsap.from('.client-row', {
  opacity: 0,
  y: 12,
  stagger: 0.04,
  duration: 0.28,
  ease: 'power2.out',
  clearProps: 'all',
})
```
Même pattern que `ventes/index.vue`. Contexte GSAP initialisé/révoqué proprement dans `watch(isLoading)` + `onUnmounted`.

### Accessibilité

- `<table aria-label="Liste des clients">`
- `<caption class="sr-only">N clients, triés par date de dernier achat décroissante</caption>`
- Search : `<input role="searchbox" aria-label="Rechercher un client par nom ou email">`
- Bouton Nouveau : `aria-label="Créer un nouveau client"`
- Focus : `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none`

---

## 2. Composant `ClientCard.vue` — Carte mobile liste

### Layout (ASCII wireframe)

```
┌───────────────────────────────────────────────────────┐
│  Marie Dupont                       12 achats         │
│  marie@email.fr                                       │
│  06 12 34 56 78          Dernier : 15/06/26           │
│                                              Voir →   │
└───────────────────────────────────────────────────────┘
```

### Props

```typescript
interface Props {
  client: Client                 // type de app/types/index.ts
  purchaseCount: number
  lastPurchaseDate: string | null
}
```

### Tailwind classes

```
Card wrapper:       client-row bg-white border border-cgws-leather/30 rounded-[4px]
                    p-4 space-y-0.5
                    (NuxtLink to="/admin/clients/[id]" class="block ...")
Nom:                font-serif font-semibold text-base text-cgws-charcoal
Email:              font-sans text-xs text-cgws-leather
Téléphone:          font-sans text-xs text-cgws-leather (hidden si absent)
Ligne stats:        flex items-center justify-between mt-1
Compteur achats:    font-display text-lg text-cgws-copper leading-none
                    + label "achats" font-sans text-[10px] text-cgws-leather
Dernier achat:      font-sans text-xs italic text-cgws-leather/70
Lien Voir:          font-sans text-xs font-semibold text-cgws-copper
                    inline-flex items-center gap-1
                    hover:text-cgws-leather transition-colors
```

### States

- **Skeleton**: div `animate-pulse` avec `h-4 w-32 bg-cgws-leather/10 rounded mb-2`, `h-3 w-48 bg-cgws-leather/10 rounded`, `h-3 w-20 bg-cgws-leather/10 rounded mt-2`

---

## 3. Page `/admin/clients/[id]` — Fiche client

### Layout (ASCII wireframe)

**Mobile 375px (empilé)**
```
┌───────────────────────────────────────────┐
│  ← Retour aux clients                     │
├───────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐  │
│  │ [M]  Marie Dupont                   │  │
│  │      marie@email.fr                 │  │
│  │      06 12 34 56 78                 │  │
│  │      12 rue des Selles, Tours       │  │
│  │      Client depuis janv. 2025       │  │
│  └─────────────────────────────────────┘  │
├───────────────────────────────────────────┤
│  Notes client                             │
│  ┌─────────────────────────────────────┐  │
│  │ Client fidèle, préfère les          │  │
│  │ selles américaines westernware…     │  │
│  └─────────────────────────────────────┘  │
│  [Sauvegarder]              [Annuler]     │
├───────────────────────────────────────────┤
│  Achats passés (12)                       │
│  Date     Produit             Prix  Pmt   │
│  15/06/26  Selle western…    850€  CB     │
│  02/04/26  Briderie cuir     120€  Esp.   │
├───────────────────────────────────────────┤
│  Consignations déposées (2)               │
│  [En vente] Selle western Reinsman        │
│  Demandé 600€ — Accordé 550€             │
│  [Vendue]   Bride cuir artisanale         │
│  Demandé 200€ — Accordé 180€             │
└───────────────────────────────────────────┘
```

**Desktop 1440px (grille 2 colonnes)**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Retour aux clients                                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [M]  Marie Dupont          ● 12 achats   ● 2 consignations  │   │
│  │      marie@email.fr · 06 12 34 56 78                        │   │
│  │      12 rue des Selles, 37130 Tours                         │   │
│  │      Client depuis janvier 2025                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────┬──────────────────────────┤
│  ACHATS PASSÉS (12)                      │  NOTES CLIENT            │
│  ─────────────────────────────────────── │  ──────────────────────  │
│  Date      Produit            Prix  Pmt  │  ┌────────────────────┐  │
│  15/06/26  Selle western…    850€   CB   │  │ Client fidèle,     │  │
│  02/04/26  Briderie cuir     120€   Esp. │  │ selles américaines │  │
│  10/01/26  Bottes Sendra     280€   CB   │  │ westernware…       │  │
│  [Voir toutes les ventes]                │  └────────────────────┘  │
│                                          │  [Sauvegarder] [Annuler] │
│  CONSIGNATIONS DÉPOSÉES (2)              │                          │
│  ─────────────────────────────────────── │                          │
│  [En vente] Selle western Reinsman       │                          │
│  Demandé 600€ — Accordé 550€            │                          │
│  [Vendue]   Bride cuir artisanale        │                          │
│  Demandé 200€ — Accordé 180€            │                          │
└──────────────────────────────────────────┴──────────────────────────┘
```

### Breakpoints

- **Mobile 375px**: tout empilé (header → notes → achats → consignations) dans `space-y-4`
- **Tablet 768px**: header s'affiche en deux colonnes internes (avatar+infos gauche, stats droite)
- **Desktop 1440px**: grille `lg:grid lg:grid-cols-3 lg:gap-6` — colonne principale `lg:col-span-2`, sidebar notes `lg:col-span-1`

### Section Avatar (header carte)

- Cercle `w-12 h-12 rounded-full bg-cgws-copper/15 flex items-center justify-center flex-shrink-0`
- Initiale : `font-display text-2xl text-cgws-copper` (première lettre du `name`)
- Nom : `font-serif font-bold text-xl text-cgws-charcoal`
- Email, tel, adresse : `font-sans text-sm text-cgws-leather` avec icônes `i-lucide-mail`, `i-lucide-phone`, `i-lucide-map-pin` (`w-3.5 h-3.5 text-cgws-leather/50 flex-shrink-0`)
- "Client depuis" : `font-sans text-xs italic text-cgws-leather/70 mt-1`
- Stats pills (lg+) : badges `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cgws-copper/10 font-sans text-xs font-medium text-cgws-copper`

### Section Achats passés

Table simplifiée, `overflow-x-auto` sur mobile :
```
bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden
```
Colonnes : Date (DD/MM/YY) | Produit (tronqué `max-w-[180px] truncate`) | Prix (`font-display text-cgws-copper`) | Paiement (`hidden md:table-cell`)

Affichage limité aux 10 derniers achats + lien `"Voir toutes les ventes"` → filtre `ventes/index.vue?client=[id]` (navigation future, lien simple pour l'instant).

Si `purchaseCount === 0` : message vide `"Aucun achat enregistré pour ce client."` avec icône `i-lucide-shopping-bag text-cgws-leather/30`.

### Section Consignations déposées

Liste verticale `space-y-2` :
```
item: bg-white border border-cgws-leather/30 rounded-[4px] p-3
      flex items-start justify-between gap-3
```
- Badge statut : même mapping couleurs que `consignations/index.vue`
  - `pending` → `bg-cgws-parchment text-cgws-leather`
  - `accepted` → `bg-cgws-denim/15 text-cgws-denim`
  - `sold` → `bg-cgws-copper/15 text-cgws-copper`
  - `rejected` → `bg-cgws-rust/15 text-cgws-rust`
  - `returned` → `bg-cgws-leather/15 text-cgws-leather`
- Description : `font-sans text-sm font-medium text-cgws-charcoal`
- Marque + prix : `font-sans text-xs text-cgws-leather`
- Lien `i-lucide-arrow-right` vers `/admin/consignations/[id]`

### Section Notes éditables

Inline edit (pas de modal) :

**État lecture** : texte dans un div `min-h-[80px] font-sans text-sm text-cgws-charcoal italic` avec un lien `[Modifier]` en haut à droite (`text-xs text-cgws-copper hover:underline`). Si vide : `"Aucune note pour ce client."` en gris.

**État édition** (basculement via `isEditingNotes = true`) :
```
<textarea>: w-full min-h-[120px] px-3 py-2 bg-cgws-cream border border-cgws-leather/40
            rounded-sm font-sans text-sm text-cgws-charcoal resize-y
            focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 focus:outline-none
```
Footer textarea :
```
flex items-center justify-end gap-2 mt-2
```
- Annuler : `px-3 py-1.5 rounded-sm border border-cgws-leather/40 font-sans text-sm text-cgws-leather hover:bg-cgws-parchment/40`
- Sauvegarder : `px-3 py-1.5 rounded-sm bg-cgws-copper text-white font-sans text-sm font-semibold hover:bg-cgws-leather` + spinner `animate-spin` pendant `PUT /api/admin/clients/[id]`

Toast de confirmation : même pattern que `ventes/index.vue` (`fixed top-4 right-4 z-[60]` avec `border-l-4 border-cgws-copper`).

### States page

- **Loading**: skeleton header (div `h-12 w-48 bg-cgws-leather/10 rounded animate-pulse`) + skeleton table 5 rows
- **Erreur 404**: message `"Client introuvable"` + bouton retour liste
- **Erreur réseau**: icône `i-lucide-alert-triangle text-cgws-rust` + `"Erreur de chargement"` + bouton `"Réessayer"`

### Tailwind classes clés

```
Back link:            inline-flex items-center gap-1.5 font-sans text-sm text-cgws-leather
                      hover:text-cgws-copper transition-colors mb-4
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper
Header card:          bg-white border border-cgws-leather/30 rounded-[4px] p-5 mb-4
                      flex flex-col sm:flex-row gap-4 items-start
Main grid:            lg:grid lg:grid-cols-3 lg:gap-6
Main col:             lg:col-span-2 space-y-4
Sidebar:              lg:col-span-1
Section card:         bg-white border border-cgws-leather/30 rounded-[4px] overflow-hidden
Section header:       px-4 py-3 border-b border-cgws-leather/20 bg-cgws-parchment/30
                      font-sans text-[10px] uppercase tracking-widest text-cgws-leather
                      flex items-center justify-between
```

### Animations (GSAP)

- Entrée des achats après chargement : `gsap.from('.sale-history-row', { opacity: 0, y: 8, stagger: 0.035, duration: 0.25, ease: 'power2.out' })`
- Transition textarea notes : CSS transition `max-height 0.2s ease, opacity 0.15s ease` (pas GSAP, simple Vue `<Transition>`)

### Accessibilité

- Back link : `aria-label="Retour à la liste des clients"`
- Section notes : `aria-label="Notes sur le client"`, textarea `id="client-notes"` avec `<label for="client-notes" class="sr-only">Notes client</label>`
- Bouton Modifier notes : `aria-label="Modifier les notes de ce client"`, `aria-expanded="[isEditingNotes]"`
- Table achats : `<table aria-label="Historique des achats de [client.name]">`
- Focus visible : `focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none` partout

---

## 4. Composant `ClientAutocomplete.vue`

### Layout (ASCII wireframe)

```
┌──────────────────────────────────────────────────────────┐
│  [i-lucide-search] Marie…                          [×]   │  ← input
└──────────────────────────────────────────────────────────┘
   ↓ dropdown (position: absolute, z-50, top-full, mt-1)
┌──────────────────────────────────────────────────────────┐
│  [M]  Marie Dupont                                       │  ← option hover
│       marie@email.fr                                     │
│  ─────────────────────────────────────────────────────── │
│  [M]  Marie-Claude Bernard                               │
│       mc.bernard@mail.fr                                 │
│  ─────────────────────────────────────────────────────── │
│  [+]  Créer : "Marie"                                    │  ← create option
└──────────────────────────────────────────────────────────┘
```

**Skeleton pendant chargement** :
```
┌──────────────────────────────────────────────────────────┐
│  [●  ███████████████████  ████████████████]              │
│  [●  ████████████████     ███████████]                   │
└──────────────────────────────────────────────────────────┘
```

**Aucun résultat (3+ chars, sans résultat)** :
```
┌──────────────────────────────────────────────────────────┐
│  [+]  Créer : "Bertrand"                                 │
└──────────────────────────────────────────────────────────┘
```

### Props & Emits

```typescript
// Props
interface Props {
  modelValue: { clientId: string | null; clientName: string } | null
  disabled?: boolean
  placeholder?: string   // défaut: "Rechercher ou créer un client…"
  inputId?: string       // pour lier le label extérieur
  hasError?: boolean     // ajoute border-cgws-rust sur l'input
}

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: { clientId: string | null; clientName: string } | null]
}>()
```

Quand un client existant est sélectionné : émet `{ clientId: client.id, clientName: client.name }`.
Quand "Créer : [nom]" est sélectionné : émet `{ clientId: null, clientName: inputText }`.
Quand le champ est vidé (bouton `×` ou texte effacé) : émet `null`.

### Comportement

1. Moins de 3 caractères : aucune requête, dropdown fermé
2. Dès 3 caractères : debounce 300ms → `GET /api/admin/clients?search=[query]&limit=8`
3. Pendant la requête : dropdown ouvert, affiche 3 skeleton rows
4. Résultats : liste options + option "Créer" en bas (toujours visible si `inputText.length >= 3`)
5. Sélection option → remplit l'input avec `client.name`, ferme dropdown, émet valeur
6. Sélection "Créer" → émet `{ clientId: null, clientName: inputText }`, ferme dropdown
7. Clic hors du composant (`@click.outside` ou `onBlur` avec `setTimeout 150ms`) → ferme dropdown
8. `Escape` → ferme dropdown, remet le focus sur l'input
9. Flèches ↑↓ → navigation dans les options du dropdown
10. `Enter` sur option → sélection

### Tailwind classes

```
Wrapper:        relative w-full
Input wrapper:  relative
Input:          w-full pl-9 pr-8 py-2 bg-cgws-cream border border-cgws-leather/40
                rounded-sm font-sans text-sm text-cgws-charcoal
                placeholder:text-cgws-rope
                focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                focus:outline-none disabled:opacity-50
                (+ border-cgws-rust si hasError)
Search icon:    absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                text-cgws-leather/50 pointer-events-none
Clear button:   absolute right-2 top-1/2 -translate-y-1/2
                p-0.5 rounded-sm text-cgws-leather/50 hover:text-cgws-charcoal
                transition-colors focus-visible:outline-none
                focus-visible:ring-1 focus-visible:ring-cgws-copper
Spinner:        absolute right-2 top-1/2 -translate-y-1/2
                w-4 h-4 rounded-full border-2 border-cgws-leather/30
                border-t-cgws-copper animate-spin

Dropdown:       absolute top-full left-0 right-0 z-50 mt-1
                bg-white border border-cgws-leather/30 rounded-[4px]
                shadow-lg max-h-56 overflow-y-auto
Option row:     flex items-center gap-3 px-3 py-2.5
                cursor-pointer transition-colors duration-100
                hover:bg-cgws-parchment/50
                (+ bg-cgws-parchment/50 si option[focused])
Option avatar:  w-7 h-7 rounded-full bg-cgws-copper/15 flex-shrink-0
                flex items-center justify-center
                font-display text-sm text-cgws-copper
Option name:    font-sans text-sm font-medium text-cgws-charcoal
Option email:   font-sans text-xs text-cgws-leather/70 leading-tight
Option divider: border-t border-cgws-leather/10 (entre les options)
Create row:     flex items-center gap-3 px-3 py-2.5
                cursor-pointer bg-cgws-copper/5
                hover:bg-cgws-copper/10 transition-colors
                font-sans text-sm font-medium text-cgws-copper
                (icône i-lucide-plus w-4 h-4)
Skeleton row:   flex items-center gap-3 px-3 py-2.5
                [div w-7 h-7 rounded-full bg-cgws-leather/10 animate-pulse]
                [div flex-1: h-3 w-32 + h-2 w-48 bg-cgws-leather/10 animate-pulse]
```

### Animation dropdown

Slide + fade via `<Transition>` CSS :
```css
/* dans le composant <style scoped> */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
```

### Accessibilité (combobox pattern ARIA)

```html
<div role="combobox"
     aria-haspopup="listbox"
     aria-expanded="[isOpen]"
     aria-owns="client-autocomplete-listbox">

  <input type="text"
         :id="inputId"
         role="combobox"
         aria-autocomplete="list"
         aria-controls="client-autocomplete-listbox"
         :aria-activedescendant="focusedOption ? `client-option-${focusedIndex}` : undefined"
         autocomplete="off" />

  <ul id="client-autocomplete-listbox"
      role="listbox"
      aria-label="Suggestions de clients">

    <li v-for="(client, i) in results"
        :id="`client-option-${i}`"
        role="option"
        :aria-selected="focusedIndex === i">...</li>

    <li id="client-option-create"
        role="option"
        :aria-selected="focusedIndex === results.length">
      Créer : "{{ inputText }}"
    </li>
  </ul>
</div>
```

---

## 5. Intégration `ClientAutocomplete` dans `SaleForm.vue`

### Remplacement du champ client existant

**Avant (ligne 586–596 de SaleForm.vue)** :
```html
<input
  id="sale-client"
  v-model="form.clientName"
  type="text"
  placeholder="Nom du client…"
  ...
>
```

**Après** :
```html
<ClientAutocomplete
  input-id="sale-client"
  v-model="clientSelection"
  :disabled="isSubmitting"
  placeholder="Rechercher ou créer un client…"
/>
```

### Changements dans le `<script setup>` de SaleForm

Ajouter après les déclarations de `form` :
```typescript
// Remplace form.clientName (texte libre)
const clientSelection = ref<{ clientId: string | null; clientName: string } | null>(null)
```

Modifier `resetForm()` :
```typescript
// Remplacer : form.clientName = ''
clientSelection.value = null
```

Modifier `submitSale()` — construction du payload :
```typescript
const payload: QuickSalePayload = {
  productId: selectedProductId.value,
  salePrice: form.salePrice,
  saleDate: form.saleDate,
  paymentMethod: form.paymentMethod,
  // Champ client enrichi
  clientId: clientSelection.value?.clientId ?? undefined,
  clientName: clientSelection.value?.clientName.trim() || undefined,
  notes: form.notes.trim() || undefined,
}
```

### Mise à jour du type `QuickSalePayload`

Dans `app/types/index.ts`, étendre l'interface :
```typescript
export interface QuickSalePayload {
  productId: string
  salePrice: number
  saleDate: string
  paymentMethod: PaymentMethod
  clientId?: string | null   // ← nouveau : uuid du client existant
  clientName?: string        // ← conservé : nom brut pour création à la volée
  notes?: string
}
```

La route `POST /api/admin/sales` devra :
1. Si `clientId` fourni → lier à la vente existante (colonne `client_id`)
2. Si `clientName` seul → créer un enregistrement `clients` à la volée et lier son `id`
3. Si ni l'un ni l'autre → `client_id = null`

---

## 6. API endpoints concernés

### `GET /api/admin/clients`

Query params : `page` (défaut 1), `limit` (défaut 20), `search` (fulltext nom+email)

Réponse :
```typescript
{
  clients: Array<Client & { purchaseCount: number; lastPurchaseDate: string | null }>,
  total: number
}
```

### `GET /api/admin/clients/[id]`

Réponse :
```typescript
{
  client: Client,
  purchases: Array<{
    id: string
    productTitle: string
    productBrand: string
    salePrice: number
    paymentMethod: PaymentMethod
    saleDate: string
  }>,
  consignments: Array<Consignment>
}
```

### `PUT /api/admin/clients/[id]`

Body : `{ notes: string }` (seul champ éditable depuis la fiche)

Réponse : `{ client: Client }`

---

## 7. Récapitulatif accessibilité globale

| Composant | Rôle ARIA | aria-label / aria-describedby |
|-----------|-----------|-------------------------------|
| Search liste | `role="searchbox"` | `"Rechercher un client par nom ou email"` |
| Table liste | `<table>` | `aria-label="Liste des clients"` |
| ClientCard lien | `<a>` | `aria-label="Voir la fiche de [client.name]"` |
| ClientAutocomplete | `role="combobox"` | `aria-haspopup="listbox"` + `aria-expanded` |
| Dropdown options | `role="listbox"` / `role="option"` | `aria-selected` sur option active |
| Notes textarea | `<textarea>` | Labelisée via `<label for="client-notes">` |
| Bouton Modifier notes | `<button>` | `aria-label="Modifier les notes"` + `aria-expanded` |
| Focus trap | N/A (pas de modale) | Navigation in-page, pas de focus trap nécessaire |

**Contraste** :
- `text-cgws-charcoal (#1A0B03)` sur `bg-white` → 18.7:1 (AAA)
- `text-cgws-copper (#B8650A)` sur `bg-white` → 4.6:1 (AA)
- `text-cgws-leather (#7B3B1C)` sur `bg-cgws-parchment (#F0DDB8)` → 5.1:1 (AA)
- `text-white` sur `bg-cgws-copper (#B8650A)` → 3.9:1 — **Attention** : utiliser uniquement pour le texte bouton en gras (`font-semibold`), jamais pour du texte courant
