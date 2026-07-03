<template>
  <div
    role="status"
    aria-label="Chargement des produits en cours"
    class="relative flex flex-col bg-cgws-surface border-2 border-cgws-hairline rounded-[6px] overflow-hidden animate-pulse"
  >
    <span class="sr-only">Chargement...</span>

    <!-- Perforation hole skeleton -->
    <div
      class="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cgws-hairline z-10"
      aria-hidden="true"
    />

    <!-- Image area skeleton -->
    <div class="aspect-[4/3] bg-cgws-hairline" aria-hidden="true" />

    <!-- Content block skeleton -->
    <div
      class="m-2 p-3 border border-dashed border-cgws-hairline rounded-sm flex flex-col gap-2"
      aria-hidden="true"
    >
      <!-- Badge skeleton -->
      <div class="h-5 w-20 bg-cgws-hairline rounded-full" />

      <!-- Title lines skeleton -->
      <div class="h-4 w-full bg-cgws-hairline rounded" />
      <div class="h-4 w-3/4 bg-cgws-hairline rounded" />

      <!-- Brand skeleton -->
      <div class="h-3 w-1/2 bg-cgws-hairline rounded mt-1" />

      <!-- Price skeleton -->
      <div class="h-6 w-16 bg-cgws-hairline rounded self-end mt-auto" />
    </div>
  </div>
</template>
