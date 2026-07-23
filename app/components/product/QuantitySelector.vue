<script setup lang="ts">
/**
 * Sélecteur de quantité 1..min(stock,10) pour l'achat multiple d'un produit
 * non-consigné (US-096). Composant custom (pas `UInputNumber`) — décision
 * design actée dans docs/design-specs/US-096-097-etats-stock-fiche-produit.md
 * §2 : `app/app.config.ts` documente explicitement que les composants Nuxt UI
 * natifs non re-thémés gardent la palette neutre par défaut, ce qui romprait
 * la cohérence visuelle immédiate avec `CgwsButton`/`CgwsInput` juste à côté.
 */
interface Props {
  modelValue: number
  min?: number
  max: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

// `useId()` (Vue 3.5+, disponible ici — vue ^3.5.38) plutôt que le pattern
// `Math.random()` utilisé par `CgwsInput` : ce dernier recalcule un id
// différent à chaque exécution de `setup()`, ce qui diverge entre le rendu
// serveur et l'hydratation client (dette latente pré-existante, hors
// périmètre de cette US). `useId()` est le primitif Vue conçu spécifiquement
// pour rester stable SSR/CSR.
const inputId = useId()

/** Clamp générique — bornes `min`/`max` de la prop. */
function clampValue(value: number): number {
  if (Number.isNaN(value)) return props.min
  return Math.min(props.max, Math.max(props.min, Math.round(value)))
}

function decrement(): void {
  if (props.disabled || props.modelValue <= props.min) return
  emit('update:modelValue', props.modelValue - 1)
}

function increment(): void {
  if (props.disabled || props.modelValue >= props.max) return
  emit('update:modelValue', props.modelValue + 1)
}

// Saisie libre pendant la frappe (pas de clamp au keystroke, seulement au
// blur/Enter) — évite de bloquer un utilisateur en train de retaper un
// nombre à 2 chiffres (ex. effacer "1" pour taper "10").
function onInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  if (raw === '') return
  const parsed = Number(raw)
  if (!Number.isNaN(parsed)) {
    emit('update:modelValue', parsed)
  }
}

function clamp(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  const parsed = clampValue(Number(raw))
  emit('update:modelValue', parsed)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    clamp(event)
  }
}
</script>

<template>
  <div class="inline-flex flex-col gap-1.5">
    <div
      role="group"
      aria-label="Quantité"
      class="inline-flex items-stretch border border-cgws-edge rounded-sm overflow-hidden w-fit"
      :class="disabled ? 'opacity-50 cursor-not-allowed' : ''"
    >
      <button
        type="button"
        :disabled="disabled || modelValue <= min"
        aria-label="Diminuer la quantité"
        :aria-controls="inputId"
        :aria-disabled="disabled || modelValue <= min ? 'true' : undefined"
        class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-cgws-ink
               hover:bg-cgws-surface-2 active:bg-cgws-surface-2/80 transition-colors duration-150
               disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
               border-r border-cgws-hairline
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground"
        @click="decrement"
      >
        <UIcon name="i-lucide-minus" class="w-4 h-4" aria-hidden="true" />
      </button>

      <input
        :id="inputId"
        type="number"
        inputmode="numeric"
        :min="min"
        :max="max"
        step="1"
        :value="modelValue"
        :disabled="disabled"
        aria-label="Quantité désirée"
        class="w-10 sm:w-12 text-center bg-cgws-ground text-cgws-ink font-sans font-semibold text-base
               outline-none [appearance:textfield] disabled:cursor-not-allowed
               [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        @input="onInput"
        @blur="clamp"
        @keydown="onKeydown"
      >

      <button
        type="button"
        :disabled="disabled || modelValue >= max"
        aria-label="Augmenter la quantité"
        :aria-controls="inputId"
        :aria-disabled="disabled || modelValue >= max ? 'true' : undefined"
        class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-cgws-ink
               hover:bg-cgws-surface-2 active:bg-cgws-surface-2/80 transition-colors duration-150
               disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
               border-l border-cgws-hairline
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground"
        @click="increment"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
    <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      Quantité sélectionnée : {{ modelValue }}
    </span>
  </div>
</template>
