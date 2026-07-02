import type { H3Event } from 'h3'
import type { ProductStatus } from '~/types'

const VALID_STATUSES: ProductStatus[] = ['active', 'reserved', 'sold', 'inactive']

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID produit manquant' })
  }

  const body = await readBody<{ status?: unknown }>(event)
  const status = body?.status

  if (!status || !VALID_STATUSES.includes(status as ProductStatus)) {
    throw createError({
      statusCode: 422,
      statusMessage: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`,
    })
  }

  const newStatus = status as ProductStatus

  // Fetch current status
  const { data: current, error: fetchErr } = await supabase
    .from('products')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchErr || !current) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }

  const oldStatus = current.status as ProductStatus | null

  // Update product status
  const { data: updated, error: updateErr } = await supabase
    .from('products')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .single()

  if (updateErr || !updated) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour du statut',
    })
  }

  // Record history only when status actually changes
  if (oldStatus !== newStatus) {
    await supabase.from('product_status_history').insert({
      product_id: id,
      old_status: oldStatus ?? null,
      new_status: newStatus,
      changed_by: 'admin',
    })
  }

  return {
    product: {
      id: updated.id as string,
      status: updated.status as ProductStatus,
    },
  }
})
