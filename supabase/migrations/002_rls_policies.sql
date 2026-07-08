-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Products: public read, admin write
CREATE POLICY "products_select_public" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_admin" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_update_admin" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "products_delete_admin" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Categories: public read, admin write
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- Consignments: only authenticated (admin) can read full list; insert is public (depositors)
CREATE POLICY "consignments_select_admin" ON consignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "consignments_insert_public" ON consignments FOR INSERT WITH CHECK (true);
CREATE POLICY "consignments_update_admin" ON consignments FOR UPDATE USING (auth.role() = 'authenticated');

-- Sales: admin only
CREATE POLICY "sales_all_admin" ON sales USING (auth.role() = 'authenticated');

-- Clients: admin only
CREATE POLICY "clients_all_admin" ON clients USING (auth.role() = 'authenticated');
