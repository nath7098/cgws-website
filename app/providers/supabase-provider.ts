import { joinURL } from 'ufo'
import { createOperationsGenerator, defineProvider } from '@nuxt/image/runtime'

const operationsGenerator = createOperationsGenerator()

export default defineProvider<{ baseURL?: string }>({
  getImage(src, { modifiers, baseURL }) {
    if (!baseURL) {
      // also support runtime config
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