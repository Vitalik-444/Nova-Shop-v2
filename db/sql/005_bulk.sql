INSERT INTO users (full_name, email, password_hash, role, created_at)
SELECT
    'Користувач ' || s,
    'user' || s || '@example.com',
    '$2b$10$genhash' || s,
    CASE
        WHEN random() < 0.70 THEN 'buyer'
        WHEN random() < 0.95 THEN 'seller'
        ELSE 'moderator'
        END,
    now() - (random() * 730) * interval '1 day'
FROM generate_series(1, 200) AS s;

WITH sellers AS (SELECT array_agg(id) AS ids FROM users WHERE role = 'seller'),
     cats    AS (SELECT array_agg(id) AS ids FROM categories)
INSERT INTO products (seller_id, category_id, title, description, price, stock, created_at)
SELECT
    sellers.ids[1 + floor(random() * cardinality(sellers.ids))::int],
    cats.ids[1 + floor(random() * cardinality(cats.ids))::int],
    'Товар #' || s,
    CASE WHEN random() < 0.10 THEN NULL ELSE 'Опис товару #' || s END,
    round((random() * 49000 + 100)::numeric, 2),
    floor(random() * 100)::int,
    now() - (random() * 400) * interval '1 day'
FROM generate_series(1, 800) AS s, sellers, cats;

WITH buyers AS (SELECT array_agg(id) AS ids FROM users WHERE role = 'buyer')
INSERT INTO orders (buyer_id, status, created_at)
SELECT
    CASE WHEN random() < 0.05 THEN NULL
         ELSE buyers.ids[1 + floor(random() * cardinality(buyers.ids))::int]
        END,
    CASE
        WHEN random() < 0.15 THEN 'pending'
        WHEN random() < 0.35 THEN 'paid'
        WHEN random() < 0.55 THEN 'shipped'
        WHEN random() < 0.90 THEN 'delivered'
        ELSE 'cancelled'
        END,
    now() - (random() * 365) * interval '1 day'
FROM generate_series(1, 5000) AS s, buyers;

WITH ord  AS (SELECT array_agg(id) AS ids FROM orders),
     prod AS (SELECT array_agg(id) AS ids FROM products)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT
    ord.ids[1 + floor(random() * cardinality(ord.ids))::int],
    prod.ids[1 + floor(random() * cardinality(prod.ids))::int],
    1 + floor(random() * 5)::int,
    round((random() * 49000 + 100)::numeric, 2)
FROM generate_series(1, 15000), ord, prod
    ON CONFLICT (order_id, product_id) DO NOTHING;

WITH usr  AS (SELECT array_agg(id) AS ids FROM users WHERE role = 'buyer'),
     prod AS (SELECT array_agg(id) AS ids FROM products)
INSERT INTO user_cart (user_id, product_id, quantity)
SELECT
    usr.ids[1 + floor(random() * cardinality(usr.ids))::int],
    prod.ids[1 + floor(random() * cardinality(prod.ids))::int],
    1 + floor(random() * 3)::int
FROM generate_series(1, 400), usr, prod
    ON CONFLICT (user_id, product_id) DO NOTHING;

WITH usr  AS (SELECT array_agg(id) AS ids FROM users WHERE role = 'buyer'),
     prod AS (SELECT array_agg(id) AS ids FROM products)
INSERT INTO user_favorites (user_id, product_id)
SELECT
    usr.ids[1 + floor(random() * cardinality(usr.ids))::int],
    prod.ids[1 + floor(random() * cardinality(prod.ids))::int]
FROM generate_series(1, 400), usr, prod
    ON CONFLICT (user_id, product_id) DO NOTHING;

WITH buyers AS (SELECT array_agg(id) AS ids FROM users WHERE role = 'buyer'),
     prod   AS (SELECT array_agg(id) AS ids FROM products)
INSERT INTO product_reviews (product_id, buyer_id, rating, comment, created_at)
SELECT
    prod.ids[1 + floor(random() * cardinality(prod.ids))::int],
    CASE WHEN random() < 0.05 THEN NULL
         ELSE buyers.ids[1 + floor(random() * cardinality(buyers.ids))::int]
        END,
    1 + floor(random() * 5)::int,
    CASE WHEN random() < 0.40 THEN NULL ELSE 'Відгук #' || s END,
    now() - (random() * 300) * interval '1 day'
FROM generate_series(1, 2200) AS s, buyers, prod
ON CONFLICT (product_id, buyer_id) DO NOTHING;