import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Config Vitest volontairement légère (pas de @nuxt/test-utils) : les tests
// unitaires ciblent la logique métier pure (#shared/utils/checkout), le store
// Pinia du panier, et (US-091) le chemin de paiement serveur (fulfillment,
// réservation, routage webhook) importé directement depuis `server/`, sans
// démarrer Nuxt/Nitro. Les alias reproduisent ceux du projet — `~~` (rootDir)
// est nécessaire pour résoudre les imports de `server/utils/fulfillment.ts`
// (ex. `~~/server/services/email`) lorsqu'il est importé tel quel par les tests.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
  },
})
