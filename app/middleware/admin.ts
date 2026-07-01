export default defineNuxtRouteMiddleware(async (_to) => {
  // Server-side: localStorage unavailable, session validation deferred to client
  if (import.meta.server) return

  const supabase = useSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return navigateTo('/admin/login')
  }
})
