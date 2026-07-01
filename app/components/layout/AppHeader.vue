<script setup lang="ts">
import { NuxtLink } from '#imports'
import { useScrollHeader } from '~/composables/useScrollHeader'
import MobileMenu from './MobileMenu.vue'

const { isScrolled } = useScrollHeader(50)
const isMobileMenuOpen = ref(false)
const route = useRoute()

type NavLink = { label: string; to: string }
const navLinks: NavLink[] = [
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'Consignation', to: '/consignation' },
  { label: 'À Propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' },
]

function isActive(to: string): boolean {
  return route.path === to || (to !== '/' && route.path.startsWith(to))
}

watch(route, () => {
  isMobileMenuOpen.value = false
})
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 h-14 lg:h-16 flex items-center justify-between',
      'border-b transition-all duration-300 ease-in-out',
      isScrolled
        ? 'bg-cgws-tack/90 backdrop-blur-md border-cgws-leather/50 shadow-lg shadow-cgws-charcoal/20'
        : 'bg-cgws-tack border-cgws-leather/30',
    ]"
    style="padding-left: var(--container-px); padding-right: var(--container-px);"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]
             focus:bg-cgws-copper focus:text-cgws-charcoal focus:px-3 focus:py-1
             focus:rounded-sm focus:font-sans focus:text-sm font-semibold"
    >
      Aller au contenu principal
    </a>

    <!-- eslint-disable-next-line nuxt/link-checker/valid-route -->
    <NuxtLink
      to="/"
      class="group flex flex-col items-start gap-0
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm"
      aria-label="CGWS — Retour à l'accueil"
    >
      <span
        class="font-display text-[24px] lg:text-[28px] leading-none uppercase tracking-[0.2em]
               text-cgws-copper group-hover:text-cgws-rope transition-colors duration-150"
      >
        CGWS
      </span>
      <span
        class="font-sans text-[9px] leading-none uppercase tracking-[0.25em] mt-0.5
               text-cgws-rope group-hover:text-cgws-copper/70 transition-colors duration-150"
        aria-hidden="true"
      >
        Sellerie · Brèches
      </span>
    </NuxtLink>

    <nav class="hidden lg:flex items-center gap-8" aria-label="Navigation principale">
      <!-- eslint-disable nuxt/link-checker/valid-route -->
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :aria-current="isActive(link.to) ? 'page' : undefined"
        class="font-sans text-sm font-medium text-cgws-rope
               hover:text-cgws-copper transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm px-1 py-0.5"
        active-class="text-cgws-copper"
      >
        {{ link.label }}
      </NuxtLink>
      <!-- eslint-enable nuxt/link-checker/valid-route -->
    </nav>

    <div class="flex items-center gap-2">
      <a
        href="tel:+33247XXXXXX"
        class="hidden lg:flex items-center justify-center w-9 h-9
               text-cgws-rope hover:text-cgws-copper transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper rounded-sm"
        aria-label="Appeler la boutique"
        title="02 47 XX XX XX"
      >
        <UIcon name="i-lucide-phone" class="w-5 h-5" aria-hidden="true" />
      </a>

      <button
        type="button"
        class="lg:hidden flex items-center justify-center w-11 h-11 -mr-2.5
               text-cgws-rope hover:text-cgws-copper transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:rounded-sm"
        :aria-expanded="isMobileMenuOpen"
        :aria-label="isMobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'"
        aria-controls="mobile-menu"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <UIcon
          :name="isMobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
          class="w-5 h-5 transition-transform duration-200"
          aria-hidden="true"
        />
      </button>
    </div>

    <MobileMenu v-model:open="isMobileMenuOpen" />
  </header>
</template>
