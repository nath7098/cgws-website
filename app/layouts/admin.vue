<script setup lang="ts">
const route = useRoute()
const { user, userInitials, logout } = useAdminAuth()

// Drawer state
const isSidebarOpen = ref(false)

function openSidebar() {
  isSidebarOpen.value = true
}

function closeSidebar() {
  isSidebarOpen.value = false
}

// Close drawer on route change
watch(() => route.path, () => {
  isSidebarOpen.value = false
})

// Close drawer on Escape key + focus trap
const drawerRef = ref<HTMLElement | null>(null)
const hamburgerRef = ref<HTMLButtonElement | null>(null)

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1)
}

function handleDrawerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeSidebar()
    hamburgerRef.value?.focus()
    return
  }

  if (event.key === 'Tab' && drawerRef.value) {
    const focusable = getFocusableElements(drawerRef.value)
    if (focusable.length === 0) return

    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    }
    else {
      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}

// Move focus into drawer when opened
watch(isSidebarOpen, async (open) => {
  if (open) {
    await nextTick()
    const focusable = drawerRef.value ? getFocusableElements(drawerRef.value) : []
    focusable[0]?.focus()
  }
})

// Resolve page title from route meta or a default
const pageTitle = computed<string>(() => {
  const meta = route.meta as { title?: string }
  return typeof meta.title === 'string' ? meta.title : 'Administration'
})

interface NavLink {
  href: string
  label: string
  icon: string
}

const navLinks: NavLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
  { href: '/admin/produits', label: 'Produits', icon: 'i-lucide-package' },
  { href: '/admin/consignations', label: 'Consignations', icon: 'i-lucide-arrow-left-right' },
  { href: '/admin/ventes', label: 'Ventes', icon: 'i-lucide-receipt' },
  { href: '/admin/clients', label: 'Clients', icon: 'i-lucide-users' },
  { href: '/admin/rapports', label: 'Rapports', icon: 'i-lucide-bar-chart-2' },
]

function isLinkActive(href: string): boolean {
  return route.path.startsWith(href)
}

function navItemClasses(href: string): string {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-sm w-full font-sans text-sm font-medium transition-colors duration-150 text-left'
  if (isLinkActive(href)) {
    return `${base} bg-cgws-copper/15 text-cgws-copper border-l-2 border-cgws-copper`
  }
  return `${base} text-cgws-rope/70 hover:bg-cgws-leather/20 hover:text-cgws-rope`
}
</script>

<template>
  <div class="flex min-h-screen bg-cgws-cream">
    <!-- Skip link for keyboard users -->
    <a
      href="#admin-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-cgws-copper focus:text-cgws-charcoal focus:rounded-sm focus:font-sans focus:text-sm focus:font-medium"
    >
      Aller au contenu
    </a>

    <!-- ═══════════════════════════════════════════════════════ SIDEBAR DESKTOP -->
    <aside
      class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-cgws-tack overflow-y-auto"
      aria-label="Navigation administration"
    >
      <!-- Wordmark -->
      <div class="px-4 pt-5 pb-4 flex-shrink-0">
        <span class="font-display text-2xl text-cgws-copper tracking-wider">CGWS</span>
        <span class="block font-sans text-xs text-cgws-rope uppercase tracking-widest mt-0.5">Admin</span>
      </div>

      <!-- Separator -->
      <div class="border-t border-cgws-leather/30 mx-4 mb-3" aria-hidden="true" />

      <!-- Nav links -->
      <nav aria-label="Navigation administration" class="flex-1 px-2 space-y-0.5">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          :class="navItemClasses(link.href)"
          :aria-current="isLinkActive(link.href) ? 'page' : undefined"
        >
          <UIcon :name="link.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Logout -->
      <div class="flex-shrink-0 px-2 pb-5 mt-auto">
        <div class="border-t border-cgws-leather/30 mb-3" aria-hidden="true" />
        <button
          type="button"
          class="flex items-center gap-3 px-4 py-2.5 rounded-sm w-full font-sans text-sm font-medium transition-colors duration-150 text-cgws-rope/50 hover:bg-cgws-rust/10 hover:text-cgws-rust"
          aria-label="Se déconnecter du backoffice"
          @click="logout()"
        >
          <UIcon name="i-lucide-log-out" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- ═══════════════════════════════════════════════════════ MOBILE DRAWER OVERLAY -->
    <Transition name="backdrop">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-cgws-charcoal/50 z-30 lg:hidden"
        aria-hidden="true"
        @click="closeSidebar()"
      />
    </Transition>

    <!-- ═══════════════════════════════════════════════════════ MOBILE DRAWER -->
    <div
      id="admin-sidebar"
      ref="drawerRef"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      :aria-hidden="!isSidebarOpen"
      :class="[
        'fixed left-0 top-0 h-full w-72 bg-cgws-tack z-40 flex flex-col lg:hidden',
        'transform transition-transform duration-300 ease-in-out overflow-y-auto',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
      @keydown="handleDrawerKeydown"
    >
      <!-- Drawer header -->
      <div class="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <span class="font-display text-2xl text-cgws-copper tracking-wider">CGWS</span>
          <span class="block font-sans text-xs text-cgws-rope uppercase tracking-widest mt-0.5">Admin</span>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-sm text-cgws-rope/70 hover:text-cgws-rope hover:bg-cgws-leather/20 transition-colors duration-150"
          aria-label="Fermer le menu"
          @click="closeSidebar()"
        >
          <UIcon name="i-lucide-x" class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Separator -->
      <div class="border-t border-cgws-leather/30 mx-4 mb-3" aria-hidden="true" />

      <!-- Nav links -->
      <nav aria-label="Navigation administration" class="flex-1 px-2 space-y-0.5">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          :class="navItemClasses(link.href)"
          :aria-current="isLinkActive(link.href) ? 'page' : undefined"
        >
          <UIcon :name="link.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Logout in drawer -->
      <div class="flex-shrink-0 px-2 pb-5 mt-auto">
        <div class="border-t border-cgws-leather/30 mb-3" aria-hidden="true" />
        <button
          type="button"
          class="flex items-center gap-3 px-4 py-2.5 rounded-sm w-full font-sans text-sm font-medium transition-colors duration-150 text-cgws-rope/50 hover:bg-cgws-rust/10 hover:text-cgws-rust"
          aria-label="Se déconnecter du backoffice"
          @click="logout()"
        >
          <UIcon name="i-lucide-log-out" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ MAIN AREA -->
    <div class="flex-1 lg:pl-64 flex flex-col min-h-screen">
      <!-- Topbar -->
      <header
        role="banner"
        class="h-14 bg-cgws-parchment border-b border-cgws-leather/40 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20"
      >
        <!-- Left: hamburger (mobile) + page title -->
        <div class="flex items-center gap-3">
          <button
            ref="hamburgerRef"
            type="button"
            class="lg:hidden p-1.5 rounded-sm text-cgws-tack hover:bg-cgws-leather/10 transition-colors duration-150"
            :aria-expanded="isSidebarOpen"
            aria-controls="admin-sidebar"
            aria-label="Ouvrir le menu"
            @click="openSidebar()"
          >
            <UIcon name="i-lucide-menu" class="w-5 h-5" aria-hidden="true" />
          </button>
          <span class="font-serif font-semibold text-base text-cgws-charcoal">{{ pageTitle }}</span>
        </div>

        <!-- Right: email + avatar -->
        <div class="flex items-center gap-2">
          <span
            v-if="user?.email"
            class="hidden sm:block font-sans text-xs text-cgws-leather"
          >
            {{ user.email }}
          </span>
          <div
            class="w-8 h-8 rounded-full bg-cgws-copper flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span class="font-display text-sm text-cgws-charcoal leading-none">{{ userInitials }}</span>
          </div>
        </div>
      </header>

      <!-- Content area -->
      <main
        id="admin-content"
        role="main"
        class="flex-1 p-4 md:p-6 lg:p-8 overflow-auto"
      >
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease-in-out;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
