import type { User } from '@supabase/supabase-js'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Adresse e-mail ou mot de passe incorrect.',
  email_not_confirmed: 'Veuillez confirmer votre adresse e-mail.',
  too_many_requests: 'Trop de tentatives. Réessayez dans quelques minutes.',
}

function resolveErrorMessage(code: string | undefined): string {
  if (!code) return 'Une erreur est survenue. Veuillez réessayer.'
  return ERROR_MESSAGES[code] ?? 'Une erreur est survenue. Veuillez réessayer.'
}

export function useAdminAuth() {
  const supabase = useSupabase()

  // Shared state via useState so layout and pages share the same instance
  const user = useState<User | null>('admin-user', () => null)
  const isLoading = useState<boolean>('admin-loading', () => false)
  const authError = useState<string | null>('admin-error', () => null)

  const isAuthenticated = computed(() => user.value !== null)

  const userInitials = computed<string>(() => {
    if (!user.value?.email) return '?'
    const email = user.value.email
    const parts = email.split('@')[0]?.split(/[._-]/) ?? []
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    }
    return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
  })

  async function initSession(): Promise<void> {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
  }

  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true
    authError.value = null

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      authError.value = resolveErrorMessage(error.code)
      isLoading.value = false
      return
    }

    user.value = data.user
    isLoading.value = false
    await navigateTo('/admin/dashboard')
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    await supabase.auth.signOut()
    user.value = null
    isLoading.value = false
    await navigateTo('/admin/login')
  }

  return {
    user,
    userInitials,
    isAuthenticated,
    authError,
    isLoading,
    login,
    logout,
    initSession,
  }
}
