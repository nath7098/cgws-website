<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import CartLineItem from './CartLineItem.vue'
import CgwsButton from '../ui/CgwsButton.vue'

const open = defineModel<boolean>('open', { default: false })

const cart = useCartStore()

const formattedSubtotal = computed(() =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cart.subtotal),
)

// Revalide la disponibilité des articles à chaque ouverture du drawer
// (un produit peut avoir été vendu entre-temps — pièces uniques).
watch(open, (isOpen) => {
  if (isOpen) {
    void cart.refreshAvailability()
  }
})

function removeItem(productId: string): void {
  cart.remove(productId)
}

function clearCart(): void {
  cart.clear()
}
</script>

<template>
  <!-- Focus trap, Escape, aria-modal et restitution du focus sont gérés par
       USlideover (Reka UI Dialog) — ne pas ré-implémenter à la main. -->
  <USlideover
    v-model:open="open"
    side="right"
    title="Votre panier"
    :description="cart.isEmpty ? 'Aucun article pour le moment' : `${cart.count} article${cart.count > 1 ? 's' : ''} dans votre panier`"
    :ui="{
      content: 'bg-cgws-ground max-w-md w-full',
      header: 'border-b border-cgws-hairline',
      title: 'font-serif font-bold text-lg text-cgws-ink',
      description: 'font-sans text-xs text-cgws-ink-soft',
      body: 'flex-1',
      footer: 'border-t border-cgws-hairline flex-col items-stretch gap-3',
      overlay: 'bg-cgws-ink/60 backdrop-blur-sm',
    }"
  >
    <!-- Bouton fermer custom : le prop `close` de USlideover n'accepte que des
         ButtonProps typés (pas d'attribut aria-label). Le slot #close est rendu
         dans un DialogClose as-child : le clic ferme le drawer, et on garde un
         aria-label français explicite. -->
    <template #close>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        aria-label="Fermer le panier"
        class="absolute top-4 end-4"
      />
    </template>

    <template #body>
      <!-- État vide -->
      <div
        v-if="cart.isEmpty"
        class="h-full flex flex-col items-center justify-center gap-4 py-12 text-center"
      >
        <div
          class="w-16 h-16 rounded-full border-2 border-dashed border-cgws-hairline flex items-center justify-center"
          aria-hidden="true"
        >
          <UIcon name="i-lucide-shopping-basket" class="w-7 h-7 text-cgws-ink-soft/50" aria-hidden="true" />
        </div>
        <p class="font-serif font-semibold text-base text-cgws-ink">
          Votre panier est vide
        </p>
        <p class="font-sans text-sm text-cgws-ink-soft max-w-[240px]">
          Parcourez notre sellerie pour trouver votre prochaine pièce western.
        </p>
        <CgwsButton
          as="NuxtLink"
          to="/catalogue"
          variant="secondary"
          size="sm"
          @click="open = false"
        >
          Voir le catalogue
        </CgwsButton>
      </div>

      <!-- Lignes du panier -->
      <ul v-else class="divide-y divide-cgws-hairline" aria-label="Articles du panier">
        <CartLineItem
          v-for="item in cart.items"
          :key="item.productId"
          :item="item"
          :unavailable="cart.unavailableIds.includes(item.productId)"
          @remove="removeItem"
        />
      </ul>
    </template>

    <template v-if="!cart.isEmpty" #footer>
      <!-- Note articles indisponibles -->
      <p
        v-if="cart.unavailableItems.length > 0"
        class="font-sans text-xs text-cgws-danger leading-snug"
        role="status"
      >
        {{ cart.unavailableItems.length > 1
          ? `${cart.unavailableItems.length} articles ne sont plus disponibles et sont exclus du sous-total.`
          : `1 article n'est plus disponible et est exclu du sous-total.` }}
      </p>

      <!-- Sous-total -->
      <div class="flex items-baseline justify-between">
        <span class="font-sans font-medium text-sm text-cgws-ink">Sous-total</span>
        <span class="font-display text-2xl tabular-nums text-cgws-accent">
          {{ formattedSubtotal }} €
        </span>
      </div>
      <p class="font-sans text-[11px] text-cgws-ink-soft -mt-2">
        Frais de port éventuels calculés à l'étape suivante.
      </p>

      <!-- CTA checkout -->
      <CgwsButton
        as="NuxtLink"
        to="/checkout"
        variant="primary"
        size="md"
        class="w-full justify-center"
        :class="cart.availableItems.length === 0 ? 'pointer-events-none opacity-40' : ''"
        :aria-disabled="cart.availableItems.length === 0 ? 'true' : undefined"
        @click="open = false"
      >
        Passer commande
      </CgwsButton>

      <!-- Vider le panier -->
      <button
        type="button"
        class="self-center flex items-center gap-1.5 font-sans text-xs text-cgws-ink-soft
               hover:text-cgws-danger transition-colors duration-150 rounded-sm px-2 py-1
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-danger"
        @click="clearCart"
      >
        <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        Vider le panier
      </button>
    </template>
  </USlideover>
</template>
