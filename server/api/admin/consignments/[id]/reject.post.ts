import type { H3Event } from 'h3'
import { sendConsignmentRejectEmail } from '~~/server/services/email'

interface RejectBody {
  reason: string
}

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const body = await readBody<RejectBody>(event)

  // Validate reason
  if (typeof body.reason !== 'string' || !body.reason.trim()) {
    throw createError({
      statusCode: 422,
      data: { errors: { reason: 'Le motif de refus est obligatoire.' } },
    })
  }

  // Fetch the consignment
  const { data: cons, error: fetchErr } = await supabase
    .from('consignments')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !cons) {
    throw createError({ statusCode: 404, statusMessage: 'Consignation introuvable' })
  }

  // Check it's still pending
  if (cons.status !== 'pending') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cette demande a déjà été traitée.',
    })
  }

  // Update the consignment to rejected, storing the reason in notes
  const { data: updatedCons, error: updateErr } = await supabase
    .from('consignments')
    .update({
      status: 'rejected',
      notes: body.reason.trim(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (updateErr || !updatedCons) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour de la consignation',
    })
  }

  // Send rejection email (non-blocking)
  const config = useRuntimeConfig()
  await sendConsignmentRejectEmail(config.resendApiKey as string, {
    depositorName: cons.depositor_name,
    depositorEmail: cons.depositor_email,
    itemDescription: cons.item_description,
    reason: body.reason.trim(),
    consignmentId: id,
  }).catch(() => {
    // Email failure is non-fatal
  })

  return { consignment: mapConsignmentRow(updatedCons) }
})
