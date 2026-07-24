// https://nuxt.com/docs/api/configuration/nuxt-config
// Libellés de marque : source unique app/utils/brand.ts (US-106).
import { BRAND_NAME, BRAND_BASELINE } from './app/utils/brand'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.NUXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    // Stripe secret — serveur uniquement (clé secrète + secret de webhook)
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    // TODO: set CGWS_CAMILLE_EMAIL env var in production (replace placeholder)
    camilleEmail: process.env.CGWS_CAMILLE_EMAIL ?? 'nathcouton@gmail.com',
    // Expéditeur unique de TOUS les emails transactionnels (US-092).
    // Fallback : domaine de test Resend (seul expéditeur qui fonctionne tant
    // que cgws.fr n'est pas vérifié dans Resend). Bascule vers
    // 'CGWS <noreply@cgws.fr>' par SEUL changement de cette env var — zéro
    // modification de code. Prérequis : domaine vérifié dans Resend (DNS).
    emailFrom: process.env.CGWS_EMAIL_FROM ?? 'CGWS <onboarding@resend.dev>',
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://cgws.fr',
      // Stripe publishable key — nécessaire côté client pour monter le
      // Checkout embarqué (pk_...). Publique par nature (aucun secret).
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
      // PostHog — mesure d'audience cookieless (US-102). Clé PROJET publique
      // (phc_...) ; absente en dev/preview → le plugin est un no-op silencieux.
      // Hébergement UE obligatoire (exemption CNIL, données dans l'UE).
      posthogKey: process.env.NUXT_PUBLIC_POSTHOG_KEY ?? '',
      posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    },
  },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/image', '@nuxtjs/google-fonts', '@nuxtjs/seo', '@nuxt/eslint', '@vueuse/nuxt'],

  googleFonts: {
    families: {
      'Rye': true,
      'Playfair Display': { wght: [400, 600, 700], ital: [400] },
      'Inter': [400, 500, 700],
    },
    display: 'swap',
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false,
    // Le programme TS `node` (.nuxt/tsconfig.node.json) type-check le provider
    // Nuxt Image custom (via la référence .nuxt/image/providers.d.ts générée
    // par @nuxt/image) sans disposer des globaux d'auto-import de l'app. On
    // lui fournit la déclaration ambiante truthful de `useRuntimeConfig`
    // (voir types/nuxt-image-provider.d.ts — programme node uniquement).
    nodeTsConfig: {
      include: ['../types/nuxt-image-provider.d.ts'],
    },
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  image: {
    quality: 85,
    format: ['webp', 'jpeg'],
    // Custom screens covering the required 400w / 800w / 1200w / 1600w srcset range
    screens: {
      xs: 400,
      sm: 800,
      md: 1200,
      lg: 1600,
    },
    providers: {
      supabase: {
        name: 'supabase',
        provider: '~/providers/supabase-provider.ts',
        // Pas d'options.baseURL ici (issue #6). La valeur serait figée au BUILD
        // depuis process.env.NUXT_PUBLIC_SUPABASE_URL, non garanti côté Vercel au
        // build → l'URL d'image devenait relative/cassée alors que les données du
        // catalogue passaient (elles, résolues au RUNTIME via runtimeConfig).
        // Le provider résout donc baseURL au runtime via useRuntimeConfig().
        // L'ancien bloc top-level `supabase: { baseURL: render/image/... }` est
        // supprimé : il baked une URL de build et détournait vers l'endpoint de
        // transformation.
        options: {},
      },
    },
  },

  site: {
    // url : domaine canonique inchangé ici (bascule = US-107, pilotée par
    // NUXT_PUBLIC_SITE_URL). name = marque commerciale → alimente og:site_name.
    url: 'https://cgws.fr',
    name: BRAND_NAME,
    description: `${BRAND_BASELINE} à Brèches, Indre-et-Loire.`,
    defaultLocale: 'fr',
  },

  robots: {
    disallow: ['/admin', '/api'],
    sitemap: '/sitemap_index.xml',
  },

  sitemap: {
    urls: [
      { loc: '/', changefreq: 'weekly', priority: 1.0 },
      { loc: '/catalogue', changefreq: 'daily', priority: 0.9 },
      { loc: '/depot-vente', changefreq: 'monthly', priority: 0.6 },
      { loc: '/contact', changefreq: 'monthly', priority: 0.5 },
      { loc: '/mentions-legales', changefreq: 'yearly', priority: 0.1 },
    ],
    sources: ['/api/__sitemap/urls'],
    exclude: ['/admin/**', '/api/**', '/dev-components'],
  },

  routeRules: {
    // Nuxt built assets have content-hash filenames — safe to cache immutably
    '/_nuxt/**': {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
    // Redirection 301 permanente de l'ancienne URL /consignation vers la
    // nouvelle /depot-vente (renommage du terme de façade). Préserve le SEO et
    // les liens externes existants. `statusCode` = clé attendue par la version
    // de Nitro embarquée ici (le renommage en `status` est postérieur).
    '/consignation': {
      redirect: { to: '/depot-vente', statusCode: 301 },
    },
  },

  nitro: {
    minify: true,
    compressPublicAssets: { gzip: true, brotli: true },
    externals: {
      // pdfmake is a CJS-only package; prevent Nitro from bundling it
      // so Node.js resolves it at runtime from node_modules.
      // papaparse ships a UMD bundle Rollup's parser cannot process (US-063),
      // so it is likewise resolved at runtime rather than bundled.
      external: ['pdfmake', 'papaparse'],
    },
  },
})