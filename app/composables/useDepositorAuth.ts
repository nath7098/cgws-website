import type { User } from '@supabase/supabase-js'

// Miroir de useAdminAuth.ts, sans mot de passe (US-066). Authentification par
// magic link Supabase OTP. Le flux repose sur signInWithOtp côté client, une route
// de callback (/espace-deposant/callback) qui pose la session, et une route serveur
// protégée (/api/depositor/consignments) pour toute lecture de données.

const ERROR_MESSAGES: Record<string, string> = {
  over_email_send_rate_limit: 'Trop de demandes. Réessayez dans quelques minutes.',
  over_request_rate_limit: 'Trop de demandes. Réessayez dans quelques minutes.',
}

function resolveErrorMessage(code: string | undefined): string {
  if (!code) return 'Une erreur est survenue. Veuillez réessayer dans un instant.'
  return ERROR_MESSAGES[code] ?? 'Une erreur est survenue. Veuillez réessayer dans un instant.'
}

export function useDepositorAuth() {
  const supabase = useSupabase()

  // Shared state via useState so page + callback + middleware share one instance.
  const user = useState<User | null>('depositor-user', () => null)
  const isSubmitting = useState<boolean>('depositor-submitting', () => false)
  const isSuccess = useState<boolean>('depositor-success', () => false)
  const authError = useState<string | null>('depositor-error', () => null)

  const isAuthenticated = computed(() => user.value !== null)

  async function initSession(): Promise<void> {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
  }

  /**
   * Envoie un magic link à l'adresse fournie.
   *
   * ANTI-ÉNUMÉRATION : quel que soit le résultat réel (email connu ou non), l'UI
   * affiche TOUJOURS le message de succès neutre. `shouldCreateUser: false` garantit
   * qu'aucun compte n'est créé et qu'aucun email n'est envoyé à une adresse inconnue —
   * mais l'éventuelle erreur "utilisateur inexistant" n'est JAMAIS remontée au front.
   * Seul un échec technique réel (réseau / serveur 5xx) sort de la branche succès.
   */
  async function requestMagicLink(email: string): Promise<void> {
    isSubmitting.value = true
    authError.value = null

    const emailRedirectTo = `${window.location.origin}/espace-deposant/callback`

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo,
        },
      })

      // Un statut >= 500 traduit une panne technique (Supabase indisponible) : on la
      // remonte. Tout le reste (utilisateur inconnu, OTP désactivé, rate limit lié à
      // l'existence…) reste sur la branche succès neutre pour ne rien divulguer.
      if (error && (error.status ?? 0) >= 500) {
        authError.value = resolveErrorMessage(error.code)
      }
      else {
        isSuccess.value = true
      }
    }
    catch {
      // Erreur réseau / exception non-HTTP : échec technique, pas une fuite d'existence.
      authError.value = resolveErrorMessage(undefined)
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Réinitialise l'état du formulaire (bouton « Utiliser une autre adresse »). */
  function reset(): void {
    isSuccess.value = false
    authError.value = null
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    user.value = null
    reset()
    await navigateTo('/espace-deposant')
  }

  return {
    user,
    isAuthenticated,
    isSubmitting,
    isSuccess,
    authError,
    requestMagicLink,
    reset,
    logout,
    initSession,
  }
}
