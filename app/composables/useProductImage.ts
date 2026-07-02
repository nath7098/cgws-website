/**
 * Converts a full Supabase Storage public URL to a relative path for use
 * with `provider="supabase"` in <NuxtImg> / <NuxtPicture>.
 *
 * Input:  https://xxx.supabase.co/storage/v1/object/public/product-images/products/abc/file.jpg
 * Output: { src: '/products/abc/file.jpg', provider: 'supabase' }
 *
 * For any URL that does not match the Supabase Storage pattern, the original
 * URL is returned without a provider so the default (ipx) handles it.
 */

const BUCKET_MARKER = '/storage/v1/object/public/product-images'

export interface ProductImageData {
  src: string
  provider?: string
}

export function useProductImage() {
  /**
   * Returns NuxtImg-compatible `src` + optional `provider` for a given URL.
   * Spread the result with `v-bind` on <NuxtImg> / <NuxtPicture>.
   */
  function imageProps(url: string): ProductImageData {
    const idx = url.indexOf(BUCKET_MARKER)
    if (idx === -1) return { src: url }
    return {
      src: url.slice(idx + BUCKET_MARKER.length),
      provider: 'supabase',
    }
  }

  return { imageProps }
}
