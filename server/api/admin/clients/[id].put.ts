import type { H3Event } from 'h3'
import { z } from 'zod'
import type { Client } from '~/types'

const updateSchema = z.object({
  notes: z.string(),
})

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID client manquant' })
  }

  const body = await readBody(event)
  const parseResult = updateSchema.safeParse(body)
  if (!parseResult.success) {
    throw createError({ statusCode: 422, statusMessage: 'Données invalides' })
  }

  // ─── Verify client exists ───────────────────────────────────────────────────

  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Client introuvable' })
  }

  // ─── Update notes ───────────────────────────────────────────────────────────

  const { data: clientData, error } = await supabase
    .from('clients')
    .update({ notes: parseResult.data.notes || null })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !clientData) {
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la mise à jour' })
  }

  const client: Client = {
    id: clientData.id,
    name: clientData.name,
    email: clientData.email ?? undefined,
    phone: clientData.phone ?? undefined,
    address: clientData.address ?? undefined,
    notes: clientData.notes ?? undefined,
    createdAt: clientData.created_at ?? '',
  }

  return { client }
})
