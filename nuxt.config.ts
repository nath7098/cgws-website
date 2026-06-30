// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

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
