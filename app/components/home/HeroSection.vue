<script setup lang="ts">
import CgwsButton from '../ui/CgwsButton.vue'

// PLACEHOLDER — titre hero à valider par Camille avant mise en ligne (US-108).
// Positionnement reining-first (BRAND_DIRECTION §Positionnement) : LA
// spécialiste reining, l'équitation western et la randonnée en rayonnement.
const TITLE = 'LA SPÉCIALISTE DU REINING'

interface TitleLetter {
  char: string
  key: number
}
interface TitleWord {
  key: number
  chars: TitleLetter[]
}

// Groupe les lettres par mot : chaque mot est un wrapper insécable
// (whitespace-nowrap), les lettres restent des spans .hero-letter individuels
// pour que le stagger GSAP fonctionne inchangé.
const titleWords = computed<TitleWord[]>(() => {
  let k = 0
  return TITLE.split(' ').map((word, wi) => ({
    key: wi,
    chars: word.split('').map((char) => ({ char, key: k++ })),
  }))
})

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
      y: 12,
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
    aria-label="Accueil — Spin & Slide Shop, sellerie western & reining"
  >
    <!-- Background image (LCP element) — NuxtPicture pour WebP + fallback JPEG.
         Image LOCALE (public/images/hero-reining.jpg, 2560×3413, ratio 3:4)
         traitée par le provider IPX par défaut (@nuxt/image) : aucune entrée
         `image.domains` requise (contrairement à l'ancienne source distante
         Unsplash). `preload` demande à @nuxt/image d'injecter lui-même le
         <link rel=preload as=image imagesrcset> pointant la VARIANTE générée
         (source unique de vérité du LCP — remplace le preload manuel jadis dans
         pages/index.vue qui référençait l'URL brute et devenait erroné). -->
    <NuxtPicture
      src="/images/hero-reining.jpg"
      alt=""
      class="absolute inset-0 h-full w-full"
      :img-attrs="{
        class: 'hero-bg-img h-full w-full object-cover object-[center_top] md:object-[center_40%]',
        fetchpriority: 'high',
      }"
      :width="1920"
      :height="2560"
      loading="eager"
      format="webp"
      quality="85"
      sizes="xs:100vw sm:100vw md:100vw lg:100vw"
      :preload="{ fetchPriority: 'high' }"
    />

    <!-- Gradient overlay -->
    <div
      class="absolute inset-0 z-[1] bg-gradient-to-t from-cgws-brand-espresso/90 via-cgws-brand-espresso/40 to-cgws-brand-espresso/10"
      aria-hidden="true"
    />

    <!-- Content layer -->
    <div
      class="relative z-[10] h-full flex flex-col justify-end pb-16 md:pb-24 lg:justify-center lg:pb-0
             px-[clamp(1rem,4vw,2rem)] max-w-[1280px] mx-auto w-full"
    >
      <!-- Bloc titre (H1) -->
      <div class="hero-title-block relative pt-6 md:pt-7">
        <!-- Eyebrow : promesse de curation exprimée dès le haut de page (US-108) -->
        <p
          class="hero-eyebrow font-eyebrow text-[13px] text-cgws-brand-sand
                 uppercase tracking-[0.2em] mb-4 md:mb-5"
        >
          <!-- PLACEHOLDER — libellé à valider par Camille -->
          Testé &amp; approuvé par Camille · Spécialiste reining
        </p>

        <!-- H1 : mots insécables (whitespace-nowrap) → lettres animables (.hero-letter) -->
        <h1
          class="font-display font-bold uppercase leading-none text-cgws-brand-cream
                 text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px]
                 mb-5 md:mb-7 max-w-[15ch] lg:max-w-[12ch]"
          aria-label="La spécialiste du reining"
        >
          <template v-for="(word, wi) in titleWords" :key="word.key">
            <span class="inline-block whitespace-nowrap">
              <span
                v-for="letter in word.chars"
                :key="letter.key"
                class="hero-letter inline-block"
                aria-hidden="true"
              >{{ letter.char }}</span>
            </span><span
              v-if="wi < titleWords.length - 1"
              class="hero-letter inline-block w-[0.25em]"
              aria-hidden="true"
            />
          </template>
        </h1>
      </div>

      <!-- Subtitle -->
      <p
        class="hero-subtitle font-serif italic text-cgws-brand-sand
               text-[17px] md:text-[19px] lg:text-[21px]
               leading-relaxed mb-8 md:mb-10 max-w-[45ch] md:max-w-[38ch]"
      >
        <!-- PLACEHOLDER — accroche hero à valider par Camille avant mise en ligne -->
        Selles, bridonnerie et équipement choisis par une compétitrice —
        pour le reining, l'équitation western et la randonnée.
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

        <!-- CTA secondaire (contre-accent) → dépôt-vente. Sur le hero photo,
             le contre-accent denim de la charte n'existe pas dans les peaux
             Élégante (--cgws-denim = Rugueux uniquement, cf. CgwsButton.vue) :
             le variant `outline-light` reste le traitement contre-accent
             théme-safe sur scrim photo (US-073 §1.3). -->
        <CgwsButton
          as="NuxtLink"
          to="/depot-vente"
          variant="outline-light"
          size="md"
          class="w-full sm:w-auto"
        >
          Dépôt-vente de selles
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
