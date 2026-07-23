import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { sendConsignmentConfirmation } from '../../services/email'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const consignmentSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^[0-9+\s\-()]{7,20}$/),
  description: z.string().min(20),
  brand: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair']),
  askingPrice: z.coerce.number().positive().max(50000),
})

type ConsignmentInput = z.infer<typeof consignmentSchema>

// Friendly client-facing error messages keyed by field name
const FIELD_MESSAGES: Record<keyof ConsignmentInput, string> = {
  prenom: 'Le prénom est requis (min. 2 caractères)',
  nom: 'Le nom est requis (min. 2 caractères)',
  email: 'Adresse email invalide',
  phone: 'Numéro de téléphone invalide',
  description: "Décrivez l'article en au moins 20 caractères",
  brand: 'Marque invalide',
  condition: "Veuillez indiquer l'état de l'article",
  askingPrice: 'Veuillez indiquer un prix valide (entre 1 € et 50 000 €)',
}

// ---------------------------------------------------------------------------
// Event handler
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Parse multipart form data — enveloppé (US-095, défense en profondeur) :
  // la compression client (voir ConsignmentForm.vue) réduit fortement le
  // risque de dépassement de la limite de corps des fonctions serverless,
  // sans l'éliminer à 100% (connexion lente interrompue, payload malformé
  // par un client non standard…). Un échec de parsing ne doit jamais
  // remonter comme une erreur brute/stack au déposant.
  let formParts: Awaited<ReturnType<typeof readMultipartFormData>>
  try {
    formParts = await readMultipartFormData(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message:
        "Impossible de lire votre demande — vérifiez la taille de vos photos et réessayez, ou contactez-nous directement.",
    })
  }

  if (!formParts) {
    throw createError({ statusCode: 400, message: 'Corps de requête manquant ou invalide' })
  }

  // Separate text fields from image files
  const textFields: Record<string, string> = {}
  const imageFiles: Array<{ data: Buffer; filename: string; contentType: string }> = []

  for (const part of formParts) {
    if (!part.name) continue

    if (part.filename) {
      // Image file
      imageFiles.push({
        data: part.data as Buffer,
        filename: part.filename,
        contentType: part.type ?? 'image/jpeg',
      })
    } else {
      // Text field
      textFields[part.name] = part.data.toString('utf-8')
    }
  }

  // Validate text fields
  const parseResult = consignmentSchema.safeParse(textFields)
  if (!parseResult.success) {
    const flatErrors = parseResult.error.flatten()
    const fieldErrors: Record<string, string> = {}

    for (const key of Object.keys(flatErrors.fieldErrors) as Array<keyof ConsignmentInput>) {
      const msgs = flatErrors.fieldErrors[key]
      if (msgs !== undefined && msgs.length > 0) {
        fieldErrors[key] = FIELD_MESSAGES[key] ?? (msgs[0] ?? 'Champ invalide')
      }
    }

    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      data: { errors: fieldErrors },
    })
  }

  const input = parseResult.data
  const depositorName = `${input.prenom.trim()} ${input.nom.trim()}`
  const consignmentId = crypto.randomUUID()

  // Set up Supabase with service role key (bypasses RLS for server-side writes)
  const supabase = createClient<Database>(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
  )

  // Upload images to Supabase Storage — enveloppé (US-095, défense en
  // profondeur) : une exception inattendue (panne réseau/Storage ponctuelle)
  // ne doit jamais remonter brute au déposant ; les échecs "normaux" par
  // fichier (`uploadErr`) restent gérés en aval sans bloquer les autres photos.
  const imageUrls: string[] = []
  try {
    for (const file of imageFiles) {
      // Sanitise filename: keep only alphanumerics, dots, dashes, underscores
      const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `consignments/${consignmentId}/${safeName}`

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
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      message:
        "Une erreur est survenue lors de l'envoi de vos photos. Réessayez avec moins de photos, ou contactez-nous directement.",
    })
  }

  // Insert consignment record
  const now = new Date().toISOString()
  const { data: consignment, error: insertErr } = await supabase
    .from('consignments')
    .insert({
      id: consignmentId,
      depositor_name: depositorName,
      depositor_email: input.email,
      depositor_phone: input.phone,
      item_description: input.description,
      brand: input.brand ?? null,
      condition: input.condition,
      asking_price: input.askingPrice,
      images: imageUrls,
      status: 'pending',
      created_at: now,
    })
    .select('id, created_at')
    .single()

  if (insertErr) {
    throw createError({
      statusCode: 500,
      message: "Erreur lors de l'enregistrement de la demande",
    })
  }

  // Send confirmation email (non-blocking — failure does not abort the response)
  try {
    await sendConsignmentConfirmation(config.resendApiKey, {
      depositorName,
      depositorEmail: input.email,
      itemDescription: input.description,
      brand: input.brand,
      condition: input.condition,
      askingPrice: input.askingPrice,
      consignmentId: consignment.id,
      createdAt: consignment.created_at ?? now,
    })
  } catch {
    // Email failure is logged silently; consignment is already saved
  }

  return {
    success: true,
    consignmentId: consignment.id,
  }
})
