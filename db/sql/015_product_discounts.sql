-- 015_product_discounts.sql
-- Управління знижками на рівні БД:
-- 1. Валідація відсотка знижки (0-100%)
-- 2. Таблиця аудиту змін знижок (хто, коли і як змінив)
-- 3. Функція update_product_discount() із розмежуванням прав:
--    - Товари NovaShop може змінювати лише адміністратор (p_is_admin = true)
--    - Товари сторонніх продавців може змінювати власник (p_user_id = seller_id) або адміністратор

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS chk_products_discount_percentage;

ALTER TABLE products
    ADD CONSTRAINT chk_products_discount_percentage
    CHECK (
        (attributes->'discount_percentage') IS NULL 
        OR (
            jsonb_typeof(attributes->'discount_percentage') = 'number'
            AND (attributes->>'discount_percentage')::numeric >= 0
            AND (attributes->>'discount_percentage')::numeric <= 100
        )
    );

CREATE TABLE IF NOT EXISTS product_discounts_audit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_discount numeric(5,2),
    new_discount numeric(5,2) NOT NULL,
    changed_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON product_discounts_audit TO app_user;

CREATE OR REPLACE FUNCTION update_product_discount(
    p_product_id int,
    p_discount numeric,
    p_user_id int,
    p_is_admin boolean DEFAULT false
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    v_seller_id int;
    v_seller_name text;
    v_old_discount numeric;
    v_new_discount numeric;
BEGIN
    -- 1. Валідація відсотка знижки
    IF p_discount < 0 OR p_discount > 100 THEN
        RAISE EXCEPTION 'Знижка має бути у межах від 0 до 100%%'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Округлюємо до 2 знаків
    v_new_discount := ROUND(p_discount, 2);

    -- 2. Перевірка наявності товару та визначення продавця
    SELECT p.seller_id, u.full_name, COALESCE((p.attributes->>'discount_percentage')::numeric, 0)
    INTO v_seller_id, v_seller_name, v_old_discount
    FROM products p
    JOIN users u ON u.id = p.seller_id
    WHERE p.id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Товар #% не знайдено', p_product_id
            USING ERRCODE = 'no_data_found';
    END IF;

    -- 3. Перевірка прав доступу:
    -- Якщо товар належить NovaShop: тільки адміністратор
    IF v_seller_name = 'NovaShop' THEN
        IF NOT p_is_admin THEN
            RAISE EXCEPTION 'Знижку на товари NovaShop може змінювати лише адміністратор'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
    ELSE
        -- Якщо товар стороннього продавця: сам продавець або адміністратор
        IF NOT p_is_admin AND p_user_id <> v_seller_id THEN
            RAISE EXCEPTION 'Ви можете змінювати знижку лише на власні товари'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;

    -- 4. Оновлення товару
    UPDATE products
    SET attributes = jsonb_set(
        attributes,
        '{discount_percentage}',
        to_jsonb(v_new_discount)
    )
    WHERE id = p_product_id;

    -- 5. Запис в аудит
    INSERT INTO product_discounts_audit (product_id, old_discount, new_discount, changed_by_user_id)
    VALUES (p_product_id, v_old_discount, v_new_discount, p_user_id);

    RETURN v_new_discount;
END;
$$;

GRANT EXECUTE ON FUNCTION update_product_discount(int, numeric, int, boolean) TO app_user;
