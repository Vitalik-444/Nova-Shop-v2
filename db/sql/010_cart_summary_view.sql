-- Сценарій 11: перегляд вмісту кошика покупця з ціною за позицію
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
