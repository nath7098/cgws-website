import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

/**
 * Validates the Supabase JWT from the Authorization header.
 * Throws 401 if missing or invalid.
 */
export async function requireAdminAuth(event: H3Event): Promise<void> {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseAnonKey as string,
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired session',
    })
  }

  // Guard: only the configured admin email is allowed
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email !== adminEmail) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès refusé',
    })
  }
}
