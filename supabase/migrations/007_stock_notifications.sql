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

-- RLS — PLUS STRICT que le pattern `orders` (004_orders.sql), à dessein.
-- `orders` accorde une policy SELECT à `auth.role() = 'authenticated'`, en
-- partant de l'hypothèse implicite que seul l'admin porte ce rôle. C'est FAUX
-- dans ce projet : l'espace déposant (US-066) s'authentifie via
-- `supabase.auth.signInWithOtp` (magic link), donc un déposant connecté porte
-- lui aussi un JWT `authenticated`. Reprendre ce pattern ici aurait permis à
-- N'IMPORTE QUEL déposant connecté de lire tous les emails inscrits aux
-- alertes de retour en stock (PII) depuis sa session navigateur (anon key
-- publique) — fuite corrigée avant merge (revue de sécurité).
--
-- Décision : ENABLE ROW LEVEL SECURITY, AUCUNE policy. Résultat : ni anon ni
-- authenticated (admin OU déposant) n'ont le moindre accès — seul le service
-- role (qui bypass RLS) peut lire/écrire cette table. C'est strictement
-- suffisant : aucune UI (admin ou déposant) ne lit `stock_notifications`
-- aujourd'hui ; toutes les écritures (inscription publique ET marquage
-- notified_at au réapprovisionnement) passent déjà par `getAdminSupabase()`
-- côté serveur : server/api/products/[id]/notify-restock.post.ts (public) et
-- server/api/admin/products/[id].put.ts (admin, via server/utils/stockNotifications.ts).
-- Si une UI admin de lecture est ajoutée plus tard, elle devra passer par une
-- route serveur `requireAdminAuth()` + `getAdminSupabase()` (jamais une policy
-- `auth.role() = 'authenticated'` ouverte au rôle déposant).
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;
