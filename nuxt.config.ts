// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    // TODO: set CGWS_CAMILLE_EMAIL env var in production (replace placeholder)
    camilleEmail: process.env.CGWS_CAMILLE_EMAIL ?? 'nathcouton@gmail.com',
    public: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://cgws.fr',
    },
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/image',
    '@nuxtjs/google-fonts',
    '@nuxtjs/seo',
    '@nuxt/eslint',
  ],

  googleFonts: {
    families: {
      'Bebas Neue': true,
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
  },

  image: {
    quality: 85,
    format: ['webp', 'jpeg'],
  },

  site: {
    url: 'https://cgws.fr',
    name: 'CGWS — Camille Guignon Western Shop',
    description:
      'Sellerie équestre western à Brèches, Indre-et-Loire. Vente neuf & occasion, service de consignation de selles.',
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
      { loc: '/consignation', changefreq: 'monthly', priority: 0.6 },
      { loc: '/contact', changefreq: 'monthly', priority: 0.5 },
      { loc: '/mentions-legales', changefreq: 'yearly', priority: 0.1 },
    ],
    sources: ['/api/__sitemap/urls'],
    exclude: ['/admin/**', '/api/**', '/dev-components'],
  },
})
