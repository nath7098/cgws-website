/**
 * US-109 — Taxonomie catégories reining/western.
 *
 * Couvre la logique métier neuve la plus risquée : la normalisation d'un slug
 * de catégorie (`normalizeCategory`), qui porte à la fois la validation stricte
 * de la nouvelle taxonomie ET la rétrocompat des anciens slugs via
 * `LEGACY_CATEGORY_REDIRECTS`. C'est cette même table de redirection qui
 * alimente `useCatalogue.initFromUrl` (liens indexés `?categorie=...`), donc la
 * couvrir ici couvre indirectement la rétrocompat catalogue sans démarrer Nuxt.
 *
 * Import pur depuis `#shared/utils/csvImport` (aucun global Nitro/Nuxt requis).
 */
import { describe, expect, it } from 'vitest'
import {
  CATEGORY_LABELS,
  LEGACY_CATEGORY_REDIRECTS,
  normalizeCategory,
  PRODUCT_CATEGORIES,
} from '#shared/utils/csvImport'

describe('taxonomie catégories (US-109)', () => {
  it('expose exactement les 8 slugs de la taxonomie cible', () => {
    expect([...PRODUCT_CATEGORIES]).toEqual([
      'selles',
      'bridonnerie',
      'etriers',
      'bandes-protections',
      'licols-accessoires',
      'soins',
      'bottes-chaussures',
      'vetements',
    ])
  })

  it('a un libellé FR pour chaque slug de la taxonomie', () => {
    for (const slug of PRODUCT_CATEGORIES) {
      expect(CATEGORY_LABELS[slug]).toBeTruthy()
    }
  })
})

describe('normalizeCategory', () => {
  it('accepte chaque slug de la nouvelle taxonomie tel quel', () => {
    for (const slug of PRODUCT_CATEGORIES) {
      expect(normalizeCategory(slug)).toBe(slug)
    }
  })

  it('est insensible à la casse et aux espaces', () => {
    expect(normalizeCategory('  Selles  ')).toBe('selles')
    expect(normalizeCategory('BRIDONNERIE')).toBe('bridonnerie')
  })

  it('remappe les anciens slugs legacy vers la taxonomie cible (rétrocompat)', () => {
    expect(normalizeCategory('accessoires')).toBe('licols-accessoires')
    expect(normalizeCategory('brides-licols')).toBe('bridonnerie')
    expect(normalizeCategory('protections')).toBe('bandes-protections')
  })

  it('remappe un ancien slug indépendamment de la casse', () => {
    expect(normalizeCategory('  Protections ')).toBe('bandes-protections')
  })

  it('retourne null pour un slug totalement inconnu (dégradation propre)', () => {
    expect(normalizeCategory('poneys')).toBeNull()
    expect(normalizeCategory('')).toBeNull()
  })

  it('chaque redirection legacy pointe vers un slug valide de la taxonomie', () => {
    for (const target of Object.values(LEGACY_CATEGORY_REDIRECTS)) {
      expect(PRODUCT_CATEGORIES as readonly string[]).toContain(target)
    }
  })
})
