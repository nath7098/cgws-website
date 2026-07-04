<script setup lang="ts">
import type { SelectItem } from '@nuxt/ui'
import type { SortOption } from '~/types'

const modelValue = defineModel<SortOption>({ default: 'relevance' })

const sortItems: SelectItem[] = [
  { label: 'Pertinence', value: 'relevance' },
  { label: 'Prix croissant', value: 'price_asc' },
  { label: 'Prix décroissant', value: 'price_desc' },
  { label: 'Nouveautés', value: 'newest' },
]
</script>

<template>
  <USelect
    v-model="modelValue"
    :items="sortItems"
    placeholder="Trier par"
    trailing-icon="i-lucide-chevrons-up-down"
    size="sm"
    color="neutral"
    variant="outline"
    aria-label="Trier les produits"
    class="min-w-[160px]"
    :ui="{ base: 'focus-visible:ring-2 focus-visible:ring-cgws-accent' }"
  />
</template>
