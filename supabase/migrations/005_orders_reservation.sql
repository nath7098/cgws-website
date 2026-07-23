-- E8 rework — Checkout embarqué + réservation des pièces uniques
--
-- 1) Réservation produit : quand un acheteur démarre un paiement, le produit
--    passe 'active' → 'reserved' et est verrouillé pour CETTE commande jusqu'à
--    ce que la session Stripe expire (30 min). Évite qu'une même selle (stock=1)
--    soit vendue deux fois par deux acheteurs concurrents.
--    `reserved_order_id` désambiguïse une réservation de checkout d'une mise en
--    'reserved' manuelle par l'admin (release ciblé, jamais de réactivation
--    accidentelle d'un produit réservé à la main).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reserved_until timestamptz,
  ADD COLUMN IF NOT EXISTS reserved_order_id uuid REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_reserved_order_id ON products(reserved_order_id);

-- 2) Checkout embarqué : les coordonnées (email, nom, téléphone) et l'adresse
--    de livraison sont désormais collectées PAR Stripe et rapatriées par le
--    webhook `checkout.session.completed`. À la création de la commande on ne
--    connaît donc encore ni l'email ni le mode de réception → on relâche les
--    contraintes NOT NULL, le webhook les renseigne au paiement confirmé.
ALTER TABLE orders ALTER COLUMN email DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN customer_name DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN fulfillment_method DROP NOT NULL;
