<script setup lang="ts">
import type { DepositorConsignmentView } from '~/types'

// Carte lecture seule (US-066 §3.2). Relevé de statut — AUCUNE action, aucun hover
// d'interaction, aucune couture accent-deco (réservée aux articles en vente active).
// role="group" statique. Le montant net à reverser est mis en avant si vendu.

const props = defineProps<{ consignment: DepositorConsignmentView }>()

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const statusLabel = computed(() => CONSIGNMENT_STATUS_LABELS[props.consignment.status])
const conditionLabel = computed(() => CONDITION_LABELS[props.consignment.condition])
const badgeVariant = computed(() => STATUS_BADGE_VARIANT[props.consignment.status])
</script>

<template>
  <div
    role="group"
    :aria-label="`Consignation : ${consignment.itemDescription}, statut ${statusLabel}`"
    class="bg-cgws-surface border border-cgws-edge rounded-[6px] p-5 flex flex-col gap-3"
  >
    <!-- En-tête : badge statut + date de dépôt -->
    <div class="flex items-start justify-between gap-3">
      <CgwsBadge :variant="badgeVariant" :label="statusLabel" />
      <span class="font-sans text-xs text-cgws-ink-soft whitespace-nowrap mt-0.5">
        Déposée le {{ formatDate(consignment.createdAt) }}
      </span>
    </div>

    <!-- Article -->
    <div>
      <h2 class="font-serif font-semibold text-cgws-ink text-lg leading-snug">
        {{ consignment.itemDescription }}
      </h2>
      <p class="font-sans text-cgws-ink-soft text-sm mt-0.5">
        {{ consignment.brand }} · {{ conditionLabel }}
      </p>
    </div>

    <hr class="border-t border-cgws-hairline my-1">

    <!-- Prix demandé / accordé -->
    <dl class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <dt class="font-sans text-sm text-cgws-ink-soft">Prix demandé</dt>
        <dd class="font-display tabular-nums text-cgws-ink text-base">
          {{ formatPrice(consignment.askingPrice) }}
        </dd>
      </div>
      <div v-if="consignment.agreedPrice !== undefined" class="flex items-center justify-between">
        <dt class="font-sans text-sm text-cgws-ink-soft">Prix accordé</dt>
        <dd class="font-display tabular-nums text-cgws-ink text-base">
          {{ formatPrice(consignment.agreedPrice) }}
        </dd>
      </div>
    </dl>

    <!-- Bloc vente — uniquement si vendu -->
    <template v-if="consignment.status === 'sold'">
      <hr class="border-t border-cgws-hairline my-1">
      <dl class="flex flex-col gap-1.5">
        <div v-if="consignment.salePrice !== undefined" class="flex items-center justify-between">
          <dt class="font-sans text-sm text-cgws-ink-soft">Prix de vente</dt>
          <dd class="font-display tabular-nums text-cgws-ink text-base">
            {{ formatPrice(consignment.salePrice) }}
          </dd>
        </div>
        <div v-if="consignment.depositorAmount !== undefined" class="flex items-center justify-between pt-1">
          <dt class="font-sans text-sm font-semibold text-cgws-ink">Montant à vous reverser</dt>
          <dd class="font-display tabular-nums text-cgws-accent text-2xl">
            {{ formatPrice(consignment.depositorAmount) }}
          </dd>
        </div>
      </dl>
    </template>
  </div>
</template>
