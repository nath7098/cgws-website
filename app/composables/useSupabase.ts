import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

/**
 * Nettoie une valeur de credential (URL / clé) avant de la passer au client
 * Supabase. Les valeurs de headers HTTP doivent être ISO-8859-1 : un caractère
 * non-Latin1 collé par erreur dans la variable d'env (ellipsis « … » U+2026,
 * guillemet typographique, espace insécable large…) fait throw
 * `Headers.set('apikey', …)` et fait planter TOUT le client — écran blanc sur
 * le catalogue. On retire donc tout ce qui n'est pas de l'ASCII imprimable
 * (`\x21`–`\x7E`, sans espace) : une clé simplement suivie d'un caractère
 * parasite est récupérée intacte ; une clé réellement corrompue dégrade en
 * erreur d'auth propre plutôt qu'en crash non rattrapé.
 */
function sanitizeCredential(value: string): string {
  return value.replace(/[^\x21-\x7E]/g, '')
}

export function useSupabase() {
  const config = useRuntimeConfig()

  return createClient<Database>(
    sanitizeCredential(config.public.supabaseUrl as string),
    sanitizeCredential(config.public.supabaseAnonKey as string),
  )
}
