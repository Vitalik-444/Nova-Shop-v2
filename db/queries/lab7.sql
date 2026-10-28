-- Лабораторна 7: плани «до» (EXPLAIN (ANALYZE, BUFFERS) перед запитом) і запит-паспорт схеми
-- Формат (парсить checks/run.sh lab7): перед КОЖНИМ запитом рядок-заголовок,
-- строго з початку рядка:   "-- 1. Мета: <питання домену або сценарій із README>"
-- далі сам запит, завершений «;». Нумерація з 1. Файл має виконуватись цілком:
--   docker compose exec -T db psql -U postgres -d myproject -v ON_ERROR_STOP=1 < queries/lab7.sql
-- Приклад заголовка й запиту - у queries/README.md. Цей коментар можна видалити.

-- 1. Мета: позиції замовлень із масовою купівлею товару (quantity >= 5) для відділу закупівель, план «до»
EXPLAIN (ANALYZE, BUFFERS)
SELECT oi.order_id, p.title, oi.quantity, oi.price_at_purchase
FROM order_items oi
         JOIN products p ON p.id = oi.product_id
WHERE oi.quantity >= 5
ORDER BY oi.price_at_purchase DESC
    LIMIT 50;

-- 2. Мета: історія цін конкретного товару в проданих замовленнях (product_id = 137), план «до»
EXPLAIN (ANALYZE, BUFFERS)
SELECT oi.order_id, oi.quantity, oi.price_at_purchase
FROM order_items oi
WHERE oi.product_id = 706
ORDER BY oi.price_at_purchase DESC;

-- 3. Мета: той самий запит 2 без провідної колонки складеного індексу — показує, що order_items_product_price_idx без product_id не береться
EXPLAIN (ANALYZE, BUFFERS)
SELECT oi.order_id, oi.product_id, oi.price_at_purchase
FROM order_items oi
WHERE oi.price_at_purchase > 45000
ORDER BY oi.price_at_purchase DESC
    LIMIT 50;

-- 4. Мета: паспорт схеми — таблиці, колонки, обмеження й індекси одним результатом
SELECT t.relname AS tbl, a.attnum AS pos, a.attname AS col,
       format_type(a.atttypid, a.atttypmod) AS type,
       CASE WHEN a.attnotnull THEN 'NOT NULL' ELSE '' END AS req,
       coalesce((SELECT string_agg(con.contype, ',' ORDER BY con.contype)
                 FROM pg_constraint con
                 WHERE con.conrelid = t.oid AND a.attnum = ANY (con.conkey)), '') AS cons,
       coalesce((SELECT string_agg(ic.relname, ', ' ORDER BY ic.relname)
                 FROM pg_index ix JOIN pg_class ic ON ic.oid = ix.indexrelid
                 WHERE ix.indrelid = t.oid AND a.attnum = ANY (ix.indkey)), '') AS idx
FROM pg_class t
         JOIN pg_namespace ns ON ns.oid = t.relnamespace
         JOIN pg_attribute a ON a.attrelid = t.oid
WHERE ns.nspname = 'public' AND t.relkind = 'r'
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY t.relname, a.attnum;

-- 5. Мета: глибока сторінка масових позицій (сторінка 61, рядки 3001-3050) через OFFSET, план «до»
EXPLAIN (ANALYZE, BUFFERS)
SELECT oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase
FROM order_items oi
WHERE oi.quantity >= 5
ORDER BY oi.price_at_purchase DESC, oi.order_id DESC, oi.product_id DESC
    LIMIT 50 OFFSET 3000;

-- 6. Мета: службовий запит — курсор, тобто ключ останнього рядка сторінки 60 (значення потрапляють у змінні psql)
SELECT oi.price_at_purchase AS cur_p, oi.order_id AS cur_o, oi.product_id AS cur_pr
FROM order_items oi
WHERE oi.quantity >= 5
ORDER BY oi.price_at_purchase DESC, oi.order_id DESC, oi.product_id DESC
    LIMIT 1 OFFSET 2999 \gset

-- 7. Мета: та сама сторінка 61 через keyset-пагінацію (продовження після курсору), план «після»
    EXPLAIN (ANALYZE, BUFFERS)
SELECT oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase
FROM order_items oi
WHERE oi.quantity >= 5
  AND oi.price_at_purchase <= :'cur_p'
  AND (oi.price_at_purchase, oi.order_id, oi.product_id) < (:'cur_p', :'cur_o', :'cur_pr')
ORDER BY oi.price_at_purchase DESC, oi.order_id DESC, oi.product_id DESC
    LIMIT 50;