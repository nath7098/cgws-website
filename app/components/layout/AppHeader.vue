<script setup lang="ts">
import { useScrollHeader } from '~/composables/useScrollHeader'
import { useCartStore } from '~/stores/cart'
import MobileMenu from './MobileMenu.vue'
import CartDrawer from '../cart/CartDrawer.vue'

const { isScrolled } = useScrollHeader(50)
const isMobileMenuOpen = ref(false)
const isCartOpen = ref(false)
const cart = useCartStore()
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
        ? 'bg-cgws-surface/90 backdrop-blur-md border-cgws-hairline shadow-lg shadow-cgws-ink/20'
        : 'bg-cgws-surface border-cgws-hairline',
    ]"
    style="padding-left: var(--container-px); padding-right: var(--container-px);"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]
             focus:bg-cgws-accent focus:text-cgws-on-accent focus:px-3 focus:py-1
             focus:rounded-sm focus:font-sans focus:text-sm font-semibold"
    >
      Aller au contenu principal
    </a>

    <!-- eslint-disable-next-line nuxt/link-checker/valid-route -->
    <NuxtLink
      to="/"
      class="group flex flex-col items-start gap-0
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
      aria-label="CGWS — Retour à l'accueil"
    >
      <span
        class="font-display text-[24px] lg:text-[28px] leading-none uppercase tracking-[0.2em]
               text-cgws-accent group-hover:text-cgws-ink-soft transition-colors duration-150"
      >
        CGWS
      </span>
      <span
        class="font-sans text-[9px] leading-none uppercase tracking-[0.25em] mt-0.5
               text-cgws-ink-soft group-hover:text-cgws-accent/70 transition-colors duration-150"
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
        class="font-sans text-sm font-medium text-cgws-ink-soft
               hover:text-cgws-accent transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm px-1 py-0.5"
        active-class="text-cgws-accent"
      >
        {{ link.label }}
      </NuxtLink>
      <!-- eslint-enable nuxt/link-checker/valid-route -->
    </nav>

    <div class="flex items-center gap-2">
      <div class="hidden lg:flex">
        <ThemeSwitcher />
      </div>

      <a
        href="tel:+33247XXXXXX"
        class="hidden lg:flex items-center justify-center w-9 h-9
               text-cgws-ink-soft hover:text-cgws-accent transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
        aria-label="Appeler la boutique"
        title="02 47 XX XX XX"
      >
        <UIcon name="i-lucide-phone" class="w-5 h-5" aria-hidden="true" />
      </a>

      <button
        type="button"
        class="relative flex items-center justify-center w-11 h-11 lg:w-9 lg:h-9
               text-cgws-ink-soft hover:text-cgws-accent transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
        aria-label="Ouvrir le panier"
        aria-haspopup="dialog"
        @click="isCartOpen = true"
      >
        <UIcon name="i-lucide-shopping-basket" class="w-5 h-5" aria-hidden="true" />
        <!-- Compteur : ClientOnly — le panier vit dans localStorage, inconnu au SSR
             (évite tout hydration mismatch, cf. app/stores/cart.ts). -->
        <ClientOnly>
          <span
            v-if="cart.count > 0"
            class="absolute top-0.5 right-0.5 lg:-top-1 lg:-right-1 min-w-[18px] h-[18px] px-1
                   flex items-center justify-center rounded-full
                   bg-cgws-accent text-cgws-on-accent font-sans font-bold text-[10px] tabular-nums leading-none"
          >
            {{ cart.count }}
            <span class="sr-only">article{{ cart.count > 1 ? 's' : '' }} dans le panier</span>
          </span>
        </ClientOnly>
      </button>

      <button
        type="button"
        class="lg:hidden flex items-center justify-center w-11 h-11 -mr-2.5
               text-cgws-ink-soft hover:text-cgws-accent transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:rounded-sm"
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
    <CartDrawer v-model:open="isCartOpen" />
  </header>
</template>
