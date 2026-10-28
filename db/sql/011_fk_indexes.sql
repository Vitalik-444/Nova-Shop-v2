-- Було: Postgres не індексує FK автоматично, тому в головній базі немає індексів
-- на колонках зовнішніх ключів (є лише два з 009 під запити lab7).
-- Зламалось: EF Code-First (docs/ef_initial.sql) створив ix_* на кожному FK, а в нас
-- кожен DELETE батьківського рядка (users, products, categories, orders) робить
-- послідовне сканування дочірньої таблиці.
-- Стало: додаємо індекси на FK-колонки, які не покриті ні PK, ні наявними індексами.
-- order_items(product_id) не додаємо: його покриває order_items_product_price_idx
-- (product_id — перша колонка). user_cart(user_id), user_favorites(user_id),
-- order_items(order_id) покриті префіксом складеного PK;
-- product_reviews(product_id) — префіксом unique_review_per_buyer_product.

CREATE INDEX IF NOT EXISTS categories_parent_id_idx      ON categories (parent_id);
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx           ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS products_seller_id_idx        ON products (seller_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx      ON products (category_id);
CREATE INDEX IF NOT EXISTS product_reviews_buyer_id_idx  ON product_reviews (buyer_id);
CREATE INDEX IF NOT EXISTS user_cart_product_id_idx      ON user_cart (product_id);
CREATE INDEX IF NOT EXISTS user_favorites_product_id_idx ON user_favorites (product_id);