<script setup lang="ts">
/**
 * Formulaire "M'avertir du retour en stock" (US-097) — remplace le CTA
 * d'achat sur la fiche produit quand `isOutOfStock === true` (ProductInfo.vue).
 * Autonome : appelle directement `$fetch` (pas de composable intermédiaire),
 * à l'identique du pattern déjà établi dans `ConsignmentForm.vue`.
 */
interface Props {
  productId: string
  /** Utilisé uniquement pour l'aria-label du bouton, jamais affiché en dur. */
  productTitle: string
}

const props = defineProps<Props>()

interface ApiErrorShape {
  data?: {
    statusCode?: number
  }
}

const email = ref('')
const emailError = ref('')
const submitError = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(): boolean {
  if (!emailRegex.test(email.value.trim())) {
    emailError.value = 'Adresse email invalide'
    return false
  }
  emailError.value = ''
  return true
}

async function handleSubmit(): Promise<void> {
  submitError.value = ''

  if (!validateEmail()) return

  isSubmitting.value = true

  try {
    await $fetch(`/api/products/${props.productId}/notify-restock`, {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    isSuccess.value = true
  } catch (err: unknown) {
    // Le serveur renvoie un succès identique en cas d'inscription déjà
    // existante (idempotence, aucune UI dédiée) — seul un échec réseau/serveur
    // réel atterrit ici.
    const apiErr = err as ApiErrorShape
    if (apiErr?.data?.statusCode === 422) {
      emailError.value = 'Adresse email invalide'
    } else {
      submitError.value = 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.'
    }
  } finally {
    isSubmitting.value = false
  }
}

function reset(): void {
  isSuccess.value = false
  email.value = ''
  emailError.value = ''
  submitError.value = ''
}
</script>

<template>
  <Transition name="fade-form" mode="out-in">
    <!-- Succès -->
    <div
      v-if="isSuccess"
      key="success"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="bg-cgws-success/15 border border-cgws-success/40 rounded-sm p-4 flex flex-col gap-2"
    >
      <p class="font-sans text-sm text-cgws-success flex items-start gap-2">
        <UIcon name="i-lucide-check-circle" class="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>Vous serez averti(e) par email dès que cet article sera de nouveau disponible.</span>
      </p>
      <button
        type="button"
        class="self-start font-sans text-xs text-cgws-ink-soft hover:text-cgws-accent underline
               underline-offset-2 transition-colors duration-150 rounded-sm
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground"
        @click="reset"
      >
        Vous inscrire avec une autre adresse ?
      </button>
    </div>

    <!-- Idle / erreur -->
    <form
      v-else
      key="form"
      :aria-label="`M'avertir du retour en stock de ${productTitle}`"
      class="flex flex-col gap-3"
      @submit.prevent="handleSubmit"
    >
      <p class="font-sans text-sm text-cgws-ink-soft">
        Cet article est actuellement épuisé.
      </p>

      <CgwsInput
        v-model="email"
        type="email"
        label="Votre adresse email"
        placeholder="vous@exemple.fr"
        :error="emailError"
        required
        :disabled="isSubmitting"
        @blur="validateEmail"
      />

      <p
        v-if="submitError"
        role="alert"
        class="font-sans text-xs text-cgws-danger flex items-center gap-1.5"
      >
        <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        {{ submitError }}
      </p>

      <CgwsButton
        type="submit"
        variant="primary"
        size="md"
        class="w-full justify-center"
        :loading="isSubmitting"
        :aria-label="`M'avertir du retour en stock de ${productTitle}`"
      >
        <UIcon name="i-lucide-bell-ring" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
        M'avertir du retour en stock
      </CgwsButton>
    </form>
  </Transition>
</template>

<style scoped>
.fade-form-enter-active,
.fade-form-leave-active {
  transition: opacity 0.2s ease-in-out;
}
.fade-form-enter-from,
.fade-form-leave-to {
  opacity: 0;
}
</style>
