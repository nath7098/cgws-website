<script setup lang="ts">
interface Props {
  bgClass?: string
  ringClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  bgClass: 'bg-cgws-ground',
  ringClass: 'ring-cgws-ground',
})
</script>

<template>
  <!-- Diviseur décoratif — concho centré entre deux lignes horizontales -->
  <div
    :class="['py-6 md:py-8', props.bgClass]"
    aria-hidden="true"
  >
    <div class="flex items-center gap-4 max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <div class="flex-1 border-t border-cgws-hairline" />

      <!-- Médaillon concho central -->
      <div
        :class="[
          'w-5 h-5 rounded-full border-2 border-cgws-accent',
          'flex items-center justify-center flex-shrink-0',
          'ring-[3px] ring-offset-0',
          'outline outline-1 outline-cgws-hairline',
          props.ringClass,
        ]"
      >
        <div class="w-1.5 h-1.5 rounded-full bg-cgws-accent" />
      </div>

      <div class="flex-1 border-t border-cgws-hairline" />
    </div>
  </div>
</template>
