<script setup lang="ts">
// CurationPromise — promesse de curation « Testé et approuvé par Camille »
// (US-108, signature éditoriale de BRAND_DIRECTION). Exprime le cœur du
// positionnement : hors selles, uniquement des articles que Camille a
// personnellement utilisés et approuvés. Réutilise le badge signature
// CgwsApprovedBadge (US-110) en taille `lg` — taille prévue pour la mise en
// avant homepage — avec son argumentaire de curation.
//
// Le badge porte lui-même son placeholder « à valider par Camille » tant
// qu'aucun `argument` validé ne lui est passé (cf. CgwsApprovedBadge §8).

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    gsap.fromTo(
      '.curation-inner',
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.curation-section',
          start: 'top 80%',
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
    class="curation-section bg-cgws-surface py-12 md:py-16 lg:py-20"
    aria-labelledby="curation-heading"
  >
    <div class="curation-inner max-w-3xl mx-auto px-[clamp(1rem,4vw,2rem)] text-center flex flex-col items-center">

      <!-- Badge signature (US-110) en taille lg avec argumentaire -->
      <CgwsApprovedBadge
        size="lg"
        :with-argument="true"
        class="mb-8"
      />

      <p class="font-eyebrow text-[13px] text-cgws-accent uppercase tracking-[0.2em] mb-3">
        Notre promesse
      </p>

      <h2
        id="curation-heading"
        class="font-serif font-bold text-cgws-ink leading-tight
               text-[26px] md:text-[34px] lg:text-[40px] mb-5 max-w-[22ch]"
      >
        <!-- PLACEHOLDER — titre à valider par Camille -->
        Si c'est dans le catalogue, c'est que ça marche
      </h2>

      <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed max-w-[56ch]">
        <!-- PLACEHOLDER — texte à personnaliser par Camille avant mise en ligne -->
        Hors selles, chaque article de la boutique a été monté, testé et approuvé
        par Camille — en concours de reining comme à l'entraînement. Pas de
        catalogue à rallonge&nbsp;: une sélection courte, exigeante, dans laquelle
        chaque pièce a fait ses preuves.
      </p>

    </div>
  </section>
</template>
