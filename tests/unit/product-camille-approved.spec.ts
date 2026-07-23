import { describe, expect, it } from 'vitest'
import { mapProductRow } from '../../server/utils/adminSupabase'

// US-110 — le badge « Testé et approuvé par Camille » n'est jamais affiché par
// défaut : son unique source de vérité est la colonne DB `camille_approved`,
// mappée en `Product.camilleApproved`. Ce test verrouille le contrat de
// mapping snake_case → camelCase (et son fallback `false`) qui GATE l'affichage
// du composant `CgwsApprovedBadge` côté fiche produit / carte catalogue.

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'selle-billy-cook',
    title: 'Selle Billy Cook 16"',
    description: null,
    price: 1850,
    category: 'selles',
    brand: 'Billy Cook',
    size: '16"',
    condition: 'excellent',
    is_consignment: false,
    consignment_id: null,
    status: 'active',
    images: null,
    stock: 1,
    camille_approved: false,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('mapProductRow — camille_approved → camilleApproved (US-110)', () => {
  it('mappe camille_approved=true sur camilleApproved=true (badge affiché)', () => {
    expect(mapProductRow(baseRow({ camille_approved: true })).camilleApproved).toBe(true)
  })

  it('mappe camille_approved=false sur camilleApproved=false (badge masqué)', () => {
    expect(mapProductRow(baseRow({ camille_approved: false })).camilleApproved).toBe(false)
  })

  it('retombe sur false si la colonne est absente/null (jamais affiché par défaut)', () => {
    // Compatibilité descendante : si le code tourne avant l'application de la
    // migration 010, `camille_approved` est absent — le badge NE doit PAS
    // apparaître par défaut.
    expect(mapProductRow(baseRow({ camille_approved: null })).camilleApproved).toBe(false)
    const { camille_approved: _omit, ...rowWithoutColumn } = baseRow()
    expect(mapProductRow(rowWithoutColumn as Parameters<typeof mapProductRow>[0]).camilleApproved).toBe(false)
  })
})
