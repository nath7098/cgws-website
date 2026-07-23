<script setup lang="ts">
import { getLocalBusinessSchema } from '~/utils/localBusinessSchema'
import { BRAND_NAME } from '~/utils/brand'

useSeoMeta({
  title: 'Sellerie western & reining à Brèches (37)',
  description:
    `${BRAND_NAME} — équipements équestres western neufs et occasion : selles, brides, bottes, vêtements et service de consignation à Brèches, Indre-et-Loire.`,
  ogTitle: `${BRAND_NAME} — Sellerie western & reining à Brèches (37)`,
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
      // Schéma partagé avec app/pages/a-propos.vue (US-099) — voir
      // app/utils/localBusinessSchema.ts, source unique de vérité.
      innerHTML: JSON.stringify(getLocalBusinessSchema()),
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
