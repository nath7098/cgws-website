import { z } from 'zod'
import type { H3Event } from 'h3'

const productUpdateSchema = z.object({
  title: z.string().min(1, 'Le nom du produit est requis'),
  category: z.enum(['selles', 'brides-licols', 'bottes-chaussures', 'vetements', 'accessoires', 'protections'], {
    error: 'Catégorie invalide',
  }),
  brand: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number({ error: 'Prix invalide' }).positive('Le prix doit être supérieur à 0'),
  condition: z.enum(['new', 'excellent', 'good', 'fair'], {
    error: 'État invalide',
  }),
  size: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(1),
  isConsignment: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  consignmentId: z.preprocess(v => (v === '' ? null : v), z.string().uuid().optional().nullable()),
  status: z.enum(['active', 'sold', 'reserved', 'inactive']).optional(),
})

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  // Verify product exists
  const { data: existing, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }

  const formParts = await readMultipartFormData(event)
  if (!formParts) {
    throw createError({ statusCode: 400, statusMessage: 'Corps de requête invalide' })
  }

  const textFields: Record<string, string> = {}
  const keptImages: string[] = []
  const removedImages: string[] = []
  const newImageFiles: Array<{ data: Buffer; filename: string; contentType: string }> = []

  for (const part of formParts) {
    if (!part.name) continue

    if (part.filename) {
      newImageFiles.push({
        data: part.data as Buffer,
        filename: part.filename,
        contentType: part.type ?? 'image/jpeg',
      })
    }
    else if (part.name === 'keptImages' || part.name === 'keptImages[]') {
      keptImages.push(part.data.toString('utf-8'))
    }
    else if (part.name === 'removedImages' || part.name === 'removedImages[]') {
      removedImages.push(part.data.toString('utf-8'))
    }
    else {
      textFields[part.name] = part.data.toString('utf-8')
    }
  }

  const parseResult = productUpdateSchema.safeParse(textFields)
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {}
    const flat = parseResult.error.flatten()
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs && msgs.length > 0) fieldErrors[key] = msgs[0] ?? 'Champ invalide'
    }
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      data: { errors: fieldErrors },
    })
  }

  const input = parseResult.data

  // Remove deleted images from Storage (non-blocking on partial failure)
  if (removedImages.length > 0) {
    const paths = removedImages.map(url => storagePathFromUrl(url)).filter((p): p is string => p !== null)
    if (paths.length > 0) {
      await supabase.storage.from('product-images').remove(paths)
    }
  }

  // Upload new images
  const newImageUrls: string[] = []
  const totalExisting = keptImages.length
  const maxNew = Math.max(0, 8 - totalExisting)

  for (const file of newImageFiles.slice(0, maxNew)) {
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `products/${id}/${Date.now()}_${safeName}`

    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, file.data, {
        contentType: file.contentType,
        upsert: false,
      })

    if (!uploadErr) {
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(storagePath)
      newImageUrls.push(urlData.publicUrl)
    }
  }

  // Merge images: kept (ordered) + new uploads
  const finalImages = [...keptImages, ...newImageUrls]

  // Regenerate slug only if title or brand changed
  let slug = existing.slug
  const titleChanged = input.title !== existing.title
  const brandChanged = (input.brand ?? '') !== (existing.brand ?? '')

  if (titleChanged || brandChanged) {
    slug = await generateUniqueSlug(supabase, input.title, input.brand ?? '', id)
  }

  // Update product
  const { data: updated, error: updateErr } = await supabase
    .from('products')
    .update({
      title: input.title,
      slug,
      category: input.category,
      brand: input.brand ?? null,
      description: input.description ?? null,
      price: input.price,
      condition: input.condition,
      size: input.size ?? null,
      stock: input.stock,
      is_consignment: input.isConsignment,
      consignment_id: input.consignmentId ?? null,
      status: input.status ?? existing.status ?? 'active',
      images: finalImages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (updateErr || !updated) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour du produit',
    })
  }

  // US-097 — Détection du réapprovisionnement (rupture 0 -> >0), décision
  // d'architecture actée : applicative dans CETTE route, seul point d'écriture
  // du stock d'un produit EXISTANT côté admin (`status.patch.ts` ne touche pas
  // au stock ; l'import CSV — `import/confirm.post.ts` — ne fait que CRÉER des
  // produits, jamais mettre à jour le stock d'un produit déjà existant : un
  // futur import qui réapprovisionnerait des produits existants ne serait PAS
  // couvert par cette détection — limite assumée, documentée dans
  // docs/PROGRESS.md). Logique extraite dans `server/utils/stockNotifications.ts`
  // (testable indépendamment, non bloquante par construction).
  await notifyRestockedSubscribers({
    productId: id,
    productTitle: updated.title,
    productSlug: updated.slug,
    previousStock: existing.stock ?? 0,
    newStock: updated.stock ?? 0,
  })

  return { product: mapProductRow(updated) }
})
