<script setup lang="ts">
import type { OrderRecap } from '~/types'
import { useCartStore } from '~/stores/cart'
import { FULFILLMENT_LABELS } from '#shared/utils/checkout'
import CgwsButton from '~/components/ui/CgwsButton.vue'

useSeoMeta({
  title: 'Commande confirmée — CGWS',
  description: 'Merci pour votre commande CGWS.',
  robots: 'noindex, nofollow',
})

const route = useRoute()
const cart = useCartStore()

const sessionId = computed(() =>
  typeof route.query.session_id === 'string' ? route.query.session_id : null,
)

// Récap commande via l'API (lookup par stripe_session_id). Peut échouer
// (visite directe sans session) — on affiche alors un message générique.
const { data } = await useAsyncData<{ order: OrderRecap } | null>(
  `checkout-success-${sessionId.value ?? 'none'}`,
  () =>
    sessionId.value
      ? $fetch<{ order: OrderRecap }>(`/api/orders/${encodeURIComponent(sessionId.value)}`).catch(() => null)
      : Promise.resolve(null),
)

const order = computed(() => data.value?.order ?? null)

/** Le webhook peut mettre quelques secondes — 'pending' ici signifie
 *  "paiement effectué, confirmation en cours de traitement". */
const isConfirmed = computed(() => order.value?.status === 'paid' || order.value?.status === 'fulfilled')

const formatEur = (amount: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

// Le paiement est passé : on vide le panier local (US-071).
onMounted(() => {
  if (sessionId.value) {
    cart.clear()
  }
})
</script>

<template>
  <section
    class="bg-cgws-ground py-12 md:py-16"
    aria-label="Confirmation de commande"
  >
    <div class="max-w-[640px] mx-auto px-[clamp(1rem,4vw,2rem)] flex flex-col items-center gap-6 text-center">
      <!-- Médaillon succès -->
      <div
        class="w-16 h-16 rounded-full bg-cgws-success/15 border-2 border-cgws-success flex items-center justify-center"
        aria-hidden="true"
      >
        <UIcon name="i-lucide-check" class="w-8 h-8 text-cgws-success" aria-hidden="true" />
      </div>

      <h1 class="font-serif font-bold text-[28px] sm:text-[32px] text-cgws-ink leading-tight">
        {{ isConfirmed ? 'Commande confirmée !' : 'Merci pour votre commande !' }}
      </h1>

      <p class="font-sans text-base text-cgws-ink-soft leading-relaxed max-w-[440px]">
        <template v-if="isConfirmed">
          Votre paiement a bien été reçu. Un email de confirmation vous a été envoyé
          <template v-if="order">à <strong class="text-cgws-ink">{{ order.email }}</strong></template>.
        </template>
        <template v-else>
          Votre paiement a bien été pris en compte. Votre confirmation est en cours de
          traitement — vous recevrez un email récapitulatif dans quelques instants.
        </template>
      </p>

      <!-- Récapitulatif -->
      <div
        v-if="order"
        class="w-full bg-cgws-surface border-2 border-cgws-edge rounded-[6px] p-5 flex flex-col gap-4 text-left"
      >
        <h2 class="font-serif font-semibold text-lg text-cgws-ink">
          Votre commande
        </h2>

        <ul class="divide-y divide-cgws-hairline" aria-label="Articles commandés">
          <li
            v-for="(item, index) in order.items"
            :key="index"
            class="py-2.5 flex items-baseline justify-between gap-3"
          >
            <span class="font-sans text-sm text-cgws-ink line-clamp-2">{{ item.title }}</span>
            <span class="font-display text-base tabular-nums text-cgws-ink flex-shrink-0">
              {{ formatEur(item.price) }} €
            </span>
          </li>
        </ul>

        <dl class="flex flex-col gap-1.5 border-t border-cgws-hairline pt-3">
          <div class="flex items-baseline justify-between">
            <dt class="font-sans text-sm text-cgws-ink-soft">Sous-total</dt>
            <dd class="font-sans text-sm tabular-nums text-cgws-ink">{{ formatEur(order.subtotal) }} €</dd>
          </div>
          <div class="flex items-baseline justify-between">
            <dt class="font-sans text-sm text-cgws-ink-soft">Frais de port</dt>
            <dd class="font-sans text-sm tabular-nums text-cgws-ink">
              {{ order.shippingCost > 0 ? `${formatEur(order.shippingCost)} €` : 'Gratuit' }}
            </dd>
          </div>
          <div class="flex items-baseline justify-between border-t border-cgws-hairline pt-2 mt-1">
            <dt class="font-sans font-semibold text-base text-cgws-ink">Total payé</dt>
            <dd class="font-display text-2xl tabular-nums text-cgws-accent">{{ formatEur(order.total) }} €</dd>
          </div>
        </dl>

        <div class="border-t border-cgws-hairline pt-3 flex flex-col gap-1">
          <p class="font-sans text-sm text-cgws-ink">
            <strong>{{ FULFILLMENT_LABELS[order.fulfillmentMethod] }}</strong>
          </p>
          <p
            v-if="order.fulfillmentMethod === 'shipping' && order.shippingAddress"
            class="font-sans text-sm text-cgws-ink-soft"
          >
            {{ order.shippingAddress.street }},
            {{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }},
            {{ order.shippingAddress.country }}
          </p>
          <p v-else-if="order.fulfillmentMethod === 'pickup'" class="font-sans text-sm text-cgws-ink-soft">
            Nous vous contacterons pour convenir d'un créneau de retrait à Brèches.
          </p>
          <p class="font-sans text-[11px] text-cgws-ink-soft mt-1">
            Référence : {{ order.id }}
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mt-2">
        <CgwsButton as="NuxtLink" to="/catalogue" variant="primary" size="md">
          Continuer sur le catalogue
        </CgwsButton>
        <CgwsButton as="NuxtLink" to="/" variant="secondary" size="md">
          Retour à l'accueil
        </CgwsButton>
      </div>
    </div>
  </section>
</template>
