import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Config Vitest volontairement légère (pas de @nuxt/test-utils) : les tests
// unitaires ciblent la logique métier pure (#shared/utils/checkout) et le store
// Pinia du panier, sans démarrer Nuxt. Les alias reproduisent ceux du projet.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
  },
})
