-- Було: product_reviews не мала обмеження на унікальність пари (product_id, buyer_id),
-- тому покупець міг залишити кілька суперечливих відгуків на один товар.
-- Зламалось: seed-дані показали, що покупець id=2 залишив два відгуки на товар id=1
-- з протилежними оцінками (5 і 2) — модель це дозволила.
-- Стало: видаляємо дублікат і додаємо обмеження унікальності на (product_id, buyer_id).

DELETE FROM product_reviews
WHERE product_id = 1 AND buyer_id = 2 AND rating = 2;

ALTER TABLE product_reviews
    ADD CONSTRAINT unique_review_per_buyer_product UNIQUE (product_id, buyer_id);