// Protège /espace-deposant/suivi (US-066). Miroir exact de app/middleware/admin.ts.
export default defineNuxtRouteMiddleware(async (_to) => {
  // Côté serveur : localStorage indisponible, validation de session déférée au client.
  if (import.meta.server) return

  const supabase = useSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return navigateTo('/espace-deposant')
  }
})
