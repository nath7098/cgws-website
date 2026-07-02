-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id),
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- consignments (created before products, referenced by products)
CREATE TABLE IF NOT EXISTS consignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depositor_name text NOT NULL,
  depositor_email text NOT NULL,
  depositor_phone text,
  item_description text NOT NULL,
  brand text,
  condition text NOT NULL CHECK (condition IN ('new', 'excellent', 'good', 'fair')),
  asking_price numeric(10,2) NOT NULL,
  agreed_price numeric(10,2),
  images text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'sold', 'returned')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  category text NOT NULL CHECK (category IN ('selles', 'brides-licols', 'bottes-chaussures', 'vetements', 'accessoires', 'protections')),
  brand text,
  size text,
  condition text NOT NULL CHECK (condition IN ('new', 'excellent', 'good', 'fair')),
  is_consignment boolean DEFAULT false,
  consignment_id uuid REFERENCES consignments(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'inactive')),
  images text[] DEFAULT '{}',
  stock int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- sales
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  client_id uuid REFERENCES clients(id),
  sale_price numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'check')),
  sale_date date NOT NULL,
  commission_amount numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Trigger: update products.updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
