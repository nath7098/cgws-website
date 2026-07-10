-- E8 fix — Réservation par UNITÉ de stock (produits multi-exemplaires)
--
-- Le flux checkout initial était bâti sur « pièce unique » : le produit ENTIER
-- passait 'active' → 'reserved' à la création de session, puis 'sold' au
-- paiement — sans jamais regarder `products.stock`. Acheter 1 exemplaire d'un
-- produit en stock 3 le faisait disparaître du catalogue.
--
-- Nouveau modèle : le stock est décrémenté À LA RÉSERVATION (création de
-- session Stripe), restitué à l'abandon/expiration, et le statut ne change
-- que sur la dernière unité. Ces deux fonctions sont atomiques côté Postgres
-- car supabase-js ne sait pas exprimer `stock = stock - 1`.
--
-- NB : dans un UPDATE Postgres, toutes les expressions SET voient les valeurs
-- AVANT update — `stock = 1` à droite signifie « c'était le dernier exemplaire ».
-- En revanche, RETURNING voit les valeurs APRÈS update (d'où `new_stock`).

-- Réserve UNE unité d'un produit pour une commande : décrémente le stock ;
-- si c'était le dernier exemplaire, verrouille le produit (reserved + owner).
CREATE OR REPLACE FUNCTION reserve_product_unit(
  p_product_id uuid,
  p_order_id uuid,
  p_reserved_until timestamptz
) RETURNS TABLE(new_stock int)
LANGUAGE sql AS $$
  UPDATE products
  SET stock             = stock - 1,
      status            = CASE WHEN stock = 1 THEN 'reserved' ELSE status END,
      reserved_order_id = CASE WHEN stock = 1 THEN p_order_id ELSE reserved_order_id END,
      reserved_until    = CASE WHEN stock = 1 THEN p_reserved_until ELSE reserved_until END,
      updated_at        = now()
  WHERE id = p_product_id AND status = 'active' AND stock >= 1
  RETURNING stock;
$$;

-- Restitue UNE unité (abandon/expiration/échec) : ré-incrémente le stock ;
-- ne déverrouille le statut QUE si c'est cette commande qui détenait le verrou
-- (jamais une réservation manuelle admin).
CREATE OR REPLACE FUNCTION release_product_unit(
  p_product_id uuid,
  p_order_id uuid
) RETURNS void
LANGUAGE sql AS $$
  UPDATE products
  SET stock             = stock + 1,
      status            = CASE WHEN status = 'reserved' AND reserved_order_id = p_order_id THEN 'active' ELSE status END,
      reserved_until    = CASE WHEN reserved_order_id = p_order_id THEN NULL ELSE reserved_until END,
      reserved_order_id = CASE WHEN reserved_order_id = p_order_id THEN NULL ELSE reserved_order_id END,
      updated_at        = now()
  WHERE id = p_product_id;
$$;

-- Ces fonctions ne doivent être appelables QUE par le backend (service role).
-- Sans ces REVOKE, PostgREST les expose en RPC à `anon`/`authenticated` : un
-- appel direct no-operait grâce aux RLS de products, mais on ferme la porte
-- explicitement (défense en profondeur).
-- NB : à la création, Postgres accorde implicitement EXECUTE à PUBLIC — le
-- REVOKE FROM PUBLIC est donc indispensable, sinon anon/authenticated
-- conservent le droit via PUBLIC malgré le revoke nominatif.
REVOKE EXECUTE ON FUNCTION reserve_product_unit(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION release_product_unit(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reserve_product_unit(uuid, uuid, timestamptz) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION release_product_unit(uuid, uuid) FROM anon, authenticated;

