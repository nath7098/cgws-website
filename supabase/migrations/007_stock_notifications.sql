-- US-097 — Rupture de stock : alerte email retour en stock
-- Table d'inscription "M'avertir du retour en stock" — un couple (product_id,
-- email) unique garantit l'idempotence de l'inscription publique (scénario
-- Gherkin US-097 : une 2e soumission ne crée pas de doublon).
CREATE TABLE IF NOT EXISTS stock_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (product_id, email)
);

CREATE INDEX IF NOT EXISTS idx_stock_notifications_product_id ON stock_notifications(product_id);
-- Index partiel pour la requête "inscriptions non encore notifiées pour ce
-- produit" exécutée à chaque réapprovisionnement admin (WHERE notified_at IS NULL).
CREATE INDEX IF NOT EXISTS idx_stock_notifications_pending ON stock_notifications(product_id) WHERE notified_at IS NULL;

-- RLS — aligné sur le pattern `orders` (004_orders.sql) : AUCUN accès public
-- (ni lecture ni écriture), les emails inscrits ne doivent pas être lisibles
-- via l'anon key. Toutes les écritures (inscription publique ET marquage
-- notified_at au réapprovisionnement) passent par le service role côté serveur
-- (bypass RLS) : server/api/products/[id]/notify-restock.post.ts (public) et
-- server/api/admin/products/[id].put.ts (admin). Seul l'admin authentifié peut
-- lire la table (pas de policy INSERT/UPDATE — RLS bloque tout accès direct
-- via anon/authenticated hors service role, cohérent avec `orders`).
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_notifications_select_admin" ON stock_notifications FOR SELECT USING (auth.role() = 'authenticated');
