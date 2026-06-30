<script setup lang="ts">
interface Props {
  title?: string
  padding?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  padding: 'md',
})

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} satisfies Record<string, string>
</script>

<template>
  <div
    :class="[
      'bg-cgws-cream border border-cgws-leather/30 rounded-[4px] shadow-sm',
      paddingClasses[padding ?? 'md'],
    ]"
  >
    <template v-if="title">
      <h3 class="font-serif font-semibold text-xl text-cgws-charcoal pb-3 mb-4 border-b border-cgws-leather/20">
        {{ title }}
      </h3>
    </template>
    <slot />
  </div>
</template>
