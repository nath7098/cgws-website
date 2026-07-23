<script setup lang="ts">
// ConsignmentPillar — pilier différenciateur « dépôt-vente de selles » sur la
// homepage (US-108). Conservé comme pilier visible (BRAND_DIRECTION §1), mais
// POSITIONNÉ APRÈS la boutique : face aux gros e-commerçants, c'est le service
// qu'eux ne peuvent pas offrir. Renvoie vers la page /consignation pour le
// détail (conditions, formulaire) — ici, teaser compact façon « wanted poster »
// cohérent avec le design system (double bordure charcoal, chiffres accent).
let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    gsap.fromTo(
      '.consign-poster',
      { opacity: 0, scale: 0.97 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.consign-section',
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
    class="consign-section bg-cgws-ground py-12 md:py-16"
    aria-labelledby="consign-heading"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

      <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase text-center mb-6">
        Le service en plus
      </p>

      <!-- Wanted poster compact -->
      <div class="consign-poster mx-auto max-w-2xl">
        <div class="border-[3px] border-cgws-ink bg-cgws-surface p-1.5">
          <div class="border border-cgws-ink p-6 md:p-8 text-center">

            <h2
              id="consign-heading"
              class="font-display uppercase text-cgws-ink leading-none
                     text-[32px] md:text-[42px] lg:text-[48px] mb-4"
            >
              <!-- PLACEHOLDER — titre à valider par Camille -->
              Dépôt-vente de selles
            </h2>

            <p class="font-sans text-[15px] md:text-base text-cgws-ink/75 leading-relaxed max-w-[52ch] mx-auto mb-6">
              <!-- PLACEHOLDER — texte à personnaliser par Camille avant mise en ligne -->
              Vous avez une selle à vendre&nbsp;? Confiez-la-nous. Nous l'exposons
              en boutique à Brèches et en ligne, et nous la vendons pour vous —
              vous recevez le prix convenu, déduction faite de la commission.
            </p>

            <CgwsButton
              as="NuxtLink"
              to="/consignation"
              variant="secondary"
              size="md"
              class="w-full sm:w-auto"
            >
              Découvrir le dépôt-vente
            </CgwsButton>

          </div>
        </div>
      </div>

    </div>
  </section>
</template>
