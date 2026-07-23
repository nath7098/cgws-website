/**
 * Taxonomie d'événements analytics CGWS (US-103) — EXHAUSTIVE.
 *
 * Tout événement hors de cette liste est refusé en review : le typage de
 * `useAnalytics().capture()` est verrouillé sur `AnalyticsEventName` et sur la
 * map `AnalyticsEventPayloadMap` — un nom d'événement inconnu ou une propriété
 * hors taxonomie est une erreur de COMPILATION, l'audit est mécanique.
 *
 * Règles :
 * - JAMAIS de PII (email, nom, téléphone, adresse, contenu de message, prix
 *   demandé du déposant, noms de fichiers).
 * - JAMAIS d'URL avec query string dans une propriété (règle anti-fuite
 *   US-102, cf. docs/DEV_GUIDE.md).
 * - « Commande payée » est volontairement côté serveur (US-104, webhook
 *   Stripe) — pas dans cette taxonomie client.
 */
import type { ProductCategory } from '~/types'

export const ANALYTICS_EVENTS = [
  'product_viewed',
  'cart_item_added',
  'checkout_opened',
  'consignment_form_viewed',
  'consignment_submitted',
  'contact_submitted',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

/**
 * Propriétés attendues par événement — `undefined` = événement sans propriétés.
 * Types littéraux (pas d'interfaces) : l'index signature implicite les rend
 * assignables à `AnalyticsProperties`.
 */
export type AnalyticsEventPayloadMap = {
  /** Affichage d'une fiche produit. */
  product_viewed: {
    product_id: string
    product_slug: string
    category: ProductCategory
    price: number
    is_consignment: boolean
  }
  /** Ajout au panier réussi (ou remplacement de quantité, US-096). */
  cart_item_added: {
    product_id: string
    quantity: number
    price: number
  }
  /** Montage effectif du checkout embarqué Stripe. */
  checkout_opened: {
    cart_value: number
    items_count: number
  }
  /** Affichage du formulaire de dépôt sur /consignation. */
  consignment_form_viewed: undefined
  /** Soumission de dépôt RÉUSSIE — `photos_count` est un COMPTE, jamais les
   *  fichiers ni leurs noms. `category` uniquement si disponible (le
   *  formulaire actuel ne collecte pas de catégorie). */
  consignment_submitted: {
    photos_count: number
    category?: ProductCategory
  }
  /** Soumission de contact RÉUSSIE. */
  contact_submitted: undefined
}

/** Événements sans propriétés (appel `capture(event)` sans second argument). */
export type AnalyticsEventWithoutProperties = {
  [K in AnalyticsEventName]: AnalyticsEventPayloadMap[K] extends undefined ? K : never
}[AnalyticsEventName]

/** Événements avec propriétés obligatoires. */
export type AnalyticsEventWithProperties = Exclude<
  AnalyticsEventName,
  AnalyticsEventWithoutProperties
>
