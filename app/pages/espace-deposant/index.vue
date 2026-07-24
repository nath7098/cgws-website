<script setup lang="ts">
// US-066 · Écran 1 — demande de magic link. Anti-énumération : message de succès
// neutre affiché systématiquement après une soumission au format valide.

useSeoMeta({
  title: 'Espace déposant — Suivi de dépôt-vente — CGWS',
  description:
    'Suivez l\'état de votre dépôt-vente chez CGWS (en attente, en vente, vendu) grâce à un lien de connexion envoyé par email.',
  robots: 'noindex, follow',
})

const { isSubmitting, isSuccess, authError, requestMagicLink, reset } = useDepositorAuth()

const route = useRoute()
const email = ref('')
const formatError = ref('')
const linkError = ref<string | null>(null)
const messageRef = ref<HTMLElement | null>(null)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(): boolean {
  if (!email.value.trim()) {
    formatError.value = 'Veuillez saisir votre adresse email.'
    return false
  }
  if (!EMAIL_RE.test(email.value.trim())) {
    formatError.value = 'Adresse email invalide.'
    return false
  }
  formatError.value = ''
  return true
}

async function handleSubmit(): Promise<void> {
  // Aucun appel réseau tant que le format est invalide (anti-énumération ne concerne
  // que les emails syntaxiquement valides).
  if (!validateEmail()) return

  linkError.value = null
  await requestMagicLink(email.value.trim())

  // Déplace le focus sur la zone de message (succès neutre ou erreur technique).
  await nextTick()
  messageRef.value?.focus()
}

function handleUseAnotherAddress(): void {
  reset()
  email.value = ''
  formatError.value = ''
  linkError.value = null
}

onMounted(async () => {
  // Repart d'un état propre à chaque arrivée sur la page (évite un succès résiduel).
  reset()

  // Lien magique expiré / déjà utilisé → message d'erreur au chargement + focus.
  if (route.query.error === 'expired_link') {
    linkError.value = 'Ce lien n\'est plus valide, veuillez en redemander un.'
    await nextTick()
    messageRef.value?.focus()
  }
})
</script>

<template>
  <section
    class="bg-cgws-ground py-12 md:py-16 lg:py-20 text-center"
    aria-labelledby="depositor-heading"
  >
    <div class="max-w-[640px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <!-- Arche fine décorative -->
      <div class="relative inline-block">
        <svg
          class="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 w-[220px] h-auto"
          viewBox="0 0 220 70"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 70 C10 24 60 6 110 6 C160 6 210 24 210 70"
            stroke="var(--cgws-accent-deco)"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>

        <p class="font-eyebrow text-cgws-ink-soft text-[12px] uppercase tracking-[0.3em] mb-3 mt-6">
          Suivi de dépôt-vente
        </p>
        <h1
          id="depositor-heading"
          class="font-heading text-cgws-heading uppercase tracking-wide leading-none text-[28px] md:text-[32px] lg:text-[40px] mb-4"
        >
          Espace déposant
        </h1>
      </div>

      <p class="font-serif italic text-cgws-ink-soft text-base md:text-lg max-w-prose mx-auto mb-8 md:mb-10">
        Suivez l'état de votre dépôt — en attente, en vente, vendu — sans avoir à nous appeler.
      </p>

      <div class="bg-cgws-surface border border-cgws-hairline rounded-[6px] p-6 md:p-8 text-left">
        <form
          aria-label="Demande de lien de connexion déposant"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <div class="flex flex-col gap-5">
            <CgwsInput
              v-model="email"
              label="Adresse email"
              type="email"
              required
              name="email"
              autocomplete="email"
              :error="formatError || undefined"
              :disabled="isSubmitting || isSuccess"
              hint="L'adresse que vous avez communiquée lors de votre dépôt."
              @blur="validateEmail"
            />

            <div>
              <CgwsButton
                type="submit"
                variant="primary"
                :loading="isSubmitting"
                :disabled="isSubmitting || isSuccess"
                class="w-full sm:w-auto"
              >
                Recevoir mon lien de connexion
              </CgwsButton>
            </div>

            <!-- Zone de message — succès neutre / erreur technique / lien invalide -->
            <div ref="messageRef" tabindex="-1" aria-live="polite" aria-atomic="true">
              <p
                v-if="authError || linkError"
                role="alert"
                class="flex items-start gap-2 font-sans text-sm text-cgws-danger bg-cgws-danger/10 border border-cgws-danger rounded-sm p-3"
              >
                <UIcon
                  name="i-lucide-alert-circle"
                  class="w-4 h-4 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                {{ authError ?? linkError }}
              </p>

              <p
                v-else-if="isSuccess"
                role="status"
                class="flex items-start gap-2 font-sans text-sm text-cgws-ink bg-cgws-success/15 border border-cgws-success/40 rounded-sm p-3"
              >
                <UIcon
                  name="i-lucide-mail-check"
                  class="w-4 h-4 mt-0.5 text-cgws-success flex-shrink-0"
                  aria-hidden="true"
                />
                Si cette adresse est associée à un dépôt-vente, un lien de connexion
                vient de vous être envoyé. Vérifiez votre boîte de réception (et vos spams).
              </p>
            </div>

            <!-- Nouvelle demande sans recharger la page -->
            <div v-if="isSuccess">
              <CgwsButton variant="ghost" type="button" @click="handleUseAnotherAddress">
                Utiliser une autre adresse
              </CgwsButton>
            </div>
          </div>
        </form>
      </div>

      <p class="font-sans text-sm text-cgws-ink-soft mt-6">
        Un dépôt-vente en cours ?
        <NuxtLink
          to="/depot-vente"
          class="text-cgws-accent hover:underline focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
        >
          Découvrez nos conditions de dépôt
        </NuxtLink>
      </p>
    </div>
  </section>
</template>
