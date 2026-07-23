<script setup lang="ts">
import { getLocalBusinessSchema } from '~/utils/localBusinessSchema'
import { BRAND_NAME } from '~/utils/brand'

useSeoMeta({
  title: 'Sellerie western & reining à Brèches (37)',
  description:
    `${BRAND_NAME} — la boutique de la spécialiste reining : selles, bridonnerie et équipement western testés et approuvés, plus le dépôt-vente de selles, à Brèches, Indre-et-Loire.`,
  ogTitle: `${BRAND_NAME} — Sellerie western & reining à Brèches (37)`,
  ogDescription:
    'La boutique de la spécialiste reining. Une sélection courte, testée et approuvée par Camille, et le dépôt-vente de selles.',
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
    <!-- Nouvelle hiérarchie reining-first (US-108) :
         hero reining → catalogue → curation → consignation → histoire.
         La consignation reste un pilier visible, mais APRÈS la boutique. -->
    <HeroSection />
    <StarDivider />
    <FeaturedProducts />
    <StarDivider />
    <CurationPromise />
    <!-- Divider posé sous CurationPromise (bg surface) — même règle que
         consignation.vue : la bande du diviseur reprend le fond de la section
         qui la précède pour une transition sans couture. -->
    <StarDivider bg-class="bg-cgws-surface" />
    <ConsignmentPillar />
    <StarDivider />
    <StatsBar />
    <StarDivider />
    <OurStorySection />
    <StarDivider />
  </main>
</template>
