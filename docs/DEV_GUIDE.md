# CGWS — Guide de Démarrage Développeur Nuxt 4
## Prompt maître + Setup complet pour Claude Code

---

## TL;DR — Commencer en 3 commandes

```bash
# 1. Cloner / créer le projet
npx nuxi@latest init cgws-website --template ui
cd cgws-website

# 2. Placer CLAUDE.md + .claude/commands/ (voir §Structure Claude)

# 3. Lancer Claude Code et utiliser le prompt de démarrage
claude
```

---

## Prompt Maître de Démarrage (à coller dans Claude Code)

> Utiliser ce prompt en **toute première session** sur le projet CGWS, ou pour reprendre après une pause.

```
Tu es un développeur Nuxt 4 senior travaillant sur CGWS (Camille Guignon Western Shop).

Lis CLAUDE.md à la racine du projet pour obtenir tout le contexte technique, le design system, la stack et les conventions.

Ton mode de travail :
- Toujours vérifier le statut git avant de commencer : git status + git log --oneline -5
- Identifier la prochaine US non démarrée dans le sprint actuel (voir docs/SPRINT_PLAN.md)
- Implémenter 1 seule US à la fois, du début à la fin
- Commiter avec le format : feat(scope): description [US-XXX]
- Marquer l'US comme "done" dans le plan avant de passer à la suivante

Règles absolues :
- TypeScript strict, aucun `any`
- Composants dans app/components/ (PascalCase)
- Composables dans app/composables/ (useXxx.ts)
- API routes dans server/api/ (RESTful)
- useSupabase() pour toutes les interactions DB
- NuxtImg pour toutes les images
- GSAP chargé via plugin client-side uniquement
- Cleanup GSAP dans onUnmounted()

Pour démarrer : dis-moi quelle US je dois implémenter, ou tape /sprint pour voir le plan complet.
```

---

## Structure des Fichiers Claude Code

```
cgws-website/
├── CLAUDE.md                          ← Contexte global (voir CGWS_01)
├── .claude/
│   └── commands/
│       ├── po.md                      ← /po : Product Owner
│       ├── ux.md                      ← /ux : UX/UI Designer
│       ├── dev.md                     ← /dev : Ce guide
│       ├── qa.md                      ← /qa : QA Engineer
│       └── sprint.md                  ← /sprint : Scrum Master
└── docs/
    └── SPRINT_PLAN.md                 ← Copie de CGWS_03_SPRINT_PLAN.md
```

---

## Setup Projet — Étape par Étape

### 1. Initialisation Nuxt 4

```bash
# Créer le projet
npx nuxi@latest init cgws-website --template ui
cd cgws-website

# Installer les dépendances supplémentaires
npm install \
  @supabase/supabase-js \
  gsap \
  swiper \
  @vueuse/core \
  zod \
  resend \
  browser-image-compression \
  slugify

npm install -D \
  @types/node \
  @playwright/test \
  vitest \
  @vue/test-utils
```

### 2. Configuration nuxt.config.ts

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: [
    '~/assets/css/main.css',
  ],

  runtimeConfig: {
    // Privé (server-side only)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    consignmentCommissionRate: process.env.COMMISSION_RATE || '20',
    // Public (exposé au client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      siteUrl: process.env.SITE_URL || 'https://cgws.fr',
    }
  },

  image: {
    // Provider Supabase Storage
    domains: ['*.supabase.co'],
    quality: 85,
    formats: ['webp', 'jpeg'],
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  nitro: {
    compressPublicAssets: true,
    minify: true,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap'
        }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },
})
```

### 3. Variables d'Environnement

```bash
# .env.local (NE PAS commiter)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...   # Pour server-side uniquement
RESEND_API_KEY=re_xxxx
SITE_URL=http://localhost:3000
COMMISSION_RATE=20
ADMIN_EMAIL=camille@cgws.fr
# Expéditeur unique des emails transactionnels (optionnel).
# Fallback si absent : 'CGWS <onboarding@resend.dev>' (domaine de test Resend).
# ⚠️ Nécessite le domaine cgws.fr VÉRIFIÉ dans Resend avant de pointer cgws.fr.
CGWS_EMAIL_FROM=
# PostHog — mesure d'audience cookieless (US-102). OPTIONNEL en local : sans
# NUXT_PUBLIC_POSTHOG_KEY, le plugin est un no-op silencieux (aucun script,
# aucune erreur console). Clé PROJET publique (phc_...), hébergement UE.
NUXT_PUBLIC_POSTHOG_KEY=
NUXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

```bash
# .env.example (à commiter)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=
SITE_URL=
COMMISSION_RATE=20
ADMIN_EMAIL=
CGWS_EMAIL_FROM=
NUXT_PUBLIC_POSTHOG_KEY=
NUXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### 4. Design System CSS

```css
/* app/assets/css/tokens.css */
:root {
  /* Couleurs CGWS */
  --cgws-brown:     #8B4513;
  --cgws-amber:     #D4A017;
  --cgws-parchment: #F5F0E8;
  --cgws-dark:      #1C1208;
  --cgws-rust:      #C4501A;
  --cgws-sand:      #E8D5B7;
  --cgws-cream:     #FBF8F3;
  --cgws-very-dark: #100A04;

  /* Typographie */
  --font-display:   'Bebas Neue', cursive;
  --font-serif:     'Playfair Display', Georgia, serif;
  --font-sans:      'Inter', system-ui, sans-serif;

  /* Espacements */
  --section-py:     clamp(3rem, 8vw, 6rem);
  --container-max:  1280px;
  --container-px:   clamp(1rem, 4vw, 2rem);
}
```

```css
/* app/assets/css/main.css */
@import './tokens.css';

/* Reset & base */
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); background: var(--cgws-cream); color: var(--cgws-dark); }

/* Typographie utilitaire */
.font-display { font-family: var(--font-display); }
.font-serif   { font-family: var(--font-serif); }

/* Layout utilitaire */
.container { max-width: var(--container-max); margin-inline: auto; padding-inline: var(--container-px); }
.section    { padding-block: var(--section-py); }

/* Page transitions GSAP */
.page-enter-active, .page-leave-active { transition: opacity 0.25s ease; }
.page-enter-from, .page-leave-to { opacity: 0; }

/* Réduction de mouvement */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

### 5. Composable Supabase

```typescript
// app/composables/useSupabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

let client: ReturnType<typeof createClient<Database>> | null = null

export function useSupabase() {
  if (!client) {
    const config = useRuntimeConfig()
    client = createClient<Database>(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
  }
  return client
}

// Alias côté serveur (avec service key pour bypass RLS)
export function useSupabaseAdmin() {
  const config = useRuntimeConfig()
  return createClient<Database>(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
    { auth: { persistSession: false } }
  )
}
```

### 5bis. Types Supabase générés — `app/types/database.types.ts`

Le fichier `app/types/database.types.ts` est **généré**, jamais édité à la main.
Il est la source de vérité TypeScript du schéma Postgres (tables, colonnes,
relations, fonctions RPC) et alimente `createClient<Database>` partout
(app + server). Un fichier désaligné produit de faux positifs/négatifs au
typecheck sur tout le code d'accès données.

**Règle absolue : à relancer après CHAQUE nouvelle migration, dans le même
commit que la migration.** Une migration sans régénération des types est un
diff incomplet.

**Commande exacte (CLI Supabase)** :

```bash
# Prérequis : Supabase CLI installée (npm i -g supabase) et authentifiée
# (supabase login), ou npx. <project-ref> = ref du projet live (dashboard).
npx supabase gen types typescript --project-id <project-ref> --schema public \
  > app/types/database.types.ts
```

**Alternative (session Claude Code)** : le MCP supabase expose
`generate_typescript_types` — écrire sa sortie **verbatim** dans
`app/types/database.types.ts` (aucune retouche de style, le diff entre le
fichier commité et la sortie générée doit être vide).

**Vérification après régénération** :

```bash
npm run typecheck   # doit rester à 0 erreur — les désalignements révélés
                    # par les nouveaux types se corrigent dans le même commit
```

Pour typer les payloads d'écriture, utiliser les helpers générés plutôt que
`Record<string, unknown>` :

```typescript
import type { TablesUpdate, TablesInsert } from '~/types/database.types'

const updates: TablesUpdate<'categories'> = {}
```

### 6. Plugin GSAP (client-side)

```typescript
// app/plugins/gsap.client.ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger)

  // Config globale
  gsap.defaults({ ease: 'power2.out' })

  return {
    provide: { gsap, ScrollTrigger }
  }
})
```

```typescript
// app/composables/useAnimation.ts
export function useAnimation() {
  const { $gsap, $ScrollTrigger } = useNuxtApp()

  function revealOnScroll(
    element: string | Element,
    options: { delay?: number; y?: number } = {}
  ) {
    return $gsap.fromTo(element,
      { opacity: 0, y: options.y ?? 30 },
      {
        opacity: 1, y: 0,
        delay: options.delay ?? 0,
        duration: 0.8,
        scrollTrigger: { trigger: element as Element, start: 'top 85%' }
      }
    )
  }

  function staggerReveal(elements: string, staggerDelay = 0.1) {
    return $gsap.fromTo(elements,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        stagger: staggerDelay,
        duration: 0.6,
        scrollTrigger: { trigger: elements, start: 'top 85%' }
      }
    )
  }

  function counter(element: Element, target: number, suffix = '') {
    const obj = { value: 0 }
    return $gsap.to(obj, {
      value: target,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate() {
        element.textContent = Math.round(obj.value) + suffix
      },
      scrollTrigger: { trigger: element, start: 'top 90%', once: true }
    })
  }

  return { revealOnScroll, staggerReveal, counter }
}
```

### 7. Middleware Admin

```typescript
// app/middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return

  const supabase = useSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && to.path !== '/admin/login') {
    return navigateTo('/admin/login')
  }

  if (user && to.path === '/admin/login') {
    return navigateTo('/admin/dashboard')
  }
})
```

### 8. Pattern Page Catalogue (référence)

```vue
<!-- app/pages/catalogue/index.vue -->
<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const supabase = useSupabase()

// State filtres synchronisé avec URL
const filters = reactive({
  categorie: route.query.categorie as string || '',
  prix_min: Number(route.query.prix_min) || 0,
  prix_max: Number(route.query.prix_max) || 9999,
  etat: route.query.etat as string || '',
  tri: route.query.tri as string || 'date_desc',
})

// Watch filtres → mise à jour URL
watch(filters, (newFilters) => {
  router.replace({ query: { ...newFilters } })
}, { deep: true })

// Query Supabase avec filtres
const { data: products, pending, refresh } = await useLazyAsyncData(
  'catalogue',
  () => {
    let query = supabase
      .from('products')
      .select('id, slug, name, brand, price, condition, status, images, is_consignment')
      .eq('status', 'available')

    if (filters.categorie) query = query.eq('category_id', filters.categorie)
    if (filters.etat) query = query.eq('condition', filters.etat)
    query = query.gte('price', filters.prix_min).lte('price', filters.prix_max)

    const [field, dir] = filters.tri.split('_')
    query = query.order(field === 'date' ? 'created_at' : 'price', { ascending: dir === 'asc' })

    return query
  },
  { watch: [filters] }
)

// SEO
useSeoMeta({
  title: 'Catalogue | CGWS — Équipements Western',
  description: 'Découvrez notre sélection d\'équipements western : selles, harnachements, vêtements et accessoires. Pièces neuves et d\'occasion en consignation.',
})
</script>

<template>
  <div class="container section">
    <FilterPanel v-model="filters" />
    <ProductGrid :products="products" :loading="pending" />
  </div>
</template>
```

### 9. Pattern API Route Server (référence)

```typescript
// server/api/admin/products/index.post.ts
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string().min(2).max(100),
  category_id: z.string().uuid(),
  brand: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  condition: z.enum(['new', 'used']),
  dimensions: z.string().optional(),
  is_consignment: z.boolean().default(false),
  consignment_id: z.string().uuid().optional(),
})

export default defineEventHandler(async (event) => {
  // Auth check
  const user = await requireAuth(event)  // helper à créer

  // Validation
  const body = await readValidatedBody(event, ProductSchema.parse)

  // Slug generation
  const slug = slugify(`${body.name}-${body.brand || ''}`, { lower: true, strict: true })

  // Insert Supabase (service key = bypass RLS)
  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .insert({ ...body, slug, status: 'available' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, product: data }
})
```

---

## Workflow de Développement d'une US

```
1. Lire la US dans docs/SPRINT_PLAN.md
   → Identifier les critères Gherkin, les tâches techniques, le scope commit

2. Vérifier git status + créer la branche
   $ git checkout develop
   $ git pull
   $ git checkout -b feature/US-XXX-description

3. Développer dans cet ordre :
   a. Types TypeScript si nouveaux (types/index.ts)
   b. Migration Supabase si nouvelle table
   c. Composants Vue (du plus petit au plus grand)
   d. Composables si logique réutilisable
   e. API routes server si nécessaire
   f. Page(s) qui assemblent tout

4. Vérifier les critères Gherkin un par un
   → Test manuel dans le navigateur
   → npm run typecheck && npm run lint

5. Commiter
   $ git add .
   $ git commit -m "feat(scope): description [US-XXX]"

6. Push + PR sur develop
   $ git push -u origin feature/US-XXX-description

7. Lancer /qa pour le rapport qualité
```

---

## Checklist Avant Chaque Session

```bash
# Vérifier l'état du projet
git log --oneline -10        # Voir les derniers commits
git status                   # Modifications en cours
npm run typecheck             # 0 erreur TypeScript
npm run lint                  # 0 warning ESLint

# Identifier la prochaine US
cat docs/SPRINT_PLAN.md | grep -A2 "pts"

# Lancer le dev server
npm run dev
```

---

## Commandes Utiles

```bash
# Dev
npm run dev                  # Serveur dev localhost:3000
npm run build                # Build production
npm run preview              # Preview build local

# Qualité
npm run typecheck            # Vérification TypeScript
npm run lint                 # ESLint
npm run lint:fix             # ESLint autofix

# Tests
npm run test                 # Vitest unit tests
npm run test:e2e             # Playwright E2E (nécessite build)
npm run test:e2e:ui          # Playwright avec UI

# Supabase
npx supabase start           # Supabase local (Docker)
npx supabase db reset        # Reset DB locale avec migrations
npx supabase gen types typescript --local > types/supabase.ts
```

---

## Taxonomie catégories (US-109)

Périmètre reining/western défini dans `docs/BRAND_DIRECTION.md` § Impacts chantier
n°2. La taxonomie produit vit à **un seul endroit** :
`shared/utils/csvImport.ts` → `PRODUCT_CATEGORIES` + `CATEGORY_LABELS`. Tout le
reste en dérive (enum `ProductCategory`, filtres catalogue, sélecteur admin,
validation Zod des routes produits, labels fiche/vente, taxonomie analytics).

**Taxonomie cible (8 slugs)** :

| slug | libellé | note |
|------|---------|------|
| `selles` | Selles | inchangé |
| `bridonnerie` | Bridonnerie | filets, mors |
| `etriers` | Étriers | nouveau |
| `bandes-protections` | Bandes & Protections | |
| `licols-accessoires` | Licols & Accessoires | |
| `soins` | Soins | crins, sabots — nouveau |
| `bottes-chaussures` | Bottes & Chaussures | conservé (arbitré 2026-07-23) |
| `vetements` | Vêtements | conservé (arbitré 2026-07-23) |

**Table de correspondance ancien → nouveau** (appliquée par la migration
`supabase/migrations/009_reining_taxonomy.sql`, pour audit / rollback) :

| ancien slug | nouveau slug | règle |
|-------------|--------------|-------|
| `selles` | `selles` | inchangé |
| `bottes-chaussures` | `bottes-chaussures` | inchangé |
| `vetements` | `vetements` | inchangé |
| `brides-licols` | `bridonnerie` | défaut (bride = têtière + mors) ; licols/attaches → `licols-accessoires` au tri fin |
| `protections` | `bandes-protections` | |
| `accessoires` | `licols-accessoires` | défaut documenté ; tri fin manuel Camille |

> ⚠️ **Tri fin à faire par Camille** (non bloquant — rattachement par défaut
> appliqué) : les ex-`brides-licols` et ex-`accessoires` peuvent nécessiter une
> reclassification produit par produit dans l'admin (ex. un chapeau ex-accessoire
> relève plutôt de `vetements` ; un licol ex-`brides-licols` de
> `licols-accessoires`).

**Rétrocompat des liens indexés** : `useCatalogue.initFromUrl` et
`normalizeCategory` (CSV) remappent silencieusement un ancien slug via
`LEGACY_CATEGORY_REDIRECTS`. Un ancien slug sans équivalent (aucun aujourd'hui)
serait ignoré → dégradation propre vers le catalogue complet, sans erreur.

**Migration** : le fichier `009_reining_taxonomy.sql` est **rejouable** (DROP
CONSTRAINT IF EXISTS + UPDATE ciblé + upsert `ON CONFLICT` + garde-fou zéro
orphelin qui `RAISE EXCEPTION` sinon). Les anciennes lignes de la table
`categories` sont **désactivées** (`is_active=false`), jamais supprimées.
La colonne `products.category` restant `text` (contrainte `CHECK`), la
régénération de `database.types.ts` ne produit **aucun diff** (le générateur
Supabase ne reflète pas les `CHECK`) — rien à recommiter côté types.

---

## CI (US-091)

Le workflow `.github/workflows/e2e.yml` se déclenche sur chaque `push` (branches
`main`, `develop`, `feature/**`) et chaque `pull_request` vers `main`/`develop`.
Il comporte 3 jobs :

| Job | Dépend d'un secret ? | Rôle |
|-----|----------------------|------|
| `quality` | Non | **Le vrai gate.** `npm ci` → `npm run typecheck` → `npm run lint` → `npm run test:unit`. Couvre notamment tout le chemin de paiement (`tests/unit/fulfillment.spec.ts`, `tests/unit/checkout-session.spec.ts`) sans base Supabase réelle (mocks). Doit **toujours** être vert. |
| `e2e-secrets-check` | Non | Vérifie la présence des secrets Supabase et log une annotation explicite si absents. Toujours vert. |
| `e2e` | Oui (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) | Playwright contre un vrai build. **Skipped** (statut de job dédié, pas un échec) tant que les secrets ne sont pas configurés dans le dépôt GitHub — sinon tourne pour de vrai. |

Résultat : le run global est **vert par défaut**, avec ou sans les secrets
Supabase configurés. Ce n'était pas le cas avant l'US-091 (`npm ci` cassé +
secrets absents faisaient échouer le job e2e systématiquement).

### Secrets GitHub à créer (Nathan)

Dans **Settings → Secrets and variables → Actions** du dépôt GitHub, créer :

| Nom exact du secret | Où trouver la valeur |
|----------------------|------------------------|
| `SUPABASE_URL` | Dashboard Supabase → Project Settings → API → **Project URL** (même valeur que `NUXT_PUBLIC_SUPABASE_URL` en local) |
| `SUPABASE_ANON_KEY` | Dashboard Supabase → Project Settings → API → **anon / public key** (même valeur que `NUXT_PUBLIC_SUPABASE_ANON_KEY` en local) |

Optionnel — pour un scénario e2e checkout complet (paiement Stripe simulé) à
ajouter dans un futur run Playwright :

| Nom exact du secret | Où trouver la valeur |
|----------------------|------------------------|
| `STRIPE_SECRET_KEY` (test) | Dashboard Stripe (mode Test) → Developers → API keys → **Secret key** (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` (test) | Dashboard Stripe (mode Test) → Developers → Webhooks → endpoint concerné → **Signing secret** (`whsec_...`), ou `stripe listen --print-secret` en local |
| `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Dashboard Stripe (mode Test) → Developers → API keys → **Publishable key** (`pk_test_...`) |

Ces clés Stripe ne sont **pas** requises pour que le job `e2e` actuel passe au
vert — seules `SUPABASE_URL` / `SUPABASE_ANON_KEY` conditionnent son
déclenchement aujourd'hui. Elles ne servent que si un futur scénario e2e du
tunnel de paiement est ajouté à `tests/e2e/`.

### Vérifier localement avant de pousser

```bash
rm -rf node_modules
npm ci                # doit terminer en EXIT 0 (package-lock.json à jour)
npm run build          # doit passer directement derrière npm ci, sans npm install
npm run typecheck
npm run lint
npm run test:unit
```

Si `npm ci` échoue avec un message du type `Missing: crossws@x.y.z from lock
file`, c'est une désynchronisation du lockfile liée à une résolution
différente des peer dependencies optionnelles selon la version majeure de npm
(observé entre npm 10 et npm 11) — régénérer avec
`npm install --package-lock-only --ignore-scripts` puis revérifier `npm ci`.

---

## Emails transactionnels (US-092, US-094)

### Expéditeur centralisé et garde-fou de fallback

`server/services/email.ts` centralise le `from` des 6 templates transactionnels
via `resolveEmailFrom()` (non exportée), qui lit `useRuntimeConfig().emailFrom`
(mappé sur `CGWS_EMAIL_FROM`, voir §3). Tant que cette variable est vide en
production, tous les emails partent depuis le fallback `CGWS
<onboarding@resend.dev>` — un domaine de test Resend qui **ne délivre qu'à
l'adresse du titulaire du compte Resend**. C'est la cause confirmée des
issues #27 (formulaire de contact "silencieux" : succès affiché côté visiteur,
email jamais reçu) et #24 (mail de commande non reçu sur une autre adresse que
celle de Camille).

Depuis l'US-094, ce risque n'est plus invisible : un bandeau d'alerte
(`app/components/admin/EmailFallbackBanner.vue`, monté dans
`app/pages/admin/dashboard.vue`) s'affiche à chaque connexion admin tant que
`GET /api/admin/email-status` (route protégée par `requireAdminAuth`) retourne
`{ isFallback: true }`. Ce booléen est calculé par `isFallbackSender()`
(export minimal de `server/services/email.ts`, dédié à cette seule
détection) — aucune information de configuration email (adresse `from`,
`runtimeConfig` brut) n'est jamais exposée côté client, authentifié ou non.
Le bandeau n'a **volontairement** aucun bouton "fermer définitivement" :
masquer durablement un vrai problème de production irait à l'encontre de sa
raison d'être.

### Lever le bandeau (action Nathan, hors périmètre code)

1. Vérifier le domaine `cgws.fr` dans Resend (Dashboard Resend → Domains →
   Add Domain → suivre les enregistrements DNS à ajouter chez le registrar :
   SPF, DKIM, et éventuellement DMARC).
2. Attendre la validation du domaine (statut "Verified" dans Resend — peut
   prendre de quelques minutes à quelques heures selon la propagation DNS).
3. Positionner la variable d'environnement `CGWS_EMAIL_FROM` en production sur
   Vercel (Project Settings → Environment Variables), par exemple :
   `CGWS <noreply@cgws.fr>`.
4. Redéployer (ou attendre le prochain déploiement) — aucun changement de code
   n'est nécessaire, la bascule est purement une variable d'environnement.
5. Se reconnecter à `/admin/dashboard` : le bandeau doit avoir disparu.

### Checklist de recette manuelle des 6 templates

À exécuter **une fois** le domaine `cgws.fr` vérifié dans Resend et
`CGWS_EMAIL_FROM` positionnée en production (cf. ci-dessus), en rejouant
chaque déclencheur manuellement avec une adresse de destination **hors
compte Resend** (ex. une boîte perso non liée au compte). Objectif : prouver
que le problème n'est plus circonscrit au domaine de test. Consigner le
résultat dans `docs/PROGRESS.md`.

| # | Déclencheur | Comment le déclencher | Reçu ? |
|---|-------------|------------------------|--------|
| 1 | Contact | Soumettre `/contact` avec une adresse de test | ☐ |
| 2 | Consignation — confirmation dépôt | Soumettre `/consignation` avec une adresse de test | ☐ |
| 3 | Consignation — acceptation | Accepter une consignation en attente depuis `/admin/consignations` | ☐ |
| 4 | Consignation — refus | Refuser une consignation en attente depuis `/admin/consignations` (motif requis) | ☐ |
| 5 | Consignation — vente au déposant | Enregistrer une vente liée à un produit de consignation depuis `/admin/ventes` | ☐ |
| 6 | Commande — confirmation acheteur | Finaliser un checkout de test (Stripe mode test) | ☐ |

Chaque ligne doit être cochée avec succès pour considérer la recette
terminée — un seul échec silencieux suffit à indiquer une régression sur
l'expéditeur ou la config Resend.

---

## Moyens de paiement — pilotés par le Dashboard Stripe (US-098)

**Règle** : `server/api/checkout/session.post.ts` ne fige **volontairement aucun
`payment_method_types`**. La liste des moyens de paiement proposés à l'acheteur
est donc entièrement pilotée depuis le Dashboard Stripe
(*Paramètres → Moyens de paiement*), sans aucun déploiement.

**Conséquence pratique** : activer ou désactiver un moyen de paiement (PayPal,
Apple Pay, Google Pay, Link, virement…) est une **action de configuration, pas
une tâche de développement**. Un ticket « ajouter tel moyen de paiement » ne
doit pas être estimé comme du dev tant que la vérification ci-dessous n'a pas
été faite — c'est précisément le piège qu'a évité US-098.

### Cas PayPal (vérifié en Sprint 9)

PayPal est **supporté par Checkout**, y compris en formulaire embarqué, et CGWS
remplit les prérequis :

| Prérequis | État CGWS |
|-----------|-----------|
| Pays du compte marchand dans la liste éligible | ✅ FR |
| Devise supportée | ✅ EUR |
| `return_url` configurée (obligatoire dès qu'un moyen de paiement à redirection est actif en `ui_mode` embarqué) | ✅ `/checkout/success?session_id={CHECKOUT_SESSION_ID}` |

**Comportement attendu** : PayPal impose une **redirection pleine page** vers
PayPal pour l'autorisation, puis un retour sur la `return_url` — y compris
depuis le formulaire embarqué. Ce n'est pas un défaut d'intégration.

**Aucune branche de code spécifique n'est nécessaire** : le webhook
`checkout.session.completed` → `fulfillOrder` et la libération de stock
(`release_product_unit`) sont agnostiques du moyen de paiement.

⚠️ **Seule contrainte à respecter** : ne jamais placer le Checkout embarqué dans
une iframe à nous — les moyens de paiement à redirection casseraient. Ce n'est
pas le cas aujourd'hui sur `/checkout`.

**Recette obligatoire** avant de communiquer un nouveau moyen de paiement à
Camille : un paiement complet de bout en bout en mode test Stripe (compte
sandbox pour PayPal), en vérifiant que la commande est bien fulfillée et
l'email de confirmation reçu.

---

## Sécurité — Rôle admin & RLS (US-101)

### Principe

Depuis la migration `supabase/migrations/008_admin_role_rls.sql`, les policies
RLS « admin » (products/categories en écriture, consignments, sales, clients,
orders, order_items, product_status_history en lecture) ne reposent **plus** sur
`auth.role() = 'authenticated'` : ce critère était une faille, car tout déposant
connecté via magic link (espace déposant, US-066) porte lui aussi une session
`authenticated` et pouvait donc lire les PII de tous les déposants/clients ou
écrire dans le catalogue via PostgREST (clé anon + son JWT).

Elles vérifient désormais un **rôle admin réel** via la fonction SQL
`public.is_admin()`, qui lit le claim `app_metadata.cgws_role` du JWT :

```sql
-- supabase/migrations/008_admin_role_rls.sql
SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'cgws_role', '') = 'admin'
```

**Pourquoi `app_metadata` et jamais `user_metadata`** : `user_metadata` est
modifiable par l'utilisateur lui-même via `supabase.auth.updateUser()` — s'y
fier permettrait à n'importe quel déposant de s'auto-promouvoir admin.
`app_metadata` n'est modifiable que par le service role (ou le Dashboard) :
c'est la seule source acceptable pour un contrôle d'accès.

### Attribuer le claim admin à un compte

Via SQL (SQL Editor du Dashboard, ou psql avec les droits postgres) :

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"cgws_role":"admin"}'::jsonb
WHERE email = 'camille.guignon37@gmail.com';
```

Ou via le Dashboard Supabase : *Authentication → Users → \[utilisateur\] →
User Metadata / App Metadata* → ajouter `"cgws_role": "admin"` dans
**App Metadata** (pas User Metadata).

⏳ **Le claim n'entre dans le JWT qu'à la prochaine émission de token** :
l'utilisateur doit se **reconnecter** (ou attendre le refresh automatique du
token, ~1 h max) après l'attribution. Un « ça ne marche pas » juste après
l'UPDATE est normal tant que la session n'a pas été renouvelée.

### ⚠️ Ordre de déploiement en production — CRITIQUE

Le backoffice interroge Supabase **directement avec le JWT admin**
(`app/pages/admin/dashboard.vue`, `app/components/admin/ProductForm.vue`).
Déployer la migration 008 **avant** d'avoir attribué le claim verrouillerait
donc le backoffice (dashboard vide, sélecteur de consignation vide).

Checklist ordonnée, à suivre strictement :

1. **Attribuer le claim** `cgws_role: 'admin'` aux comptes de **Camille et
   Nathan** en production (SQL ci-dessus, pour chaque email admin)
2. Vérifier : `SELECT email, raw_app_meta_data FROM auth.users;` → les deux
   comptes portent `"cgws_role": "admin"`, aucun compte déposant ne le porte
3. **Ensuite seulement**, appliquer la migration `008_admin_role_rls.sql`
4. Demander à Camille/Nathan de se **déconnecter/reconnecter** au backoffice
5. Recette rapide : dashboard admin (stats visibles), création/édition d'un
   produit, liste des consignations

Tout nouveau compte créé via l'espace déposant est un compte **déposant** par
défaut (aucun claim) : il n'a jamais rien à faire de plus. N'attribuer
`cgws_role: 'admin'` qu'aux comptes réellement gérants.

### Script de non-régression rejouable

`supabase/tests/rls_admin.sql` simule les 4 profils (déposant sans claim,
déposant avec `user_metadata` forgé, admin `app_metadata`, visiteur anonyme)
via `SET LOCAL ROLE` + `SET LOCAL request.jwt.claims`, et vérifie chaque table.

```bash
# psql (les secrets CI étant absents — cf. issue #11 — l'exécution est manuelle)
psql "$DATABASE_URL" -f supabase/tests/rls_admin.sql
# ou : copier-coller intégral dans le SQL Editor du Dashboard
```

Transactionnel (ROLLBACK final, aucune donnée persistée). Résultat = la table
finale : **toutes les lignes doivent avoir `ok = true`**. À rejouer à chaque
évolution de schéma ou de policy, et consigner le résultat dans
`docs/PROGRESS.md`.

**Anti-pattern à ne plus jamais réintroduire** : une policy
`auth.role() = 'authenticated'` comme critère « admin ». Toute nouvelle table
contenant des PII ou des données de gestion doit soit utiliser
`public.is_admin()`, soit activer RLS sans policy (accès service role
uniquement, pattern `stock_notifications` de la migration 007).

---

## Mesure d'audience — PostHog cookieless (US-102)

> 📊 **Guide de lecture produit** : taxonomie complète, dashboard « CGWS —
> Produit », questions produit par vue, limites du dispositif, gouvernance des
> événements et recette de bout en bout → **`docs/ANALYTICS.md`** (US-105).

### Cadrage (NON négociable)

Pas de bandeau de consentement → la configuration doit rester dans le cadre de
l'**exemption CNIL de mesure d'audience** :

| Contrainte | Implémentation |
|------------|----------------|
| Aucun cookie ni localStorage/sessionStorage | `persistence: 'memory'` (identité anonyme éphémère par session de navigation) |
| Aucun profil personne / aucune identification | `person_profiles: 'never'` + **JAMAIS d'appel `identify()`** dans le codebase |
| Pas de session recording ni heatmaps | `disable_session_recording: true`, `capture_heatmaps: false`, `disable_surveys: true`, `disable_external_dependency_loading: true` |
| Pas d'autocapture DOM (PII accidentelle) | `autocapture: false` — taxonomie exclusivement explicite (US-103) |
| Données dans l'UE | `NUXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` (PostHog Cloud EU) |

### Architecture

- `app/plugins/posthog.client.ts` — plugin **client only**, init différée via
  `onNuxtReady` + import dynamique de `posthog-js` (hors bundle d'entrée, zéro
  impact LCP/TBT). Sans `NUXT_PUBLIC_POSTHOG_KEY` : no-op silencieux. Les
  `$pageview` sont capturés **manuellement** (initial + `router.afterEach`),
  la capture automatique ne couvrant pas les navigations SPA.
- `app/composables/useAnalytics.ts` — **point d'entrée unique** des événements
  côté client : `useAnalytics().capture(event, properties)`. Inerte sans clé,
  buffer borné avant l'init différée. **Aucun composant ne doit importer
  `posthog-js` directement.**
- `app/utils/analytics.ts` — `sanitizeAnalyticsEvent()`, branché sur le hook
  d'init `before_send` : voir ci-dessous.

### ⚠️ Anti-fuite d'URL — `before_send` obligatoire (correctif QA US-102)

PostHog attache `$current_url` = `window.location.href` **complet** (query
string + fragment) à **chaque** événement — pageviews ET événements custom.
Certaines routes CGWS portent des jetons sensibles en query/fragment :
`/espace-deposant/callback?code=…` / `?token_hash=…` (auth Supabase) et
`/checkout/success?session_id=cs_…` (session Stripe → commande/identité).
Les envoyer au tiers contredirait l'anonymat revendiqué (mentions légales /
exemption CNIL).

Le plugin passe donc `before_send: sanitizeAnalyticsEvent`
(`app/utils/analytics.ts`) : query string et fragment sont supprimés de toute
propriété porteuse d'URL (`$current_url`, `$referrer`, `$initial_current_url`,
`…_url`, `…_pathname`) dans `properties`, `$set` et `$set_once`, sur **tous**
les événements. Pourquoi `before_send` et pas une autre option (vérifié dans
`@posthog/types`) : `get_current_url` ne réécrit **pas** `$current_url` (URL
targeting uniquement, sa JSDoc renvoie vers `before_send`) et
`sanitize_properties` est **dépréciée** au profit de `before_send`.

**Règle pour US-103/104** : ne JAMAIS mettre d'URL complète (avec query) dans
une propriété métier custom. Si une propriété doit porter une URL, la nettoyer
avec `stripQueryAndHash()` — ou nommer la clé en `…_url` pour bénéficier du
nettoyage automatique du hook. Aucune query string n'est nécessaire à
l'analytics (pas d'allowlist).

### Événement serveur `order_paid` (US-104)

La taxonomie CLIENT (`app/utils/analytics-events.ts`) reste exhaustive à 6
événements. Un unique événement SERVEUR existe en plus : `order_paid`, capturé
par `server/services/analytics.ts` (`posthog-node`, seul point serveur autorisé
à parler à PostHog) à la FIN de `fulfillCheckoutSession` — exactement une fois
par commande payée grâce à la barrière d'idempotence `pending → paid`, que le
fulfillment soit déclenché par le webhook Stripe ou par la landing page.
Propriétés : `amount_total` (euros), `currency`, `items_count` (somme des
quantités, US-096), `payment_method_type` — zéro PII (jamais
`customer_details`), `$process_person_profile: false`, `disableGeoip: true`.
Jonction funnel : le navigateur transmet son distinct_id anonyme éphémère
(`useAnalytics().getDistinctId()`) à la création de session → metadata Stripe
`analytics_id` → repris comme distinct_id du `order_paid` (id aléatoire en
fallback : comptage exhaustif même avec PostHog bloqué côté client).
Serverless : `flushAt: 1` + `flushInterval: 0` + `await _shutdown()` avant le
retour de la lambda (dans posthog-node v5.x, le shutdown gracieux public est
`_shutdown()` — l'ancien `shutdown()` n'existe plus).

### Variables d'environnement

| Variable | Rôle |
|----------|------|
| `NUXT_PUBLIC_POSTHOG_KEY` | Clé PROJET publique (`phc_...`). Absente = analytics désactivé (dev local, preview). |
| `NUXT_PUBLIC_POSTHOG_HOST` | Hôte d'ingestion. Défaut : `https://eu.i.posthog.com` (UE obligatoire). |
| `POSTHOG_PERSONAL_API_KEY` | Clé personnelle **SECRÈTE** (`phx_...`) — API privée serveur/CLI uniquement (US-105). Ne JAMAIS la préfixer `NUXT_PUBLIC_*`. |

### Config projet PostHog (action Nathan, hors code)

1. Projet sur **PostHog Cloud EU** (eu.posthog.com).
2. Activer **« Discard client IP data »** (Project Settings) — l'IP n'est
   jamais conservée, condition de l'anonymat revendiqué dans les mentions
   légales.
3. Saisir `NUXT_PUBLIC_POSTHOG_KEY` / `NUXT_PUBLIC_POSTHOG_HOST` dans Vercel
   (production uniquement — laisser vide en preview pour ne pas polluer les
   stats).

---

## Anti-Patterns à Éviter Absolument

```typescript
// ❌ JAMAIS
const data: any = await fetch(...)
import { gsap } from 'gsap'  // dans un composant SSR
localStorage.getItem(...)     // dans setup() sans import.meta.client

// ✅ TOUJOURS
const data: Product = await fetch(...)
const { $gsap } = useNuxtApp()  // via plugin client-side
if (import.meta.client) { localStorage.getItem(...) }

// ❌ JAMAIS
console.log('debug')
// TODO: fix this later

// ✅ TOUJOURS
// Code propre, logs retirés avant commit
```

---

## Prompts Claude Code Situationnels

### Débloquer une impasse technique
```
J'implémente [US-XXX] et je suis bloqué sur [problème précis].
Voici ce que j'ai essayé : [tentatives].
Voici l'erreur : [stacktrace/message].
Contexte : [fichier concerné + dépendances].
Propose une solution qui respecte les conventions CLAUDE.md.
```

### Review de composant
```
Revois ce composant [nom] pour US-XXX :
[code]
Vérifie : TypeScript strict, a11y WCAG AA, responsive mobile-first, performance (re-renders), conventions CGWS.
```

### Débogage Supabase
```
Ma query Supabase retourne [résultat inattendu].
Table : [nom], colonnes : [liste].
RLS policies : [description].
Query : [code].
Qu'est-ce qui ne va pas ?
```

### Optimisation GSAP
```
Mon animation GSAP cause [problème : jank, memory leak, pas de cleanup].
Voici le code dans [composant] :
[code]
Corrige en respectant le pattern cleanup onUnmounted() de CLAUDE.md.
```

---

## Ressources de Référence

| Ressource | URL |
|-----------|-----|
| Nuxt 4 Docs | https://nuxt.com/docs |
| Nuxt UI v3 | https://ui.nuxt.com |
| Supabase JS | https://supabase.com/docs/reference/javascript |
| GSAP Docs | https://gsap.com/docs/v3 |
| GSAP ScrollTrigger | https://gsap.com/docs/v3/Plugins/ScrollTrigger |
| TailwindCSS v4 | https://tailwindcss.com/docs |
| Zod | https://zod.dev |
| Resend | https://resend.com/docs |
| Playwright | https://playwright.dev/docs |
| Vercel Nuxt | https://vercel.com/docs/frameworks/nuxt |
