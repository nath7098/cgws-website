-- =============================================================================
-- US-101 — Script de non-régression RLS « rôle admin réel »
-- =============================================================================
-- Vérifie, après la migration 008_admin_role_rls.sql, que :
--   S1. un déposant authentifié SANS claim admin ne lit aucune PII
--       (consignments, clients, sales, orders, order_items,
--       product_status_history → 0 ligne) et ne peut pas écrire dans le
--       catalogue (products/categories : INSERT rejeté 42501, UPDATE/DELETE
--       → 0 ligne affectée) ;
--   S2. un déposant qui a forgé `role: 'admin'` / `cgws_role: 'admin'` dans son
--       PROPRE user_metadata (via supabase.auth.updateUser) reste confiné à
--       l'identique — is_admin() ne lit QUE app_metadata ;
--   S3. un admin portant app_metadata.cgws_role = 'admin' garde tous ses accès
--       (lectures PII + CRUD catalogue) ;
--   S4. un visiteur anonyme lit toujours les produits actifs, et rien de plus.
--
-- EXÉCUTION (locale/manuelle — secrets CI absents, cf. issue #11) :
--   psql "$DATABASE_URL" -f supabase/tests/rls_admin.sql
--   ou copier-coller INTÉGRALEMENT dans le SQL Editor du Dashboard Supabase.
--
-- Le script est transactionnel et se termine par ROLLBACK : aucune donnée
-- n'est persistée. Résultat = la table finale : TOUTES les lignes doivent
-- avoir ok = true. Une ligne ok = false signale une régression de sécurité.
--
-- Technique : les claims JWT sont simulés via SET LOCAL ROLE +
-- SET LOCAL request.jwt.claims (mécanisme exact utilisé par PostgREST,
-- que `auth.jwt()` relit). Le seed est inséré en tant que propriétaire des
-- tables (postgres), non soumis à RLS.
-- =============================================================================

BEGIN;

-- ─── Collecte des résultats ──────────────────────────────────────────────────
CREATE TEMP TABLE rls_results (
  seq      int GENERATED ALWAYS AS IDENTITY,
  scenario text NOT NULL,
  test     text NOT NULL,
  ok       boolean NOT NULL,
  detail   text
) ON COMMIT DROP;
-- Les scénarios s'exécutent sous les rôles anon/authenticated : ils doivent
-- pouvoir enregistrer leurs résultats.
GRANT ALL ON rls_results TO anon, authenticated;

CREATE FUNCTION pg_temp.record(p_scenario text, p_test text, p_ok boolean, p_detail text)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO rls_results (scenario, test, ok, detail)
  VALUES (p_scenario, p_test, p_ok, p_detail);
$$;

-- ─── Seed (rôle postgres, propriétaire → bypass RLS) ─────────────────────────
INSERT INTO consignments (id, depositor_name, depositor_email, depositor_phone, item_description, condition, asking_price)
VALUES ('00000000-0000-4000-8000-00000000a001', 'Autre Déposant', 'autre.deposant@example.com', '0600000000', 'Selle test RLS — PII à protéger', 'good', 900);

INSERT INTO clients (id, name, email)
VALUES ('00000000-0000-4000-8000-00000000a002', 'Client test RLS', 'client.rls@example.com');

INSERT INTO products (id, slug, title, description, price, category, condition, status)
VALUES ('00000000-0000-4000-8000-00000000a003', 'produit-test-rls-us101', 'Produit test RLS', 'seed US-101', 100, 'selles', 'good', 'active');

INSERT INTO categories (id, name, slug)
VALUES ('00000000-0000-4000-8000-00000000a004', 'Catégorie test RLS', 'categorie-test-rls-us101');

INSERT INTO sales (id, product_id, sale_price, payment_method, sale_date)
VALUES ('00000000-0000-4000-8000-00000000a005', '00000000-0000-4000-8000-00000000a003', 100, 'cash', now()::date);

INSERT INTO orders (id, email, customer_name, fulfillment_method, status)
VALUES ('00000000-0000-4000-8000-00000000a006', 'commande.rls@example.com', 'Acheteur test RLS', 'pickup', 'paid');

INSERT INTO order_items (id, order_id, product_id, title, price)
VALUES ('00000000-0000-4000-8000-00000000a007', '00000000-0000-4000-8000-00000000a006', '00000000-0000-4000-8000-00000000a003', 'Produit test RLS', 100);

INSERT INTO product_status_history (product_id, old_status, new_status)
VALUES ('00000000-0000-4000-8000-00000000a003', 'active', 'reserved');

-- ─── Assertions communes aux profils NON admin (déposant, forgeur, anon) ─────
CREATE FUNCTION pg_temp.assert_non_admin_locked(p_scenario text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  n int;
BEGIN
  -- Non-régression site public : les produits actifs restent lisibles
  SELECT count(*) INTO n FROM products WHERE status = 'active';
  PERFORM pg_temp.record(p_scenario, 'SELECT products actifs → visibles (public)', n >= 1, n || ' ligne(s)');

  -- PII : zéro ligne partout
  SELECT count(*) INTO n FROM consignments;
  PERFORM pg_temp.record(p_scenario, 'SELECT consignments → 0 ligne', n = 0, n || ' ligne(s) visibles');

  SELECT count(*) INTO n FROM clients;
  PERFORM pg_temp.record(p_scenario, 'SELECT clients → 0 ligne', n = 0, n || ' ligne(s) visibles');

  SELECT count(*) INTO n FROM sales;
  PERFORM pg_temp.record(p_scenario, 'SELECT sales → 0 ligne', n = 0, n || ' ligne(s) visibles');

  SELECT count(*) INTO n FROM orders;
  PERFORM pg_temp.record(p_scenario, 'SELECT orders → 0 ligne', n = 0, n || ' ligne(s) visibles');

  SELECT count(*) INTO n FROM order_items;
  PERFORM pg_temp.record(p_scenario, 'SELECT order_items → 0 ligne', n = 0, n || ' ligne(s) visibles');

  SELECT count(*) INTO n FROM product_status_history;
  PERFORM pg_temp.record(p_scenario, 'SELECT product_status_history → 0 ligne', n = 0, n || ' ligne(s) visibles');

  -- Écritures catalogue : INSERT rejeté par RLS (42501)
  BEGIN
    INSERT INTO products (slug, title, price, category, condition)
    VALUES ('rls-fail-' || md5(p_scenario), 'Intrusion', 1, 'selles', 'good');
    PERFORM pg_temp.record(p_scenario, 'INSERT products → rejeté', false, 'INSERT ACCEPTÉ — faille');
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.record(p_scenario, 'INSERT products → rejeté', true, 'violation RLS (42501)');
  END;

  BEGIN
    INSERT INTO categories (name, slug)
    VALUES ('Intrusion', 'rls-fail-cat-' || md5(p_scenario));
    PERFORM pg_temp.record(p_scenario, 'INSERT categories → rejeté', false, 'INSERT ACCEPTÉ — faille');
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.record(p_scenario, 'INSERT categories → rejeté', true, 'violation RLS (42501)');
  END;

  -- UPDATE/DELETE : la policy USING filtre → 0 ligne affectée (comportement RLS)
  UPDATE products SET price = 999999 WHERE id = '00000000-0000-4000-8000-00000000a003';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.record(p_scenario, 'UPDATE products → 0 ligne affectée', n = 0, n || ' ligne(s) affectées');

  DELETE FROM products WHERE id = '00000000-0000-4000-8000-00000000a003';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.record(p_scenario, 'DELETE products → 0 ligne affectée', n = 0, n || ' ligne(s) affectées');

  UPDATE categories SET name = 'Intrusion' WHERE id = '00000000-0000-4000-8000-00000000a004';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.record(p_scenario, 'UPDATE categories → 0 ligne affectée', n = 0, n || ' ligne(s) affectées');

  DELETE FROM categories WHERE id = '00000000-0000-4000-8000-00000000a004';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.record(p_scenario, 'DELETE categories → 0 ligne affectée', n = 0, n || ' ligne(s) affectées');

  -- UPDATE consignments (ex. s'auto-« accepter ») : 0 ligne
  UPDATE consignments SET status = 'accepted' WHERE id = '00000000-0000-4000-8000-00000000a001';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.record(p_scenario, 'UPDATE consignments → 0 ligne affectée', n = 0, n || ' ligne(s) affectées');

  -- Non-régression : le dépôt public (INSERT consignments) reste possible —
  -- policy consignments_insert_public volontairement conservée.
  BEGIN
    INSERT INTO consignments (depositor_name, depositor_email, item_description, condition, asking_price)
    VALUES ('Dépôt public', 'depot-' || md5(p_scenario) || '@example.com', 'dépôt via formulaire public', 'good', 1);
    PERFORM pg_temp.record(p_scenario, 'INSERT consignments (dépôt public) → conservé', true, 'insert public OK');
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.record(p_scenario, 'INSERT consignments (dépôt public) → conservé', false, 'insert public CASSÉ');
  END;
END;
$fn$;

-- ─── Assertions du profil admin (app_metadata.cgws_role = 'admin') ───────────
CREATE FUNCTION pg_temp.assert_admin_full_access(p_scenario text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  n int;
  new_product uuid;
  new_category uuid;
BEGIN
  SELECT count(*) INTO n FROM consignments;
  PERFORM pg_temp.record(p_scenario, 'SELECT consignments → visibles', n >= 1, n || ' ligne(s)');

  SELECT count(*) INTO n FROM clients;
  PERFORM pg_temp.record(p_scenario, 'SELECT clients → visibles', n >= 1, n || ' ligne(s)');

  SELECT count(*) INTO n FROM sales;
  PERFORM pg_temp.record(p_scenario, 'SELECT sales → visibles', n >= 1, n || ' ligne(s)');

  SELECT count(*) INTO n FROM orders;
  PERFORM pg_temp.record(p_scenario, 'SELECT orders → visibles', n >= 1, n || ' ligne(s)');

  SELECT count(*) INTO n FROM order_items;
  PERFORM pg_temp.record(p_scenario, 'SELECT order_items → visibles', n >= 1, n || ' ligne(s)');

  SELECT count(*) INTO n FROM product_status_history;
  PERFORM pg_temp.record(p_scenario, 'SELECT product_status_history → visibles', n >= 1, n || ' ligne(s)');

  -- CRUD catalogue complet
  BEGIN
    INSERT INTO products (slug, title, price, category, condition)
    VALUES ('produit-admin-rls-us101', 'Produit créé par admin', 50, 'selles', 'new')
    RETURNING id INTO new_product;
    PERFORM pg_temp.record(p_scenario, 'INSERT products → accepté', true, 'id ' || new_product);
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.record(p_scenario, 'INSERT products → accepté', false, 'REJETÉ — backoffice verrouillé');
  END;

  UPDATE products SET price = 120 WHERE id = '00000000-0000-4000-8000-00000000a003';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.record(p_scenario, 'UPDATE products → 1 ligne affectée', n = 1, n || ' ligne(s) affectées');

  IF new_product IS NOT NULL THEN
    DELETE FROM products WHERE id = new_product;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.record(p_scenario, 'DELETE products → 1 ligne affectée', n = 1, n || ' ligne(s) affectées');
  END IF;

  BEGIN
    INSERT INTO categories (name, slug)
    VALUES ('Catégorie admin RLS', 'categorie-admin-rls-us101')
    RETURNING id INTO new_category;
    PERFORM pg_temp.record(p_scenario, 'INSERT categories → accepté', true, 'id ' || new_category);
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.record(p_scenario, 'INSERT categories → accepté', false, 'REJETÉ — backoffice verrouillé');
  END;

  IF new_category IS NOT NULL THEN
    DELETE FROM categories WHERE id = new_category;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.record(p_scenario, 'DELETE categories → 1 ligne affectée', n = 1, n || ' ligne(s) affectées');
  END IF;

  UPDATE consignments SET notes = 'vue par admin (test RLS)' WHERE id = '00000000-0000-4000-8000-00000000a001';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.record(p_scenario, 'UPDATE consignments → 1 ligne affectée', n = 1, n || ' ligne(s) affectées');
END;
$fn$;

-- ═══ S1 · Déposant authentifié SANS claim admin (magic link US-066) ══════════
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"deposant@example.com","app_metadata":{"provider":"email","providers":["email"]},"user_metadata":{}}';
SELECT pg_temp.assert_non_admin_locked('S1 déposant sans claim');
RESET ROLE;

-- ═══ S2 · Déposant avec user_metadata FORGÉ via auth.updateUser ══════════════
-- role/cgws_role = 'admin' dans user_metadata : doit rester sans effet,
-- is_admin() ne lit QUE app_metadata.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"deposant@example.com","app_metadata":{"provider":"email","providers":["email"]},"user_metadata":{"role":"admin","cgws_role":"admin"}}';
SELECT pg_temp.assert_non_admin_locked('S2 user_metadata forgé');
RESET ROLE;

-- ═══ S3 · Admin réel : app_metadata.cgws_role = 'admin' ══════════════════════
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"camille.guignon37@gmail.com","app_metadata":{"provider":"email","providers":["email"],"cgws_role":"admin"},"user_metadata":{}}';
SELECT pg_temp.assert_admin_full_access('S3 admin app_metadata');
RESET ROLE;

-- ═══ S4 · Visiteur anonyme (clé anon, pas de session) ════════════════════════
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claims = '{"role":"anon"}';
SELECT pg_temp.assert_non_admin_locked('S4 visiteur anonyme');
RESET ROLE;

-- ─── Bilan ───────────────────────────────────────────────────────────────────
DO $$
DECLARE bad int;
BEGIN
  SELECT count(*) INTO bad FROM rls_results WHERE NOT ok;
  IF bad > 0 THEN
    RAISE WARNING 'US-101 RLS : % test(s) en ÉCHEC — régression de sécurité, voir la table de résultats', bad;
  ELSE
    RAISE NOTICE 'US-101 RLS : tous les tests passent';
  END IF;
END $$;

SELECT scenario, test, ok, detail
FROM rls_results
ORDER BY seq;

ROLLBACK;
