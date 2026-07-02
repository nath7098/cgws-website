import type { H3Event } from 'h3'
import {
  sendConsignmentAcceptEmail,
} from '~/server/services/email'

interface AcceptBody {
  agreedPrice: number
  notes?: string
}

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const body = await readBody<AcceptBody>(event)

  // Validate agreedPrice
  if (typeof body.agreedPrice !== 'number' || body.agreedPrice <= 0) {
    throw createError({
      statusCode: 422,
      data: { errors: { agreedPrice: 'Le prix de mise en vente doit être supérieur à 0.' } },
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

  // Generate a unique slug from item description + brand
  const slug = await generateUniqueSlug(
    supabase,
    cons.item_description,
    cons.brand ?? '',
  )

  // Create the product in the catalogue
  const { data: newProduct, error: productErr } = await supabase
    .from('products')
    .insert({
      title: cons.item_description,
      slug,
      description: '',
      price: body.agreedPrice,
      category: 'accessoires',
      brand: cons.brand ?? '',
      condition: cons.condition,
      is_consignment: true,
      consignment_id: id,
      status: 'active',
      images: cons.images ?? [],
      stock: 1,
    })
    .select('id, title, slug, status')
    .single()

  if (productErr || !newProduct) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création du produit',
    })
  }

  // Update the consignment status to accepted
  const { data: updatedCons, error: updateErr } = await supabase
    .from('consignments')
    .update({
      status: 'accepted',
      agreed_price: body.agreedPrice,
      notes: body.notes ?? null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (updateErr || !updatedCons) {
    // Rollback: delete the product we just created
    await supabase.from('products').delete().eq('id', newProduct.id)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour de la consignation',
    })
  }

  // Send acceptance email (non-blocking — do not throw on failure)
  const config = useRuntimeConfig()
  await sendConsignmentAcceptEmail(config.resendApiKey as string, {
    depositorName: cons.depositor_name,
    depositorEmail: cons.depositor_email,
    itemDescription: cons.item_description,
    brand: cons.brand ?? undefined,
    agreedPrice: body.agreedPrice,
    consignmentId: id,
  }).catch(() => {
    // Email failure is non-fatal
  })

  return {
    consignment: mapConsignmentRow(updatedCons),
    linkedProduct: {
      id: newProduct.id,
      title: newProduct.title,
      slug: newProduct.slug,
      status: (newProduct.status ?? 'active') as 'active' | 'sold' | 'reserved' | 'inactive',
    },
  }
})
