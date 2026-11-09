-- 016_refine_product_discounts.sql
-- 1. Оновлюємо роль офіційного магазину NovaShop до 'admin' (щоб не хардкодити імена в SQL-функціях)
-- 2. Перевизначаємо update_product_discount():
--    - перевірка базується виключно на ролі продавця (v_seller_role = 'admin')
--    - жодних хардкодних текстових імен 'NovaShop'

UPDATE users
SET role = 'admin'
WHERE full_name = 'NovaShop' AND role <> 'admin';

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
    v_seller_role text;
    v_old_discount numeric;
    v_new_discount numeric;
BEGIN
    -- 1. Валідація відсотка знижки
    IF p_discount < 0 OR p_discount > 100 THEN
        RAISE EXCEPTION 'Знижка має бути у межах від 0 до 100%%'
            USING ERRCODE = 'check_violation';
    END IF;

    v_new_discount := ROUND(p_discount, 2);

    -- 2. Перевірка наявності товару та ролі його продавця
    SELECT p.seller_id, u.role, COALESCE((p.attributes->>'discount_percentage')::numeric, 0)
    INTO v_seller_id, v_seller_role, v_old_discount
    FROM products p
    JOIN users u ON u.id = p.seller_id
    WHERE p.id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Товар #% не знайдено', p_product_id
            USING ERRCODE = 'no_data_found';
    END IF;

    -- 3. Розмежування прав за роллю (RBAC):
    -- Якщо продавець товару — адміністратор або платформа (role = 'admin'):
    IF v_seller_role = 'admin' THEN
        IF NOT p_is_admin THEN
            RAISE EXCEPTION 'Знижку на товари платформи може змінювати лише адміністратор'
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
