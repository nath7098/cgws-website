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
