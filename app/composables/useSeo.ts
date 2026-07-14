export const SITE_NAME = 'CGWS — Camille Guignon Western Shop'
export const SITE_URL = 'https://cgws.fr'

/**
 * Temporary OG image fallback using the hero Unsplash photo.
 * Replace with a local `/og-default.jpg` (1200×630 px, branded) once
 * Camille provides the asset: `cp <branded.jpg> public/og-default.jpg`
 * and update this constant to `'/og-default.jpg'`.
 */
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&auto=format&fit=crop'

interface PageSeoOptions {
  /** Page title without the " | CGWS" suffix */
  title: string
  /** Meta description — max 160 characters */
  description: string
  /** Absolute URL or public path (/...). Falls back to DEFAULT_OG_IMAGE. */
  image?: string
  type?: 'website' | 'product' | 'article'
}

function resolveOgImage(image: string | undefined, baseUrl: string): string {
  if (!image) {
    return DEFAULT_OG_IMAGE.startsWith('http')
      ? DEFAULT_OG_IMAGE
      : `${baseUrl}${DEFAULT_OG_IMAGE}`
  }
  return image.startsWith('http') ? image : `${baseUrl}${image}`
}

export function usePageSeo({
  title,
  description,
  image,
  type = 'website',
}: PageSeoOptions): void {
  const config = useRuntimeConfig()
  const baseUrl = (config.public.siteUrl as string) || SITE_URL
  const resolvedImage = resolveOgImage(image, baseUrl)

  useSeoMeta({
    title: `${title} | ${SITE_NAME}`,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: resolvedImage,
    twitterCard: 'summary_large_image',
    twitterImage: resolvedImage,
  })

  // `og:type: product` (extension OG commerce) n'appartient pas à l'union
  // stricte typée par unhead v2 pour `ogType` — on passe par une entrée meta
  // brute de useHead, l'échappatoire documentée d'unhead pour les valeurs
  // hors schéma (aucun cast nécessaire).
  useHead({
    meta: [{ property: 'og:type', content: type }],
  })
}
