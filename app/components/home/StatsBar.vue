<script setup lang="ts">
interface Stat {
  value: number | string
  suffix: string | undefined
  label: string
  animateOnVisible: boolean
}

const stats: Stat[] = [
  { value: 250,    suffix: '+',       label: 'articles en stock',        animateOnVisible: true  },
  { value: 15,     suffix: '+',       label: 'marques référencées',      animateOnVisible: true  },
  { value: '100%', suffix: undefined, label: 'passion équestre',         animateOnVisible: false },
  { value: 37,     suffix: '',        label: 'Brèches · Indre-et-Loire', animateOnVisible: true  },
]
</script>

<template>
  <section
    class="bg-cgws-tack py-12 md:py-16"
    aria-label="Chiffres clés CGWS"
  >
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 lg:gap-8">
        <ConchoStat
          v-for="stat in stats"
          :key="stat.label"
          :value="stat.value"
          :suffix="stat.suffix"
          :label="stat.label"
          :animate-on-visible="stat.animateOnVisible"
          :on-dark="true"
        />
      </div>
    </div>
  </section>
</template>
