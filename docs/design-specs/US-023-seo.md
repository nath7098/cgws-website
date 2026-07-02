# SEO Fondations — Spec Technique (US-023)

**Purpose**: Assurer l'indexabilité complète du site par Google et les réseaux sociaux — sitemap dynamique, robots.txt, meta tags OG/Twitter uniformes, et Schema.org LocalBusiness sur la homepage.
**Sprint**: Sprint 2 — Services + SEO · 3 pts
**Commit cible**: `feat(seo): sitemap, robots, meta tags, OpenGraph and schema.org [US-023]`

---

## Audit de l'existant

### Déjà implémenté — ne pas toucher

| Fichier | État |
|---------|------|
| `app/pages/index.vue` | `useSeoMeta()` title + description + ogTitle + ogDescription + ogType ✅ |
| `app/pages/catalogue/index.vue` | `useSeoMeta()` complet sauf ogImage + twitterCard |
| `app/pages/catalogue/[slug].vue` | `useSeoMeta()` + ogImage produit + twitterCard + Schema.org Product JSON-LD ✅ **complet** |
| `app/pages/consignation.vue` | `useSeoMeta()` complet sauf ogImage + twitterCard |
| `app/pages/contact.vue` | `useSeoMeta()` title + description + ogTitle + ogDescription seulement |
| `app/pages/mentions-legales.vue` | `robots: 'noindex, nofollow'` ✅ — aucune balise OG requise |

### Manquant — à créer dans cette US

| Livrable | Fichier |
|----------|---------|
| Wrapper SEO réutilisable | `app/composables/useSeo.ts` |
| Endpoint sitemap dynamique | `server/api/__sitemap/urls.ts` |
| Config modules sitemap + robots | `nuxt.config.ts` (additions) |
| Robots.txt corrigé | `public/_robots.txt` (mise à jour) |
| Schema.org LocalBusiness | `app/pages/index.vue` (ajout) |
| OG image par défaut | `public/og-default.jpg` (placeholder) |
| Gaps ogImage + twitterCard | 4 pages statiques (patches) |

---

## 1. `nuxt.config.ts` — Additions

Ajouter après `image: { ... }` les blocs suivants. `@nuxtjs/seo` v5 est déjà chargé comme module — ses sous-modules `@nuxtjs/robots` et `@nuxtjs/sitemap` sont activables par clés de config directes.

```ts
// nuxt.config.ts

site: {
  url: 'https://cgws.fr',
  name: 'CGWS — Camille Guignon Western Shop',
  description: 'Sellerie équestre western à Brèches, Indre-et-Loire. Vente neuf & occasion, service de consignation de selles.',
  defaultLocale: 'fr',
},

robots: {
  disallow: ['/admin', '/api'],
  sitemap: '/sitemap_index.xml',
},

sitemap: {
  // Pages statiques déclarées explicitement avec leurs priorités
  urls: [
    { loc: '/',              changefreq: 'weekly',  priority: 1.0 },
    { loc: '/catalogue',     changefreq: 'daily',   priority: 0.9 },
    { loc: '/consignation',  changefreq: 'monthly', priority: 0.6 },
    { loc: '/contact',       changefreq: 'monthly', priority: 0.5 },
    { loc: '/mentions-legales', changefreq: 'yearly', priority: 0.1 },
  ],
  // Source dynamique pour les fiches produits
  sources: ['/api/__sitemap/urls'],
  // Exclure les pages non-publiques
  exclude: ['/admin/**', '/api/**', '/dev-components'],
},
```

**Note robots.txt** : avec `@nuxtjs/robots` inclus dans `@nuxtjs/seo`, le module génère une route serveur `/robots.txt` dynamique à partir de la config ci-dessus. Le fichier `public/_robots.txt` (underscore = source statique lue par le module) doit être mis à jour en parallèle (voir section 2). Ne pas créer de `public/robots.txt` sans underscore — cela court-circuiterait le module.

---

## 2. `public/_robots.txt` — Mise à jour

Remplacer le contenu actuel (`Disallow:` vide) par :

```
User-Agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /dev-components

Sitemap: https://cgws.fr/sitemap_index.xml
```

Ce fichier est lu par `@nuxtjs/robots` comme source de base, fusionné avec la config `nuxt.config.ts`. En cas de conflit, la config `nuxt.config.ts` prime.

---

## 3. `server/api/__sitemap/urls.ts` — Endpoint dynamique

Ce fichier expose les URLs des fiches produits actives au module `@nuxtjs/sitemap` via la clé `sources`.

```ts
// server/api/__sitemap/urls.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Lecture seule — on ne sélectionne que les colonnes nécessaires
  const client = await serverSupabaseClient(event)

  const { data: products, error } = await client
    .from('products')
    .select('slug, updated_at, status')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error || !products) return []

  return products.map((p) => ({
    loc: `/catalogue/${p.slug}`,
    lastmod: p.updated_at ?? new Date().toISOString(),
    changefreq: 'weekly' as const,
    priority: 0.7,
  }))
})
```

**Précisions** :
- Seuls les produits `status = 'active'` sont indexés (pas les `sold`, `reserved`, `inactive`).
- `updated_at` est disponible sur le type `Database['public']['Tables']['products']['Row']` — pas d'invention de champ.
- Si `serverSupabaseClient` n'est pas disponible sans `@nuxtjs/supabase` (le projet utilise un client manuel), remplacer par l'import du util `server/utils/supabase.ts` existant et une clé service role.

**Fallback sans `@nuxtjs/supabase`** — pattern alternatif avec le client service :

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = createClient<Database>(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
  )

  const { data: products } = await client
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'active')

  return (products ?? []).map((p) => ({
    loc: `/catalogue/${p.slug}`,
    lastmod: p.updated_at ?? new Date().toISOString(),
    changefreq: 'weekly' as const,
    priority: 0.7,
  }))
})
```

---

## 4. `app/composables/useSeo.ts` — Wrapper réutilisable

Centralise les constantes SEO et garantit que toutes les pages futures ont les balises OG + Twitter complètes, incluant une image par défaut.

```ts
// app/composables/useSeo.ts

export const SITE_NAME = 'CGWS — Camille Guignon Western Shop'
export const SITE_URL = 'https://cgws.fr'
export const DEFAULT_OG_IMAGE = '/og-default.jpg'

interface PageSeoOptions {
  title: string           // Titre de la page sans le suffixe " | CGWS"
  description: string     // Max 160 caractères
  image?: string          // URL absolue ou chemin /public — optionnel, fallback sur DEFAULT_OG_IMAGE
  type?: 'website' | 'product' | 'article'
}

export function usePageSeo({ title, description, image, type = 'website' }: PageSeoOptions) {
  const config = useRuntimeConfig()
  const baseUrl = (config.public.siteUrl as string) || SITE_URL

  // Résolution de l'image : URL absolue passée telle quelle, chemin local préfixé
  const resolvedImage = image
    ? image.startsWith('http') ? image : `${baseUrl}${image}`
    : `${baseUrl}${DEFAULT_OG_IMAGE}`

  useSeoMeta({
    title: `${title} | ${SITE_NAME}`,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: resolvedImage,
    ogType: type,
    twitterCard: 'summary_large_image',
    twitterImage: resolvedImage,
  })
}
```

**Usage sur une nouvelle page** :
```ts
usePageSeo({
  title: 'Catalogue',
  description: 'Parcourez notre sélection d\'équipements équestres western.',
})
```

**Usage sur une fiche produit** (image absolue depuis Supabase Storage) :
```ts
usePageSeo({
  title: product.value.title,
  description: product.value.description.slice(0, 160),
  image: product.value.images[0], // URL absolue Supabase — passée telle quelle
  type: 'product',
})
```

---

## 5. Schema.org LocalBusiness — `app/pages/index.vue`

Ajouter après le bloc `useSeoMeta()` existant. Utiliser `useHead` avec JSON-LD inline (cohérent avec le pattern déjà en place sur `catalogue/[slug].vue`).

```ts
// Ajout dans le <script setup> de app/pages/index.vue
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'CGWS — Camille Guignon Western Shop',
        description: 'Boutique d\'équipements équestres western : selles, brides, bottes, vêtements et service de consignation.',
        url: 'https://cgws.fr',
        image: 'https://cgws.fr/og-default.jpg',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'TODO: adresse exacte (à confirmer avec Camille)',
          addressLocality: 'Brèches',
          postalCode: '37220',
          addressCountry: 'FR',
        },
        telephone: 'TODO: numéro de téléphone (à confirmer avec Camille)',
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '10:00',
            closes: '18:00',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday'],
            opens: '09:00',
            closes: '17:00',
          },
        ],
        priceRange: '€€',
        currenciesAccepted: 'EUR',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer',
      }),
    },
  ],
})
```

**Bloquant** : `streetAddress` et `telephone` sont des données réelles de Camille — ne pas inventer. Utiliser les placeholders `TODO:` en développement. Google Search Console peut valider sans ces champs (ils ne sont pas requis par le schéma) mais ils améliorent le rich result local.

---

## 6. Patches OG/Twitter sur les pages statiques existantes

Les pages suivantes ont un `useSeoMeta()` incomplet. Appliquer les ajouts minimalistes — ne pas réécrire les appels existants, juste ajouter les clés manquantes.

### `app/pages/index.vue`
```ts
// Ajouter dans le useSeoMeta() existant :
ogImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
twitterCard: 'summary_large_image',
twitterImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
```

### `app/pages/catalogue/index.vue`
```ts
// Ajouter dans le useSeoMeta() existant :
ogImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
twitterCard: 'summary_large_image',
twitterImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
```

### `app/pages/consignation.vue`
```ts
// Ajouter dans le useSeoMeta() existant :
ogImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
twitterCard: 'summary_large_image',
twitterImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
```

### `app/pages/contact.vue`
```ts
// Ajouter dans le useSeoMeta() existant :
ogType: 'website',
ogImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
twitterCard: 'summary_large_image',
twitterImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
```

**À terme** : ces 4 pages pourront migrer vers `usePageSeo()` lors d'un refactor, mais le patch direct est suffisant pour cette US.

---

## 7. `public/og-default.jpg` — Image OG par défaut

Une image de 1200×630 px branded CGWS est nécessaire pour que les previews réseaux sociaux s'affichent correctement sur les pages statiques.

**En développement** : utiliser un placeholder 1200×630 (couleur `#3D1A06` avec le logo texte CGWS en `#B8650A`). L'image Unsplash déjà utilisée dans le hero (`https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200`) peut servir de fallback temporaire — dans ce cas mettre l'URL absolue Unsplash comme valeur de `DEFAULT_OG_IMAGE` dans `useSeo.ts` jusqu'à ce que l'image branded soit créée.

**En production** : fichier à créer par Camille ou un graphiste. Dimensions : 1200×630 px, format JPG, moins de 300 Ko. Placer dans `public/og-default.jpg`.

---

## 8. Schema.org Product — `catalogue/[slug].vue`

Implémenté dans US-013. Vérification : le bloc `useHead` avec JSON-LD `@type: Product` est présent et contient `name`, `description`, `brand`, `image`, et `offers` avec `price`, `priceCurrency`, `availability`, et `url`. Aucune modification requise.

---

## Validation (checklist Gherkin)

| Critère | Fichier concerné | Action |
|---------|-----------------|--------|
| sitemap.xml liste toutes les pages et produits | `nuxt.config.ts` + `server/api/__sitemap/urls.ts` | Créer |
| robots.txt disallow /admin/* et /api/* | `public/_robots.txt` + `nuxt.config.ts` | Modifier |
| `<title>` unique sur chaque page | Toutes les pages | Déjà fait ✅ |
| `<meta description>` sur chaque page | Toutes les pages | Déjà fait ✅ |
| og:title + og:description sur chaque page | Toutes les pages | Déjà fait ✅ |
| og:image sur chaque page | `index`, `catalogue/index`, `consignation`, `contact` | Patcher |
| twitterCard sur chaque page | `index`, `catalogue/index`, `consignation`, `contact` | Patcher |
| Schema.org LocalBusiness sur homepage | `app/pages/index.vue` | Ajouter |
| Schema.org Product sur fiches | `app/pages/catalogue/[slug].vue` | Déjà fait ✅ |
| og:image produit s'affiche sur réseaux sociaux | `catalogue/[slug].vue` | Déjà fait ✅ |

---

## Ordre d'implémentation recommandé

1. `nuxt.config.ts` — bloc `site` + `robots` + `sitemap`
2. `public/_robots.txt` — mise à jour du contenu
3. `server/api/__sitemap/urls.ts` — endpoint produits
4. `app/composables/useSeo.ts` — wrapper + constantes
5. `app/pages/index.vue` — patch ogImage/twitterCard + ajout LocalBusiness JSON-LD
6. `app/pages/catalogue/index.vue`, `consignation.vue`, `contact.vue` — patches ogImage/twitterCard
7. Vérifier `https://cgws.fr/sitemap.xml` et `https://cgws.fr/robots.txt` en preview Vercel
8. Tester le partage produit avec [opengraph.xyz](https://www.opengraph.xyz) ou l'outil de débogage Facebook/LinkedIn
