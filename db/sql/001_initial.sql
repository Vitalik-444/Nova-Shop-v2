CREATE TABLE IF NOT EXISTS "users" (
                                       "id" SERIAL,
                                       "full_name" TEXT NOT NULL,
                                       "email" TEXT NOT NULL UNIQUE,
                                       "password_hash" TEXT NOT NULL,
                                       "role" TEXT NOT NULL,
                                       "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY("id")
    );

CREATE TABLE IF NOT EXISTS "categories" (
                                            "id" SERIAL,
                                            "name" TEXT NOT NULL,
                                            "parent_id" INTEGER,
                                            PRIMARY KEY("id")
    );

CREATE TABLE IF NOT EXISTS "products" (
                                          "id" SERIAL,
                                          "seller_id" INTEGER NOT NULL,
                                          "category_id" INTEGER NOT NULL,
                                          "title" TEXT NOT NULL,
                                          "description" TEXT,
                                          "price" NUMERIC(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY("id")
    );

CREATE TABLE IF NOT EXISTS "orders" (
                                        "id" SERIAL,
                                        "buyer_id" INTEGER NOT NULL,
                                        "status" TEXT NOT NULL DEFAULT 'pending',
                                        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY("id")
    );

CREATE TABLE IF NOT EXISTS "order_items" (
                                             "order_id" INTEGER NOT NULL,
                                             "product_id" INTEGER NOT NULL,
                                             "quantity" INTEGER NOT NULL,
                                             "price_at_purchase" NUMERIC(10,2) NOT NULL,
    PRIMARY KEY("order_id", "product_id")
    );

CREATE TABLE IF NOT EXISTS "user_cart" (
                                           "user_id" INTEGER NOT NULL,
                                           "product_id" INTEGER NOT NULL,
                                           "quantity" INTEGER NOT NULL DEFAULT 1,
                                           "added_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY("user_id", "product_id")
    );

CREATE TABLE IF NOT EXISTS "user_favorites" (
                                                "user_id" INTEGER NOT NULL,
                                                "product_id" INTEGER NOT NULL,
                                                "added_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY("user_id", "product_id")
    );

CREATE TABLE IF NOT EXISTS "product_reviews" (
                                                 "id" SERIAL,
                                                 "product_id" INTEGER NOT NULL,
                                                 "buyer_id" INTEGER NOT NULL,
                                                 "rating" SMALLINT NOT NULL CHECK("rating" BETWEEN 1 AND 5),
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY("id")
    );

ALTER TABLE "categories"
    ADD FOREIGN KEY("parent_id") REFERENCES "categories"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "products"
    ADD FOREIGN KEY("seller_id") REFERENCES "users"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "products"
    ADD FOREIGN KEY("category_id") REFERENCES "categories"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "orders"
    ADD FOREIGN KEY("buyer_id") REFERENCES "users"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "order_items"
    ADD FOREIGN KEY("order_id") REFERENCES "orders"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "order_items"
    ADD FOREIGN KEY("product_id") REFERENCES "products"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "user_cart"
    ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "user_cart"
    ADD FOREIGN KEY("product_id") REFERENCES "products"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "user_favorites"
    ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "user_favorites"
    ADD FOREIGN KEY("product_id") REFERENCES "products"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "product_reviews"
    ADD FOREIGN KEY("product_id") REFERENCES "products"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "product_reviews"
    ADD FOREIGN KEY("buyer_id") REFERENCES "users"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION;