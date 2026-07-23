-- US-101 — RLS admin réel : rôle admin vérifié dans les policies
--
-- PROBLÈME CORRIGÉ : 002_rls_policies.sql et 004_orders.sql utilisaient
-- `auth.role() = 'authenticated'` comme critère « admin ». Or depuis l'espace
-- déposant (US-066), tout déposant connecté via magic link porte une session
-- `authenticated` : avec la clé anon publique + son propre JWT, il pouvait
-- interroger PostgREST directement et lire les PII de TOUS les déposants /
-- clients / commandes, ou écrire dans le catalogue. La faille était documentée
-- en commentaire dans 007_stock_notifications.sql (lignes 20-39) — cette
-- migration généralise l'approche à toutes les tables.
--
-- ⚠️ ORDRE DE DÉPLOIEMENT CRITIQUE : le backoffice interroge Supabase
-- directement avec le JWT admin (app/pages/admin/dashboard.vue,
-- app/components/admin/ProductForm.vue). Le claim admin DOIT être attribué aux
-- comptes de Camille et Nathan AVANT d'appliquer cette migration en production,
-- sinon le backoffice se verrouille. Procédure : docs/DEV_GUIDE.md
-- § « Sécurité — Rôle admin & RLS ». Le claim n'entre dans le JWT qu'à la
-- prochaine émission de token (reconnexion ou refresh).

-- ---------------------------------------------------------------------------
-- Fonction helper is_admin()
--
-- Lit UNIQUEMENT `app_metadata` du JWT (modifiable par le service role seul).
-- JAMAIS `user_metadata` : un utilisateur peut l'écrire lui-même via
-- `supabase.auth.updateUser()` — s'y fier recréerait la faille sous une autre
-- forme (élévation de privilège self-service).
--
-- STABLE : le JWT ne change pas au cours d'une requête — permet à Postgres de
-- ne l'évaluer qu'une fois par statement (initPlan) au lieu d'une fois par ligne.
-- search_path vidé + références qualifiées : immunise contre le shadowing.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'cgws_role', '') = 'admin'
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'US-101 — true si le JWT courant porte app_metadata.cgws_role = ''admin''. Ne lit JAMAIS user_metadata (modifiable côté client).';

-- ---------------------------------------------------------------------------
-- products : lecture publique conservée, écritures réservées à l'admin réel
-- ---------------------------------------------------------------------------
DROP POLICY "products_insert_admin" ON products;
DROP POLICY "products_update_admin" ON products;
DROP POLICY "products_delete_admin" ON products;

CREATE POLICY "products_insert_admin" ON products
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "products_update_admin" ON products
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_delete_admin" ON products
  FOR DELETE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories : lecture publique conservée, écritures admin réel
-- ---------------------------------------------------------------------------
DROP POLICY "categories_insert_admin" ON categories;
DROP POLICY "categories_update_admin" ON categories;
DROP POLICY "categories_delete_admin" ON categories;

CREATE POLICY "categories_insert_admin" ON categories
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "categories_update_admin" ON categories
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories_delete_admin" ON categories
  FOR DELETE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- consignments : PII des déposants — SELECT/UPDATE admin réel uniquement.
-- `consignments_insert_public` (WITH CHECK true) est volontairement conservée :
-- c'est le formulaire public de dépôt. Un déposant connecté ne voit plus AUCUNE
-- ligne ici — son espace passe par server/api/depositor/* (service role filtré
-- par l'email du JWT, barrières US-066 inchangées).
-- ---------------------------------------------------------------------------
DROP POLICY "consignments_select_admin" ON consignments;
DROP POLICY "consignments_update_admin" ON consignments;

CREATE POLICY "consignments_select_admin" ON consignments
  FOR SELECT USING (public.is_admin());
CREATE POLICY "consignments_update_admin" ON consignments
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- sales / clients : admin réel uniquement (toutes opérations)
-- ---------------------------------------------------------------------------
DROP POLICY "sales_all_admin" ON sales;
CREATE POLICY "sales_all_admin" ON sales
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY "clients_all_admin" ON clients;
CREATE POLICY "clients_all_admin" ON clients
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders / order_items : PII acheteurs — SELECT admin réel uniquement.
-- Toutes les écritures passent déjà par le service role côté serveur
-- (checkout / webhook Stripe), aucune policy d'écriture n'est nécessaire.
-- ---------------------------------------------------------------------------
DROP POLICY "orders_select_admin" ON orders;
CREATE POLICY "orders_select_admin" ON orders
  FOR SELECT USING (public.is_admin());

DROP POLICY "order_items_select_admin" ON order_items;
CREATE POLICY "order_items_select_admin" ON order_items
  FOR SELECT USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- product_status_history — durcissement ADJACENT découvert pendant US-101.
-- 003_product_status_history.sql n'avait JAMAIS activé RLS : avec les grants
-- PostgREST par défaut, n'importe quel porteur de la clé anon pouvait lire ET
-- écrire cette table. Toutes les lectures/écritures applicatives passent par le
-- service role (server/api/admin/**, server/utils/fulfillment.ts) — activer RLS
-- avec une seule policy SELECT admin ne casse donc rien et ferme le trou.
-- ---------------------------------------------------------------------------
ALTER TABLE product_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psh_select_admin" ON product_status_history
  FOR SELECT USING (public.is_admin());
