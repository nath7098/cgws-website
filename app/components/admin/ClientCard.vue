<script setup lang="ts">
import type { ClientWithStats } from '~/types'

interface Props {
  client: ClientWithStats
}

const props = defineProps<Props>()

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}
</script>

<template>
  <NuxtLink
    :to="`/admin/clients/${props.client.id}`"
    class="client-row block bg-cgws-surface border border-cgws-hairline rounded-[4px]
           p-4 space-y-0.5 hover:bg-cgws-surface/20 transition-colors"
    :aria-label="`Voir la fiche de ${props.client.name}`"
  >
    <!-- Top row: name + purchase count -->
    <div class="flex items-start justify-between gap-2">
      <p class="font-serif font-semibold text-base text-cgws-ink">
        {{ props.client.name }}
      </p>
      <div class="flex-shrink-0 text-right">
        <span class="font-display text-lg text-cgws-accent leading-none">
          {{ props.client.purchaseCount }}
        </span>
        <span class="font-sans text-[10px] text-cgws-ink-soft block leading-none">
          achats
        </span>
      </div>
    </div>

    <!-- Email -->
    <p
      v-if="props.client.email"
      class="font-sans text-xs text-cgws-ink-soft"
    >
      {{ props.client.email }}
    </p>

    <!-- Bottom row: phone + last purchase -->
    <div class="flex items-center justify-between mt-1">
      <p class="font-sans text-xs text-cgws-ink-soft">
        {{ props.client.phone ?? '—' }}
      </p>
      <p class="font-sans text-xs italic text-cgws-ink-soft/70">
        {{ props.client.lastPurchaseDate ? `Dernier : ${formatDate(props.client.lastPurchaseDate)}` : 'Aucun achat' }}
      </p>
    </div>

    <!-- See link -->
    <div class="flex justify-end mt-1">
      <span
        class="font-sans text-xs font-semibold text-cgws-accent
               inline-flex items-center gap-1
               hover:text-cgws-ink-soft transition-colors"
        aria-hidden="true"
      >
        Voir
        <UIcon
          name="i-lucide-arrow-right"
          class="w-3.5 h-3.5"
        />
      </span>
    </div>
  </NuxtLink>
</template>
