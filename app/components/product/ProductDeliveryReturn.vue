<script setup lang="ts">
import type { Product } from '~/types'
import {
  FULFILLMENT_LABELS,
  PICKUP_COST,
} from '#shared/utils/checkout'

interface Props {
  product: Product
}

const props = defineProps<Props>()

// Traitement différencié selle vs non-selle (docs/BRAND_DIRECTION § Modèle de
// vente) : une selle expédiée engage une politique d'essai/retour spécifique
// (frais de retour élevés ≈ 60-100 €, encouragement à l'essai/retrait au
// magasin). Les autres articles relèvent du droit de rétractation standard de
// la vente à distance (14 jours). Le bloc « Livraison & retrait », lui, est
// affiché pour TOUS les articles.
const isSaddle = computed(() => props.product.category === 'selles')

// Réutilise le contrat fulfillment PARTAGÉ (#shared/utils/checkout, livré en
// US-082/US-091) : les libellés des deux modes de réception et la gratuité du
// retrait sont la MÊME source de vérité que le checkout embarqué. Aucune
// logique de livraison n'est ré-implémentée ici — elle est seulement exposée
// côté vitrine, en amont du tunnel de paiement où le choix réel est fait.
const shippingLabel = FULFILLMENT_LABELS.shipping
const pickupLabel = FULFILLMENT_LABELS.pickup
const pickupIsFree = PICKUP_COST === 0
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- ── Bloc « Livraison & retrait » — affiché pour tous les articles ─────── -->
    <section
      class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4 flex flex-col gap-3"
      aria-labelledby="delivery-heading"
    >
      <h2
        id="delivery-heading"
        class="font-serif font-bold text-[15px] text-cgws-ink flex items-center gap-2"
      >
        <UIcon
          name="i-lucide-truck"
          class="w-4 h-4 text-cgws-accent flex-shrink-0"
          aria-hidden="true"
        />
        Livraison &amp; retrait
      </h2>

      <ul class="flex flex-col gap-3" role="list">
        <!-- Expédition France entière -->
        <li class="flex items-start gap-2.5">
          <UIcon
            name="i-lucide-package"
            class="w-4 h-4 text-cgws-accent/70 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p class="font-sans font-medium text-[13px] text-cgws-ink leading-snug">
              {{ shippingLabel }} — France entière
            </p>
            <p class="font-sans text-[12px] text-cgws-ink-soft leading-snug mt-0.5">
              Frais de port forfaitaires, calculés à l'étape de paiement.
            </p>
          </div>
        </li>

        <!-- Click &amp; collect au magasin de Brèches -->
        <li class="flex items-start gap-2.5">
          <UIcon
            name="i-lucide-store"
            class="w-4 h-4 text-cgws-accent/70 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p class="font-sans font-medium text-[13px] text-cgws-ink leading-snug">
              Click &amp; collect — {{ pickupLabel }}
            </p>
            <p class="font-sans text-[12px] text-cgws-ink-soft leading-snug mt-0.5">
              Retrait au magasin de Brèches (37){{ pickupIsFree ? ' — gratuit' : '' }}. Article
              également disponible directement en boutique.
            </p>
          </div>
        </li>
      </ul>
    </section>

    <!-- ── Bloc « Essai & retour » ──────────────────────────────────────────── -->
    <section
      class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4 flex flex-col gap-2.5"
      aria-labelledby="return-heading"
    >
      <h2
        id="return-heading"
        class="font-serif font-bold text-[15px] text-cgws-ink flex items-center gap-2"
      >
        <UIcon
          name="i-lucide-rotate-ccw"
          class="w-4 h-4 text-cgws-accent flex-shrink-0"
          aria-hidden="true"
        />
        {{ isSaddle ? 'Essai & retour de votre selle' : 'Retour & rétractation' }}
      </h2>

      <!-- Selle : politique d'essai/retour spécifique (résumé) -->
      <template v-if="isSaddle">
        <p class="font-sans text-[13px] text-cgws-ink-soft leading-relaxed">
          Vous achetez une selle à distance : vous bénéficiez du délai légal de rétractation
          de 14 jours prévu pour la vente en ligne. Une selle qui ne conviendrait pas peut
          être retournée dans ce délai.
        </p>
        <!-- PLACEHOLDER JURIDIQUE — texte définitif (frais de retour ≈ 60-100 €,
             conditions et modalités d'essai) engage juridiquement CGWS et doit
             être validé par Camille (+ comptable/juriste). Ne PAS présenter
             comme définitif. Même pattern « à valider » que US-011/US-099/US-110. -->
        <p
          class="font-sans text-[13px] text-cgws-ink-soft leading-relaxed border-l-2 border-cgws-accent/40 pl-3"
        >
          Les modalités précises de retour d'une selle (prise en charge et montant des frais
          de retour, conditions d'essai) sont détaillées sur notre page dédiée.
          <span class="italic text-cgws-ink-soft/70">— contenu à valider par Camille</span>
        </p>
        <p class="font-sans text-[12px] text-cgws-ink-soft/80 leading-relaxed">
          Une selle s'essaie&nbsp;: si vous le pouvez, privilégiez le retrait au magasin de
          Brèches pour l'essayer avant l'achat.
        </p>
      </template>

      <!-- Article non-selle : droit de rétractation standard à distance -->
      <template v-else>
        <p class="font-sans text-[13px] text-cgws-ink-soft leading-relaxed">
          Pour un achat en ligne, vous bénéficiez du délai légal de rétractation de 14 jours
          prévu pour la vente à distance, à compter de la réception de l'article. Le retrait
          au magasin de Brèches reste possible à tout moment.
        </p>
        <!-- PLACEHOLDER JURIDIQUE — modalités et frais de retour définitifs à
             valider par Camille avant d'être présentés comme définitifs. -->
        <p class="font-sans text-[12px] text-cgws-ink-soft/80 leading-relaxed">
          Modalités complètes de retour détaillées sur notre page dédiée.
          <span class="italic text-cgws-ink-soft/70">— contenu à valider par Camille</span>
        </p>
      </template>

      <!-- Lien vers la page dédiée complète (présent pour selle ET non-selle) -->
      <!-- eslint-disable link-checker/valid-route, link-checker/valid-sitemap-link -->
      <NuxtLink
        to="/livraison-retour"
        class="font-sans font-medium text-[13px] text-cgws-accent hover:text-cgws-ink-soft transition-colors duration-150 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-accent rounded-sm self-start inline-flex items-center gap-1"
      >
        Livraison, essai &amp; retour — tout savoir
        <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
      </NuxtLink>
      <!-- eslint-enable link-checker/valid-route, link-checker/valid-sitemap-link -->
    </section>
  </div>
</template>
