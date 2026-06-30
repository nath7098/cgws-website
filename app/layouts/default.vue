<template>
  <div class="min-h-screen flex flex-col bg-cgws-cream">
    <AppHeader />
    <main id="main-content" class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
