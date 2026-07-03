<script setup lang="ts">
// FiligreeCorner — arabesque filigranée décorative v3.
// Cf. docs/design-specs/US-072-signature-components.md §3.
// Motif végétal fin inspiré de la gravure de selle. Purement décoratif :
// toujours aria-hidden, stroke accent-deco, fill none, opacité réduite.
// Positionnement (coin, rotation, échelle) porté par le parent via `class`
// (ex. `class="absolute top-0 left-0"`, ajouter `rotate-90` / `-scale-x-100`
// pour varier les coins).
interface Props {
  // Opacité du motif (0–100). Défaut 50 pour rester discret (§3).
  opacity?: 40 | 50 | 60
}

withDefaults(defineProps<Props>(), {
  opacity: 50,
})

const opacityClass: Record<NonNullable<Props['opacity']>, string> = {
  40: 'opacity-40',
  50: 'opacity-50',
  60: 'opacity-60',
}
</script>

<template>
  <svg
    :class="['pointer-events-none select-none text-cgws-accent-deco', opacityClass[opacity]]"
    width="96"
    height="96"
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <g stroke="currentColor" stroke-width="1.25" fill="none" stroke-linecap="round">
      <!-- Tige principale en L, adoucie -->
      <path d="M6 6 C6 34 12 48 40 52" />
      <path d="M6 6 C34 6 48 12 52 40" />
      <!-- Volute supérieure -->
      <path d="M52 40 C58 30 56 18 44 16 C50 22 48 30 40 30" />
      <!-- Volute latérale -->
      <path d="M40 52 C30 58 18 56 16 44 C22 50 30 48 30 40" />
      <!-- Feuillage central -->
      <path d="M20 20 C28 22 30 30 28 38" />
      <path d="M20 20 C22 28 30 30 38 28" />
      <!-- Petites vrilles -->
      <path d="M12 30 C16 32 17 36 15 40" />
      <path d="M30 12 C32 16 36 17 40 15" />
    </g>
    <!-- Points ornementaux (poinçons) -->
    <circle cx="52" cy="40" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="40" cy="52" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="6" cy="6" r="2" fill="currentColor" stroke="none" />
  </svg>
</template>
