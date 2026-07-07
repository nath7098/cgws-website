<script setup lang="ts">
import type { CartItem } from '~/types'
import CgwsBadge from '../ui/CgwsBadge.vue'

const props = defineProps<{
  item: CartItem
  /** Produit devenu indisponible (vendu/réservé entre-temps) — exclu du total. */
  unavailable?: boolean
}>()

const emit = defineEmits<{ remove: [productId: string] }>()

const { imageProps } = useProductImage()

const imageData = computed(() =>
  props.item.image !== null ? imageProps(props.item.image) : null,
)

const formattedPrice = computed(() =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(props.item.price),
)
</script>

<template>
  <li
    class="flex items-start gap-3 py-4"
    :class="unavailable ? 'opacity-80' : ''"
  >
    <!-- Vignette -->
    <div class="relative w-20 h-16 flex-shrink-0 rounded-[4px] overflow-hidden border border-cgws-hairline bg-cgws-surface">
      <NuxtImg
        v-if="imageData"
        v-bind="imageData"
        :alt="`${item.title}, ${item.brand}`"
        loading="lazy"
        format="webp"
        width="160"
        height="128"
        class="w-full h-full object-cover"
        :class="unavailable ? 'grayscale' : ''"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
        aria-hidden="true"
      >
        <UIcon name="i-lucide-image-off" class="w-5 h-5 text-cgws-ink-soft/40" aria-hidden="true" />
      </div>
    </div>

    <!-- Infos -->
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <NuxtLink
        :to="`/catalogue/${item.slug}`"
        class="font-serif font-semibold text-sm leading-snug line-clamp-2 text-cgws-ink
               hover:text-cgws-accent transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cgws-accent rounded-sm"
      >
        {{ item.title }}
      </NuxtLink>
      <p class="font-sans text-xs text-cgws-ink-soft">{{ item.brand }}</p>
      <p v-if="item.size" class="font-sans text-[11px] text-cgws-ink-soft/70 italic">
        Taille : {{ item.size }}
      </p>

      <div v-if="unavailable" class="mt-1 flex flex-col items-start gap-1">
        <CgwsBadge variant="rejected" label="Indisponible" />
        <p class="font-sans text-[11px] text-cgws-ink-soft leading-snug">
          Cet article n'est plus disponible — retirez-le du panier.
        </p>
      </div>
    </div>

    <!-- Prix + retirer -->
    <div class="flex flex-col items-end gap-2 flex-shrink-0">
      <p
        class="font-display text-lg tabular-nums leading-none"
        :class="unavailable ? 'text-cgws-ink-soft line-through' : 'text-cgws-accent'"
      >
        <span class="sr-only">Prix : </span>{{ formattedPrice }} €
      </p>
      <button
        type="button"
        class="flex items-center gap-1 font-sans text-xs text-cgws-ink-soft
               hover:text-cgws-danger transition-colors duration-150 rounded-sm px-1 py-0.5
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-danger"
        :aria-label="`Retirer ${item.title} du panier`"
        @click="emit('remove', item.productId)"
      >
        <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        Retirer
      </button>
    </div>
  </li>
</template>
