<script setup lang="ts">
let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  const isMobile = window.innerWidth < 768

  ctx = gsap.context(() => {
    gsap.from('.story-text-col', {
      x: isMobile ? 0 : -60,
      y: isMobile ? 40 : 0,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.story-section',
        start: 'top 80%',
        once: true,
      },
    })

    gsap.from('.story-image-col', {
      x: isMobile ? 0 : 60,
      y: isMobile ? 40 : 0,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      delay: 0.15,
      scrollTrigger: {
        trigger: '.story-section',
        start: 'top 80%',
        once: true,
      },
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section
    class="story-section bg-cgws-cream pt-[clamp(3rem,8vw,6rem)] pb-8 md:pb-12"
    aria-labelledby="story-heading"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <!-- Grille 2 colonnes desktop / 1 colonne mobile -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">

        <!-- Colonne texte — order-2 mobile (sous l'image), order-1 desktop (à gauche) -->
        <div class="story-text-col order-2 md:order-1">

          <!-- Eyebrow -->
          <p class="inline-flex items-center gap-3 mb-4 md:mb-5">
            <span
              class="block w-0.5 h-5 bg-cgws-copper flex-shrink-0"
              aria-hidden="true"
            />
            <span class="font-eyebrow text-[13px] text-cgws-leather uppercase tracking-[0.2em]">
              Notre Passion
            </span>
          </p>

          <!-- H2 lié via aria-labelledby à la section -->
          <h2
            id="story-heading"
            class="font-serif font-bold text-cgws-charcoal leading-tight
                   text-[28px] md:text-[36px] lg:text-[44px]
                   mb-5 md:mb-6 max-w-[20ch]"
          >
            L'histoire de Camille&nbsp;&amp;&nbsp;CGWS
          </h2>

          <!-- Corps du texte — placeholder à personnaliser -->
          <p
            class="font-sans text-[15px] md:text-base text-cgws-charcoal
                   leading-relaxed mb-6 md:mb-8 max-w-[52ch]"
          >
            <!-- PLACEHOLDER — texte à personnaliser par Camille avant mise en ligne -->
            Cavalière depuis l'enfance, Camille a grandi avec la passion du western
            dans le sang. C'est au cœur de l'Indre-et-Loire, à Brèches, qu'elle a
            décidé de transformer cette vocation en un vrai projet de vie : une boutique
            entièrement dédiée aux cavaliers western. CGWS, c'est avant tout une
            sélection rigoureuse d'équipements authentiques — selles, brides, bottes
            et vêtements — choisis avec l'œil d'une cavalière exigeante. Le service
            de consignation est né d'un besoin réel&nbsp;: offrir aux cavaliers une
            alternative fiable pour vendre leur matériel en toute confiance. Ici, on
            parle le même langage que vous — celui des selles qui sentent bon le cuir
            et des matins en selle dans la lumière de la Loire.
          </p>

          <!-- CTA -->
          <CgwsButton
            as="NuxtLink"
            to="/a-propos"
            variant="secondary"
            size="sm"
            class="story-cta mt-2"
          >
            En savoir plus
          </CgwsButton>
        </div>

        <!-- Colonne image — order-1 mobile (en premier), order-2 desktop (à droite) -->
        <div class="story-image-col order-1 md:order-2">
          <div class="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)] bg-cgws-parchment">
            <!-- Placeholder Unsplash — À remplacer par la vraie photo de Camille -->
            <!-- Photo crédit : Unsplash (placeholder uniquement, supprimer à la mise en ligne) -->
            <NuxtImg
              src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=800&q=80&auto=format&fit=crop"
              alt="Cavalière avec son cheval quarter horse dans une prairie — image d'illustration"
              class="w-full object-cover object-center
                     aspect-[4/5] md:aspect-auto md:max-h-[540px] lg:max-h-[580px]"
              :width="600"
              :height="750"
              loading="lazy"
              format="webp"
              quality="85"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

      </div>
    </div>
  </section>
</template>
