<script setup lang="ts">
interface Props {
  totalCount: number
  isFiltered: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <section
    class="bg-cgws-cream py-8 md:py-14"
    role="region"
    aria-label="En-tête du catalogue"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <p class="font-eyebrow text-[12px] text-cgws-copper uppercase tracking-[0.2em] mb-2">
        Sellerie de Brèches
      </p>

      <h1
        class="font-display text-[56px] md:text-[64px] text-cgws-charcoal leading-none tracking-wide uppercase mb-3"
      >
        Catalogue
      </h1>

      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="font-sans font-medium text-sm text-cgws-leather"
      >
        {{ props.totalCount }}
        {{ props.totalCount !== 1 ? 'produits' : 'produit' }}
        {{ props.isFiltered
          ? (props.totalCount !== 1 ? 'trouvés' : 'trouvé')
          : (props.totalCount !== 1 ? 'disponibles' : 'disponible')
        }}
      </span>
    </div>
  </section>
</template>
