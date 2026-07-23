import { sendRestockNotification } from '~~/server/services/email'

/**
 * US-097 — Détection du réapprovisionnement (rupture 0 -> stock > 0) et envoi
 * des alertes email aux inscrits non encore notifiés.
 *
 * Extrait en util partagé (même logique de composition que
 * `server/utils/fulfillment.ts`, US-091) pour rester testable indépendamment
 * de la route admin multipart qui l'appelle (`server/api/admin/products/[id].put.ts`,
 * seul point d'écriture du stock d'un produit EXISTANT côté admin — décision
 * d'architecture actée, cf. docs/SPRINT_PLAN.md § US-097).
 *
 * Non bloquant : toute erreur (requête Supabase, envoi Resend) est absorbée
 * ici et ne remonte jamais à l'appelant — un échec ne doit jamais faire
 * échouer la mise à jour produit qui a déclenché cette détection.
 */
export interface RestockDetectionInput {
  productId: string
  productTitle: string
  productSlug: string
  previousStock: number
  newStock: number
}

export async function notifyRestockedSubscribers(input: RestockDetectionInput): Promise<void> {
  const wasOutOfStock = input.previousStock === 0
  const isNowInStock = input.newStock > 0
  if (!wasOutOfStock || !isNowInStock) return

  try {
    const supabase = getAdminSupabase()

    const { data: pending } = await supabase
      .from('stock_notifications')
      .select('id, email')
      .eq('product_id', input.productId)
      .is('notified_at', null)

    if (!pending || pending.length === 0) return

    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
    const productUrl = `${siteUrl}/catalogue/${input.productSlug}`

    await Promise.all(
      pending.map(subscription =>
        sendRestockNotification(config.resendApiKey as string, {
          recipientEmail: subscription.email,
          productTitle: input.productTitle,
          productUrl,
        }),
      ),
    )

    await supabase
      .from('stock_notifications')
      .update({ notified_at: new Date().toISOString() })
      .in('id', pending.map(subscription => subscription.id))
  }
  catch {
    // Non-bloquant (cf. docstring) — silencieux à dessein, cohérent avec le
    // pattern déjà en place pour les autres envois email du projet.
  }
}
