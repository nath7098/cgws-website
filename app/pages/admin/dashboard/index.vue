<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Dashboard',
})

useSeoMeta({
  title: 'Dashboard — CGWS Administration',
  robots: 'noindex, nofollow',
})

const { initSession } = useAdminAuth()
await initSession()
</script>

<template>
  <div>
    <h2 class="font-serif font-bold text-2xl text-cgws-charcoal mb-6">
      Tableau de bord
    </h2>
    <p class="font-sans text-sm text-cgws-leather">
      Bienvenue dans le backoffice CGWS. Utilisez la navigation pour gérer les produits, consignations, ventes et clients.
    </p>
  </div>
</template>
