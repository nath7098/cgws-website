-- ─────────────────────────────────────────────────────────────────────────────
-- US-109 · Refonte de la taxonomie catégories (reining/western)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Objectif : remplacer l'ancienne taxonomie produit par le périmètre reining
-- défini dans docs/BRAND_DIRECTION.md § Impacts chantier n°2.
--
-- Nouvelle taxonomie (8 slugs) :
--   selles · bridonnerie · etriers · bandes-protections ·
--   licols-accessoires · soins · bottes-chaussures (conservé) · vetements (conservé)
--
-- Table de correspondance ancien → nouveau (documentée aussi dans docs/DEV_GUIDE.md
-- « Taxonomie catégories (US-109) », pour audit / rollback) :
--
--   selles            → selles              (inchangé)
--   bottes-chaussures → bottes-chaussures   (inchangé — conservé, arbitré 2026-07-23)
--   vetements         → vetements           (inchangé — conservé, arbitré 2026-07-23)
--   brides-licols     → bridonnerie         (défaut : bride = têtière + mors ; les
--                                            licols/attaches relèvent de
--                                            licols-accessoires → tri fin Camille)
--   protections       → bandes-protections
--   accessoires       → licols-accessoires  (défaut documenté ; tri fin Camille —
--                                            un chapeau relève plutôt de vetements,
--                                            un éperon reste un accessoire cavalier)
--   (nouveau)           etriers             (aucun produit legacy — catégorie neuve)
--   (nouveau)           soins               (crins, sabots — catégorie neuve)
--
-- ⚠️ Rejouable : DROP CONSTRAINT IF EXISTS + UPDATE ciblé (no-op au 2ᵉ passage) +
-- upsert ON CONFLICT. Aucune suppression de produit. Les anciennes lignes de la
-- table `categories` sont DÉSACTIVÉES (is_active=false), jamais supprimées, pour
-- ne pas casser l'historique / les comptages.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1) Lever l'ancienne contrainte CHECK : les nouveaux slugs la violeraient
--    (l'UPDATE de remappage doit passer avant l'ajout de la nouvelle contrainte).
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- 2) Remappage des produits existants via la table de correspondance.
--    Toute la table est traitée (tous statuts confondus : active, sold,
--    reserved, inactive) — un produit vendu conserve son historique de vente
--    (sales.product_id) intact, seule sa catégorie est réalignée.
UPDATE products
SET category = CASE category
  WHEN 'brides-licols' THEN 'bridonnerie'
  WHEN 'protections'   THEN 'bandes-protections'
  WHEN 'accessoires'   THEN 'licols-accessoires'
  ELSE category
END
WHERE category IN ('brides-licols', 'protections', 'accessoires');

-- 3) Nouvelle contrainte CHECK alignée sur la taxonomie cible.
ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN (
    'selles',
    'bridonnerie',
    'etriers',
    'bandes-protections',
    'licols-accessoires',
    'soins',
    'bottes-chaussures',
    'vetements'
  ));

-- 4) Upsert des catégories cibles dans la table `categories` (source d'affichage
--    de l'admin — le comptage produit y joint categories.slug = products.category,
--    donc les slugs DOIVENT correspondre à l'enum). Réactive + réordonne les
--    catégories conservées, crée les neuves.
INSERT INTO categories (name, slug, sort_order, is_active) VALUES
  ('Selles',                'selles',             1, true),
  ('Bridonnerie',           'bridonnerie',        2, true),
  ('Étriers',               'etriers',            3, true),
  ('Bandes & Protections',  'bandes-protections', 4, true),
  ('Licols & Accessoires',  'licols-accessoires', 5, true),
  ('Soins',                 'soins',              6, true),
  ('Bottes & Chaussures',   'bottes-chaussures',  7, true),
  ('Vêtements',             'vetements',          8, true)
ON CONFLICT (slug) DO UPDATE SET
  name       = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active  = true;

-- 5) Désactivation (SANS suppression) des anciennes catégories hors nouveau
--    périmètre : legacy taxonomie produit + anciens regroupements seed
--    (harnachements, vetements-accessoires). is_active=false → masquées de la
--    boutique mais conservées pour l'historique.
UPDATE categories
SET is_active = false
WHERE slug NOT IN (
  'selles',
  'bridonnerie',
  'etriers',
  'bandes-protections',
  'licols-accessoires',
  'soins',
  'bottes-chaussures',
  'vetements'
);

-- 6) Garde-fou : ZÉRO produit orphelin. Échoue la migration (rollback complet)
--    si un produit porte encore une catégorie hors taxonomie cible.
DO $$
DECLARE
  orphan_count int;
BEGIN
  SELECT count(*) INTO orphan_count
  FROM products
  WHERE category NOT IN (
    'selles', 'bridonnerie', 'etriers', 'bandes-protections',
    'licols-accessoires', 'soins', 'bottes-chaussures', 'vetements'
  );

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'US-109 remap incomplet : % produit(s) orphelin(s) hors taxonomie cible', orphan_count;
  END IF;
END $$;

COMMIT;
