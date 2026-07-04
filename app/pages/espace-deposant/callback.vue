<script setup lang="ts">
import type { EmailOtpType } from '@supabase/supabase-js'

// US-066 · Callback OTP. Échange le token du magic link contre une session puis
// redirige vers /espace-deposant/suivi. Lien expiré/invalide → /espace-deposant.
// Écran de transition minimal (< 1s) plutôt qu'un flash blanc.

definePageMeta({ layout: false })

useSeoMeta({
  title: 'Connexion en cours — CGWS',
  robots: 'noindex, nofollow',
})

const SUIVI = '/espace-deposant/suivi'
const EXPIRED = '/espace-deposant?error=expired_link'

onMounted(async () => {
  const supabase = useSupabase()

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const hashParams = new URLSearchParams(hash)
  const queryParams = new URLSearchParams(window.location.search)

  // 1. Erreur explicite renvoyée par Supabase (lien expiré / déjà utilisé).
  if (hashParams.get('error') || queryParams.get('error')) {
    await navigateTo(EXPIRED, { replace: true })
    return
  }

  try {
    // 2. Flux PKCE — un paramètre `code` est présent dans la query.
    const code = queryParams.get('code')
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      await navigateTo(error ? EXPIRED : SUIVI, { replace: true })
      return
    }

    // 3. Lien avec token_hash (template email personnalisé).
    const tokenHash = queryParams.get('token_hash')
    const type = queryParams.get('type')
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      })
      await navigateTo(error ? EXPIRED : SUIVI, { replace: true })
      return
    }

    // 4. Flux implicite — les tokens sont dans le fragment, traités automatiquement
    //    par detectSessionInUrl à l'instanciation du client. On confirme la session.
    const { data: { session } } = await supabase.auth.getSession()
    await navigateTo(session ? SUIVI : EXPIRED, { replace: true })
  }
  catch {
    await navigateTo(EXPIRED, { replace: true })
  }
})
</script>

<template>
  <div class="min-h-screen bg-cgws-ground flex flex-col items-center justify-center gap-4 p-4">
    <UIcon
      name="i-lucide-loader-circle"
      class="w-8 h-8 text-cgws-accent animate-spin"
      aria-hidden="true"
    />
    <p aria-live="polite" class="sr-only">Connexion en cours…</p>
    <p class="font-sans text-sm text-cgws-ink-soft">Connexion en cours…</p>
  </div>
</template>
