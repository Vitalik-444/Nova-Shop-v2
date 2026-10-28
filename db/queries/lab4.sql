-- Лабораторна 4: банк запитів під сценарії з README (>= 8; JOIN, зовнішній JOIN, RETURNING, NULL-семантика, LIMIT з ORDER BY)
-- Формат (парсить checks/run.sh lab4): перед КОЖНИМ запитом рядок-заголовок,
-- строго з початку рядка:   "-- 1. Мета: <питання домену або сценарій із README>"
-- далі сам запит, завершений «;». Нумерація з 1. Файл має виконуватись цілком:
--   docker compose exec -T db psql -U postgres -d myproject -v ON_ERROR_STOP=1 < queries/lab4.sql

-- 1. Мета: які товари категорії X зараз є в наявності у продавця Y (сценарій 1)
SELECT p.title, p.price, p.stock
FROM products p
         JOIN categories c ON c.id = p.category_id
         JOIN users s ON s.id = p.seller_id
WHERE c.id = 2 AND s.id = 1 AND p.stock > 0
ORDER BY p.title;

-- 2. Мета: які замовлення покупця Z ще не доставлені (сценарій 2)
SELECT o.id, o.status, o.created_at
FROM orders o
         JOIN users u ON u.id = o.buyer_id
WHERE u.id = 2 AND o.status <> 'delivered'
ORDER BY o.created_at DESC;

-- 3. Мета: товари, які покупець додав в обране, але жодного разу не купив (сценарій 6)
SELECT p.title
FROM user_favorites uf
         JOIN products p ON p.id = uf.product_id
         LEFT JOIN order_items oi ON oi.product_id = uf.product_id
         LEFT JOIN orders o ON o.id = oi.order_id AND o.buyer_id = uf.user_id
WHERE uf.user_id = 2
  AND o.id IS NULL
ORDER BY p.title;

-- 4. Мета: покупці, які не робили замовлень за останні 3 місяці (сценарій 9)
SELECT u.full_name, u.email
FROM users u
         LEFT JOIN orders o
                   ON o.buyer_id = u.id AND o.created_at >= now() - interval '3 months'
WHERE u.role = 'buyer'
  AND o.id IS NULL
ORDER BY u.full_name;

-- 5. Мета: категорія та її батьківська категорія одним рядком (self-join)
SELECT child.name AS category, COALESCE(parent.name, '(корінь)') AS parent_category
FROM categories child
         LEFT JOIN categories parent ON parent.id = child.parent_id
ORDER BY parent_category NULLS FIRST, category;

-- 6. Мета: продавці, у яких понад N товарів мають рейтинг нижче 3 (сценарій 7)
SELECT s.full_name, COUNT(DISTINCT p.id) AS low_rated_products
FROM users s
         JOIN products p ON p.seller_id = s.id
         JOIN product_reviews r ON r.product_id = p.id AND r.rating < 3
GROUP BY s.id, s.full_name
HAVING COUNT(DISTINCT p.id) > 1
ORDER BY low_rated_products DESC;

-- 7. Мета: товари в кошику покупця X і їх сумарна вартість (сценарій 11)
SELECT p.title, uc.quantity, p.price, (uc.quantity * p.price) AS subtotal,
       SUM(uc.quantity * p.price) OVER () AS cart_total
FROM user_cart uc
         JOIN products p ON p.id = uc.product_id
WHERE uc.user_id = 3
ORDER BY p.title;

-- 8. Мета: додати новий товар продавця (DML з RETURNING)
INSERT INTO products (seller_id, category_id, title, description, price, stock)
VALUES (1, 2, 'Xiaomi Redmi Note 13', 'Смартфон, 128 ГБ', 8999.00, 12)
    RETURNING id, title, created_at;

-- 9. Мета: позначити замовлення відправленим (DML з RETURNING)
UPDATE orders
SET status = 'shipped'
WHERE id = 2 AND status = 'paid'
    RETURNING id, status;

-- 10. Мета: історія відгуків на товар (сценарій 8), сторінка з пагінацією
SELECT COALESCE(u.full_name, '(акаунт видалено)') AS author, r.rating, r.comment, r.created_at
FROM product_reviews r
         LEFT JOIN users u ON u.id = r.buyer_id
WHERE r.product_id = 1
ORDER BY r.created_at DESC
    LIMIT 5 OFFSET 0;