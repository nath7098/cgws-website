<template>
  <footer
    class="bg-cgws-tack border-t border-cgws-copper/30 py-8"
    :style="{ paddingLeft: 'var(--container-px)', paddingRight: 'var(--container-px)' }"
  >
    <!-- eslint-disable link-checker/valid-route link-checker/valid-sitemap-link -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <span class="font-display text-xl text-cgws-copper tracking-widest uppercase">CGWS</span>
        <p class="font-sans text-sm text-cgws-rope mt-1">Brèches, 37 — Indre-et-Loire</p>
      </div>

      <nav class="flex flex-wrap gap-4 md:gap-6" aria-label="Navigation secondaire">
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

      <p class="font-sans text-sm text-cgws-rope">
        © 2026 CGWS — Mentions légales
      </p>
    </div>
    <!-- eslint-enable link-checker/valid-route link-checker/valid-sitemap-link -->
  </footer>
</template>
