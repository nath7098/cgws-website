<script setup lang="ts">
import type { TransitionProps } from 'vue'

const pageTransition: TransitionProps = {
  name: 'page',
  mode: 'out-in',
  appear: false,
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </div>
</template>
