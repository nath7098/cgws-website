<script setup lang="ts">
import CgwsButton from '../ui/CgwsButton.vue'
import SaddleIllustration from './SaddleIllustration.vue'

const TITLE = "L'AUTHENTIQUE WESTERN À VOTRE PORTÉE"

interface TitleChar {
  char: string
  isSpace: boolean
  key: number
}

const titleChars = computed<TitleChar[]>(() =>
  TITLE.split('').map((char, i) => ({
    char,
    isSpace: char === ' ',
    key: i,
  })),
)

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    tl.from('.hero-eyebrow', {
      opacity: 0,
      y: -8,
      duration: 0.5,
    }, 0)

    tl.from('.hero-letter', {
      opacity: 0,
      y: 30,
      stagger: 0.035,
      duration: 0.45,
    }, 0.15)

    tl.from('.hero-subtitle', {
      opacity: 0,
      y: 16,
      duration: 0.6,
    }, 0.8)

    tl.from('.hero-ctas', {
      opacity: 0,
      y: 24,
      duration: 0.5,
    }, 1.2)

    tl.from('.saddle-illustration-wrapper', {
      opacity: 0,
      x: 30,
      duration: 0.9,
      ease: 'power1.out',
    }, 0.4)

    tl.from('.hero-scroll-indicator', {
      opacity: 0,
      duration: 0.4,
    }, 1.6)

    gsap.to('.hero-scroll-indicator', {
      y: 6,
      duration: 1.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 2,
    })

    ScrollTrigger.create({
      start: 'top -80px',
      once: true,
      onEnter: () => {
        gsap.to('.hero-scroll-indicator', {
          opacity: 0,
          duration: 0.3,
          pointerEvents: 'none',
        })
      },
    })

    // Parallax scrub — desktop only (avoids GPU jank on mobile)
    if (window.innerWidth >= 768) {
      gsap.to('.hero-bg-img', {
        y: '30%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section
    class="hero-section relative w-full h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden bg-cgws-ground"
    aria-label="Accueil CGWS — Sellerie équestre western"
  >
    <!-- Background image (LCP element) — NuxtPicture for WebP + JPEG fallback -->
    <NuxtPicture
      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80&auto=format&fit=crop"
      alt=""
      class="absolute inset-0 h-full w-full"
      :img-attrs="{
        class: 'hero-bg-img h-full w-full object-cover object-[center_top] md:object-[center_40%]',
        fetchpriority: 'high',
      }"
      :width="1920"
      :height="1080"
      loading="eager"
      format="webp"
      quality="85"
      sizes="xs:100vw sm:100vw md:100vw lg:100vw"
    />

    <!-- Gradient overlay -->
    <div
      class="absolute inset-0 z-[1] bg-gradient-to-t from-cgws-brand-espresso/90 via-cgws-brand-espresso/40 to-cgws-brand-espresso/10"
      aria-hidden="true"
    />

    <!-- Saddle illustration (desktop only) -->
    <div
      class="saddle-illustration-wrapper absolute z-[2] hidden md:block
             right-[6%] lg:right-[8%] xl:right-[10%]
             top-1/2 -translate-y-[55%]
             w-[200px] lg:w-[260px] xl:w-[300px]
             opacity-70 md:opacity-75"
      aria-hidden="true"
    >
      <SaddleIllustration />
    </div>

    <!-- Content layer -->
    <div
      class="relative z-[10] h-full flex flex-col justify-end pb-16 md:pb-24 lg:justify-center lg:pb-0
             px-[clamp(1rem,4vw,2rem)] max-w-[1280px] mx-auto w-full"
    >
      <!-- Eyebrow -->
      <p
        class="hero-eyebrow font-eyebrow text-[13px] text-cgws-brand-sand uppercase tracking-[0.2em] mb-4 md:mb-5"
      >
        Sellerie Équestre Western · Brèches, 37
      </p>

      <!-- H1 with per-character spans for GSAP stagger -->
      <h1
        class="font-display uppercase leading-none text-cgws-brand-cream
               text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px]
               mb-5 md:mb-7 max-w-[15ch] lg:max-w-[12ch]"
        aria-label="L'AUTHENTIQUE WESTERN À VOTRE PORTÉE"
      >
        <span
          v-for="item in titleChars"
          :key="item.key"
          class="hero-letter inline-block"
          :class="item.isSpace ? 'w-[0.25em]' : ''"
          aria-hidden="true"
        >{{ item.isSpace ? '' : item.char }}</span>
      </h1>

      <!-- Subtitle -->
      <p
        class="hero-subtitle font-serif italic text-cgws-brand-sand
               text-[17px] md:text-[19px] lg:text-[21px]
               leading-relaxed mb-8 md:mb-10 max-w-[45ch] md:max-w-[38ch]"
      >
        Équipements authentiques pour cavaliers passionnés —
        neuf, occasion et consignation.
      </p>

      <!-- CTAs -->
      <div class="hero-ctas flex flex-col sm:flex-row gap-3 sm:gap-4">
        <CgwsButton
          as="NuxtLink"
          to="/catalogue"
          variant="primary"
          size="md"
          class="w-full sm:w-auto"
        >
          Découvrir le catalogue
        </CgwsButton>

        <CgwsButton
          as="NuxtLink"
          to="/consignation"
          variant="outline-light"
          size="md"
          class="w-full sm:w-auto"
        >
          Service consignation
        </CgwsButton>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div
      class="hero-scroll-indicator absolute bottom-7 left-1/2 -translate-x-1/2 z-[10]
             flex flex-col items-center gap-1"
      role="presentation"
      aria-label="Défiler vers le bas"
    >
      <span class="font-eyebrow text-[10px] text-cgws-brand-sand/60 uppercase tracking-widest">
        Découvrir
      </span>
      <svg
        width="16"
        height="24"
        viewBox="0 0 16 24"
        fill="none"
        aria-hidden="true"
        class="text-cgws-brand-sand"
      >
        <path d="M2 8 L8 14 L14 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M2 14 L8 20 L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
      </svg>
    </div>
  </section>
</template>
