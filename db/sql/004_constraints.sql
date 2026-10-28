ALTER TABLE orders ALTER COLUMN buyer_id DROP NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN buyer_id DROP NOT NULL;

ALTER TABLE categories
DROP CONSTRAINT categories_parent_id_fkey,
    ADD CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
        REFERENCES categories (id) ON DELETE RESTRICT;

ALTER TABLE products
DROP CONSTRAINT products_seller_id_fkey,
    ADD CONSTRAINT fk_products_seller FOREIGN KEY (seller_id)
        REFERENCES users (id) ON DELETE RESTRICT;

ALTER TABLE products
DROP CONSTRAINT products_category_id_fkey,
    ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT;

ALTER TABLE orders
DROP CONSTRAINT orders_buyer_id_fkey,
    ADD CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id)
        REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE order_items
DROP CONSTRAINT order_items_order_id_fkey,
    ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE;

ALTER TABLE order_items
DROP CONSTRAINT order_items_product_id_fkey,
    ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE RESTRICT;

ALTER TABLE user_cart
DROP CONSTRAINT user_cart_user_id_fkey,
    ADD CONSTRAINT fk_user_cart_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE user_cart
DROP CONSTRAINT user_cart_product_id_fkey,
    ADD CONSTRAINT fk_user_cart_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE;

ALTER TABLE user_favorites
DROP CONSTRAINT user_favorites_user_id_fkey,
    ADD CONSTRAINT fk_user_favorites_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE user_favorites
DROP CONSTRAINT user_favorites_product_id_fkey,
    ADD CONSTRAINT fk_user_favorites_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE;

ALTER TABLE product_reviews
DROP CONSTRAINT product_reviews_product_id_fkey,
    ADD CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE;

ALTER TABLE product_reviews
DROP CONSTRAINT product_reviews_buyer_id_fkey,
    ADD CONSTRAINT fk_product_reviews_buyer FOREIGN KEY (buyer_id)
        REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE products
    ADD CONSTRAINT chk_products_price_positive CHECK (price > 0),
    ADD CONSTRAINT chk_products_stock_nonnegative CHECK (stock >= 0);

ALTER TABLE order_items
    ADD CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0),
    ADD CONSTRAINT chk_order_items_price_positive CHECK (price_at_purchase > 0);

ALTER TABLE user_cart
    ADD CONSTRAINT chk_user_cart_quantity_positive CHECK (quantity > 0);

ALTER TABLE orders
    ADD CONSTRAINT chk_orders_status_allowed
        CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE users
    ADD CONSTRAINT chk_users_role_allowed
        CHECK (role IN ('buyer', 'seller', 'moderator', 'admin'));