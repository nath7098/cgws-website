<template>
  <UApp>
    <div class="min-h-screen flex flex-col bg-cgws-ground">
      <AppHeader />
      <main id="main-content" class="flex-1">
        <slot />
      </main>
      <AppFooter />
    </div>
  </UApp>
</template>