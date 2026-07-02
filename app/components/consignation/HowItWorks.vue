<script setup lang="ts">
interface Step {
  number: number
  icon: string
  title: string
  body: string
}

const steps: Step[] = [
  {
    number: 1,
    icon: 'i-lucide-inbox',
    title: 'DÉPOSEZ',
    body: 'Décrivez votre article, envoyez vos photos et indiquez votre prix de vente souhaité. Nous vous répondons sous 48h.',
  },
  {
    number: 2,
    icon: 'i-lucide-eye',
    title: 'EXPOSEZ',
    body: "Votre article est mis en vitrine sur notre site et en boutique à Brèches. Camille s'occupe de tout — photos, annonce, accueil des acheteurs.",
  },
  {
    number: 3,
    icon: 'i-lucide-circle-dollar-sign',
    title: 'VENDEZ',
    body: "Lorsqu'un acheteur est trouvé, vous recevez le prix convenu, déduction faite de la commission. Paiement sous 7 jours après la vente.",
  },
]

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    gsap.fromTo(
      '.how-it-works-card',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.how-it-works-section',
          start: 'top 75%',
          once: true,
        },
      },
    )
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section
    class="how-it-works-section bg-cgws-parchment py-10 md:py-14 lg:py-16"
    aria-label="Fonctionnement du service de consignation en 3 étapes"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

      <!-- En-tête section -->
      <div class="text-center mb-12 md:mb-14">
        <p class="font-eyebrow text-cgws-copper text-sm tracking-widest uppercase mb-2">
          COMMENT ÇA MARCHE
        </p>
        <p class="font-serif italic text-cgws-charcoal/70 text-xl">
          Votre matériel mérite un nouveau propriétaire
        </p>
      </div>

      <!-- Grille des étapes avec flèches -->
      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 md:gap-4 items-center">

        <template v-for="(step, index) in steps" :key="step.number">
          <!-- Carte étape -->
          <div
            class="how-it-works-card bg-cgws-parchment border-2 border-cgws-charcoal
                   rounded-sm p-8 text-center relative pt-12"
          >
            <!-- Cercle numéro -->
            <div
              class="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full
                     bg-cgws-copper text-cgws-charcoal font-display text-2xl
                     flex items-center justify-center border-2 border-cgws-charcoal"
              aria-hidden="true"
            >
              {{ step.number }}
            </div>

            <!-- Icône -->
            <UIcon
              :name="step.icon"
              class="w-8 h-8 text-cgws-leather mx-auto mb-3"
              aria-hidden="true"
            />

            <!-- Titre -->
            <p class="font-eyebrow text-cgws-charcoal text-base uppercase tracking-wider mb-3">
              {{ step.title }}
            </p>

            <!-- Corps -->
            <p class="font-sans text-sm text-cgws-charcoal/75 leading-relaxed">
              {{ step.body }}
            </p>
          </div>

          <!-- Flèche de séparation (sauf après la dernière carte) -->
          <template v-if="index < steps.length - 1">
            <!-- Flèche horizontale — desktop/tablet -->
            <div class="hidden md:flex items-center justify-center" aria-hidden="true">
              <UIcon name="i-lucide-arrow-right" class="w-5 h-5 text-cgws-copper" />
            </div>

            <!-- Flèche verticale — mobile -->
            <div class="flex md:hidden items-center justify-center py-1" aria-hidden="true">
              <UIcon name="i-lucide-arrow-down" class="w-5 h-5 text-cgws-copper" />
            </div>
          </template>
        </template>

      </div>
    </div>
  </section>
</template>
