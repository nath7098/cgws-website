import type { H3Event } from 'h3'

interface PatchBody {
  agreedPrice?: number
  notes?: string
}

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const body = await readBody<PatchBody>(event)

  // Validate: at least one field to update
  if (body.agreedPrice === undefined && body.notes === undefined) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Aucun champ à mettre à jour',
    })
  }

  // Validate agreedPrice if provided
  if (body.agreedPrice !== undefined && (typeof body.agreedPrice !== 'number' || body.agreedPrice <= 0)) {
    throw createError({
      statusCode: 422,
      data: { errors: { agreedPrice: 'Le prix doit être un nombre supérieur à 0.' } },
    })
  }

  // Check the consignment exists and is pending
  const { data: existing, error: fetchErr } = await supabase
    .from('consignments')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Consignation introuvable' })
  }

  if (existing.status !== 'pending') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cette demande a déjà été traitée et ne peut plus être modifiée.',
    })
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {}
  if (body.agreedPrice !== undefined) updatePayload.agreed_price = body.agreedPrice
  if (body.notes !== undefined) updatePayload.notes = body.notes || null

  const { data, error } = await supabase
    .from('consignments')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour de la consignation',
    })
  }

  return { consignment: mapConsignmentRow(data) }
})
