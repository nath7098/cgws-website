import { z } from 'zod'
import type { H3Event } from 'h3'
import { PRODUCT_CATEGORIES } from '#shared/utils/csvImport'

const productSchema = z.object({
  title: z.string().min(1, 'Le nom du produit est requis'),
  category: z.enum(PRODUCT_CATEGORIES, {
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
})

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()

  const formParts = await readMultipartFormData(event)
  if (!formParts) {
    throw createError({ statusCode: 400, statusMessage: 'Corps de requête invalide' })
  }

  const textFields: Record<string, string> = {}
  const imageFiles: Array<{ data: Buffer; filename: string; contentType: string }> = []

  for (const part of formParts) {
    if (!part.name) continue
    if (part.filename) {
      imageFiles.push({
        data: part.data as Buffer,
        filename: part.filename,
        contentType: part.type ?? 'image/jpeg',
      })
    }
    else {
      textFields[part.name] = part.data.toString('utf-8')
    }
  }

  const parseResult = productSchema.safeParse(textFields)
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

  // Generate unique slug
  const slug = await generateUniqueSlug(supabase, input.title, input.brand ?? '')

  // Pre-allocate a product ID so we can build the storage path
  const productId = crypto.randomUUID()

  // Upload images
  const imageUrls: string[] = []
  for (const file of imageFiles.slice(0, 8)) {
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `products/${productId}/${Date.now()}_${safeName}`

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
      imageUrls.push(urlData.publicUrl)
    }
  }

  // Insert product
  const { data: product, error: insertErr } = await supabase
    .from('products')
    .insert({
      id: productId,
      slug,
      title: input.title,
      description: input.description ?? null,
      price: input.price,
      category: input.category,
      brand: input.brand ?? null,
      size: input.size ?? null,
      condition: input.condition,
      is_consignment: input.isConsignment,
      consignment_id: input.consignmentId ?? null,
      status: 'active',
      images: imageUrls,
      stock: input.stock,
    })
    .select('*')
    .single()

  if (insertErr || !product) {
    // Clean up uploaded images to avoid orphaned Storage objects
    const storagePaths = imageUrls.map((url) => {
      const marker = '/product-images/'
      const idx = url.indexOf(marker)
      return idx !== -1 ? url.slice(idx + marker.length) : null
    }).filter((p): p is string => p !== null)
    if (storagePaths.length > 0) {
      await supabase.storage.from('product-images').remove(storagePaths)
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la création du produit",
    })
  }

  setResponseStatus(event, 201)
  return { product: mapProductRow(product) }
})
