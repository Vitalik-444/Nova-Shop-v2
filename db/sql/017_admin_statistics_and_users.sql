-- 017_admin_statistics_and_users.sql
-- 1. Створення представлень (VIEWS) для аналітики та статистики адмін-панелі:
--    - admin_stats_overview: загальні KPI (дохід, замовлення за статусами, середній чек, користувачі, залишки)
--    - admin_stats_category_sales: продажі та виручка по категоріях
-- 2. Додавання реалістичних користувачів-покупців (users) із контактними даними та містами
-- 3. Додавання реалістичних замовлень (orders) та позицій (order_items) за останні 30 днів для формування живої статистики

-- ============================================================================
-- 1. Представлення (VIEWS) для аналітики
-- ============================================================================

CREATE OR REPLACE VIEW admin_stats_overview AS
SELECT
    COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN oi.subtotal ELSE 0 END), 0)::numeric(12,2) AS total_revenue,
    COUNT(DISTINCT o.id)::int AS total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END)::int AS delivered_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.id END)::int AS shipped_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.id END)::int AS paid_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END)::int AS pending_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END)::int AS cancelled_orders,
    COALESCE(
        ROUND(
            SUM(CASE WHEN o.status <> 'cancelled' THEN oi.subtotal ELSE 0 END) /
            NULLIF(COUNT(DISTINCT CASE WHEN o.status <> 'cancelled' THEN o.id END), 0),
            2
        ),
        0
    )::numeric(10,2) AS average_order_value,
    (SELECT COUNT(*)::int FROM users) AS total_users,
    (SELECT COUNT(*)::int FROM users WHERE created_at >= now() - INTERVAL '30 days') AS new_users_30d,
    (SELECT COUNT(*)::int FROM products) AS total_products,
    (SELECT COUNT(*)::int FROM products WHERE stock <= 5) AS low_stock_count
FROM orders o
LEFT JOIN (
    SELECT order_id, SUM(quantity * price_at_purchase) AS subtotal
    FROM order_items
    GROUP BY order_id
) oi ON oi.order_id = o.id;

CREATE OR REPLACE VIEW admin_stats_category_sales AS
SELECT
    c.id AS category_id,
    c.name AS category_slug,
    COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
    COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)::numeric(12,2) AS revenue,
    COUNT(DISTINCT o.id)::int AS orders_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
GROUP BY c.id, c.name
ORDER BY revenue DESC, units_sold DESC;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        GRANT SELECT ON admin_stats_overview TO app_user;
        GRANT SELECT ON admin_stats_category_sales TO app_user;
    END IF;
END $$;

-- ============================================================================
-- 2. Додавання реалістичних користувачів-покупців (якщо ще не існують)
-- ============================================================================

INSERT INTO users (full_name, email, password_hash, role, phone, city, address, created_at, settings)
VALUES
    (
        'Олена Коваленко',
        'olena.kovalenko@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380671234567',
        'Київ',
        'вул. Хрещатик, 24, кв. 15',
        now() - INTERVAL '45 days',
        '{"currency": "UAH", "language": "uk", "notifications_order": true, "notifications_promo": true}'::jsonb
    ),
    (
        'Максим Бондаренко',
        'maks.bondarenko@ukr.net',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380509876543',
        'Львів',
        'просп. Свободи, 12',
        now() - INTERVAL '40 days',
        '{"currency": "USD", "language": "uk", "notifications_order": true, "notifications_promo": false}'::jsonb
    ),
    (
        'Ірина Шевченко',
        'irina.shevchenko@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380934567890',
        'Одеса',
        'вул. Дерибасівська, 7',
        now() - INTERVAL '35 days',
        '{"currency": "UAH", "language": "uk", "notifications_order": true, "notifications_promo": true}'::jsonb
    ),
    (
        'Андрій Мельник',
        'andriy.melnyk@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380971122334',
        'Дніпро',
        'вул. Січових Стрільців, 18',
        now() - INTERVAL '28 days',
        '{"currency": "USD", "language": "uk", "notifications_order": true, "notifications_promo": false}'::jsonb
    ),
    (
        'Софія Ткаченко',
        'sofia.tkachenko@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380635544332',
        'Харків',
        'вул. Сумська, 42',
        now() - INTERVAL '22 days',
        '{"currency": "UAH", "language": "uk", "notifications_order": true, "notifications_promo": true}'::jsonb
    ),
    (
        'Богдан Кравченко',
        'bohdan.kravchenko@ukr.net',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380687788990',
        'Житомир',
        'майдан Соборний, 3',
        now() - INTERVAL '18 days',
        '{"currency": "UAH", "language": "uk", "notifications_order": true, "notifications_promo": false}'::jsonb
    ),
    (
        'Наталія Мороз',
        'natalia.moroz@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380993322114',
        'Вінниця',
        'вул. Соборна, 55',
        now() - INTERVAL '12 days',
        '{"currency": "USD", "language": "uk", "notifications_order": true, "notifications_promo": true}'::jsonb
    ),
    (
        'Дмитро Павленко',
        'dmytro.pavlenko@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380662211445',
        'Полтава',
        'вул. Європейська, 21',
        now() - INTERVAL '7 days',
        '{"currency": "UAH", "language": "uk", "notifications_order": true, "notifications_promo": false}'::jsonb
    ),
    (
        'Юлія Савченко',
        'yulia.savchenko@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380738877665',
        'Черкаси',
        'бульв. Шевченка, 150',
        now() - INTERVAL '3 days',
        '{"currency": "UAH", "language": "uk", "notifications_order": true, "notifications_promo": true}'::jsonb
    ),
    (
        'Тарас Лисенко',
        'taras.lysenko@gmail.com',
        '$2b$10$YXbqOKiIzZsctV5YAmwZZu3kXsoSGykJ/r1QPyfUouiROjiPK2DL6',
        'buyer',
        '+380951133557',
        'Івано-Франківськ',
        'вул. Незалежності, 9',
        now() - INTERVAL '1 day',
        '{"currency": "USD", "language": "uk", "notifications_order": true, "notifications_promo": false}'::jsonb
    )
ON CONFLICT (email) DO UPDATE
SET phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    address = EXCLUDED.address;

-- ============================================================================
-- 3. Додавання реалістичних замовлень та позицій замовлень (idempotent)
-- ============================================================================

DO $$
DECLARE
    v_olena_id int;
    v_maks_id int;
    v_irina_id int;
    v_andriy_id int;
    v_sofia_id int;
    v_bohdan_id int;
    v_natalia_id int;
    v_dmytro_id int;
    v_yulia_id int;
    v_taras_id int;

    v_ord_id int;
BEGIN
    SELECT id INTO v_olena_id FROM users WHERE email = 'olena.kovalenko@gmail.com';
    SELECT id INTO v_maks_id FROM users WHERE email = 'maks.bondarenko@ukr.net';
    SELECT id INTO v_irina_id FROM users WHERE email = 'irina.shevchenko@gmail.com';
    SELECT id INTO v_andriy_id FROM users WHERE email = 'andriy.melnyk@gmail.com';
    SELECT id INTO v_sofia_id FROM users WHERE email = 'sofia.tkachenko@gmail.com';
    SELECT id INTO v_bohdan_id FROM users WHERE email = 'bohdan.kravchenko@ukr.net';
    SELECT id INTO v_natalia_id FROM users WHERE email = 'natalia.moroz@gmail.com';
    SELECT id INTO v_dmytro_id FROM users WHERE email = 'dmytro.pavlenko@gmail.com';
    SELECT id INTO v_yulia_id FROM users WHERE email = 'yulia.savchenko@gmail.com';
    SELECT id INTO v_taras_id FROM users WHERE email = 'taras.lysenko@gmail.com';

    -- Якщо замовлення вже додані, не дублюємо
    IF NOT EXISTS (SELECT 1 FROM orders WHERE buyer_id = v_olena_id) THEN

        -- Замовлення 1 (Олена Коваленко, 25 днів тому, Доставлено: парфуми та косметика)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_olena_id, 'delivered', now() - INTERVAL '25 days',
            '{"name":"Олена","surname":"Коваленко","email":"olena.kovalenko@gmail.com","phone":"+380671234567","city":"Київ","address":"вул. Хрещатик, 24","delivery":"courier","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 1, 2, 9.99),    -- Essence Mascara
            (v_ord_id, 7, 1, 129.99);  -- Chanel Coco Noir

        -- Замовлення 2 (Олена Коваленко, 10 днів тому, Доставлено: парфуми Dior)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_olena_id, 'delivered', now() - INTERVAL '10 days',
            '{"name":"Олена","surname":"Коваленко","email":"olena.kovalenko@gmail.com","phone":"+380671234567","city":"Київ","address":"вул. Хрещатик, 24","delivery":"post","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 8, 1, 89.99),   -- Dior J'adore
            (v_ord_id, 4, 2, 12.99);   -- Red Lipstick

        -- Замовлення 3 (Максим Бондаренко, 22 дні тому, Доставлено: меблі)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_maks_id, 'delivered', now() - INTERVAL '22 days',
            '{"name":"Максим","surname":"Бондаренко","email":"maks.bondarenko@ukr.net","phone":"+380509876543","city":"Львів","address":"просп. Свободи, 12","delivery":"courier","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 14, 2, 499.99); -- Knoll Executive Chair

        -- Замовлення 4 (Ірина Шевченко, 19 днів тому, Доставлено: парфуми та косметика)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_irina_id, 'delivered', now() - INTERVAL '19 days',
            '{"name":"Ірина","surname":"Шевченко","email":"irina.shevchenko@gmail.com","phone":"+380934567890","city":"Одеса","address":"вул. Дерибасівська, 7","delivery":"post","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 6, 1, 49.99),   -- CK One
            (v_ord_id, 2, 1, 19.99),   -- Eyeshadow Palette
            (v_ord_id, 3, 1, 14.99);   -- Powder Canister

        -- Замовлення 5 (Андрій Мельник, 15 днів тому, Доставлено: меблі)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_andriy_id, 'delivered', now() - INTERVAL '15 days',
            '{"name":"Андрій","surname":"Мельник","email":"andriy.melnyk@gmail.com","phone":"+380971122334","city":"Дніпро","address":"вул. Січових Стрільців, 18","delivery":"courier","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 11, 1, 1899.99), -- Annibale Colombo Bed
            (v_ord_id, 13, 2, 299.99);  -- Bedside Table African Cherry

        -- Замовлення 6 (Софія Ткаченко, 12 днів тому, Відправлено: парфуми та продукти)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_sofia_id, 'shipped', now() - INTERVAL '12 days',
            '{"name":"Софія","surname":"Ткаченко","email":"sofia.tkachenko@gmail.com","phone":"+380635544332","city":"Харків","address":"вул. Сумська, 42","delivery":"post","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 10, 1, 79.99),  -- Gucci Bloom
            (v_ord_id, 34, 3, 7.99);   -- Nescafe Coffee

        -- Замовлення 7 (Богдан Кравченко, 8 днів тому, Відправлено: продукти та косметика)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_bohdan_id, 'shipped', now() - INTERVAL '8 days',
            '{"name":"Богдан","surname":"Кравченко","email":"bohdan.kravchenko@ukr.net","phone":"+380687788990","city":"Житомир","address":"майдан Соборний, 3","delivery":"post","payment":"cash","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 17, 3, 12.99),  -- Beef Steak
            (v_ord_id, 36, 2, 19.99);  -- Protein Powder

        -- Замовлення 8 (Наталія Мороз, 5 днів тому, В обробці: меблі та дзеркало)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_natalia_id, 'paid', now() - INTERVAL '5 days',
            '{"name":"Наталія","surname":"Мороз","email":"natalia.moroz@gmail.com","phone":"+380993322114","city":"Вінниця","address":"вул. Соборна, 55","delivery":"courier","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 15, 1, 799.99), -- Wooden Bathroom Sink With Mirror
            (v_ord_id, 14, 1, 499.99); -- Knoll Executive Chair

        -- Замовлення 9 (Дмитро Павленко, 3 дні тому, В обробці: парфуми)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_dmytro_id, 'paid', now() - INTERVAL '3 days',
            '{"name":"Дмитро","surname":"Павленко","email":"dmytro.pavlenko@gmail.com","phone":"+380662211445","city":"Полтава","address":"вул. Європейська, 21","delivery":"post","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 6, 2, 49.99),   -- CK One
            (v_ord_id, 9, 1, 69.99);   -- Dolce Shine

        -- Замовлення 10 (Юлія Савченко, 1 день тому, Нове: косметика)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_yulia_id, 'pending', now() - INTERVAL '1 day',
            '{"name":"Юлія","surname":"Савченко","email":"yulia.savchenko@gmail.com","phone":"+380738877665","city":"Черкаси","address":"бульв. Шевченка, 150","delivery":"post","payment":"cash","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 2, 2, 19.99),   -- Eyeshadow Palette
            (v_ord_id, 5, 3, 8.99);    -- Red Nail Polish

        -- Замовлення 11 (Тарас Лисенко, 6 годин тому, Нове: диван)
        INSERT INTO orders (buyer_id, status, created_at, customer_data)
        VALUES (v_taras_id, 'pending', now() - INTERVAL '6 hours',
            '{"name":"Тарас","surname":"Лисенко","email":"taras.lysenko@gmail.com","phone":"+380951133557","city":"Івано-Франківськ","address":"вул. Незалежності, 9","delivery":"courier","payment":"card","language":"uk"}'::jsonb
        ) RETURNING id INTO v_ord_id;
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES
            (v_ord_id, 12, 1, 2499.99); -- Annibale Colombo Sofa

    END IF;
END $$;
