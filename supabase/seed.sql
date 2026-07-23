-- Seed categories — taxonomie reining/western (US-109), alignée sur l'enum
-- ProductCategory et la contrainte CHECK products.category.
INSERT INTO categories (name, slug, sort_order, is_active) VALUES
  ('Selles',               'selles',             1, true),
  ('Bridonnerie',          'bridonnerie',        2, true),
  ('Étriers',              'etriers',            3, true),
  ('Bandes & Protections', 'bandes-protections', 4, true),
  ('Licols & Accessoires', 'licols-accessoires', 5, true),
  ('Soins',                'soins',              6, true),
  ('Bottes & Chaussures',  'bottes-chaussures',  7, true),
  ('Vêtements',            'vetements',          8, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed products (5 demo products)
INSERT INTO products (slug, title, description, price, category, brand, condition, is_consignment, status, stock) VALUES
  (
    'selle-western-circle-y-2024',
    'Selle Western Circle Y Park & Trail',
    'Selle western trail confortable, cuir brun, arçon Quarter Horse, siège 16". Idéale pour la randonnée et les longues balades.',
    890.00, 'selles', 'Circle Y', 'excellent', false, 'active', 1
  ),
  (
    'bride-western-show-aluminium',
    'Bride Western Show en aluminium',
    'Bride de show western avec mors à port moyen. Cuir marron chocolat, ornements en aluminium gravé.',
    145.00, 'bridonnerie', 'Classic Equine', 'new', false, 'active', 2
  ),
  (
    'bottes-ariat-heritage-roper',
    'Bottes Ariat Heritage Roper',
    'Bottes de travail western Ariat Heritage Roper, cuir pleine fleur, semelle Duratread. Pointure 42.',
    195.00, 'bottes-chaussures', 'Ariat', 'good', false, 'active', 1
  ),
  (
    'selle-occasion-billy-cook',
    'Selle Occasion Billy Cook Barrel Racing',
    'Selle de barrel racing en très bon état, cuir fauve, siège 14.5". Légère et maniable.',
    650.00, 'selles', 'Billy Cook', 'excellent', true, 'active', 1
  ),
  (
    'chapeau-resistol-4x',
    'Chapeau Resistol 4X Beaver Natural',
    'Chapeau western Resistol 4X Beaver en feutre naturel. Bord 4". État excellent, très peu porté.',
    120.00, 'vetements', 'Resistol', 'excellent', false, 'active', 1
  )
ON CONFLICT (slug) DO NOTHING;
