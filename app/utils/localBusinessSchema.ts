// app/utils/localBusinessSchema.ts
// JSON-LD `LocalBusiness` partagé — source unique de vérité pour les
// coordonnées de la boutique CGWS à Brèches (37).
//
// Historique : ce schéma existait uniquement dans `app/pages/index.vue`
// (US-090). US-099 (page /a-propos) a besoin exactement du même balisage
// structuré — plutôt que de le dupliquer avec un risque de divergence
// future (adresse, horaires...), il est factorisé ici. Toute page qui
// déclare un JSON-LD `LocalBusiness` DOIT consommer cette fonction.
//
// ⚠️ `getLocalBusinessSchema()` doit rester un remplacement 1:1 de l'objet
// précédemment inline dans `index.vue` — ne pas faire diverger les valeurs
// sans mettre à jour les deux usages en connaissance de cause.
export interface LocalBusinessSchema {
  '@context': string
  '@type': string
  name: string
  alternateName: string
  legalName: string
  description: string
  url: string
  image: string
  address: {
    '@type': string
    addressLocality: string
    postalCode: string
    addressCountry: string
  }
  openingHoursSpecification: Array<{
    '@type': string
    dayOfWeek: string[]
    opens: string
    closes: string
  }>
  priceRange: string
  currenciesAccepted: string
  paymentAccepted: string
}

export function getLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    // Nom commercial « Spin & Slide Shop » ; l'endossement/raison sociale CGWS
    // reste porté par alternateName/legalName (source : app/utils/brand.ts).
    name: BRAND_NAME,
    alternateName: BRAND_LOCKUP,
    legalName: BRAND_LEGAL_NAME,
    description:
      'Sellerie western & reining à Brèches (37) : selles neuves & occasion, '
      + 'bridonnerie, accessoires et service de dépôt-vente de selles.',
    url: 'https://cgws.fr',
    image: DEFAULT_OG_IMAGE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Brèches',
      postalCode: '37330',
      addressCountry: 'FR',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
  }
}
