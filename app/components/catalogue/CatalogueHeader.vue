<script setup lang="ts">
interface Props {
  totalCount: number
  isFiltered: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <section
    class="relative bg-cgws-ground py-8 md:py-14"
    role="region"
    aria-label="En-tête du catalogue"
  >
    <FiligreeCorner
      class="absolute top-3 left-3 md:top-5 md:left-5 w-10 h-10 md:w-14 md:h-14"
      :opacity="40"
    />
    <FiligreeCorner
      class="absolute bottom-3 right-3 md:bottom-5 md:right-5 w-10 h-10 md:w-14 md:h-14 rotate-180"
      :opacity="40"
    />

    <div class="relative max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <p class="font-eyebrow text-[12px] text-cgws-accent uppercase tracking-[0.2em] mb-2">
        Sellerie de Brèches
      </p>

      <h1
        class="font-heading text-[44px] md:text-[52px] text-cgws-heading leading-none tracking-wide uppercase mb-3"
      >
        Catalogue
      </h1>

      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="font-sans font-medium text-sm text-cgws-ink-soft"
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
