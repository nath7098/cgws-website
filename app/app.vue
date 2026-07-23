<script setup lang="ts">
import type { TransitionProps } from 'vue'

const pageTransition: TransitionProps = {
  name: 'page',
  mode: 'out-in',
  appear: false,
}

// Anti-flash — axe "peau" (US-071, DESIGN_SYSTEM_v3.md §6.2).
// L'axe jour/nuit est déjà couvert nativement par @nuxtjs/color-mode (script
// bloquant injecté automatiquement par le module). L'axe peau
// (elegante/rugueux) est un besoin métier CGWS sans équivalent natif : ce
// script bloquant, synchrone (ni async ni defer), lit localStorage['cgws-skin']
// et pose l'attribut `data-skin` sur <html> avant le premier paint, pour
// qu'aucun flash de la peau par défaut ne soit visible avant bascule.
// `tagPriority: 'critical'` (API Unhead, confirmée via node_modules/unhead)
// hisse ce script tôt dans <head>, avant les feuilles de style.
useHead({
  script: [
    {
      key: 'cgws-skin-anti-flash',
      tagPriority: 'critical',
      innerHTML: `(function(){try{var s=window.localStorage.getItem('cgws-skin');document.documentElement.setAttribute('data-skin', s==='rugueux'?'rugueux':'elegante');}catch(e){}})();`,
    },
  ],
})

// Identité de marque « Spin & Slide » (US-106) — source unique app/utils/brand.ts.
// • titleTemplate : « %s · Spin & Slide Shop » par page ; sur une page sans titre
//   propre, le titre par défaut porte à la fois la marque ET le signal SEO
//   « Sellerie western & reining » (baseline conservée malgré le retrait de
//   « western » du nom).
// • Favicon SVG PROVISOIRE (public/favicon.svg — traces de sliding stop) ; le
//   favicon .ico historique reste en fallback pour les vieux clients.
useHead({
  titleTemplate: (titleChunk?: string | null) =>
    titleChunk ? `${titleChunk} · ${BRAND_TITLE_SUFFIX}` : BRAND_DEFAULT_TITLE,
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
})
useSeoMeta({ ogSiteName: BRAND_NAME })
</script>

<template>
  <div>
    <NuxtLoadingIndicator color="#B8650A" :height="3" :duration="2000" :throttle="200" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </div>
</template>
