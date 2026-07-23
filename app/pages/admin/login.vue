<script setup lang="ts">
import { BRAND_NAME } from '~/utils/brand'

definePageMeta({ layout: false })

useSeoMeta({
  title: 'Connexion — CGWS Administration',
  description: 'Accès sécurisé au backoffice CGWS.',
  robots: 'noindex, nofollow',
})

const { login, authError, isLoading } = useAdminAuth()

const email = ref('')
const password = ref('')

// Refs for focus management
const emailInputRef = ref<HTMLInputElement | null>(null)
const isShaking = ref(false)
const cardVisible = ref(false)

// Redirect if already authenticated + trigger card entrance
const supabase = useSupabase()
onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    await navigateTo('/admin/dashboard')
    return
  }
  // Slight delay lets the browser paint before triggering entrance
  requestAnimationFrame(() => {
    cardVisible.value = true
  })
})

async function handleSubmit() {
  await login(email.value, password.value)

  if (authError.value) {
    // Trigger shake animation
    isShaking.value = false
    await nextTick()
    isShaking.value = true
    setTimeout(() => {
      isShaking.value = false
    }, 350)

    // Move focus back to email field
    await nextTick()
    emailInputRef.value?.focus()
  }
}
</script>

<template>
  <div class="min-h-screen bg-cgws-ground flex items-center justify-center p-4">
    <!-- Login card — CSS entrance animation -->
    <div
      :class="[
        'bg-cgws-surface border-2 border-cgws-edge rounded-sm shadow-2xl',
        'w-full max-w-[343px] sm:max-w-sm p-6 sm:p-8',
        'transition-[opacity,transform] duration-400 ease-out',
        cardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      ]"
    >
      <!-- Wordmark — monogramme d'entreprise CGWS + marque commerciale. -->
      <div>
        <span class="font-display text-3xl text-cgws-accent tracking-wider">CGWS</span>
        <span class="block font-sans text-[11px] text-cgws-ink-soft uppercase tracking-widest mt-0.5">
          {{ BRAND_NAME }}
        </span>
      </div>

      <!-- Mini separator -->
      <div class="border-t border-cgws-hairline my-5" aria-hidden="true" />

      <!-- Form header -->
      <p class="font-eyebrow text-[11px] text-cgws-ink-soft uppercase tracking-widest mt-5">
        Administration
      </p>
      <h1 class="font-serif font-bold text-xl text-cgws-ink mt-1 mb-6">
        Connexion
      </h1>

      <!-- Form -->
      <form novalidate @submit.prevent="handleSubmit">
        <!-- Email -->
        <div class="mb-4">
          <label
            for="admin-email"
            class="block font-sans font-medium text-sm text-cgws-ink mb-1.5"
          >
            Adresse e-mail
          </label>
          <input
            id="admin-email"
            ref="emailInputRef"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            :disabled="isLoading"
            :aria-required="true"
            :aria-describedby="authError ? 'login-error' : undefined"
            :aria-invalid="authError ? true : undefined"
            class="w-full bg-cgws-ground text-cgws-ink border border-cgws-edge rounded-sm px-3 py-2.5 font-sans text-sm placeholder:text-cgws-ink-soft placeholder:font-normal transition-shadow transition-colors duration-150 outline-none focus:ring-3 focus:border-cgws-accent focus:ring-cgws-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="votre@email.fr"
          >
        </div>

        <!-- Password -->
        <div class="mb-5">
          <label
            for="admin-password"
            class="block font-sans font-medium text-sm text-cgws-ink mb-1.5"
          >
            Mot de passe
          </label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            :disabled="isLoading"
            :aria-required="true"
            class="w-full bg-cgws-ground text-cgws-ink border border-cgws-edge rounded-sm px-3 py-2.5 font-sans text-sm placeholder:text-cgws-ink-soft placeholder:font-normal transition-shadow transition-colors duration-150 outline-none focus:ring-3 focus:border-cgws-accent focus:ring-cgws-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="••••••••"
          >
        </div>

        <!-- Error banner -->
        <div
          v-if="authError"
          id="login-error"
          role="alert"
          aria-live="assertive"
          :class="[
            'flex items-start gap-2 bg-cgws-danger/10 border-l-4 border-cgws-danger rounded-sm p-3 mb-4',
            'text-cgws-danger font-sans text-[13px] font-medium',
            isShaking ? 'animate-shake' : '',
          ]"
        >
          <UIcon
            name="i-lucide-alert-circle"
            class="w-4 h-4 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{{ authError }}</span>
        </div>

        <!-- Submit -->
        <CgwsButton
          type="submit"
          variant="primary"
          :loading="isLoading"
          :disabled="isLoading"
          class="w-full"
        >
          Se connecter
        </CgwsButton>
      </form>

      <!-- Footer -->
      <p class="text-center font-sans text-[11px] text-cgws-ink-soft mt-6">
        cgws.fr — Sellerie équestre western
      </p>
    </div>
  </div>
</template>
