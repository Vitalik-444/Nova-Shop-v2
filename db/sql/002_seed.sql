INSERT INTO users (full_name, email, password_hash, role) VALUES
                                                              ('Олена Коваленко', 'olena.kovalenko@example.com', '$2b$10$examplehash1', 'seller'),
                                                              ('Іван Петренко', 'ivan.petrenko@example.com', '$2b$10$examplehash2', 'buyer'),
                                                              ('Марія Шевченко', 'maria.shevchenko@example.com', '$2b$10$examplehash3', 'buyer'),
                                                              ('Дмитро Бондаренко', 'dmytro.bondarenko@example.com', '$2b$10$examplehash4', 'seller'),
                                                              ('Наталія Мельник', 'natalia.melnyk@example.com', '$2b$10$examplehash5', 'moderator');


INSERT INTO categories (name, parent_id) VALUES
                                             ('Електроніка', NULL),
                                             ('Смартфони', 1),
                                             ('Одяг', NULL),
                                             ('Взуття', 3);


INSERT INTO products (seller_id, category_id, title, description, price, stock) VALUES
                                                                                    (1, 2, 'iPhone 14 Pro', 'Смартфон Apple, 128 ГБ, космічний чорний', 42999.00, 5),
                                                                                    (1, 2, 'Samsung Galaxy S23', 'Смартфон Samsung, 256 ГБ, фантомний чорний', 34999.00, 8),
                                                                                    (4, 1, 'Навушники Sony WH-1000XM5', 'Бездротові навушники з шумозаглушенням', 12999.00, 15),
                                                                                    (4, 4, 'Кросівки Nike Air Max', 'Чоловічі кросівки, розмір 42-45', 3299.00, 20),
                                                                                    (4, 3, 'Футболка Uniqlo', 'Бавовняна футболка, унісекс', 599.00, 50);


INSERT INTO orders (buyer_id, status) VALUES
                                          (2, 'delivered'),
                                          (3, 'paid'),
                                          (2, 'pending');


INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
                                                                                (1, 1, 1, 42999.00),
                                                                                (1, 3, 1, 12999.00),
                                                                                (2, 2, 1, 34999.00),
                                                                                (2, 5, 2, 599.00),
                                                                                (3, 4, 1, 3299.00);


INSERT INTO user_cart (user_id, product_id, quantity) VALUES
                                                          (3, 1, 1),
                                                          (2, 4, 1),
                                                          (3, 3, 2);


INSERT INTO user_favorites (user_id, product_id) VALUES
                                                     (2, 1),
                                                     (3, 2),
                                                     (2, 3);


INSERT INTO product_reviews (product_id, buyer_id, rating, comment) VALUES
                                                                        (1, 2, 5, 'Чудовий телефон, камера просто супер!'),
                                                                        (3, 3, 4, 'Гарний звук, але трохи тиснуть на вуха'),
                                                                        (1, 2, 2, 'Через тиждень почали глючити Face ID'),
                                                                        (2, 3, 5, 'Все супер, рекомендую'),
                                                                        (4, 2, 4, 'Зручні, але трохи тісні');