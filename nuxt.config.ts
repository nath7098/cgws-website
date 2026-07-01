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
})
