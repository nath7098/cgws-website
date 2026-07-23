import { z } from 'zod'
import type { H3Event } from 'h3'

// ---------------------------------------------------------------------------
// US-097 — Inscription publique "M'avertir du retour en stock".
//
// Idempotence (scénario Gherkin 4) : upsert sur la contrainte UNIQUE
// (product_id, email) de la migration 007 — une 2e soumission ne crée jamais
// de doublon. `notified_at` est réinitialisé à `null` sur upsert : si la même
// adresse se réinscrit après un cycle rupture → réappro → rupture précédent
// (déjà notifiée une première fois), elle redevient éligible à la prochaine
// notification plutôt que de rester marquée "déjà traitée" pour toujours.
//
// Aucune fuite d'information (spec design §3, table §détaillée) : la réponse
// est strictement identique que l'email soit déjà inscrit ou non, et que le
// produit soit réellement en rupture ou non — dans ce dernier cas (race
// condition : le produit vient d'être réapprovisionné entre le chargement de
// la fiche et la soumission du formulaire), aucune inscription n'est créée
// mais le client reçoit la même confirmation neutre.
// ---------------------------------------------------------------------------

const notifyRestockSchema = z.object({
  email: z.string().trim().email('Adresse email invalide'),
})

export default defineEventHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID produit manquant' })
  }

  const body = await readBody<unknown>(event)
  const parseResult = notifyRestockSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      data: { errors: { email: 'Adresse email invalide' } },
    })
  }

  const email = parseResult.data.email.trim().toLowerCase()
  const supabase = getAdminSupabase()

  const { data: product, error: fetchErr } = await supabase
    .from('products')
    .select('id, status, stock, is_consignment')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !product) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }

  // Contrat identique à `isOutOfStock` dans ProductInfo.vue/ProductCard.vue
  // (spec design §0.1) : un produit de consignation n'entre jamais dans cet
  // axe, quelle que soit la valeur de `stock` en base.
  const isOutOfStock
    = !product.is_consignment && (product.stock ?? 0) === 0 && product.status === 'active'

  if (isOutOfStock) {
    const { error: upsertErr } = await supabase
      .from('stock_notifications')
      .upsert(
        { product_id: id, email, notified_at: null },
        { onConflict: 'product_id,email' },
      )

    if (upsertErr) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de l'enregistrement de votre inscription",
      })
    }
  }

  return { success: true }
})
