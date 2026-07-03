<script setup lang="ts">
useSeoMeta({
  title: 'Consignation — Vendez votre matériel western avec CGWS',
  description:
    'Déposez votre selle, bride ou équipement western en consignation chez CGWS à Brèches (37). Service simple, rapide et transparent : 20 % de commission, 3 mois renouvelables.',
  ogTitle: 'Service de Consignation — CGWS Brèches',
  ogDescription:
    "Confiez-nous votre matériel western d'occasion. Nous l'exposons en boutique et en ligne, vous recevez le prix convenu.",
  ogType: 'website',
  ogImage: DEFAULT_OG_IMAGE,
  twitterCard: 'summary_large_image',
  twitterImage: DEFAULT_OG_IMAGE,
})

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    gsap.fromTo(
      '.conditions-poster',
      { opacity: 0, scale: 0.97 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.conditions-section',
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
  <main>

    <!-- ====================================================================
         1 — Page Hero
    ==================================================================== -->
    <section class="bg-cgws-ground py-12 md:py-16 lg:py-20 text-center" aria-labelledby="consignation-heading">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

        <!-- Eyebrow -->
        <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase mb-4">
          CONSIGNATION
        </p>

        <!-- Main heading -->
        <h1
          id="consignation-heading"
          class="font-display uppercase text-cgws-ink leading-none
                 text-[48px] md:text-[56px] lg:text-[72px]
                 mb-4 md:mb-6"
        >
          Déposez votre matériel<br>
          Trouvez-lui un nouveau propriétaire
        </h1>

        <!-- Tagline -->
        <p class="font-serif italic text-cgws-ink-soft text-base md:text-lg max-w-2xl mx-auto mt-4 mb-8 md:mb-10">
          « Confiez-nous votre selle, votre bride ou vos bottes —
          nous les exposons, nous les vendons pour vous. »
        </p>

        <!-- CTA ancre vers le formulaire -->
        <CgwsButton
          as="a"
          href="#consignment-form"
          variant="primary"
          size="md"
          class="w-full sm:w-auto"
        >
          DÉPOSER MA DEMANDE ↓
        </CgwsButton>

      </div>
    </section>

    <!-- ====================================================================
         2 — How It Works (3 étapes)
    ==================================================================== -->
    <HowItWorks />

    <!-- ====================================================================
         3 — StarDivider (transition parchment → cream)
    ==================================================================== -->
    <StarDivider bg-class="bg-cgws-surface" />

    <!-- ====================================================================
         4 — Conditions de consignation (wanted poster)
    ==================================================================== -->
    <section class="conditions-section bg-cgws-ground py-10 md:py-14 lg:py-16">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

        <!-- Eyebrow -->
        <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase text-center mb-8">
          NOS CONDITIONS
        </p>

        <!-- Wanted poster — max-w-2xl centré -->
        <div class="conditions-poster mx-auto max-w-2xl">

          <!-- Bordure externe (3px charcoal) -->
          <div class="border-[3px] border-cgws-ink bg-cgws-surface p-1.5">

            <!-- Bordure interne (1px charcoal) -->
            <div class="border border-cgws-ink p-6 md:p-8">

              <!-- Header poster -->
              <p class="font-eyebrow text-cgws-ink text-xs tracking-[0.2em] uppercase text-center mb-6">
                DÉPÔT-VENTE CGWS · BRÈCHES · INDRE-ET-LOIRE
              </p>

              <div class="border-t border-cgws-ink/40 mb-6" />

              <!-- 3 conditions -->
              <!-- TODO: confirmer avec Camille les valeurs réelles (commission et durée) -->
              <div class="flex flex-col sm:flex-row gap-6 text-center">

                <!-- Commission -->
                <div class="flex-1">
                  <p class="font-eyebrow text-cgws-ink/60 text-[11px] uppercase tracking-widest mb-1">
                    COMMISSION
                  </p>
                  <p class="font-display text-5xl text-cgws-accent leading-none">
                    20&nbsp;%
                  </p>
                  <p class="font-sans text-xs text-cgws-ink/60 mt-1">
                    sur le prix de vente
                  </p>
                </div>

                <!-- Séparateur vertical -->
                <div class="hidden sm:block w-px bg-cgws-ink/20 self-stretch" aria-hidden="true" />

                <!-- Durée -->
                <div class="flex-1">
                  <p class="font-eyebrow text-cgws-ink/60 text-[11px] uppercase tracking-widest mb-1">
                    DURÉE
                  </p>
                  <p class="font-display text-5xl text-cgws-accent leading-none">
                    3 MOIS
                  </p>
                  <p class="font-sans text-xs text-cgws-ink/60 mt-1">
                    renouvelable par accord
                  </p>
                </div>

                <!-- Séparateur vertical -->
                <div class="hidden sm:block w-px bg-cgws-ink/20 self-stretch" aria-hidden="true" />

                <!-- État requis -->
                <div class="flex-1">
                  <p class="font-eyebrow text-cgws-ink/60 text-[11px] uppercase tracking-widest mb-1">
                    ÉTAT REQUIS
                  </p>
                  <p class="font-display text-3xl text-cgws-accent leading-none">
                    EXCELLENT<br>À BON
                  </p>
                  <p class="font-sans text-xs text-cgws-ink/60 mt-1">
                    état minimum accepté
                  </p>
                </div>

              </div>

              <!-- Note bas de poster -->
              <div class="border-t border-cgws-ink/40 mt-6 pt-4">
                <p class="font-sans text-sm text-cgws-ink/60 text-center italic">
                  Le prix de mise en vente est défini en accord avec vous.
                </p>
              </div>

            </div>
          </div>

        </div><!-- /.conditions-poster -->
      </div>
    </section>

    <!-- ====================================================================
         5 — StarDivider (transition cream → cream)
    ==================================================================== -->
    <StarDivider />

    <!-- ====================================================================
         6 — Formulaire de consignation
    ==================================================================== -->
    <ConsignmentForm />

  </main>
</template>
