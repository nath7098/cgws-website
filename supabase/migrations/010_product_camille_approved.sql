-- ─────────────────────────────────────────────────────────────────────────────
-- US-110 · Badge « Testé et approuvé par Camille »
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Objectif : ajouter le champ de vérité qui pilote l'affichage du badge de
-- curation « Testé et approuvé par Camille » (docs/BRAND_DIRECTION.md
-- § Signature éditoriale). La curation est une décision MANUELLE de Camille,
-- produit par produit — aucune règle automatique : d'où une simple colonne
-- booléenne, défaut `false` (le badge n'est JAMAIS affiché par défaut).
--
-- ⚠️ Additive et idempotente : `ADD COLUMN IF NOT EXISTS`, valeur par défaut
-- `false` appliquée aux lignes existantes. Aucune donnée supprimée, aucune
-- contrainte durcie. Rejouable sans effet au 2ᵉ passage.
--
-- Ordre de déploiement : cette migration peut être appliquée AVANT ou EN MÊME
-- TEMPS que le code (le code lit `camille_approved` avec un fallback `?? false`
-- côté mapping, donc reste compatible même si la colonne n'existe pas encore).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS camille_approved boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN products.camille_approved IS
  'US-110 — Article personnellement testé et approuvé par Camille. Décision manuelle produit par produit ; pilote l''affichage du badge de curation. Défaut false : jamais affiché par défaut.';
