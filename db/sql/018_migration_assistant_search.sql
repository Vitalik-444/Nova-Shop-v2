ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE products p
SET category = c.name
FROM categories c
WHERE p.category_id = c.id AND (p.category IS NULL OR p.category = '');

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_category_lower ON products (LOWER(category));

CREATE INDEX IF NOT EXISTS idx_products_title_desc_fts ON products USING gin (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

CREATE TABLE IF NOT EXISTS assistant_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_ip TEXT,
    query TEXT NOT NULL,
    reply TEXT,
    found_products_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assistant_logs ADD COLUMN IF NOT EXISTS found_products_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_assistant_logs_created_at ON assistant_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_assistant_logs_user_id ON assistant_logs (user_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        GRANT SELECT, INSERT, UPDATE ON assistant_logs TO app_user;
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'assistant_logs_id_seq') THEN
            GRANT USAGE, SELECT ON SEQUENCE assistant_logs_id_seq TO app_user;
        END IF;
    END IF;
END $$;
