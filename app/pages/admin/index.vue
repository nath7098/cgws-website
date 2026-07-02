<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

// Redirect /admin → /admin/dashboard
await navigateTo('/admin/dashboard', { replace: true })
</script>

<template>
  <div />
</template>
