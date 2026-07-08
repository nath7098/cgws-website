import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  // Fetch category + children
  const { data: category } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('id', id)
    .maybeSingle()

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Catégorie introuvable.' })
  }

  const { data: children } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('parent_id', id)

  const allSlugs = [category.slug, ...(children ?? []).map(c => c.slug)]

  // Count products in these categories (all statuses)
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .in('category', allSlugs)

  if (count && count > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cette catégorie contient des produits et ne peut pas être supprimée.',
      data: { reason: 'has_products', productCount: count },
    })
  }

  // Delete children first, then parent
  if (children && children.length > 0) {
    const childIds = children.map(c => c.id)
    const { error: deleteChildrenErr } = await supabase
      .from('categories')
      .delete()
      .in('id', childIds)

    if (deleteChildrenErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression des sous-catégories.',
      })
    }
  }

  const { error: deleteErr } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (deleteErr) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la suppression de la catégorie.',
    })
  }

  return { success: true, deletedId: id }
})
