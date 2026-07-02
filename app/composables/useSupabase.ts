import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export function useSupabase() {
  const config = useRuntimeConfig()

console.log('====================================');
console.log(config);
console.log('====================================');

  return createClient<Database>(
    config.public.supabaseUrl as string,
    config.public.supabaseAnonKey as string,
  )
}
