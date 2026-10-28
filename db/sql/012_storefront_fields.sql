-- Інтеграція з вітриною NovaShop (React + Node.js).
-- Було: схема з 001–011 не має місця для даних, які показує вітрина і які були в MySQL-версії:
--       бренд, SKU, мініатюра й галерея, знижка, базовий рейтинг, гарантія, доставка,
--       політика повернення, а також контактні/доставочні дані замовлення (ПІБ, адреса, телефон).
-- Зламалось: без цих даних каталог і оформлення замовлення не можна перенести з MySQL.
-- Стало: за прикладом EF-міграції AddProductAttributes — одна гнучка колонка products.attributes (jsonb)
--        з GIN-індексом і orders.customer_data (jsonb). Наявні таблиці, ключі й обмеження не чіпаємо.
--
-- Ключі products.attributes (імена збігаються зі стовпцями MySQL-таблиці products):
--   brand, sku, weight, warranty_information, shipping_information, availability_status,
--   return_policy, thumbnail, images (масив URL), discount_percentage, rating (базовий рейтинг)

ALTER TABLE products
    ADD COLUMN attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS products_attributes_idx ON products USING gin (attributes);

ALTER TABLE orders
    ADD COLUMN customer_data jsonb;
