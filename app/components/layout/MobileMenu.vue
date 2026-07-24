<script setup lang="ts">
import gsap from 'gsap'
import { BRAND_SHORT, BRAND_ENDORSEMENT } from '~/utils/brand'
import CgwsButton from '../ui/CgwsButton.vue';

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const route = useRoute()

const panelRef = ref<HTMLDivElement | null>(null)
const backdropRef = ref<HTMLDivElement | null>(null)

const isVisible = ref(false)
let isClosing = false

type NavLink = { label: string; to: string }
const navLinks: NavLink[] = [
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'Dépôt-vente', to: '/depot-vente' },
  { label: 'À Propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' },
]

function isActive(to: string): boolean {
  return route.path === to || (to !== '/' && route.path.startsWith(to))
}

async function show() {
  isVisible.value = true
  await nextTick()

  if (!panelRef.value || !backdropRef.value) return

  document.body.style.overflow = 'hidden'

  const links = Array.from(panelRef.value.querySelectorAll<HTMLElement>('.mobile-nav-link'))

  gsap.fromTo(
    panelRef.value,
    { xPercent: 100 },
    { xPercent: 0, duration: 0.35, ease: 'power2.out' },
  )
  gsap.fromTo(backdropRef.value, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' })
  gsap.fromTo(links, { opacity: 0, x: 16 }, {
    opacity: 1,
    x: 0,
    stagger: 0.06,
    delay: 0.15,
    duration: 0.22,
    ease: 'power1.out',
  })

  panelRef.value?.querySelector<HTMLElement>('button')?.focus()
}

function close() {
  if (isClosing || !panelRef.value) return
  isClosing = true

  const links = Array.from(panelRef.value.querySelectorAll<HTMLElement>('.mobile-nav-link'))

  const done = () => {
    isClosing = false
    isVisible.value = false
    document.body.style.overflow = ''
    emit('update:open', false)
    document.querySelector<HTMLElement>('[aria-controls="mobile-menu"]')?.focus()
  }

  gsap.to(links, { opacity: 0, x: 16, stagger: 0.03, duration: 0.15, ease: 'power1.in' })
  gsap.to(panelRef.value, {
    xPercent: 100,
    duration: 0.25,
    ease: 'power2.in',
    delay: 0.05,
    onComplete: done,
  })
  if (backdropRef.value) {
    gsap.to(backdropRef.value, { opacity: 0, duration: 0.2, ease: 'none' })
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
    return
  }
  if (e.key !== 'Tab' || !panelRef.value) return

  const focusables = Array.from(
    panelRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (!first || !last) return

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  }
  else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      show()
    }
    else if (!newVal && oldVal && !isClosing && isVisible.value) {
      isVisible.value = false
      document.body.style.overflow = ''
    }
  },
)

onUnmounted(() => {
  if (isVisible.value) {
    document.body.style.overflow = ''
  }
  gsap.killTweensOf([panelRef.value, backdropRef.value])
})
</script>

<template>
  <Teleport to="body">
    <template v-if="isVisible">
      <div
        ref="backdropRef"
        class="fixed inset-0 z-60 bg-cgws-ink/60 backdrop-blur-sm"
        aria-hidden="true"
        @click="close"
      />

      <div
        id="mobile-menu"
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        class="fixed top-0 right-0 z-60 h-full w-[85vw] max-w-[340px] bg-cgws-ground flex flex-col"
        @keydown="handleKeydown"
      >
        <div class="h-14 flex items-center justify-between px-5 flex-shrink-0 border-b border-cgws-hairline">
          <!-- Lockup de façade « Spin & Slide » + endossement CGWS (wordmark
               PROVISOIRE Bebas Neue). Pas de troncature : max-width du panneau
               340px, le wordmark tient sur une ligne sans wrap. -->
          <span class="flex flex-col items-start gap-0 min-w-0">
            <span class="font-display text-[20px] leading-none uppercase tracking-[0.06em] whitespace-nowrap text-cgws-accent">
              {{ BRAND_SHORT }}
            </span>
            <span
              class="font-sans text-[9px] leading-none uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap text-cgws-ink-soft"
              aria-hidden="true"
            >
              {{ BRAND_ENDORSEMENT }}
            </span>
          </span>
          <button
            type="button"
            class="w-10 h-10 flex items-center justify-center text-cgws-ink-soft hover:text-cgws-accent
                   transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
            aria-label="Fermer le menu"
            @click="close"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav class="flex-1 flex flex-col py-2 overflow-y-auto" aria-label="Navigation mobile">
          <!-- eslint-disable-next-line nuxt/link-checker/valid-route -->
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :aria-current="isActive(link.to) ? 'page' : undefined"
            class="mobile-nav-link flex items-center justify-between py-4 px-5 border-b border-cgws-hairline
                   font-sans text-lg font-medium text-cgws-ink-soft
                   hover:text-cgws-accent hover:bg-cgws-hairline transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cgws-accent"
            active-class="text-cgws-accent"
            @click="close"
          >
            {{ link.label }}
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-cgws-ink-soft flex-shrink-0" aria-hidden="true" />
          </NuxtLink>
        </nav>

        <div class="relative flex items-center mx-5 my-1 flex-shrink-0" aria-hidden="true">
          <div class="flex-1 border-t border-cgws-hairline" />
          <div class="mx-3 w-5 h-5 rounded-full border-2 border-cgws-accent/60 flex items-center justify-center flex-shrink-0">
            <div class="w-1.5 h-1.5 rounded-full bg-cgws-accent/80" />
          </div>
          <div class="flex-1 border-t border-cgws-hairline" />
        </div>

        <div class="px-5 py-4 flex-shrink-0">
          <ThemeSwitcher layout="stacked" />
        </div>

        <div class="px-5 py-5 flex flex-col gap-3 flex-shrink-0">
          <a
            href="tel:+33247XXXXXX"
            class="flex items-center gap-3 text-cgws-ink-soft hover:text-cgws-accent text-sm font-sans
                   transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
            aria-label="Appeler la boutique"
          >
            <UIcon name="i-lucide-phone" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>02 47 XX XX XX</span>
          </a>
          <a
            href="mailto:contact@cgws.fr"
            class="flex items-center gap-3 text-cgws-ink-soft hover:text-cgws-accent text-sm font-sans
                   transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
            aria-label="Envoyer un email à la boutique"
          >
            <UIcon name="i-lucide-mail" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>contact@cgws.fr</span>
          </a>
        </div>

        <div class="px-5 pb-8 mt-auto flex-shrink-0">
          <CgwsButton
            as="NuxtLink"
            to="/depot-vente"
            variant="primary"
            size="sm"
            class="w-full justify-center"
            @click="close"
          >
            Déposer une selle
          </CgwsButton>
        </div>
      </div>
    </template>
  </Teleport>
</template>
