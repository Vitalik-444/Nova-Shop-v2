CREATE OR REPLACE VIEW order_totals AS
SELECT o.id AS order_id,
       o.buyer_id,
       u.full_name AS buyer,
       o.status,
       o.created_at,
       COUNT(*) AS items_count,
       SUM(oi.quantity * oi.price_at_purchase) AS total_amount
FROM orders o
         JOIN users u ON u.id = o.buyer_id
         JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.buyer_id, u.full_name, o.status, o.created_at;

GRANT SELECT ON order_totals TO app_user;

CREATE OR REPLACE VIEW cart_summary AS
SELECT uc.user_id,
       p.id AS product_id,
       p.title,
       p.price,
       uc.quantity,
       p.price * uc.quantity AS line_total
FROM user_cart uc
         JOIN products p ON p.id = uc.product_id;

GRANT SELECT ON cart_summary TO app_user;