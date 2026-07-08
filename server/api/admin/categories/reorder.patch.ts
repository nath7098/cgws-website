import type { H3Event } from 'h3'

interface ReorderItem {
  id: string
  sortOrder: number
  parentId: string | null
}

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const body = await readBody<{ items?: ReorderItem[] }>(event)

  if (!Array.isArray(body?.items) || body.items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Corps invalide : `items` requis.' })
  }

  const results = await Promise.allSettled(
    body.items.map(item =>
      supabase
        .from('categories')
        .update({
          sort_order: item.sortOrder,
          parent_id: item.parentId,
        })
        .eq('id', item.id),
    ),
  )

  const failed = results.filter(r => r.status === 'rejected').length
  if (failed > 0) {
    throw createError({
      statusCode: 500,
      statusMessage: `${failed} mise(s) à jour ont échoué.`,
    })
  }

  return { updated: body.items.length }
})
