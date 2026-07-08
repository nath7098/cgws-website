CREATE TABLE IF NOT EXISTS product_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_status  text,
  new_status  text NOT NULL,
  changed_at  timestamptz DEFAULT now(),
  changed_by  text DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_psh_product_id ON product_status_history(product_id);
CREATE INDEX IF NOT EXISTS idx_psh_changed_at ON product_status_history(changed_at DESC);
