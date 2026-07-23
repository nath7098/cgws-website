<script setup lang="ts">
import {
  FULFILLMENT_LABELS,
  PICKUP_COST,
} from '#shared/utils/checkout'

// Réutilise le contrat fulfillment PARTAGÉ (#shared/utils/checkout, US-082/
// US-091) : mêmes libellés et même gratuité du retrait que le checkout
// embarqué — la page vitrine ne redéfinit aucune règle de livraison.
const shippingLabel = FULFILLMENT_LABELS.shipping
const pickupLabel = FULFILLMENT_LABELS.pickup
const pickupIsFree = PICKUP_COST === 0

// Contenu juridique provisoire (politique de retour des selles) → on n'indexe
// pas tant qu'il n'est pas validé par Camille, même approche que
// mentions-legales.vue. À repasser en `index, follow` une fois le texte
// définitif intégré (blocage contenu US-111).
useSeoMeta({
  title: 'Livraison, essai & retour — CGWS',
  description:
    'Modes de livraison et de retrait, droit de rétractation et politique d\'essai/retour '
    + 'des selles chez CGWS — sellerie western à Brèches, Indre-et-Loire.',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <div class="bg-cgws-ground min-h-screen">
    <!-- Lien retour — en dehors du container article centré -->
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] pt-6 md:pt-8">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 font-sans text-sm text-cgws-accent
               hover:text-cgws-ink-soft transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 rounded-sm"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" aria-hidden="true" />
        Retour à l'accueil
      </NuxtLink>
    </div>

    <!-- Contenu -->
    <article
      class="max-w-3xl mx-auto px-[clamp(1rem,4vw,2rem)] py-8 md:py-16"
      aria-labelledby="delivery-title"
    >
      <!-- En-tête -->
      <h1
        id="delivery-title"
        class="font-display text-[40px] sm:text-[48px] md:text-[56px]
               text-cgws-ink tracking-wide uppercase leading-none mb-2"
      >
        Livraison, essai &amp; retour
      </h1>
      <p class="font-sans text-[12px] md:text-[13px] text-cgws-ink/50 mb-6">
        Dernière mise à jour : janvier 2025
      </p>

      <!-- Bandeau contenu provisoire — jamais présenté comme définitif -->
      <div
        class="mb-10 rounded-[4px] border border-cgws-accent/40 bg-cgws-surface
               px-4 py-3 flex items-start gap-2.5"
        role="note"
        aria-label="Contenu provisoire"
      >
        <UIcon
          name="i-lucide-info"
          class="w-4 h-4 text-cgws-accent flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p class="font-sans text-[13px] text-cgws-ink-soft leading-relaxed">
          <span class="font-semibold text-cgws-ink">Contenu en cours de validation.</span>
          Les modalités et frais de retour propres à CGWS ci-dessous sont provisoires et
          seront précisés prochainement. Le cadre légal (délai de rétractation de 14 jours)
          est, lui, d'application générale.
        </p>
      </div>

      <hr class="border-t border-cgws-hairline mb-10" aria-hidden="true">

      <!-- 1. Acheter chez CGWS -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-modele">
        <h2
          id="section-modele"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          1. Acheter chez CGWS
        </h2>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          L'ensemble du catalogue — selles comprises — est achetable en ligne, avec au choix
          la livraison ou le retrait au magasin. Chaque article reste également disponible à
          l'achat directement en boutique, à Brèches (Indre-et-Loire).
        </p>
      </section>

      <!-- 2. Modes de réception -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-reception">
        <h2
          id="section-reception"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          2. Livraison &amp; retrait
        </h2>

        <h3
          class="font-serif font-semibold text-[17px] md:text-[18px]
                 text-cgws-ink mb-2 mt-6"
        >
          2.1 {{ shippingLabel }} — France entière
        </h3>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Vos achats sont expédiés partout en France. Les frais de port forfaitaires vous
          sont indiqués et calculés à l'étape de paiement, avant validation de la commande.
        </p>

        <h3
          class="font-serif font-semibold text-[17px] md:text-[18px]
                 text-cgws-ink mb-2 mt-6"
        >
          2.2 Click &amp; collect — {{ pickupLabel }}
        </h3>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Vous pouvez choisir de récupérer votre commande directement au magasin de Brèches
          (37){{ pickupIsFree ? ', sans frais' : '' }}. C'est aussi l'occasion d'essayer le
          matériel sur place, en particulier pour une selle.
        </p>
      </section>

      <!-- 3. Droit de rétractation (cadre légal général) -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-retractation">
        <h2
          id="section-retractation"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          3. Droit de rétractation
        </h2>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Conformément à l'article L221-18 du Code de la consommation, pour tout achat en
          ligne vous disposez d'un délai de 14 jours pour exercer votre droit de rétractation,
          à compter de la réception du bien, sans avoir à motiver votre décision. Ce droit ne
          s'applique pas aux achats effectués directement en boutique ni aux articles
          personnalisés.
        </p>
      </section>

      <!-- 4. Essai & retour d'une selle expédiée — PLACEHOLDER juridique -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-selle">
        <h2
          id="section-selle"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          4. Essai &amp; retour d'une selle expédiée
        </h2>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Acheter une selle à distance, c'est possible en toute confiance : le délai légal de
          rétractation de 14 jours s'applique, et une selle qui ne conviendrait pas peut être
          retournée dans ce délai.
        </p>

        <!-- PLACEHOLDER JURIDIQUE — le texte définitif (prise en charge et
             montant des frais de retour d'une selle ≈ 60-100 €, conditions et
             modalités d'essai) engage juridiquement CGWS et doit être validé
             par Camille (+ comptable/juriste). NE PAS présenter comme
             définitif. Même pattern « à valider » que US-011/US-099/US-110. -->
        <div
          class="mt-5 rounded-[4px] border-l-2 border-cgws-accent/40 bg-cgws-surface/60
                 pl-4 py-3 pr-3 space-y-2"
        >
          <p
            class="font-sans text-[13px] md:text-[14px] text-cgws-ink-soft leading-relaxed"
          >
            <span class="font-semibold text-cgws-ink">Frais de retour&nbsp;:</span>
            le retour d'une selle représente un coût d'expédition significatif (de l'ordre de
            60 à 100 €). Leur prise en charge et leur montant exact seront précisés ici.
          </p>
          <p
            class="font-sans text-[13px] md:text-[14px] text-cgws-ink-soft leading-relaxed"
          >
            <span class="font-semibold text-cgws-ink">Conditions d'essai&nbsp;:</span>
            une selle retournée devra être renvoyée propre, non montée en extérieur et dans
            son état d'origine. Les modalités précises seront détaillées ici.
          </p>
          <p class="font-sans text-[12px] italic text-cgws-ink-soft/70">
            — modalités et montants à valider par Camille
          </p>
        </div>

        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed mt-5"
        >
          Compte tenu de ces frais, si vous le pouvez, nous vous invitons à privilégier
          l'essai et le retrait de votre selle au magasin de Brèches : c'est la façon la plus
          simple de vérifier qu'elle vous convient, à vous comme à votre cheval.
        </p>
      </section>

      <!-- 5. Une question ? -->
      <section class="mb-4" aria-labelledby="section-contact">
        <h2
          id="section-contact"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          5. Une question sur votre commande ?
        </h2>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Avant ou après un achat, pour toute question sur la livraison, un essai ou un
          retour, n'hésitez pas à
          <!-- eslint-disable-next-line link-checker/valid-route -->
          <NuxtLink
            to="/contact"
            class="text-cgws-accent hover:underline transition-colors duration-150"
          >
            nous contacter
          </NuxtLink>. Nous vous répondrons avec plaisir.
        </p>
      </section>
    </article>
  </div>
</template>
