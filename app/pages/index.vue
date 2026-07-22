<script setup lang="ts">

useSeoMeta({
  title: 'CGWS — Sellerie Équestre Western à Brèches (37)',
  description:
    'Camille Guignon Western Shop — équipements équestres western neufs et occasion : selles, brides, bottes, vêtements et service de consignation à Brèches, Indre-et-Loire.',
  ogTitle: 'CGWS — Sellerie Équestre Western à Brèches (37)',
  ogDescription:
    'Découvrez notre sélection d\'équipements western authentiques. Vente neuf, occasion et service de consignation de selles.',
  ogType: 'website',
  ogImage: DEFAULT_OG_IMAGE,
  twitterCard: 'summary_large_image',
  twitterImage: DEFAULT_OG_IMAGE,
})

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80&auto=format&fit=crop',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'CGWS — Camille Guignon Western Shop',
        description:
          "Boutique d'équipements équestres western : selles, brides, bottes, vêtements et service de consignation.",
        url: 'https://cgws.fr',
        image: DEFAULT_OG_IMAGE,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Brèches',
          postalCode: '37220',
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
      }),
    },
  ],
})
</script>

<template>
  <main>
    <HeroSection />
    <StarDivider />
    <StatsBar />
    <StarDivider />
    <OurStorySection />
    <StarDivider />
  </main>
</template>
