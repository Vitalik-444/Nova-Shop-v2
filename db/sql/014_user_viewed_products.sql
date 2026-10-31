-- Міграція 014: Створення таблиці переглянутих товарів користувача
CREATE TABLE IF NOT EXISTS "user_viewed_products" (
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY ("user_id", "product_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_viewed_products_user_viewed_at"
    ON "user_viewed_products" ("user_id", "viewed_at" DESC);
