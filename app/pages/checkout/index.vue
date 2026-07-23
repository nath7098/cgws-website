<script setup lang="ts">
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCartStore } from '~/stores/cart'
import CgwsButton from '~/components/ui/CgwsButton.vue'

useSeoMeta({
  title: 'Passer commande — CGWS',
  description: 'Finalisez votre commande CGWS : livraison à domicile ou retrait gratuit à la boutique de Brèches (37). Paiement sécurisé par Stripe.',
  robots: 'noindex, nofollow',
})

const route = useRoute()
const config = useRuntimeConfig()
const cart = useCartStore()
const { loading, errorMessage, unavailableProducts, createSession } = useCheckout()

// Retour de return_url Stripe après échec/annulation — panier intact.
const wasCancelled = computed(() => route.query.cancelled === '1')

const hasPublishableKey = computed(() => Boolean(config.public.stripePublishableKey))

type MountState = 'idle' | 'loading' | 'mounted' | 'error'
const mountState = ref<MountState>('idle')

// ── Analytics (US-103) ──────────────────────────────────────────────────────
// checkout_opened : capturé UNE fois par visite de la page, au montage EFFECTIF
// du checkout embarqué Stripe (jamais sur panier vide, clé absente ou erreur
// de session). One-shot : un retry réussi après erreur ne recompte pas une
// « ouverture » dans le funnel.
const { capture, getDistinctId } = useAnalytics()
let checkoutOpenedCaptured = false

function captureCheckoutOpened(): void {
  if (checkoutOpenedCaptured) return
  checkoutOpenedCaptured = true
  capture('checkout_opened', {
    // Sous-total payable (articles disponibles) — les frais de port, choisis
    // dans le formulaire Stripe, ne sont pas connus à l'ouverture.
    cart_value: cart.subtotal,
    // Total d'unités (somme des quantités, sémantique US-096 du badge panier).
    items_count: cart.count,
  })
}

const checkoutContainer = ref<HTMLDivElement | null>(null)
let embeddedCheckout: StripeEmbeddedCheckout | null = null

const formatEur = (amount: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

// ─── Disponibilité ──────────────────────────────────────────────────────────

function removeUnavailable(): void {
  for (const item of cart.unavailableItems) {
    cart.remove(item.productId)
  }
}

// Si le serveur refuse la session (409), il renvoie la liste précise des
// articles indisponibles — on resynchronise l'état local du panier.
watch(unavailableProducts, (products) => {
  if (products.length > 0) {
    void cart.refreshAvailability()
  }
})

// ─── Montage du Checkout embarqué Stripe ────────────────────────────────────

async function mountEmbeddedCheckout(): Promise<void> {
  if (!import.meta.client) return
  if (cart.isEmpty || cart.unavailableItems.length > 0) return
  if (!hasPublishableKey.value) {
    mountState.value = 'error'
    return
  }
  if (embeddedCheckout) return

  mountState.value = 'loading'

  try {
    const stripe = await loadStripe(config.public.stripePublishableKey as string)
    if (!stripe) throw new Error('stripe-load-failed')

    const checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret: async () => {
        const clientSecret = await createSession({
          // `item.quantity ?? 1` : garde de migration — un panier localStorage
          // posé avant l'US-096 ne porte pas de champ `quantity` (`undefined`),
          // ce qui violerait `z.number().int().min(1)` côté API (422, checkout
          // bloqué) sans cette garde.
          items: cart.availableItems.map(item => ({ productId: item.productId, quantity: item.quantity ?? 1 })),
          previousOrderId: cart.pendingOrderId ?? undefined,
          // US-104 — raccorde le funnel client (checkout_opened) au
          // `order_paid` serveur : distinct_id anonyme éphémère, absent si
          // PostHog est bloqué/désactivé (le comptage serveur reste exhaustif
          // via un id aléatoire côté webhook).
          analyticsId: getDistinctId() ?? undefined,
        })
        if (!clientSecret) throw new Error('checkout-session-failed')
        return clientSecret
      },
    })

    embeddedCheckout = checkout
    await nextTick()
    if (checkoutContainer.value) {
      checkout.mount(checkoutContainer.value)
      mountState.value = 'mounted'
      captureCheckoutOpened()
    }
    else {
      // Le conteneur a disparu (navigation) entre-temps — on nettoie.
      checkout.destroy()
      embeddedCheckout = null
    }
  }
  catch {
    mountState.value = 'error'
    if (!errorMessage.value) {
      errorMessage.value = 'Impossible de charger le formulaire de paiement. Réessayez dans quelques instants.'
    }
  }
}

async function retryMount(): Promise<void> {
  if (embeddedCheckout) {
    embeddedCheckout.destroy()
    embeddedCheckout = null
  }
  mountState.value = 'idle'
  await mountEmbeddedCheckout()
}

onMounted(async () => {
  await cart.refreshAvailability()
  await mountEmbeddedCheckout()
})

// Une fois les articles indisponibles retirés du panier, on tente le montage
// (il n'a jamais démarré tant qu'ils étaient présents).
watch(
  () => cart.unavailableItems.length,
  (length) => {
    if (length === 0 && mountState.value === 'idle' && !cart.isEmpty) {
      void mountEmbeddedCheckout()
    }
  },
)

onUnmounted(() => {
  embeddedCheckout?.destroy()
  embeddedCheckout = null
})
</script>

<template>
  <section
    class="bg-cgws-ground py-8 md:py-12"
    aria-label="Passer commande"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <h1 class="font-serif font-bold text-[28px] sm:text-[32px] lg:text-[36px] text-cgws-ink leading-tight">
        Passer commande
      </h1>
      <p class="font-sans text-sm text-cgws-ink-soft mt-2">
        Paiement sécurisé par Stripe — aucun compte nécessaire.
      </p>

      <!-- Bannière paiement annulé/échoué (retour return_url) -->
      <div
        v-if="wasCancelled"
        role="status"
        class="mt-6 bg-cgws-surface border-l-4 border-cgws-accent rounded-[4px] p-4 flex items-start gap-3"
      >
        <UIcon name="i-lucide-info" class="w-5 h-5 text-cgws-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p class="font-sans text-sm text-cgws-ink leading-relaxed">
          Paiement annulé ou interrompu — votre panier est intact. Vous pouvez reprendre votre commande ci-dessous.
        </p>
      </div>

      <!-- Le panier vit dans localStorage : inconnu au rendu serveur.
           ClientOnly évite tout hydration mismatch sur cette page. -->
      <ClientOnly>
        <!-- Panier vide -->
        <div
          v-if="cart.isEmpty"
          class="mt-12 flex flex-col items-center gap-4 py-12 text-center"
        >
          <div
            class="w-16 h-16 rounded-full border-2 border-dashed border-cgws-hairline flex items-center justify-center"
            aria-hidden="true"
          >
            <UIcon name="i-lucide-shopping-basket" class="w-7 h-7 text-cgws-ink-soft/50" aria-hidden="true" />
          </div>
          <p class="font-serif font-semibold text-lg text-cgws-ink">Votre panier est vide</p>
          <p class="font-sans text-sm text-cgws-ink-soft max-w-[280px]">
            Ajoutez des articles depuis le catalogue avant de passer commande.
          </p>
          <CgwsButton as="NuxtLink" to="/catalogue" variant="primary" size="md">
            Voir le catalogue
          </CgwsButton>
        </div>

        <!-- Récapitulatif + Checkout embarqué -->
        <div
          v-else
          class="mt-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start"
        >
          <!-- ── Colonne récapitulatif ──────────────────────────────────── -->
          <aside
            class="bg-cgws-surface border-2 border-cgws-edge rounded-[6px] p-5 flex flex-col gap-4 lg:sticky lg:top-[calc(4rem+2rem)]"
            aria-label="Récapitulatif de la commande"
          >
            <h2 class="font-serif font-semibold text-lg text-cgws-ink">
              Récapitulatif
            </h2>

            <!-- Articles indisponibles -->
            <div
              v-if="cart.unavailableItems.length > 0"
              role="alert"
              class="bg-cgws-danger/10 border border-cgws-danger/40 rounded-[4px] p-3 flex flex-col gap-2"
            >
              <p class="font-sans font-semibold text-xs text-cgws-danger">
                Plus disponible{{ cart.unavailableItems.length > 1 ? 's' : '' }} :
              </p>
              <ul class="font-sans text-xs text-cgws-ink list-disc list-inside">
                <li v-for="item in cart.unavailableItems" :key="item.productId">
                  {{ item.title }}
                </li>
              </ul>
              <button
                type="button"
                class="self-start font-sans text-xs font-semibold text-cgws-danger underline underline-offset-2
                       rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-danger"
                @click="removeUnavailable"
              >
                Retirer du panier
              </button>
            </div>

            <ul class="divide-y divide-cgws-hairline" aria-label="Articles de la commande">
              <li
                v-for="item in cart.availableItems"
                :key="item.productId"
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
                <dt class="font-sans font-semibold text-base text-cgws-ink">Sous-total</dt>
                <dd class="font-display text-2xl tabular-nums text-cgws-accent">{{ formatEur(cart.subtotal) }} €</dd>
              </div>
            </dl>

            <p class="font-sans text-[11px] text-cgws-ink-soft leading-snug">
              Frais de port calculés dans le formulaire de paiement, selon le mode de réception choisi
              (livraison à domicile ou retrait gratuit à la boutique de Brèches).
            </p>
          </aside>

          <!-- ── Colonne Checkout embarqué ──────────────────────────────── -->
          <div
            class="relative bg-cgws-surface border-2 border-cgws-edge rounded-[6px] p-4 min-h-[600px]"
          >
            <!-- Articles indisponibles : le montage n'a pas démarré -->
            <div
              v-if="cart.unavailableItems.length > 0"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <UIcon name="i-lucide-triangle-alert" class="w-8 h-8 text-cgws-danger" aria-hidden="true" />
              <p class="font-sans text-sm text-cgws-ink-soft max-w-[360px]">
                Retirez les articles indisponibles de votre panier (colonne de gauche) pour continuer votre paiement.
              </p>
            </div>

            <!-- Clé publishable absente : paiement indisponible -->
            <div
              v-else-if="!hasPublishableKey"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <UIcon name="i-lucide-circle-off" class="w-8 h-8 text-cgws-ink-soft" aria-hidden="true" />
              <p class="font-sans text-sm text-cgws-ink-soft max-w-[360px]">
                Le paiement en ligne n'est pas disponible pour le moment. Merci de nous contacter directement pour
                finaliser votre commande.
              </p>
            </div>

            <!-- Chargement du formulaire -->
            <div
              v-else-if="mountState === 'idle' || mountState === 'loading'"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3"
              aria-hidden="true"
            >
              <span
                class="w-10 h-10 inline-block animate-spin rounded-full border-4 border-cgws-accent border-t-transparent"
              />
              <p class="font-sans text-sm text-cgws-ink-soft">Chargement du formulaire de paiement…</p>
            </div>

            <!-- Erreur de création de session -->
            <div
              v-else-if="mountState === 'error'"
              role="alert"
              class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
            >
              <UIcon name="i-lucide-circle-alert" class="w-8 h-8 text-cgws-danger" aria-hidden="true" />
              <p class="font-sans text-sm text-cgws-danger leading-snug max-w-[360px]">
                {{ errorMessage }}
              </p>
              <CgwsButton variant="secondary" size="sm" :loading="loading" @click="retryMount">
                Réessayer
              </CgwsButton>
            </div>

            <!-- Conteneur Checkout embarqué Stripe — toujours présent dans le DOM
                 (v-show, jamais v-if) pour que la référence reste valide tant que
                 Stripe y a injecté son iframe. -->
            <div
              v-show="mountState === 'mounted'"
              ref="checkoutContainer"
              class="w-full min-h-[600px]"
            />
          </div>
        </div>

        <template #fallback>
          <div class="mt-12 py-12 text-center" aria-hidden="true">
            <p class="font-sans text-sm text-cgws-ink-soft">Chargement de votre panier…</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </section>
</template>
