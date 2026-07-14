import { joinURL } from 'ufo'
import { createOperationsGenerator, defineProvider } from '@nuxt/image/runtime'

const operationsGenerator = createOperationsGenerator()

export default defineProvider<{ baseURL?: string }>({
  getImage(src, { modifiers, baseURL }) {
    if (!baseURL) {
      // `useRuntimeConfig` volontairement en auto-import (pattern officiel
      // @nuxt/image pour les providers custom) : le bundler le résout vers la
      // bonne implémentation dans CHAQUE bundle (vue app ET nitro). Un import
      // statique explicite casse l'un ou l'autre : `#imports` tire le barrel
      // des composables app dans les programmes TS shared/node (sans globaux),
      // `nuxt/app`/`#app` sont interdits dans le bundle serveur nitro (plugin
      // impound). Le programme TS `node` — qui type ce fichier via
      // .nuxt/image/providers.d.ts sans avoir les globaux d'auto-import —
      // reçoit la déclaration ambiante types/nuxt-image-provider.d.ts
      // (branchée via typescript.nodeTsConfig dans nuxt.config.ts).
      baseURL = useRuntimeConfig().public.supabaseUrl + '/storage/v1/object/public/product-images'
    }

    // Strip any stray non-ASCII from the base URL (issue #6). A UTF-8 BOM
    // (U+FEFF) prefixing NUXT_PUBLIC_SUPABASE_URL makes the string start with a
    // non-scheme char, so the browser treats the whole `src` as RELATIVE and
    // resolves it against the site origin → every image 404s. Mirrors the
    // sanitize in useSupabase(); a clean URL is unaffected (no-op).
    baseURL = baseURL.replace(/[^\x21-\x7E]/g, '')

    const operations = operationsGenerator(modifiers)

    return {
      url: joinURL(baseURL, src + (operations ? '?' + operations : '')),
    }
  },
})