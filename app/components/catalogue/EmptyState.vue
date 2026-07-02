<script setup lang="ts">
import CgwsButton from '../ui/CgwsButton.vue';

defineEmits<{
  reset: []
}>()
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="col-span-full flex flex-col items-center justify-center py-16 md:py-24 text-center gap-5"
  >
    <!-- Concho ornament -->
    <div
      class="w-12 h-12 rounded-full border-2 border-cgws-copper/40 ring-[6px] ring-cgws-leather/10 flex items-center justify-center mb-2"
      aria-hidden="true"
    >
      <div class="w-3 h-3 rounded-full bg-cgws-copper/30" />
    </div>

    <h2 class="font-serif font-semibold text-2xl text-cgws-charcoal">
      Aucun résultat
    </h2>

    <p class="font-sans text-sm text-cgws-leather max-w-[300px]">
      Modifiez vos critères de recherche ou explorez tout le catalogue.
    </p>

    <CgwsButton variant="primary" size="sm" @click="$emit('reset')">
      Réinitialiser les filtres
    </CgwsButton>
  </div>
</template>
