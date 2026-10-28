-- Лабораторна 5: аналітичні звіти (GROUP BY/HAVING, період, вікно, CTE, WITH RECURSIVE)
-- Формат (парсить checks/run.sh lab5): перед КОЖНИМ запитом рядок-заголовок,
-- строго з початку рядка:   "-- 1. Мета: <питання домену або сценарій із README>"
-- далі сам запит, завершений «;». Нумерація з 1. Файл має виконуватись цілком:
--   docker compose exec -T db psql -U postgres -d myproject -v ON_ERROR_STOP=1 < queries/lab5.sql

-- 1. Мета: скільки товарів продав кожен продавець за останній місяць? (сценарій 3)
SELECT u.full_name AS seller_name,
       count(oi.id) AS order_lines,
       sum(oi.quantity) AS units_sold,
       round(sum(oi.quantity * p.price)::numeric, 2) AS revenue
FROM users u
         JOIN products p ON p.seller_id = u.id
         JOIN order_items oi ON oi.product_id = p.id
         JOIN orders o ON o.id = oi.order_id
WHERE o.created_at >= date_trunc('month', now()) - interval '1 month'
  AND o.created_at < date_trunc('month', now())
GROUP BY u.id, u.full_name
ORDER BY revenue DESC;

-- 2. Мета: який середній рейтинг товарів у кожній категорії? (сценарій 5)
-- HAVING тут не можна замінити на WHERE: count(pr.id) і avg(pr.rating) --
-- це підсумки вже згорнутих груп, вони існують лише після GROUP BY,
-- а WHERE відсіює рядки таблиці product_reviews ще до згортання.
SELECT cat.name AS category_name,
       count(pr.id) AS reviews_count,
       round(avg(pr.rating)::numeric, 2) AS avg_rating
FROM categories cat
         JOIN products p ON p.category_id = cat.id
         JOIN product_reviews pr ON pr.product_id = p.id
GROUP BY cat.id, cat.name
HAVING count(pr.id) >= 5
ORDER BY avg_rating DESC;

-- 3. Мета: скільки нових продавців реєструється по місяцях цього року? (сценарій 10)
SELECT date_trunc('month', u.created_at)::date AS month,
       count(*) AS new_sellers
FROM users u
WHERE u.role = 'seller'
  AND u.created_at >= date_trunc('year', now())
GROUP BY date_trunc('month', u.created_at)
ORDER BY month;

-- 4. Мета: топ-10 найпопулярніших товарів за кількістю продажів за останній квартал (сценарій 4)
SELECT p.title,
       sum(oi.quantity) AS units_sold,
       rank() OVER (ORDER BY sum(oi.quantity) DESC) AS popularity_rank
FROM products p
         JOIN order_items oi ON oi.product_id = p.id
         JOIN orders o ON o.id = oi.order_id
WHERE o.created_at >= date_trunc('quarter', now()) - interval '3 months'
  AND o.created_at < date_trunc('quarter', now())
GROUP BY p.id, p.title
ORDER BY popularity_rank
    LIMIT 10;

-- 5. Мета: ранг товару за ціною всередині кожної категорії за допомогою PARTITION BY.
SELECT cat.name AS category_name,
       p.title AS product_title,
       p.price,
       dense_rank() OVER (PARTITION BY p.category_id ORDER BY p.price DESC) AS rank_in_category
FROM products p
         JOIN categories cat ON cat.id = p.category_id
ORDER BY cat.name, rank_in_category;

-- 6. Мета: пошук категорій з кількістю товарів вище середньої (варіант "БУЛО" - вкладений підзапит).
SELECT cat.name AS category_name,
       count(p.id) AS products_count
FROM categories cat
         JOIN products p ON p.category_id = cat.id
GROUP BY cat.id, cat.name
HAVING count(p.id) > (
    SELECT avg(prod_count)
    FROM (
             SELECT count(*) AS prod_count
             FROM products
             GROUP BY category_id
         ) sub
)
ORDER BY products_count DESC;

-- 7. Мета: пошук категорій з кількістю товарів вище середньої (варіант "СТАЛО" - нерекурсивні СТЕ).
WITH category_counts AS (
    SELECT category_id,
           count(*) AS prod_count
    FROM products
    GROUP BY category_id
),
     avg_category_count AS (
         SELECT avg(prod_count) AS avg_count
         FROM category_counts
     )
SELECT cat.name AS category_name,
       cc.prod_count AS products_count
FROM categories cat
         JOIN category_counts cc ON cc.category_id = cat.id
         CROSS JOIN avg_category_count acc
WHERE cc.prod_count > acc.avg_count
ORDER BY cc.prod_count DESC;

-- 8. Мета: дерево категорій із рівнем і шляхом від кореня та кількістю товарів у кожній (адміністратор веде каталог)
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id,
           1 AS level,
           name::text AS path
    FROM categories
    WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id,
           ct.level + 1,
           ct.path || ' / ' || c.name
    FROM categories c
             JOIN category_tree ct ON c.parent_id = ct.id
    WHERE ct.level < 10
)
SELECT ct.level,
       ct.path,
       count(p.id) AS products_count
FROM category_tree ct
         LEFT JOIN products p ON p.category_id = ct.id
GROUP BY ct.level, ct.path
ORDER BY ct.path;