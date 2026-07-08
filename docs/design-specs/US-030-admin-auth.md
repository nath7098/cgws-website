# AdminAuth — Spec UX (US-030)

**Purpose**: Sécuriser l'accès au backoffice CGWS via Supabase Auth. Seule Camille (P1) peut accéder à `/admin/*`. Cette US couvre la page de connexion, le layout admin complet (sidebar + topbar), le middleware de protection des routes et le composable d'authentification.

**Fichiers concernés** :
- `app/pages/admin/login.vue`
- `app/layouts/admin.vue`
- `app/middleware/admin.ts`
- `app/composables/useAdminAuth.ts`

---

## 1. Page `/admin/login`

### Purpose

Unique point d'entrée vers le backoffice. Design sobre et professionnel, ancré dans les tokens CGWS — pas de fioritures western, mais une identité immédiatement reconnaissable. Aucun lien public vers cette page (accessible uniquement en naviguant directement vers l'URL).

### Location

`app/pages/admin/login.vue` — utilise `definePageMeta({ layout: false })` car la page est auto-contenue (pas de layout admin ni public).

### Layout (ASCII wireframe — 375px et 1440px identiques, carte centrée)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              [fond cgws-tack plein écran]            │
│                                                      │
│         ┌────────────────────────────────┐           │
│         │  [logo CGWS — wordmark cuivre] │           │
│         │                                │           │
│         │  ─── ◉ ───────────────────── ─ │  ← concho divider (petit)
│         │                                │           │
│         │  Administration                │  ← Rye 400, cgws-rope, 11px uppercase
│         │  Connexion                     │  ← Playfair Display 700, cgws-charcoal
│         │                                │           │
│         │  ┌──────────────────────────┐  │           │
│         │  │  Adresse e-mail          │  │  ← CgwsInput (label + champ)
│         │  │  [                     ] │  │           │
│         │  └──────────────────────────┘  │           │
│         │                                │           │
│         │  ┌──────────────────────────┐  │           │
│         │  │  Mot de passe            │  │  ← CgwsInput type="password"
│         │  │  [                ● ● ●] │  │           │
│         │  └──────────────────────────┘  │           │
│         │                                │           │
│         │  [!] Identifiants incorrects   │  ← bandeau erreur (cgws-rust, masqué par défaut)
│         │                                │           │
│         │  ┌──────────────────────────┐  │           │
│         │  │   SE CONNECTER           │  │  ← CgwsButton primary, full width
│         │  └──────────────────────────┘  │           │
│         │                                │           │
│         │        cgws.fr — Sellerie      │  ← Inter 400, cgws-rope, 11px, centré
│         └────────────────────────────────┘           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Breakpoints

- **Mobile 375px** : carte pleine largeur avec `mx-4`, padding interne `p-6`, carte `max-w-[343px]`
- **Tablet 768px** : carte `max-w-sm` (384px), centrage identique, padding `p-8`
- **Desktop 1440px** : carte `max-w-sm`, centrage identique — le fond tack couvre tout l'écran

### Carte de connexion — détails visuels

La carte n'est pas un `TagCard` (réservé aux produits). C'est une carte admin simple :
- Fond : `bg-cgws-parchment`
- Bordure : `border-2 border-cgws-leather rounded-sm`
- Ombre portée : `shadow-2xl` (profondeur sur fond sombre)
- Padding : `p-6 md:p-8`

### Zone logo

```
┌──────────────────────────────────────────────┐
│                                              │
│   C G W S                                   │  ← Bebas Neue 400, 28px, cgws-copper
│   Camille Guignon Western Shop              │  ← Inter 400, 11px, cgws-leather, uppercase tracking-widest
│                                              │
└──────────────────────────────────────────────┘
```

Pas d'image logo externe dans cette US — wordmark typographique uniquement, afin d'éviter une dépendance asset. Le développeur pourra remplacer par `<NuxtImg>` quand le logo SVG sera disponible.

### Séparateur entre logo et formulaire

Mini `ConchoDivider` (composant existant) avec `class="my-5"` et scale réduit (`transform scale-75 opacity-70`). Alternative acceptable si ConchoDivider ne supporte pas le scaling : simple ligne `border-t border-cgws-leather/40 my-5`.

### États du formulaire

#### Default

- Les deux champs `CgwsInput` en état neutre : `border-cgws-leather`, fond `bg-cgws-cream`
- Bouton `CgwsButton` variant `primary` : fond `bg-cgws-copper`, texte `cgws-charcoal`, label "SE CONNECTER"
- Bandeau d'erreur masqué (`hidden`)

#### Loading (pendant l'appel Supabase Auth)

- `CgwsButton` avec prop `:loading="true"` — le spinner intégré du composant s'affiche
- Les deux champs `CgwsInput` avec prop `:disabled="true"` — `opacity-50`, `cursor-not-allowed`
- Bouton label reste "SE CONNECTER" (le spinner le complète visuellement)
- Aucun overlay plein écran — la désactivation des champs suffit

#### Erreur (identifiants incorrects ou erreur réseau)

- Bandeau erreur visible juste au-dessus du bouton :
  - Fond `bg-cgws-rust/10`, bordure gauche `border-l-4 border-cgws-rust`, padding `p-3`
  - Icône `i-lucide-alert-circle` (`text-cgws-rust`, taille 16px) + texte à droite
  - Texte : Inter 500, 13px, `text-cgws-rust`
  - Message erreur identifiants : "Adresse e-mail ou mot de passe incorrect."
  - Message erreur réseau : "Une erreur est survenue. Veuillez réessayer."
  - `role="alert"` sur l'élément pour annonce immédiate aux lecteurs d'écran
  - `aria-live="assertive"` pour s'assurer de la lecture sans délai
- Focus management : au moment où l'erreur apparaît, le focus est replacé sur le champ email (`emailRef.value?.focus()`) pour permettre la correction immédiate au clavier
- Les champs `CgwsInput` ne passent pas individuellement en état `error` (on ne sait pas lequel est erroné) — seul le bandeau global s'affiche

#### Succès (authentification réussie)

- Pas d'état visuel distinct — la redirection vers `/admin/dashboard` est immédiate (< 200 ms)
- L'UX de redirection est gérée par le composable `useAdminAuth.ts`

### Tailwind classes (page login.vue — éléments clés)

```
// Fond écran
min-h-screen bg-cgws-tack flex items-center justify-center p-4

// Carte
bg-cgws-parchment border-2 border-cgws-leather rounded-sm shadow-2xl
w-full max-w-[343px] sm:max-w-sm p-6 sm:p-8

// Wordmark CGWS
font-display text-3xl text-cgws-copper tracking-wider

// Sous-titre wordmark
font-sans text-[11px] text-cgws-leather uppercase tracking-widest

// Eyebrow "Administration"
font-eyebrow text-[11px] text-cgws-rope uppercase tracking-widest mt-5

// Titre "Connexion"
font-serif font-bold text-xl text-cgws-charcoal mt-1 mb-4

// Bandeau erreur
flex items-start gap-2 bg-cgws-rust/10 border-l-4 border-cgws-rust
rounded-sm p-3 mb-4 text-cgws-rust font-sans text-[13px] font-medium

// Pied de page carte
text-center font-sans text-[11px] text-cgws-rope mt-6
```

### Animations

- **Entrée de la carte** : `@vueuse/motion` directive `v-motion` avec preset `fade` + `y: 12` → `y: 0`, durée 400 ms, easing `ease-out`. Lancé à `onMounted`.
- **Shake erreur** : classe CSS `animate-shake` (keyframes custom à définir dans `tokens.css` : `translateX(±6px)` en 300 ms, 3 oscillations) appliquée temporairement sur le bandeau erreur via `setTimeout` de 350 ms pour retirer la classe après animation.
- Pas de GSAP nécessaire sur cette page — les animations sont légères et ne requièrent pas de timeline.

### Accessibilité (page login)

- `<form>` avec `novalidate` (validation gérée côté JS/Supabase)
- `<h1>` : "Connexion" (Playfair Display 700) — un seul H1 sur la page
- `CgwsInput` déjà câblé : `aria-required`, `aria-invalid`, `aria-describedby` natifs
- Bandeau erreur : `role="alert"` + `aria-live="assertive"` + `id="login-error"` référencé dans `aria-describedby` du champ email
- Bouton submit : `type="submit"`, `aria-busy` géré par `CgwsButton` via prop `loading`
- Contraste : `cgws-charcoal` sur `cgws-parchment` → ~14.8:1 (AAA). `cgws-copper` sur `cgws-tack` → ~5.2:1 (AA Large). `cgws-rust` sur `cgws-parchment` → ~6.1:1 (AA)
- Navigation clavier : Tab → Email → Mot de passe → Bouton (ordre naturel du DOM)
- Pas de `autocomplete="off"` — laisser le gestionnaire de mots de passe du navigateur remplir les champs (`autocomplete="email"` et `autocomplete="current-password"`)

---

## 2. Layout `admin.vue`

### Purpose

Enveloppe toutes les pages `/admin/*` (sauf `/admin/login`). Remplace le layout `default.vue` (pas d'AppHeader ni AppFooter public). Fournit une sidebar de navigation fixe et une topbar contextuelle. Esthétique fonctionnelle et sobrement westernisée.

### Location

`app/layouts/admin.vue`

### Layout Desktop 1280px+ (ASCII wireframe)

```
┌──────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (w-64, fixe, h-full, bg-cgws-tack)                          │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │  C G W S   Admin                         ← wordmark (copper)    │ │
│ │  ─── ◉ ──────────────────────────────── ← mini ConchoDivider    │ │
│ │                                                                  │ │
│ │  [◉] Dashboard                           ← nav item             │ │
│ │  [◉] Produits                                                    │ │
│ │  [◉] Consignations                                               │ │
│ │  [◉] Ventes                                                      │ │
│ │  [◉] Clients                                                     │ │
│ │                                                                  │ │
│ │  ── (flex-1 pousse vers le bas) ──────────────────────────────── │ │
│ │                                                                  │ │
│ │  [◉] Déconnexion                         ← action déstructive   │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ MAIN AREA (ml-64, flex flex-col, min-h-screen)                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ TOPBAR (bg-cgws-parchment, border-b border-cgws-leather, h-14)  │ │
│ │  Titre page courant              Camille · [avatar initiales]    │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │                                                                  │ │
│ │  CONTENT AREA (bg-cgws-cream, flex-1, p-6 lg:p-8)              │ │
│ │                                                                  │ │
│ │  <slot />                                                        │ │
│ │                                                                  │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Layout Mobile 375px (ASCII wireframe)

```
┌──────────────────────────────────┐
│ TOPBAR (bg-cgws-tack, h-14)      │
│ [≡]  CGWS Admin     [initiales]  │ ← hamburger + wordmark + avatar
└──────────────────────────────────┘
│                                  │
│  CONTENT AREA (bg-cgws-cream)    │
│  <slot />                        │
│  p-4                             │
│                                  │
└──────────────────────────────────┘

══ DRAWER SIDEBAR (overlay, slide depuis la gauche) ══
┌────────────────────────────────── ░░░░░░░░░░░░░░░ ─┐
│ SIDEBAR (w-72, bg-cgws-tack)      ░ backdrop 50%  ░ │
│  [✕]  C G W S  Admin             ░ overlay        ░ │
│  ─── ◉ ───────                   ░ bg-black/50    ░ │
│  [◉] Dashboard                   ░                ░ │
│  [◉] Produits                    ░                ░ │
│  [◉] Consignations               ░                ░ │
│  [◉] Ventes                      ░                ░ │
│  [◉] Clients                     ░                ░ │
│                                  ░                ░ │
│  [◉] Déconnexion                 ░                ░ │
└──────────────────────────────────░░░░░░░░░░░░░░░░░─┘
```

### Sidebar — détails visuels

**Wordmark en haut** :
- "CGWS" en `font-display text-2xl text-cgws-copper`
- "Admin" en `font-sans text-xs text-cgws-rope uppercase tracking-widest`
- Padding `px-4 pt-5 pb-4`

**Séparateur** : `ConchoDivider` en version miniaturisée (`scale-75 opacity-50`) ou `border-t border-cgws-leather/30 mx-4 my-2`

**Navigation items** (liste `<nav>`):
```
Chaque item = <NuxtLink> :
- Icône  : i-lucide-* (16px, flex-shrink-0)
- Label  : Inter 500, 14px
- Padding: px-4 py-2.5
- Coins  : rounded-sm
- Hover  : bg-cgws-leather/20, text-cgws-rope
- Active : bg-cgws-copper/15 + border-l-2 border-cgws-copper + text-cgws-copper
- Défaut : text-cgws-rope/70
```

| Page | Label | Icône Lucide |
|------|-------|--------------|
| /admin/dashboard | Dashboard | `i-lucide-layout-dashboard` |
| /admin/produits | Produits | `i-lucide-package` |
| /admin/consignations | Consignations | `i-lucide-arrow-left-right` |
| /admin/ventes | Ventes | `i-lucide-receipt` |
| /admin/clients | Clients | `i-lucide-users` |

**Déconnexion** (en bas, poussé par `flex-1` dans le gap) :
- Bouton `<button>` (pas NuxtLink)
- Même structure visuelle qu'un nav item
- Icône : `i-lucide-log-out`
- Couleur repos : `text-cgws-rope/50`
- Hover : `text-cgws-rust bg-cgws-rust/10`
- Confirmation : pas de modale — une simple action directe suffit (session unique, cas d'usage mobile-stable)

### Topbar — détails visuels

- Hauteur fixe `h-14`
- Fond `bg-cgws-parchment`, bordure basse `border-b border-cgws-leather/40`
- Padding `px-4 md:px-6`
- Flex row, items-center, justify-between

**Gauche** :
- Mobile uniquement : bouton hamburger `i-lucide-menu` (`text-cgws-tack`, 22px, `aria-label="Ouvrir le menu"`)
- Desktop : caché (`hidden lg:hidden` → hamburger absent sur desktop)
- Titre de page : texte injecté via `provide/inject` ou `useRoute().meta.title` — `font-serif font-semibold text-base text-cgws-charcoal`

**Droite** :
- Avatar initiales : cercle `w-8 h-8 rounded-full bg-cgws-copper flex items-center justify-center`
- Initiales en `font-display text-sm text-cgws-charcoal` (ex: "CG" pour Camille Guignon)
- Email de l'utilisateur en `font-sans text-xs text-cgws-leather hidden sm:block mr-3` (masqué sur mobile)

### Drawer mobile — comportement

- État contrôlé par `ref<boolean> isSidebarOpen`
- Overlay backdrop : `fixed inset-0 bg-cgws-charcoal/50 z-30 lg:hidden` — `transition-opacity duration-200`
- Drawer : `fixed left-0 top-0 h-full w-72 bg-cgws-tack z-40 transform transition-transform duration-300` — `translate-x-0` (ouvert) / `-translate-x-full` (fermé)
- Fermeture : clic sur backdrop, clic sur `[✕]` en haut du drawer, navigation vers une page (watch sur route)
- Fermeture par `Escape` : event listener sur `keydown`
- `aria-expanded` sur le bouton hamburger, `aria-controls="admin-sidebar"`, `id="admin-sidebar"` sur le drawer
- Focus trap dans le drawer quand ouvert (librairie `@vueuse/core` → `useFocusTrap`)

### Tailwind classes (layout admin.vue — éléments clés)

```
// Wrapper racine
flex min-h-screen bg-cgws-cream

// Sidebar desktop
hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0
bg-cgws-tack

// Main area (desktop offset)
flex-1 lg:pl-64 flex flex-col

// Topbar
h-14 bg-cgws-parchment border-b border-cgws-leather/40
flex items-center justify-between px-4 md:px-6 sticky top-0 z-20

// Content area
flex-1 p-4 md:p-6 lg:p-8 overflow-auto

// Nav item — base
flex items-center gap-3 px-4 py-2.5 rounded-sm w-full
font-sans text-sm font-medium text-cgws-rope/70
transition-colors duration-150

// Nav item — hover
hover:bg-cgws-leather/20 hover:text-cgws-rope

// Nav item — active (NuxtLink exactActiveClass)
bg-cgws-copper/15 text-cgws-copper border-l-2 border-cgws-copper

// Bouton déconnexion — hover
hover:bg-cgws-rust/10 hover:text-cgws-rust
```

### Animations layout

- **Drawer mobile** : `transition-transform duration-300 ease-in-out` CSS natif — pas de GSAP (performance mobile)
- **Backdrop** : `transition-opacity duration-200 ease-in-out`
- **Content area** : pas d'animation sur le `<slot />` — les pages filles gèrent leur propre entrée

### Accessibilité (layout admin)

- `<nav aria-label="Navigation administration">` pour la sidebar
- `role="banner"` sur la topbar (`<header>`)
- `role="main"` sur la zone `<slot />`
- Nav item actif : `aria-current="page"` (géré automatiquement par NuxtLink ou conditionnellement)
- Drawer : `role="dialog"`, `aria-modal="true"`, `aria-label="Menu de navigation"` quand ouvert
- Contraste sidebar : `cgws-rope` (#C8AB82) sur `cgws-tack` (#3D1A06) → ~6.8:1 (AA). Active `cgws-copper` (#B8650A) sur `cgws-tack` → ~5.2:1 (AA Large, taille 14px/medium acceptable)
- Skip link : `<a href="#admin-content" class="sr-only focus:not-sr-only ...">Aller au contenu</a>` en premier élément du layout

---

## 3. Composable `useAdminAuth.ts`

### Purpose

Encapsule toute la logique Supabase Auth. Exposé en tant que composable singleton (utilise `useState` Nuxt pour partager l'état entre layout et pages).

### Interface exposée

```ts
// Retour du composable (pas de type custom CGWS — Supabase User natif)
{
  user: Ref<User | null>               // Supabase User object
  userInitials: ComputedRef<string>    // ex: "CG" depuis user.email
  isAuthenticated: ComputedRef<boolean>
  authError: Ref<string | null>        // message d'erreur localisé
  isLoading: Ref<boolean>
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  initSession(): Promise<void>         // appelé dans le layout/middleware
}
```

Note : `User` est le type Supabase natif (`import type { User } from '@supabase/supabase-js'`), pas un type défini dans `app/types/index.ts`. Le développeur doit importer depuis le package Supabase.

### Messages d'erreur localisés

| Code Supabase | Message affiché |
|---------------|-----------------|
| `invalid_credentials` | "Adresse e-mail ou mot de passe incorrect." |
| `email_not_confirmed` | "Veuillez confirmer votre adresse e-mail." |
| `too_many_requests` | "Trop de tentatives. Réessayez dans quelques minutes." |
| Toute autre erreur | "Une erreur est survenue. Veuillez réessayer." |

---

## 4. Middleware `admin.ts`

### Purpose

Intercepte chaque navigation vers `/admin/*` (sauf `/admin/login`). Vérifie l'existence d'une session Supabase active. Redirige vers `/admin/login` si absente.

### Logique

```
Route cible commence par /admin
  ET n'est pas /admin/login
    → getUser() via Supabase server-side (useSupabaseUser() Nuxt)
    → user null → navigateTo('/admin/login')
    → user présent → navigation autorisée
```

Le middleware est de type `global: false` — appliqué explicitement via `definePageMeta({ middleware: 'admin' })` dans chaque page admin, OU en le plaçant dans `middleware/admin.ts` avec la convention de nommage Nuxt (application automatique via `definePageMeta`).

---

## 5. Récapitulatif tokens utilisés dans cette US

| Token | Valeur | Usage |
|-------|--------|-------|
| `cgws-tack` | #3D1A06 | Fond page login, sidebar, topbar mobile |
| `cgws-leather` | #7B3B1C | Bordures carte, bordures topbar, nav hover bg |
| `cgws-copper` | #B8650A | Wordmark CGWS, CTA bouton, nav item actif, avatar |
| `cgws-rope` | #C8AB82 | Texte sidebar, sous-labels |
| `cgws-parchment` | #F0DDB8 | Fond carte login, fond topbar desktop |
| `cgws-cream` | #FAF3E3 | Fond champs input, fond content area |
| `cgws-charcoal` | #1A0B03 | Textes forts (H1, topbar title, bouton label) |
| `cgws-rust` | #943218 | Bandeau erreur, déconnexion hover, `aria-invalid` |

`cgws-denim` : non utilisé dans cette US (réservé aux CTA secondaires du site public).
