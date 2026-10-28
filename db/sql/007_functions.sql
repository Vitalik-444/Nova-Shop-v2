CREATE OR REPLACE FUNCTION product_reviews_history(p_product_id int, p_limit int DEFAULT 10)
RETURNS TABLE (review_id int, buyer text, rating smallint, comment text, created_at timestamptz)
LANGUAGE plpgsql STABLE AS $$
BEGIN
RETURN QUERY
SELECT pr.id, u.full_name, pr.rating, pr.comment, pr.created_at
FROM product_reviews pr
         LEFT JOIN users u ON u.id = pr.buyer_id
WHERE pr.product_id = p_product_id
ORDER BY pr.created_at DESC
    LIMIT p_limit;
END $$;

GRANT EXECUTE ON FUNCTION product_reviews_history(int, int) TO app_user;

CREATE OR REPLACE FUNCTION check_and_reserve_stock(p_product_id int, p_quantity int)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
v_stock int;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'кількість має бути додатною, а не %', p_quantity
            USING ERRCODE = 'check_violation';
END IF;

SELECT stock INTO v_stock FROM products WHERE id = p_product_id;

IF NOT FOUND THEN
        RAISE EXCEPTION 'товару #% не існує', p_product_id
            USING ERRCODE = 'no_data_found';
END IF;

    IF v_stock < p_quantity THEN
        RAISE EXCEPTION 'недостатньо товару #% на складі: є %, потрібно %', p_product_id, v_stock, p_quantity
            USING ERRCODE = 'check_violation';
END IF;

RETURN v_stock - p_quantity;
END $$;

GRANT EXECUTE ON FUNCTION check_and_reserve_stock(int, int) TO app_user;