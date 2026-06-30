<script setup lang="ts">
useSeoMeta({
  title: 'CGWS — Sellerie Équestre Western à Brèches (37)',
  description:
    'Camille Guignon Western Shop — équipements équestres western neufs et occasion : selles, brides, bottes, vêtements et service de consignation à Brèches, Indre-et-Loire.',
  ogTitle: 'CGWS — Sellerie Équestre Western à Brèches (37)',
  ogDescription:
    'Découvrez notre sélection d\'équipements western authentiques. Vente neuf, occasion et service de consignation de selles.',
  ogType: 'website',
})

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80&auto=format&fit=crop',
    },
  ],
})
</script>

<template>
  <main>
    <HeroSection />
    <StatsBar />
  </main>
</template>
