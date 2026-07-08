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
      'bg-cgws-ground border border-cgws-hairline rounded-[4px] shadow-sm',
      paddingClasses[padding ?? 'md'],
    ]"
  >
    <template v-if="title">
      <h3 class="font-serif font-semibold text-xl text-cgws-ink pb-3 mb-4 border-b border-cgws-hairline">
        {{ title }}
      </h3>
    </template>
    <slot />
  </div>
</template>
