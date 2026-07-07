-- US-071 — Commandes en ligne (Stripe Checkout)
-- orders : commande guest (email + coordonnées saisis au checkout, aucun compte)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  customer_name text NOT NULL,
  phone text,
  fulfillment_method text NOT NULL CHECK (fulfillment_method IN ('shipping', 'pickup')),
  -- Adresse de livraison (jsonb {street, postalCode, city, country}) — NULL si retrait boutique
  shipping_address jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'fulfilled')),
  subtotal numeric(10,2),
  shipping_cost numeric(10,2) DEFAULT 0,
  total numeric(10,2),
  currency text DEFAULT 'eur',
  -- Idempotence webhook : une session Stripe = au plus une commande
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  client_id uuid REFERENCES clients(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- order_items : lignes de commande — title/price sont des SNAPSHOTS au moment
-- de l'achat (le produit peut être modifié/supprimé ensuite sans altérer la commande)
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  title text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Trigger updated_at (réutilise la fonction de 001_initial_schema.sql)
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS — cohérent avec 002_rls_policies.sql.
-- AUCUN accès public (ni lecture ni écriture) : les commandes contiennent des
-- données personnelles (email, adresse). Toutes les écritures passent par le
-- service role côté serveur (bypass RLS) ; l'admin authentifié peut lire.
-- ---------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_admin" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "order_items_select_admin" ON order_items FOR SELECT USING (auth.role() = 'authenticated');
