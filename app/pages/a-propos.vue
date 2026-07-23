<script setup lang="ts">
import { compassStarPoints, compassStarCenterRadius } from '~/utils/compassStar'
import { getLocalBusinessSchema } from '~/utils/localBusinessSchema'
import { BRAND_NAME } from '~/utils/brand'

// ---------------------------------------------------------------------------
// Contenu — constantes isolées (garantie « swap » — voir §7 de la spec design
// US-099-a-propos.md). Le remplacement futur par la bio définitive de
// Camille + les vraies photos de l'atelier ne doit toucher QUE les valeurs
// ci-dessous, jamais la structure de la page, le SEO ou les composants.
// ---------------------------------------------------------------------------

// Placeholder Unsplash — MÊME image que OurStorySection.vue. Une seule
// constante réutilisée aux 3 endroits qui en ont besoin (photo section 2,
// image usePageSeo, Person.image du JSON-LD) pour qu'un unique remplacement
// d'URL propage la mise à jour partout, sans risque de divergence.
const CAMILLE_PHOTO =
  'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=800&q=80&auto=format&fit=crop'

// Placeholder Unsplash — sellerie/atelier, à remplacer par une vraie photo
// de la boutique de Brèches.
const ATELIER_PHOTO =
  'https://images.unsplash.com/photo-1544966503-7ad532c5a8e8?w=600&h=800&q=80&auto=format&fit=crop'

// Icônes vérifiées via mcp__nuxt-ui-remote__search-icons (collection lucide) :
// i-lucide-package, i-lucide-link, i-lucide-footprints, i-lucide-shirt et
// i-lucide-shield existent tous — noms proposés par la spec design confirmés
// tels quels, aucune correction nécessaire.
interface Activite {
  label: string
  icon: string
}

const activites: Activite[] = [
  { label: 'Selles neuves & occasion', icon: 'i-lucide-package' },
  { label: 'Brides & licols', icon: 'i-lucide-link' },
  { label: 'Bottes & chaussures', icon: 'i-lucide-footprints' },
  { label: 'Vêtements', icon: 'i-lucide-shirt' },
  { label: 'Accessoires & protections', icon: 'i-lucide-shield' },
]

// Géométrie canonique de l'étoile-boussole (source unique — utils/compassStar.ts,
// cf. StarDivider.vue) réutilisée pour l'icône décorative du bloc consignation.
const STAR_POINTS = compassStarPoints()
const STAR_CENTER_R = compassStarCenterRadius()

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

usePageSeo({
  title: "À propos — Camille, spécialiste reining, et l'atelier de Brèches",
  description:
    `${BRAND_NAME} : Camille, spécialiste reining, son atelier de Brèches (37) et le dépôt-vente de selles western. Une sélection courte, testée et approuvée.`,
  image: CAMILLE_PHOTO,
  type: 'website',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Camille Guignon',
        jobTitle: 'Fondatrice',
        // PLACEHOLDER — remplacer par la vraie photo une fois fournie par Camille
        image: CAMILLE_PHOTO,
        worksFor: {
          '@type': 'LocalBusiness',
          name: BRAND_NAME,
          url: 'https://cgws.fr',
        },
      }),
    },
    {
      // JSON-LD LocalBusiness — factorisé dans app/utils/localBusinessSchema.ts
      // (mêmes coordonnées Brèches/37 que app/pages/index.vue, source unique).
      type: 'application/ld+json',
      innerHTML: JSON.stringify(getLocalBusinessSchema()),
    },
  ],
})

// ---------------------------------------------------------------------------
// GSAP — animation de la seule section « Camille » (cf. spec §Animations :
// les autres sections restent statiques, pas de scroll-trigger généralisé)
// ---------------------------------------------------------------------------

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  const isMobile = window.innerWidth < 768

  ctx = gsap.context(() => {
    gsap.from('.camille-text-col', {
      x: isMobile ? 0 : 60,
      y: isMobile ? 40 : 0,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.camille-section',
        start: 'top 80%',
        once: true,
      },
    })

    gsap.from('.camille-image-col', {
      x: isMobile ? 0 : -60,
      y: isMobile ? 40 : 0,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      delay: 0.15,
      scrollTrigger: {
        trigger: '.camille-section',
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
  <main>
    <!-- ==================================================================
         1 — Hero / intro
    =================================================================== -->
    <section class="bg-cgws-ground py-12 md:py-16 lg:py-20 text-center" aria-labelledby="apropos-heading">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
        <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase mb-4">
          À PROPOS
        </p>
        <h1
          id="apropos-heading"
          class="font-display uppercase text-cgws-ink leading-none
                 text-[40px] md:text-[52px] lg:text-[64px] mb-4 md:mb-6"
        >
          Camille&nbsp;&amp;&nbsp;CGWS
        </h1>
        <p class="font-serif italic text-cgws-ink-soft text-base md:text-lg max-w-2xl mx-auto">
          <!-- PLACEHOLDER — à personnaliser par Camille -->
          La boutique de la spécialiste reining — pensée pour les cavaliers western
          et de randonnée, à Brèches, au cœur de l'Indre-et-Loire.
        </p>
      </div>
    </section>

    <!-- ==================================================================
         2 — Camille (grille texte / image)
    =================================================================== -->
    <StarDivider />

    <section class="camille-section bg-cgws-ground py-10 md:py-14 lg:py-16" aria-labelledby="camille-heading">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">

          <div class="camille-text-col order-2 md:order-1">
            <p class="inline-flex items-center gap-3 mb-4 md:mb-5">
              <span class="block w-0.5 h-5 bg-cgws-accent-deco flex-shrink-0" aria-hidden="true" />
              <span class="font-eyebrow text-[13px] text-cgws-ink-soft uppercase tracking-[0.2em]">Portrait</span>
            </p>
            <h2
              id="camille-heading"
              class="font-serif font-bold text-cgws-ink leading-tight
                     text-[26px] md:text-[32px] lg:text-[38px] mb-5 md:mb-6 max-w-[22ch]"
            >
              Une cavalière, une vocation
            </h2>

            <!-- PLACEHOLDER — à personnaliser par Camille — reprend puis étend le
                 texte de OurStorySection.vue (registre reining/curation, US-112) -->
            <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed mb-5 max-w-[56ch]">
              Cavalière de reining, Camille connaît le matériel de l'intérieur — en
              concours comme à l'entraînement. C'est au cœur de l'Indre-et-Loire, à
              Brèches, qu'elle a fait de cette passion sa boutique&nbsp;: spécialiste
              reining, elle équipe aussi les cavaliers western et les randonneurs qui
              cherchent du matériel de confiance. Hors selles, chaque article du
              catalogue, elle l'a personnellement monté, testé et approuvé — une
              sélection courte et défendable, jamais un catalogue à rallonge.
            </p>
            <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed mb-5 max-w-[56ch]">
              Le dépôt-vente de selles est né d'un besoin réel&nbsp;: offrir aux
              cavaliers une alternative fiable pour vendre leur matériel en toute
              confiance, sans les tracas d'une annonce entre particuliers. Chaque
              selle déposée est examinée avec le même soin que si elle était la
              sienne.
            </p>
            <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed max-w-[56ch]">
              Ici, on parle le même langage que vous — celui des selles qui sentent
              bon le cuir et des matins en selle dans la lumière de la Loire.
            </p>
          </div>

          <div class="camille-image-col order-1 md:order-2 relative">
            <svg
              class="pointer-events-none absolute -top-3 -left-3 z-10 h-16 w-16 md:h-20 md:w-20"
              viewBox="0 0 80 80"
              fill="none"
              aria-hidden="true"
            >
              <path d="M4 40 C4 16 24 4 40 4" stroke="var(--cgws-accent-deco)" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <div class="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)] bg-cgws-surface">
              <!-- Placeholder Unsplash — MÊME image que OurStorySection.vue, à
                   remplacer par la vraie photo de Camille -->
              <NuxtImg
                :src="CAMILLE_PHOTO"
                alt="Camille, fondatrice de CGWS, avec son cheval quarter horse — photo d'illustration en attente de la vraie photo"
                class="w-full object-cover object-center aspect-[4/5] md:aspect-auto md:max-h-[540px] lg:max-h-[580px]"
                :width="600"
                :height="750"
                loading="lazy"
                format="webp"
                quality="85"
                sizes="xs:100vw sm:100vw md:50vw lg:50vw"
              />
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ==================================================================
         3 — L'atelier de Brèches (37)
    =================================================================== -->
    <StarDivider />

    <section class="atelier-section bg-cgws-surface py-10 md:py-14 lg:py-16" aria-labelledby="atelier-heading">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center mb-10 md:mb-12">

          <div class="atelier-image-col order-1 relative">
            <div class="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(61,26,6,0.12)] bg-cgws-ground">
              <!-- Placeholder Unsplash — sellerie/atelier, à remplacer par une
                   vraie photo de la boutique -->
              <NuxtImg
                :src="ATELIER_PHOTO"
                alt="Sellerie et matériel western exposés en boutique — photo d'illustration en attente de la vraie photo de l'atelier"
                class="w-full object-cover object-center aspect-[4/5] md:aspect-auto md:max-h-[480px]"
                :width="600"
                :height="750"
                loading="lazy"
                format="webp"
                quality="85"
                sizes="xs:100vw sm:100vw md:50vw lg:50vw"
              />
            </div>
          </div>

          <div class="atelier-text-col order-2">
            <p class="font-eyebrow text-[13px] text-cgws-ink-soft uppercase tracking-[0.2em] mb-4 md:mb-5">
              L'Atelier
            </p>
            <h2
              id="atelier-heading"
              class="font-serif font-bold text-cgws-ink leading-tight
                     text-[26px] md:text-[32px] lg:text-[38px] mb-5 md:mb-6 max-w-[22ch]"
            >
              Brèches, Indre-et-Loire
            </h2>
            <!-- PLACEHOLDER — à personnaliser par Camille -->
            <p class="font-sans text-[15px] md:text-base text-cgws-ink leading-relaxed mb-6 max-w-[56ch]">
              La boutique vous accueille à Brèches, au cœur du Véron. Venez essayer,
              toucher, comparer — le matériel western se choisit aussi à l'œil et au
              toucher. Les retraits de commande et les dépôts de consignation se font
              uniquement sur place, sur rendez-vous ou aux horaires d'ouverture.
            </p>
            <dl class="font-sans text-[14px] md:text-[15px] text-cgws-ink space-y-3">
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-map-pin" class="w-4 h-4 mt-0.5 text-cgws-accent flex-shrink-0" aria-hidden="true" />
                <!-- TODO: confirmer adresse exacte avec Camille -->
                <dd>Brèches, 37330 Indre-et-Loire</dd>
              </div>
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-4 h-4 mt-0.5 text-cgws-accent flex-shrink-0" aria-hidden="true" />
                <dd>Mar–Ven 10h–18h · Sam 9h–17h</dd>
              </div>
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-phone" class="w-4 h-4 mt-0.5 text-cgws-accent flex-shrink-0" aria-hidden="true" />
                <!-- TODO: confirmer numéro avec Camille -->
                <dd>
                  <a
                    href="tel:+33600000000"
                    class="text-cgws-accent hover:underline
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
                           focus-visible:ring-offset-2 rounded-sm"
                  >
                    06 XX XX XX XX
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="rounded-lg overflow-hidden border border-cgws-hairline h-64 md:h-72 lg:h-80">
          <ClientOnly>
            <ContactMap />
            <template #fallback>
              <div class="w-full h-full bg-cgws-surface animate-pulse flex items-center justify-center">
                <UIcon name="i-lucide-map" class="w-8 h-8 text-cgws-ink-soft/30" aria-hidden="true" />
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         4 — Activités CGWS + mise en avant consignation
    =================================================================== -->
    <StarDivider bg-class="bg-cgws-surface" />

    <section class="activites-section bg-cgws-ground py-10 md:py-14 lg:py-16" aria-labelledby="activites-heading">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
        <div class="text-center mb-10 md:mb-12">
          <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase mb-4">Nos Activités</p>
          <h2 id="activites-heading" class="font-serif font-bold text-cgws-ink text-[26px] md:text-[32px] lg:text-[38px]">
            Tout pour le cavalier western
          </h2>
        </div>

        <ul class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10 md:mb-12">
          <li
            v-for="activite in activites"
            :key="activite.label"
            class="bg-cgws-surface border border-cgws-hairline rounded-[--ui-radius] p-4 md:p-5 text-center"
          >
            <UIcon :name="activite.icon" class="w-6 h-6 mx-auto mb-2 text-cgws-accent" aria-hidden="true" />
            <p class="font-sans font-semibold text-sm text-cgws-ink">{{ activite.label }}</p>
          </li>
        </ul>

        <!-- Bloc consignation — mise en avant, PAS le motif "wanted poster"
             complet (réservé à consignation.vue) : simple callout avec bordure
             accent-deco, pour rappeler sans dupliquer. -->
        <div
          class="bg-cgws-surface border-2 border-cgws-accent-deco rounded-[--ui-radius] p-6 md:p-8
                 flex flex-col md:flex-row items-center gap-5 md:gap-8 text-center md:text-left"
        >
          <svg class="w-12 h-12 md:w-14 md:h-14 flex-shrink-0" viewBox="0 0 100 100" aria-hidden="true">
            <polygon class="fill-cgws-accent-deco" :points="STAR_POINTS" />
            <circle cx="50" cy="50" :r="STAR_CENTER_R" class="fill-cgws-surface" />
          </svg>
          <div class="flex-1">
            <h3 class="font-serif font-bold text-cgws-ink text-lg md:text-xl mb-1.5">
              Vous voulez vendre votre selle ?
            </h3>
            <p class="font-sans text-sm md:text-[15px] text-cgws-ink-soft max-w-[60ch]">
              Notre service de consignation vous permet de déposer votre matériel en
              toute confiance : nous l'exposons, nous le vendons pour vous, selon des
              conditions définies ensemble.
            </p>
          </div>
          <CgwsButton as="NuxtLink" to="/consignation" variant="primary" size="sm" class="flex-shrink-0 w-full md:w-auto">
            Découvrir la consignation
          </CgwsButton>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         5 — CTA final (contact)
    =================================================================== -->
    <StarDivider />

    <section class="cta-final-section bg-cgws-surface py-12 md:py-16 text-center" aria-labelledby="cta-final-heading">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
        <h2 id="cta-final-heading" class="font-serif font-bold text-cgws-ink text-[24px] md:text-[30px] mb-6">
          Une question&nbsp;? Parlons-en.
        </h2>
        <CgwsButton as="NuxtLink" to="/contact" variant="primary" size="md">
          Nous contacter
        </CgwsButton>
      </div>
    </section>
  </main>
</template>
