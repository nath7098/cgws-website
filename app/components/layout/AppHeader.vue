<template>
  <header
    class="sticky top-0 z-50 bg-cgws-tack border-b border-cgws-leather/30 h-16 flex items-center justify-between transition-all duration-200"
    :style="{ paddingLeft: 'var(--container-px)', paddingRight: 'var(--container-px)' }"
  >
    <!-- eslint-disable link-checker/valid-route link-checker/valid-sitemap-link -->
    <NuxtLink
      to="/"
      class="font-display text-2xl text-cgws-copper tracking-widest uppercase hover:text-cgws-rope transition-colors duration-150"
      aria-label="CGWS — Retour à l'accueil"
    >
      CGWS
    </NuxtLink>

    <nav class="hidden md:flex items-center gap-6" aria-label="Navigation principale">
      <NuxtLink
        to="/catalogue"
        class="font-sans text-sm text-cgws-rope hover:text-cgws-copper transition-colors duration-150"
      >
        Catalogue
      </NuxtLink>
      <NuxtLink
        to="/consignation"
        class="font-sans text-sm text-cgws-rope hover:text-cgws-copper transition-colors duration-150"
      >
        Consignation
      </NuxtLink>
      <NuxtLink
        to="/contact"
        class="font-sans text-sm text-cgws-rope hover:text-cgws-copper transition-colors duration-150"
      >
        Contact
      </NuxtLink>
    </nav>
    <!-- eslint-enable link-checker/valid-route link-checker/valid-sitemap-link -->
  </header>
</template>
