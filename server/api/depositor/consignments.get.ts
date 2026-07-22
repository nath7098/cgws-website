import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { ConsignmentStatus, DepositorConsignmentView, ProductCondition } from '~/types'

// CŒUR SÉCURITÉ US-066 — seule source de données de /espace-deposant/suivi.
//
// 1. Vérifie le JWT du déposant via supabase.auth.getUser(token) (rôle authenticated).
// 2. Interroge `consignments` avec getAdminSupabase() (service role, bypass RLS)
//    STRICTEMENT filtré par depositor_email = email du JWT (exact, insensible à la casse).
// 3. Ne retourne QUE le sous-ensemble autorisé (DepositorConsignmentView) — jamais
//    `notes`, jamais de champ commission brut. Le montant net à reverser est calculé ICI.
//
// Un déposant ne peut jamais lire les consignations d'un autre : le filtre est appliqué
// côté serveur sur l'email du token, aucune donnée client (URL, body) ne le pilote.

const COMMISSION_RATE = 0.20

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export default defineEventHandler(
  async (event: H3Event): Promise<{ consignments: DepositorConsignmentView[] }> => {
    const config = useRuntimeConfig()

    // ─── 1. Vérification du JWT déposant ────────────────────────────────────────
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const authClient = createClient(
      config.public.supabaseUrl as string,
      config.public.supabaseAnonKey as string,
    )

    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user?.email) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
    }

    const depositorEmail = user.email.toLowerCase()

    // ─── 2. Lecture service role, filtrée sur l'email du token ───────────────────
    const admin = getAdminSupabase()

    // Échappe les métacaractères ILIKE (%, _, \) pour forcer une correspondance exacte
    // insensible à la casse, jamais un motif — un email peut légitimement contenir « _ ».
    const escapedEmail = depositorEmail.replace(/([%_\\])/g, '\\$1')

    const { data: rows, error: consErr } = await admin
      .from('consignments')
      .select('id, item_description, brand, condition, status, asking_price, agreed_price, created_at, depositor_email')
      .ilike('depositor_email', escapedEmail)
      .order('created_at', { ascending: false })

    if (consErr) {
      throw createError({ statusCode: 500, statusMessage: 'Erreur lors du chargement des consignations' })
    }

    // Filet de sécurité : re-vérifie l'égalité exacte insensible à la casse côté JS,
    // même si l'échappement ILIKE devait être imparfait — aucune ligne d'un autre
    // déposant ne peut alors franchir cette barrière.
    const owned = (rows ?? []).filter(
      row => (row.depositor_email ?? '').toLowerCase() === depositorEmail,
    )

    // ─── 3. Enrichissement des consignations vendues (batch, US-093) ─────────────
    // Ancien code : 2 requêtes (products + sales) PAR consignation vendue (N+1).
    // Désormais : nombre de requêtes CONSTANT — 1 requête `consignments` + au plus
    // 1 requête `products` (.in sur les ids des consignations vendues DU déposant)
    // + 1 requête `sales` (.in sur les ids des produits ainsi retrouvés). Les ids
    // proviennent exclusivement de `owned` (déjà filtré sur l'email du JWT) : les
    // barrières de sécurité US-066 sont inchangées.

    const soldIds = owned
      .filter(row => (row.status ?? 'pending') === 'sold')
      .map(row => row.id)

    // consignment_id → product_id (au plus un produit par consignation, comme
    // l'ancien maybeSingle — on ne conserve que la première correspondance).
    const productByConsignment = new Map<string, string>()
    // product_id → vente la plus récente (sale_price, commission_amount).
    const latestSaleByProduct = new Map<string, { sale_price: number | string, commission_amount: number | string | null }>()

    if (soldIds.length > 0) {
      const { data: products } = await admin
        .from('products')
        .select('id, consignment_id')
        .in('consignment_id', soldIds)

      for (const product of products ?? []) {
        if (product.consignment_id && !productByConsignment.has(product.consignment_id)) {
          productByConsignment.set(product.consignment_id, product.id)
        }
      }

      const productIds = [...productByConsignment.values()]
      if (productIds.length > 0) {
        // Tri décroissant sur created_at : la première ligne rencontrée par produit
        // est la vente la plus récente (équivalent de l'ancien .limit(1).maybeSingle()).
        const { data: sales } = await admin
          .from('sales')
          .select('product_id, sale_price, commission_amount')
          .in('product_id', productIds)
          .order('created_at', { ascending: false })

        for (const sale of sales ?? []) {
          if (sale.product_id && !latestSaleByProduct.has(sale.product_id)) {
            latestSaleByProduct.set(sale.product_id, {
              sale_price: sale.sale_price,
              commission_amount: sale.commission_amount,
            })
          }
        }
      }
    }

    // ─── 4. Mapping vers le sous-ensemble exposé ─────────────────────────────────
    const consignments: DepositorConsignmentView[] = []

    for (const row of owned) {
      const status = (row.status ?? 'pending') as ConsignmentStatus

      const view: DepositorConsignmentView = {
        id: row.id,
        itemDescription: row.item_description,
        brand: row.brand ?? '',
        condition: row.condition as ProductCondition,
        status,
        askingPrice: Number(row.asking_price),
        agreedPrice: row.agreed_price !== null ? Number(row.agreed_price) : undefined,
        createdAt: row.created_at ?? '',
      }

      if (status === 'sold') {
        const productId = productByConsignment.get(row.id)
        const sale = productId !== undefined ? latestSaleByProduct.get(productId) : undefined

        if (sale) {
          const salePrice = Number(sale.sale_price)
          // Commission réellement enregistrée (peut différer du taux standard si
          // négociée). Fallback sur le taux public 20 % si absente.
          const commission = sale.commission_amount !== null
            ? Number(sale.commission_amount)
            : round2(salePrice * COMMISSION_RATE)

          view.salePrice = salePrice
          view.depositorAmount = round2(salePrice - commission)
        }

        // Aucune vente retrouvée : le net à reverser est le prix accordé (modèle canonique
        // aligné sur l'email de vente — cf. server/services/email.ts).
        if (view.salePrice === undefined && view.agreedPrice !== undefined) {
          view.depositorAmount = view.agreedPrice
        }
      }

      consignments.push(view)
    }

    return { consignments }
  },
)
