import { BRAND_NAME } from '~/utils/brand'

// Nom de site = marque commerciale « Spin & Slide Shop » (source unique :
// app/utils/brand.ts). Utilisé comme fallback du og:site_name.
export const SITE_NAME = BRAND_NAME
export const SITE_URL = 'https://cgws.fr'

/**
 * Image OG par défaut — wordmark PROVISOIRE « Spin & Slide » (US-106),
 * rasterisé depuis `public/og-default.svg` vers `public/og-default.png`
 * (1200×630 px, palette design system v2). À remplacer par l'asset OG
 * définitif fourni par le design/Camille — remplacer le fichier
 * `public/og-default.png` suffit, cette constante reste inchangée.
 */
export const DEFAULT_OG_IMAGE = '/og-default.png'

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
    // Pas de concaténation manuelle du suffixe ici : @nuxtjs/seo applique
    // déjà son `titleTemplate` global (basé sur `site.name`, nuxt.config.ts)
    // à tout titre défini via useSeoMeta/useHead. Un titre déjà suffixé en
    // dur ici produisait un double suffixe " | CGWS — ... | CGWS — ..." sur
    // la page qui a révélé le bug (US-099, /a-propos) — cf. contact.vue et
    // consignation.vue, qui passent déjà un titre brut sans suffixe.
    title,
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
