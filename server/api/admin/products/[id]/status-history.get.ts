import type { H3Event } from 'h3'
import type { ProductStatus, ProductStatusHistory } from '~/types'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID produit manquant' })
  }

  const { data, error } = await supabase
    .from('product_status_history')
    .select('*')
    .eq('product_id', id)
    .order('changed_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors du chargement de l\'historique',
    })
  }

  const history: ProductStatusHistory[] = (data ?? []).map(row => ({
    id: row.id as string,
    productId: row.product_id as string,
    oldStatus: (row.old_status as ProductStatus | null) ?? null,
    newStatus: row.new_status as ProductStatus,
    changedAt: row.changed_at as string,
    changedBy: row.changed_by as string,
  }))

  return { history }
})
