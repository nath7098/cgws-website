# CGWS — Camille Guignon Western Shop
## Configuration Claude Code · `cgws-website/CLAUDE.md`

> Ce fichier doit être placé à la racine du projet : `cgws-website/CLAUDE.md`

---

## ⚠️ Règle absolue — MCPs obligatoires avant toute implémentation Nuxt

**AVANT** d'utiliser n'importe quel composant Nuxt UI, composable Nuxt, ou pattern SSR, les agents (`nuxt-developer`, `qa-engineer`, etc.) **DOIVENT** consulter :

- `mcp__nuxt-ui-remote__*` — pour tout composant @nuxt/ui (UButton, UModal, UDrawer, UTable, etc.)
- `mcp__nuxt-remote__*` — pour les APIs Nuxt 4 (useAsyncData, useFetch, useState, definePageMeta, Teleport, layouts, middleware...)

**Pourquoi** : Des erreurs de config, SSR warnings, hydration mismatches et comportements incorrects ont été causés par des APIs mal utilisées sans vérification doc. La doc officielle via MCP est la seule source de vérité.

**Comment appliquer** : Le prompt de chaque subagent doit inclure l'instruction explicite d'utiliser ces MCPs avant tout pattern Nuxt. L'orchestrateur l'inclut systématiquement.

---

## Contexte métier

**CGWS** est une boutique d'équipements équestres western à Brèches (37, Indre-et-Loire).

**Activités** :
- Vente neuf & occasion : selles, brides, bottes, vêtements, accessoires western
- **Service de consignation de selles** (différenciateur clé) : dépôt-vente avec accord sur prix

**Personas** :
- `Visiteur` : passionné d'équitation western, cherche équipement de qualité
- `Acheteur` : visiteur prêt à acheter, compare les produits
- `Déposant` : particulier souhaitant vendre sa selle via consignation
- `Admin` : Camille (propriétaire), gère catalogue et ventes depuis le backoffice

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Nuxt 4 (app/ directory) |
| Langage | TypeScript strict |
| UI | Nuxt UI v3 + TailwindCSS v4 |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| State | Pinia v3 |
| Animations | GSAP 3 + @vueuse/motion |
| Images | Nuxt Image v1 (WebP auto) |
| Tests | Vitest + Playwright |
| SEO | @nuxtjs/seo |
| Email | Resend |
| Déploiement | Vercel (preview/PR → main/prod) |

---

## Structure de dossiers

```
cgws-website/
├── CLAUDE.md
├── .claude/
│   └── agents/               ← Subagents (auto-délégués par la session principale)
│       ├── product-owner.md
│       ├── ux-designer.md
│       ├── nuxt-developer.md
│       └── qa-engineer.md
├── app/
│   ├── assets/
│   │   └── css/
│   │       ├── tokens.css   ← Variables design system CGWS v2
│   │       └── main.css     ← Reset global + utilitaires
│   ├── components/
│   │   ├── ui/              ← Design system CGWS (CgwsButton, TagCard, ConchoStat…)
│   │   ├── layout/          ← CgwsHeader, CgwsFooter, CgwsNavbar
│   │   ├── catalogue/       ← ProductCard, ProductGrid, FilterPanel, ProductGallery
│   │   ├── consignation/    ← ConsignationForm, StepIndicator, UploadZone
│   │   └── admin/           ← AdminSidebar, DataTable, ProductForm, StatCard
│   ├── composables/
│   │   ├── useProducts.ts
│   │   ├── useConsignations.ts
│   │   ├── useSales.ts
│   │   ├── useAuth.ts
│   │   └── useSupabase.ts
│   ├── layouts/
│   │   ├── default.vue      ← Site public
│   │   └── admin.vue        ← Backoffice (auth required)
│   ├── middleware/
│   │   └── auth.ts          ← Protège /admin/*
│   ├── pages/
│   │   ├── index.vue        ← Homepage immersive
│   │   ├── catalogue/
│   │   │   ├── index.vue    ← Liste + filtres
│   │   │   └── [slug].vue   ← Fiche produit
│   │   ├── consignation.vue
│   │   ├── contact.vue
│   │   └── admin/
│   │       ├── index.vue    ← Dashboard
│   │       ├── login.vue
│   │       ├── produits/
│   │       │   ├── index.vue
│   │       │   ├── nouveau.vue
│   │       │   └── [id].vue
│   │       ├── consignations/
│   │       ├── ventes/
│   │       └── clients/
│   ├── stores/
│   │   ├── products.ts
│   │   └── auth.ts
│   └── types/
│       └── index.ts         ← Tous les types TypeScript CGWS
├── server/
│   ├── api/
│   │   ├── products/
│   │   ├── consignations/
│   │   └── contact.post.ts
│   └── utils/supabase.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   └── e2e/critical-paths.spec.ts
├── docs/
│   ├── SPRINT_PLAN.md       ← Plan Scrum détaillé (6 sprints, 123 pts)
│   ├── DEV_GUIDE.md         ← Guide démarrage développeur Nuxt 4
│   ├── PROGRESS.md          ← Journal auto-rempli par l'orchestrateur
│   ├── LAUNCH_PROMPT.md     ← Prompt de lancement / reprise de l'autonomie
│   └── design-specs/        ← Specs écrites par ux-designer, une par US
├── nuxt.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Design System CGWS v2 — "Sellerie de Brèches"

> Direction artistique : western authentique et premium — cuir, cuivre, denim.
> Référence : maroquinerie équestre haut de gamme (Hermès selle, sellerie artisanale), **jamais** décoration cowboy kitsch.

### Couleurs (tokens Tailwind personnalisés)

```ts
// tailwind.config.ts
colors: {
  cgws: {
    tack:      '#3D1A06',  // Cuir brûlé — fonds sombres (header, footer, hero)
    leather:   '#7B3B1C',  // Cuir de selle — bordures, accents secondaires
    copper:    '#B8650A',  // Concho cuivre — accent principal, CTA, prix
    rope:      '#C8AB82',  // Chanvre — tons moyens, texte sur fond sombre
    parchment: '#F0DDB8',  // Papier vieilli — fonds clairs, cartes étiquette
    cream:     '#FAF3E3',  // Papier frais — fond principal du site
    denim:     '#2C4A72',  // Denim délavé — contre-accent, CTA secondaire
    rust:      '#943218',  // Rouille — badges occasion, alertes, refus
    charcoal:  '#1A0B03',  // Quasi-noir brun — texte fort, bordures wanted-poster
  }
}
```

**Migration depuis le v1** (si du code existant utilise les anciens tokens) :

| v1 (ancien) | v2 (nouveau) | Usage |
|-------------|--------------|-------|
| `cgws-brown` `#8B4513` | `cgws-leather` `#7B3B1C` | Bordures, accents secondaires |
| `cgws-amber` `#D4A017` | `cgws-copper` `#B8650A` | Accent principal, CTA, prix |
| `cgws-parchment` `#F5F0E8` | `cgws-parchment` `#F0DDB8` | Fonds clairs (ton plus chaud) |
| `cgws-dark` `#1C1208` | `cgws-tack` `#3D1A06` | Fonds sombres |
| `cgws-rust` `#C4501A` | `cgws-rust` `#943218` | Alertes, occasion (ton plus profond) |
| `cgws-sand` `#E8D5B7` | `cgws-rope` `#C8AB82` | Texte sur fond sombre |
| `cgws-cream` `#FBF8F3` | `cgws-cream` `#FAF3E3` | Fond cards (ton plus chaud) |
| *(nouveau)* | `cgws-denim` `#2C4A72` | Contre-accent CTA secondaire |
| *(nouveau)* | `cgws-charcoal` `#1A0B03` | Texte fort, bordures wanted-poster |

### Typographie

| Usage | Police | Poids |
|-------|--------|-------|
| Titres hero (H1) | Bebas Neue | 400 |
| Eyebrows, labels de section | **Rye** (nouveau — letterpress western) | 400 |
| Titres sections (H2-H3) | Playfair Display | 600-700 |
| Corps de texte | Inter | 400-500 |
| Prix, labels numériques | Bebas Neue | 400 |
| Taglines, citations | Playfair Display Italic | 400i |

**Chargement fonts** (dans `nuxt.config.ts`) :
```ts
googleFonts: {
  families: {
    'Bebas Neue': true,
    'Rye': true,
    'Playfair Display': { wght: [400, 600, 700], ital: [400] },
    'Inter': [400, 500, 700],
  }
}
```

### Tokens CSS (`app/assets/css/tokens.css`)

```css
:root {
  /* Couleurs CGWS v2 */
  --cgws-tack:      #3D1A06;
  --cgws-leather:   #7B3B1C;
  --cgws-copper:    #B8650A;
  --cgws-rope:      #C8AB82;
  --cgws-parchment: #F0DDB8;
  --cgws-cream:     #FAF3E3;
  --cgws-denim:     #2C4A72;
  --cgws-rust:      #943218;
  --cgws-charcoal:  #1A0B03;

  /* Typographie */
  --font-display: 'Bebas Neue', cursive;
  --font-eyebrow: 'Rye', serif;
  --font-serif:   'Playfair Display', Georgia, serif;
  --font-sans:    'Inter', system-ui, sans-serif;

  /* Espacements */
  --section-py:    clamp(3rem, 8vw, 6rem);
  --container-max: 1280px;
  --container-px:  clamp(1rem, 4vw, 2rem);
}
```

### Éléments signature

**Cartes "étiquette de selle" (`TagCard`)** — composant phare du design system. Chaque produit est présenté comme une étiquette cuir pendue à un article de sellerie :
- Fond `cgws-parchment`, bordure `cgws-leather` 2px, coins légèrement arrondis (6px)
- Trou de perforation en haut centré (cercle `cgws-cream` bordé `cgws-leather`)
- Bloc texte entouré d'une bordure pointillée `cgws-copper` (simule une couture)
- Badge statut (Consignation/Neuf/Occasion) en pilule colorée au-dessus du nom
- Prix en `Bebas Neue` couleur `cgws-copper`

**Stats en conchos (`ConchoStat`)** — médaillons circulaires façon ornement de harnachement, remplacent les barres de stats plates : cercle extérieur cuivre, anneau pointillé intérieur, pivot central, 4 pointes cardinales.

**Section consignation "wanted poster"** — fond parchemin, double bordure `cgws-charcoal`, typographie bois (`Rye` + `Bebas Neue`), évoque les affiches de l'Ouest sans tomber dans le kitsch.

**Diviseur concho** — entre les sections : ligne horizontale interrompue par un petit médaillon circulaire centré, en lieu et place d'un simple `<hr>`.

### Ton visuel

Western authentique et premium, jamais kitsch cowboy. Cuir, cuivre, denim — pas de dorure tape-à-l'œil ni de typographie far-west grossière. Les conchos, étiquettes et coutures pointillées sont des clins d'œil fonctionnels au matériel réel de sellerie, pas de la décoration gratuite. Accent denim utilisé avec parcimonie (CTA secondaire uniquement) pour rappeler que le cavalier western porte aussi du jean, pas que du cuir.

---

## Types TypeScript CGWS (`app/types/index.ts`)

```typescript
export type ProductStatus    = 'active' | 'sold' | 'reserved' | 'inactive'
export type ProductCondition = 'new' | 'excellent' | 'good' | 'fair'
export type ProductCategory  =
  | 'selles' | 'brides-licols' | 'bottes-chaussures'
  | 'vetements' | 'accessoires' | 'protections'
export type ConsignmentStatus = 'pending' | 'accepted' | 'rejected' | 'sold' | 'returned'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check'

export interface Product {
  id: string
  slug: string
  title: string
  description: string
  price: number
  category: ProductCategory
  brand: string
  size?: string
  condition: ProductCondition
  isConsignment: boolean
  consignmentId?: string
  status: ProductStatus
  images: string[]
  stock: number
  createdAt: string
  updatedAt: string
}

export interface Consignment {
  id: string
  depositorName: string
  depositorEmail: string
  depositorPhone: string
  itemDescription: string
  brand: string
  condition: ProductCondition
  askingPrice: number
  agreedPrice?: number
  images: string[]
  status: ConsignmentStatus
  notes?: string
  createdAt: string
}

export interface Sale {
  id: string
  productId: string
  clientId?: string
  salePrice: number
  paymentMethod: PaymentMethod
  saleDate: string
  commissionAmount?: number
  notes?: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
}
```

---

## Schéma Supabase

```sql
-- products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  brand text,
  size text,
  condition text NOT NULL,
  is_consignment boolean DEFAULT false,
  consignment_id uuid REFERENCES consignments(id),
  status text DEFAULT 'active',
  images text[] DEFAULT '{}',
  stock int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- consignments
CREATE TABLE consignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depositor_name text NOT NULL,
  depositor_email text NOT NULL,
  depositor_phone text,
  item_description text NOT NULL,
  brand text,
  condition text NOT NULL,
  asking_price numeric(10,2) NOT NULL,
  agreed_price numeric(10,2),
  images text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- sales
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  client_id uuid REFERENCES clients(id),
  sale_price numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  sale_date date NOT NULL,
  commission_amount numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id),
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true
);
```

---

## Conventions de code

### Commits (Conventional Commits)

Format strict : `type(scope): description [US-XXX]`

```
feat(catalogue): add product filter by category [US-012]
fix(hero): resolve LCP issue on mobile [US-010]
chore(setup): init Nuxt 4 project with TypeScript [US-001]
test(e2e): add critical path tests for catalogue [US-053]
style(design-system): add TagCard component [US-003]
```

**Règle absolue : 1 commit par User Story complétée.**

### Git flow

```
main          ← production (Vercel auto-deploy)
  ↑ PR + review
develop       ← intégration
  ↑ merge après /qa validate
feature/US-XXX-description
```

**Règle absolue : squash merge d'une feature → suppression de la branche dans la foulée** (remote *et* local), sans attendre qu'on le demande.

Pourquoi : après un squash, les commits d'origine n'existent plus sur `develop` — seul leur contenu y est. Une branche laissée en place apparaît donc éternellement « en avance » sur `develop` (`git log develop..feature/X` liste des commits déjà intégrés), ce qui rend illisible la question « qu'est-ce qui reste vraiment à merger ? ». Toujours raisonner sur `git diff develop..branche` (le contenu), jamais sur le nombre de commits.

**Règle absolue : tout merge vers `develop` inclut le close des issues embarquées.** Le message du commit de squash (et le corps de la PR) porte `Closes #N` pour chaque issue GitHub couverte par la branche, et chaque issue reçoit un commentaire de fermeture avec le contexte requis (livrables de référence, arbitrages de cadrage actés) pour qu'elle ne soit pas rouverte sur un critère devenu obsolète.

Pourquoi : GitHub ne ferme les issues par mot-clé qu'à l'arrivée du commit sur la branche par défaut (`main`) — sans `Closes #N` dans le squash, les issues restent ouvertes après le merge et le backlog ment. Le commentaire de contexte est ce qui permet, des mois plus tard, de comprendre pourquoi l'issue est fermée alors que son texte d'origine décrit un critère abandonné (ex. #31 : bandeau de consentement abandonné au profit du mode anonyme exempté).

### Standards

- TypeScript strict — aucun `any`, types explicites partout
- ESLint + Prettier — zéro erreur avant commit
- Mobile-first — Tailwind : base → sm: → md: → lg: → xl:
- Accessibilité — WCAG AA minimum (contraste, aria-labels, navigation clavier)
- Images — toujours via `<NuxtImg>` avec `loading="lazy"` et `format="webp"`
- GSAP — uniquement dans `onMounted()`, nettoyer dans `onUnmounted()`

---

## Definition of Done

Une US est **Done** quand toutes les cases sont cochées :

- [ ] Fonctionnel selon critères d'acceptation de la US
- [ ] TypeScript sans erreurs (`vue-tsc --noEmit`)
- [ ] ESLint sans erreurs
- [ ] Aucun `any` TypeScript
- [ ] Responsive : 375px / 768px / 1440px
- [ ] Accessible (aria-labels, contraste ≥ 4.5:1, keyboard nav)
- [ ] Images via NuxtImg (WebP + lazy)
- [ ] Tests unitaires pour la logique métier
- [ ] `/qa validate US-XXX` PASS
- [ ] Commit conventionnel avec ID US

---

## Variables d'environnement (`.env` — ne jamais commiter)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
RESEND_API_KEY=xxx
NUXT_PUBLIC_SITE_URL=https://cgws.fr
NUXT_PUBLIC_GA_ID=xxx
```

---

## Orchestration Autonome (Mode Team d'Agents)

> CGWS est développé par une équipe de 4 subagents Claude Code (`.claude/agents/`), pas par des slash commands manuelles. La session principale (toi, Claude Code) ne code jamais directement — elle orchestre la délégation.

### Les 4 agents

| Agent | Rôle | Outils | MCP |
|-------|------|--------|-----|
| `product-owner` | Écrit/clarifie les US, arbitre les questions de scope ambiguës | Read, Grep, Glob, Edit | aucun |
| `ux-designer` | Produit les specs design avant implémentation (docs/design-specs/) | Read, Grep, Glob, Write | nuxt-remote, nuxt-ui-remote, context7 |
| `nuxt-developer` | Implémente chaque US de bout en bout (composants, composables, API routes) | Read, Write, Edit, Bash, Grep, Glob | nuxt-remote, nuxt-ui-remote, supabase, context7 |
| `qa-engineer` | Valide chaque implémentation contre les critères Gherkin avant commit — lecture seule | Read, Bash, Grep, Glob | supabase, context7 |

Important : **les subagents ne communiquent jamais entre eux directement**. Chacun reporte uniquement à la session principale, qui décide de la suite. C'est elle qui porte la logique de boucle ci-dessous.

### Boucle de développement (sprint par sprint, US par US)

1. Déterminer la prochaine US non terminée en croisant `docs/SPRINT_PLAN.md` avec `git log --oneline` (chaque commit complété porte `[US-XXX]`)
2. Si les critères d'acceptation sont vagues/incomplets → déléguer à `product-owner` avant toute implémentation
3. Si la US touche une UI nouvelle sans spec existante dans `docs/design-specs/` → déléguer à `ux-designer`
4. Déléguer à `nuxt-developer` l'implémentation complète
5. Déléguer à `qa-engineer` la validation
6. Si `FAIL` → déléguer les corrections précises à `nuxt-developer`, revalider avec `qa-engineer` (max 3 boucles, sinon s'arrêter et signaler)
7. Si `PASS` → commiter soi-même (jamais via un agent) avec le format conventionnel `type(scope): description [US-XXX]`
8. Logger l'entrée dans `docs/PROGRESS.md`
9. Passer à la US suivante automatiquement

### Garde-fous permanents

- Toujours travailler sur une branche `feature/sprint-N`, jamais directement sur `main`/`develop`
- Ne jamais `git push` sans demande explicite de Nathan
- Contenu réel impossible à inventer fiablement (textes légaux, vrais prix, vraies photos, coordonnées de Camille) → s'arrêter sur cette US, logger le blocage dans `docs/PROGRESS.md`, continuer sur les US suivantes non dépendantes
- Ne jamais modifier `.env` / `.env.local`
- Fin de sprint → résumé dans `docs/PROGRESS.md` (vélocité réelle vs planifiée) puis pause pour validation humaine, sauf mode autopilote explicitement demandé

### Démarrer ou reprendre

Voir `docs/LAUNCH_PROMPT.md` pour le prompt de lancement complet (mode checkpoint ou autopilote) et le prompt de reprise après interruption.
