<script setup lang="ts">
import type { CheckoutSessionStatus } from '~/types'
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

// Statut de la session Stripe (déclenche aussi le fulfillment côté serveur,
// idempotent). Peut échouer (session inconnue/expirée) — on affiche alors un
// message générique plutôt que de faire planter la page.
const { data } = await useAsyncData<CheckoutSessionStatus | null>(
  `checkout-session-status-${sessionId.value ?? 'none'}`,
  () =>
    sessionId.value
      ? $fetch<CheckoutSessionStatus>('/api/checkout/session-status', {
          query: { session_id: sessionId.value },
        }).catch(() => null)
      : Promise.resolve(null),
)

const order = computed(() => data.value?.order ?? null)

/** Paiement confirmé (synchrone ou total à 0) — le fulfillment a eu lieu. */
const isPaid = computed(
  () =>
    data.value?.status === 'complete'
    && (data.value.paymentStatus === 'paid' || data.value.paymentStatus === 'no_payment_required'),
)

/** Paiement asynchrone (ex. virement) en cours de confirmation. */
const isProcessing = computed(
  () => data.value?.status === 'complete' && data.value.paymentStatus === 'unpaid',
)

const formatEur = (amount: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

onMounted(() => {
  if (!sessionId.value || !data.value) return

  // Session encore ouverte : le paiement a échoué ou a été abandonné dans le
  // formulaire embarqué. On remonte le formulaire — le panier reste intact.
  if (data.value.status === 'open') {
    void navigateTo({ path: '/checkout', query: { cancelled: '1' } })
    return
  }

  // Paiement confirmé ou en cours de traitement asynchrone : le panier a
  // rempli son rôle, on le vide (les pièces sont réservées/vendues côté serveur).
  if (data.value.status === 'complete') {
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
        <template v-if="isPaid">Commande confirmée !</template>
        <template v-else-if="isProcessing">Merci pour votre commande !</template>
        <template v-else>Merci de votre visite</template>
      </h1>

      <p class="font-sans text-base text-cgws-ink-soft leading-relaxed max-w-[440px]">
        <template v-if="isPaid">
          Votre paiement a bien été reçu. Un email de confirmation vous a été envoyé
          <template v-if="order?.email"> à <strong class="text-cgws-ink">{{ order.email }}</strong></template>.
        </template>
        <template v-else-if="isProcessing">
          Votre paiement a bien été pris en compte et est en cours de traitement. Vous recevrez un email de
          confirmation dans quelques instants.
        </template>
        <template v-else>
          Nous n'avons pas pu retrouver les détails de cette commande. Si vous venez d'effectuer un paiement,
          vous recevrez un email de confirmation sous peu.
        </template>
      </p>

      <!-- Récapitulatif -->
      <div
        v-if="order && (isPaid || isProcessing)"
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

        <div v-if="order.fulfillmentMethod" class="border-t border-cgws-hairline pt-3 flex flex-col gap-1">
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
