<script setup lang="ts">
import type { FulfillmentMethod } from '~/types'
import { useCartStore } from '~/stores/cart'
import {
  SHIPPING_FLAT_RATE,
  computeShippingCost,
  computeTotal,
} from '#shared/utils/checkout'
import CgwsInput from '~/components/ui/CgwsInput.vue'
import CgwsButton from '~/components/ui/CgwsButton.vue'

useSeoMeta({
  title: 'Passer commande — CGWS',
  description: 'Finalisez votre commande CGWS : livraison à domicile ou retrait gratuit à la boutique de Brèches (37). Paiement sécurisé par Stripe.',
  robots: 'noindex, nofollow',
})

const route = useRoute()
const cart = useCartStore()
const { loading, errorMessage, unavailableProducts, submitCheckout } = useCheckout()

// Retour de cancel_url Stripe — panier intact, aucune commande payée.
const wasCancelled = computed(() => route.query.cancelled === '1')

// ─── Formulaire guest (aucun compte) ────────────────────────────────────────

const form = reactive({
  email: '',
  name: '',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
  country: 'France',
})

const fulfillment = ref<FulfillmentMethod>('shipping')

const touched = reactive<Record<string, boolean>>({})
const submitAttempted = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\s\-()]{7,20}$/

const errors = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {}

  if (!form.email.trim()) result.email = 'L\'adresse email est requise'
  else if (!EMAIL_RE.test(form.email.trim())) result.email = 'Adresse email invalide'

  if (form.name.trim().length < 2) result.name = 'Le nom est requis (min. 2 caractères)'

  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
    result.phone = 'Numéro de téléphone invalide'
  }

  if (fulfillment.value === 'shipping') {
    if (form.street.trim().length < 3) result.street = 'L\'adresse est requise'
    if (form.postalCode.trim().length < 3) result.postalCode = 'Code postal invalide'
    if (!form.city.trim()) result.city = 'La ville est requise'
    if (form.country.trim().length < 2) result.country = 'Le pays est requis'
  }

  return result
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

/** Erreur affichée en temps réel dès que le champ a été visité (ou après une
 *  tentative de soumission) — le message se met à jour à chaque frappe. */
function fieldError(field: string): string | undefined {
  return touched[field] || submitAttempted.value ? errors.value[field] : undefined
}

function markTouched(field: string): void {
  touched[field] = true
}

// ─── Totaux ─────────────────────────────────────────────────────────────────

const formatEur = (amount: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

const shippingCost = computed(() => computeShippingCost(fulfillment.value))
const total = computed(() => computeTotal(cart.subtotal, fulfillment.value))

// ─── Disponibilité ──────────────────────────────────────────────────────────

onMounted(() => {
  void cart.refreshAvailability()
})

// Si le serveur refuse la session (409), il renvoie la liste précise des
// articles indisponibles — on resynchronise l'état local du panier.
watch(unavailableProducts, (products) => {
  if (products.length > 0) {
    void cart.refreshAvailability()
  }
})

function removeUnavailable(): void {
  for (const item of cart.unavailableItems) {
    cart.remove(item.productId)
  }
}

// ─── Soumission ─────────────────────────────────────────────────────────────

async function onSubmit(): Promise<void> {
  submitAttempted.value = true
  if (!isValid.value || cart.availableItems.length === 0) return

  await submitCheckout({
    email: form.email.trim(),
    name: form.name.trim(),
    phone: form.phone.trim() || undefined,
    fulfillmentMethod: fulfillment.value,
    address:
      fulfillment.value === 'shipping'
        ? {
            street: form.street.trim(),
            postalCode: form.postalCode.trim(),
            city: form.city.trim(),
            country: form.country.trim(),
          }
        : undefined,
    productIds: cart.availableItems.map(item => item.productId),
  })
}
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

      <!-- Bannière paiement annulé (retour cancel_url) -->
      <div
        v-if="wasCancelled"
        role="status"
        class="mt-6 bg-cgws-surface border-l-4 border-cgws-accent rounded-[4px] p-4 flex items-start gap-3"
      >
        <UIcon name="i-lucide-info" class="w-5 h-5 text-cgws-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p class="font-sans text-sm text-cgws-ink leading-relaxed">
          Paiement annulé — votre panier est intact. Vous pouvez reprendre votre commande quand vous le souhaitez.
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

        <!-- Formulaire + récapitulatif -->
        <form
          v-else
          class="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start"
          novalidate
          @submit.prevent="onSubmit"
        >
          <!-- ── Colonne formulaire ─────────────────────────────────────── -->
          <div class="flex flex-col gap-8 min-w-0">
            <!-- Coordonnées -->
            <fieldset class="flex flex-col gap-4 border-0 p-0 m-0">
              <legend class="font-serif font-semibold text-lg text-cgws-ink mb-2 p-0">
                Vos coordonnées
              </legend>

              <CgwsInput
                v-model="form.email"
                label="Email"
                type="email"
                name="email"
                autocomplete="email"
                placeholder="vous@exemple.fr"
                required
                :error="fieldError('email')"
                hint="Votre confirmation de commande sera envoyée à cette adresse"
                @blur="markTouched('email')"
              />
              <CgwsInput
                v-model="form.name"
                label="Nom complet"
                type="text"
                name="name"
                autocomplete="name"
                placeholder="Prénom Nom"
                required
                :error="fieldError('name')"
                @blur="markTouched('name')"
              />
              <CgwsInput
                v-model="form.phone"
                label="Téléphone"
                type="tel"
                name="phone"
                autocomplete="tel"
                placeholder="06 12 34 56 78"
                :error="fieldError('phone')"
                hint="Facultatif — utile pour organiser la livraison ou le retrait"
                @blur="markTouched('phone')"
              />
            </fieldset>

            <!-- Mode de réception -->
            <fieldset class="flex flex-col gap-3 border-0 p-0 m-0">
              <legend class="font-serif font-semibold text-lg text-cgws-ink mb-2 p-0">
                Mode de réception
              </legend>

              <label
                v-for="option in ([
                  { value: 'shipping', label: 'Livraison à domicile', detail: `Frais de port : ${formatEur(SHIPPING_FLAT_RATE)} €` },
                  { value: 'pickup', label: 'Retrait à la boutique — Brèches (37)', detail: 'Gratuit — nous conviendrons d\'un créneau ensemble' },
                ] as Array<{ value: FulfillmentMethod, label: string, detail: string }>)"
                :key="option.value"
                class="flex items-start gap-3 p-4 rounded-[4px] border-2 cursor-pointer transition-colors duration-150"
                :class="fulfillment === option.value
                  ? 'border-cgws-accent bg-cgws-surface'
                  : 'border-cgws-hairline bg-cgws-ground hover:border-cgws-edge'"
              >
                <input
                  v-model="fulfillment"
                  type="radio"
                  name="fulfillment"
                  :value="option.value"
                  class="mt-1 w-4 h-4 accent-cgws-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
                >
                <span class="flex flex-col gap-0.5">
                  <span class="font-sans font-semibold text-sm text-cgws-ink">{{ option.label }}</span>
                  <span class="font-sans text-xs text-cgws-ink-soft">{{ option.detail }}</span>
                </span>
              </label>
            </fieldset>

            <!-- Adresse de livraison (requise si livraison) -->
            <fieldset
              v-if="fulfillment === 'shipping'"
              class="flex flex-col gap-4 border-0 p-0 m-0"
            >
              <legend class="font-serif font-semibold text-lg text-cgws-ink mb-2 p-0">
                Adresse de livraison
              </legend>

              <CgwsInput
                v-model="form.street"
                label="Adresse"
                type="text"
                name="street"
                autocomplete="street-address"
                placeholder="12 rue de la Sellerie"
                required
                :error="fieldError('street')"
                @blur="markTouched('street')"
              />
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CgwsInput
                  v-model="form.postalCode"
                  label="Code postal"
                  type="text"
                  name="postalCode"
                  autocomplete="postal-code"
                  placeholder="37330"
                  required
                  :error="fieldError('postalCode')"
                  @blur="markTouched('postalCode')"
                />
                <CgwsInput
                  v-model="form.city"
                  label="Ville"
                  type="text"
                  name="city"
                  autocomplete="address-level2"
                  placeholder="Brèches"
                  required
                  :error="fieldError('city')"
                  @blur="markTouched('city')"
                />
              </div>
              <CgwsInput
                v-model="form.country"
                label="Pays"
                type="text"
                name="country"
                autocomplete="country-name"
                required
                :error="fieldError('country')"
                @blur="markTouched('country')"
              />
            </fieldset>
          </div>

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
                <dt class="font-sans text-sm text-cgws-ink-soft">Sous-total</dt>
                <dd class="font-sans text-sm tabular-nums text-cgws-ink">{{ formatEur(cart.subtotal) }} €</dd>
              </div>
              <div class="flex items-baseline justify-between">
                <dt class="font-sans text-sm text-cgws-ink-soft">Frais de port</dt>
                <dd class="font-sans text-sm tabular-nums text-cgws-ink">
                  {{ shippingCost > 0 ? `${formatEur(shippingCost)} €` : 'Gratuit' }}
                </dd>
              </div>
              <div class="flex items-baseline justify-between border-t border-cgws-hairline pt-2 mt-1">
                <dt class="font-sans font-semibold text-base text-cgws-ink">Total</dt>
                <dd class="font-display text-2xl tabular-nums text-cgws-accent">{{ formatEur(total) }} €</dd>
              </div>
            </dl>

            <!-- Erreur de soumission -->
            <p
              v-if="errorMessage"
              role="alert"
              class="font-sans text-sm text-cgws-danger leading-snug animate-shake"
            >
              {{ errorMessage }}
            </p>

            <CgwsButton
              type="submit"
              variant="primary"
              size="md"
              class="w-full justify-center"
              :loading="loading"
              :disabled="loading || cart.availableItems.length === 0"
            >
              <UIcon name="i-lucide-lock" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
              Payer {{ formatEur(total) }} €
            </CgwsButton>

            <p class="font-sans text-[11px] text-cgws-ink-soft text-center leading-snug">
              Vous serez redirigé vers la page de paiement sécurisée Stripe.
            </p>
          </aside>
        </form>

        <template #fallback>
          <div class="mt-12 py-12 text-center" aria-hidden="true">
            <p class="font-sans text-sm text-cgws-ink-soft">Chargement de votre panier…</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </section>
</template>
