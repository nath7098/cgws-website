/**
 * Returns the current Supabase session access token for use in admin API calls.
 * Must be called inside a setup context.
 */
export function useAdminApi() {
  const supabase = useSupabase()

  async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  function buildAuthHeaders(token: string | null): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return { getAccessToken, buildAuthHeaders }
}
