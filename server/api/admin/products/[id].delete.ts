import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  // Fetch product to get its images
  const { data: product, error: fetchErr } = await supabase
    .from('products')
    .select('id, images')
    .eq('id', id)
    .single()

  if (fetchErr || !product) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }

  // Remove images from Storage (failure is non-blocking)
  let storageWarning: string | undefined
  const images = product.images ?? []
  if (images.length > 0) {
    const paths = images
      .map(url => storagePathFromUrl(url))
      .filter((p): p is string => p !== null)

    if (paths.length > 0) {
      const { error: storageErr } = await supabase.storage
        .from('product-images')
        .remove(paths)

      if (storageErr) {
        storageWarning = 'Certains fichiers Storage n\'ont pas pu être supprimés'
      }
    }
  }

  // Delete the DB record
  const { error: deleteErr } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (deleteErr) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la suppression du produit',
    })
  }

  return {
    success: true,
    deletedId: id,
    ...(storageWarning ? { warning: storageWarning } : {}),
  }
})
