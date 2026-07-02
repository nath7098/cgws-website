import { joinURL } from 'ufo'
import { createOperationsGenerator, defineProvider } from '@nuxt/image/runtime'

const operationsGenerator = createOperationsGenerator()

export default defineProvider<{ baseURL?: string }>({
  getImage(src, { modifiers, baseURL }) {
    if (!baseURL) {
      // also support runtime config 
      baseURL = useRuntimeConfig().public.supabaseUrl + '/storage/v1/object/public/product-images'
    }

    const operations = operationsGenerator(modifiers)

    return {
      url: joinURL(baseURL, src + (operations ? '?' + operations : ''))
    }
  }
})