-- під запит 1 з queries/lab7.sql: масові позиції (quantity >= 5), сортування
-- за price_at_purchase DESC. Предикат постійний, охоплює ~20% таблиці і
-- одразу дає потрібний порядок для ORDER BY
CREATE INDEX order_items_bulk_price_idx ON order_items (price_at_purchase DESC)
    WHERE quantity >= 5;

-- під запит 2 з queries/lab7.sql: історія цін товару за product_id.
-- product_id — рівність, тож перший у ключі; price_at_purchase — сортування,
-- тож другий. Зворотний порядок (price_at_purchase, product_id) цьому
-- запиту не допоміг би
CREATE INDEX order_items_product_price_idx ON order_items (product_id, price_at_purchase DESC);