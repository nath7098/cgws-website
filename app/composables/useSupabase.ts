import { createClient } from '@supabase/supabase-js'
import type { Product, Consignment, Sale, Client } from '~/types'

export type Database = {
  public: {
    Tables: {
      products: { Row: Product }
      consignments: { Row: Consignment }
      sales: { Row: Sale }
      clients: { Row: Client }
    }
  }
}

export function useSupabase() {
  const config = useRuntimeConfig()

  const supabase = createClient<Database>(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )

  return supabase
}
