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
    <NuxtLoadingIndicator color="#B8650A" :height="3" :duration="2000" :throttle="200" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </div>
</template>
