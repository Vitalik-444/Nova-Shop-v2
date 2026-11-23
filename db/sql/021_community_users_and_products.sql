-- 021_community_users_and_products.sql
-- Міграція: додавання нових користувачів, авторських товарів продавців, історії замовлень та відгуків.

DO $$
BEGIN
    -- 1. Користувачі (продавці та покупці)
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (71, 'Тарас Мельник', 'taras.melnyk.craft@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'seller', '+380673412589', 'Львів', 'вул. Вірменська, 19, кв. 4', '2026-11-19T10:15:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (72, 'Владислав Іваненко', 'vlad.ivanenko.tech@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'seller', '+380509124478', 'Київ', 'вул. Велика Васильківська, 84, кв. 31', '2026-11-19T11:30:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (73, 'Марина Грищенко', 'maryna.hryshchenko@ukr.net', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'seller', '+380938871234', 'Івано-Франківськ', 'вул. Незалежності, 42', '2026-11-19T14:00:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (74, 'Ольга Данилюк', 'olha.danyliuk@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'seller', '+380685523190', 'Ужгород', 'наб. Незалежності, 11, кв. 7', '2026-11-20T09:40:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (75, 'Дмитро Шевчук', 'dmytro.shevchuk@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'seller', '+380954432178', 'Дніпро', 'просп. Дмитра Яворницького, 65', '2026-11-20T12:20:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (76, 'Сергій Ткачук', 'serhii.tkachuk.eco@ukr.net', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'seller', '+380631298456', 'Чернівці', 'вул. Ольги Кобилянської, 26', '2026-11-21T10:05:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (77, 'Богдан Сидоренко', 'bohdan.sydorenko.ua@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380679081234', 'Одеса', 'вул. Дерибасівська, 16, кв. 10', '2026-11-19T12:00:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (78, 'Олена Василенко', 'olena.vasylenko@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380507812903', 'Харків', 'вул. Сумська, 54, кв. 22', '2026-11-19T15:20:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (79, 'Катерина Кравченко', 'kateryna.kravchenko.design@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380934127890', 'Київ', 'вул. Мечникова, 8, кв. 45', '2026-11-20T11:15:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (80, 'Наталія Бондар', 'nataliia.bondar@ukr.net', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380683419082', 'Вінниця', 'вул. Соборна, 43, кв. 14', '2026-11-20T16:30:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (81, 'Ірина Лисенко', 'iryna.lysenko.doc@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380956712390', 'Полтава', 'вул. Європейська, 60, кв. 8', '2026-11-21T13:45:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (82, 'Михайло Савчук', 'mykhailo.savchuk@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380678912345', 'Тернопіль', 'просп. Степана Бандери, 15', '2026-11-21T17:10:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (83, 'Ярослав Федоренко', 'yaroslav.fedorenko@ukr.net', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380501239944', 'Черкаси', 'бульв. Шевченка, 205, кв. 33', '2026-11-22T10:30:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (84, 'Світлана Кравчук', 'svitlana.kravchuk.kyiv@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380937712356', 'Київ', 'вул. Хрещатик, 24, кв. 19', '2026-11-22T14:50:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (85, 'Андрій Романенко', 'andrii.romanenko@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380689945123', 'Луцьк', 'вул. Лесі Українки, 31', '2026-11-23T09:15:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (86, 'Юлія Романчук', 'yulia.romanchuk@ukr.net', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380953321908', 'Рівне', 'вул. Чорновола, 12, кв. 5', '2026-11-23T16:20:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (87, 'Максим Козак', 'maksym.kozak@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380671198450', 'Житомир', 'вул. Київська, 77, кв. 41', '2026-11-24T11:00:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (88, 'Тетяна Мороз', 'tetiana.moroz@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380504491278', 'Львів', 'просп. Свободи, 28, кв. 14', '2026-11-24T15:40:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (89, 'Артур Дзюба', 'artur.dziuba@ukr.net', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380936654129', 'Запоріжжя', 'вул. Перемоги, 50', '2026-11-25T10:10:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;
    INSERT INTO users (id, full_name, email, password_hash, role, phone, city, address, created_at, settings)
    VALUES (90, 'Олеся Гончар', 'olesia.honchar@gmail.com', '$2b$10$QqiXKR4S3LGZv8.7znP/EueoW3.HwZQnGZ.jnqAVvDSbH6v0zleo6', 'buyer', '+380681123478', 'Київ', 'вул. Саксаганського, 112, кв. 6', '2026-11-25T14:25:00+02:00'::timestamptz, '{"currency":"UAH","language":"uk","notifications_order":true,"notifications_promo":true}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address, role = EXCLUDED.role;

    -- 2. Авторські товари продавців
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (195, 71, 20, 'Шкіряний гаманець ручної роботи "Bifold Hunter"', 'Компактний чоловічий гаманець подвійного складання з вінтажної шкіри Crazy Horse. Повністю прошитий вручну вощеною ниткою сідельним швом. 6 відділень для карток та містке відділення для купюр.', 1450, 14, '{"sku":"MLC-WLT-001","brand":"Melnyk Leather Craft","rating":4.95,"weight":120,"thumbnail":"https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"],"title_uk":"Шкіряний гаманець ручної роботи \"Bifold Hunter\"","description_uk":"Компактний чоловічий гаманець подвійного складання з вінтажної шкіри Crazy Horse. Повністю прошитий вручну вощеною ниткою сідельним швом. 6 відділень для карток та містке відділення для купюр.","warranty_information":"Довічна гарантія на шви","shipping_information":"Відправка Новою Поштою 1-2 дні","availability_status":"In Stock","return_policy":"14 днів на повернення","discount_percentage":5}'::jsonb, '2026-11-19T14:30:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (196, 71, 8, 'Ремінь із цільної італійської шкіри з латунною пряжкою', 'Ремінь виготовлений з італійської ремінної смуги рослинного дублення товщиною 4 мм. Масивна лита латунна пряжка та ручна обробка урізів натуральним воском.', 1850, 9, '{"sku":"MLC-BLT-002","brand":"Melnyk Leather Craft","rating":4.9,"weight":260,"thumbnail":"https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80"],"title_uk":"Ремінь із цільної італійської шкіри з латунною пряжкою","description_uk":"Ремінь виготовлений з італійської ремінної смуги рослинного дублення товщиною 4 мм. Масивна лита латунна пряжка та ручна обробка урізів натуральним воском.","warranty_information":"3 роки гарантії","shipping_information":"Відправка 1-2 дні","availability_status":"In Stock","return_policy":"14 днів на повернення"}'::jsonb, '2026-11-19T15:10:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (197, 72, 11, 'Кастомна механічна клавіатура Nova Pro 75% Wireless', 'Зібрана вручну механічна клавіатура у форматі 75%. Алюмінієвий корпус, змащені перемикачі Gateron Pro Yellow, подвійна шумоізоляція з Poron та преміальні PBT-кейкапи товщиною 1.5 мм. Підтримка Bluetooth 5.1, 2.4Ghz та Type-C.', 4200, 6, '{"sku":"ITS-KBD-75P","brand":"Ivanenko Tech Studio","rating":5,"weight":1150,"thumbnail":"https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"],"title_uk":"Кастомна механічна клавіатура Nova Pro 75% Wireless","description_uk":"Зібрана вручну механічна клавіатура у форматі 75%. Алюмінієвий корпус, змащені перемикачі Gateron Pro Yellow, подвійна шумоізоляція з Poron та преміальні PBT-кейкапи товщиною 1.5 мм.","warranty_information":"12 місяців гарантії","shipping_information":"Швидка доставка Нова Пошта","availability_status":"In Stock","return_policy":"14 днів на повернення"}'::jsonb, '2026-11-20T10:15:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (198, 72, 11, 'Бездротовий зарядний килимок з горіхового дерева та текстилю 15W', 'Швидка бездротова зарядка стандарту Qi у витонченому корпусі з натурального масиву американського горіха та сірого фактурного текстилю. Вбудований захист від перегріву та перепадів напруги.', 1290, 18, '{"sku":"ITS-CHG-W15","brand":"Ivanenko Tech Studio","rating":4.85,"weight":190,"thumbnail":"https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?auto=format&fit=crop&w=800&q=80"],"title_uk":"Бездротовий зарядний килимок з горіхового дерева та текстилю 15W","description_uk":"Швидка бездротова зарядка стандарту Qi у витонченому корпусі з натурального масиву американського горіха та сірого фактурного текстилю.","warranty_information":"12 місяців гарантії","shipping_information":"В наявності, відправка сьогодні","availability_status":"In Stock","return_policy":"14 днів на повернення","discount_percentage":8}'::jsonb, '2026-11-20T11:00:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (199, 73, 6, 'Торцева обробна дошка з дуба та ясеня "Monolith"', 'Професійна торцева кухонна дошка розміром 40х30х4 см. Завдяки вертикальному розташуванню деревних волокон ніж довше зберігає гостроту, а дошка не деформується. Оброблена безпечною мінеральною олією та бджолиним воском.', 2100, 8, '{"sku":"HWH-BRD-4030","brand":"Hryshchenko Wood & Home","rating":4.95,"weight":3400,"thumbnail":"https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80"],"title_uk":"Торцева обробна дошка з дуба та ясеня \"Monolith\"","description_uk":"Професійна торцева кухонна дошка розміром 40х30х4 см. Вертикальне розташування волокон оберігає ножі. Оброблена органічною олією та воском.","warranty_information":"2 роки гарантії","shipping_information":"Відправка в подарунковому пакуванні","availability_status":"In Stock","return_policy":"14 днів"}'::jsonb, '2026-11-20T15:30:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (200, 73, 5, 'Набір соєвих ароматичних свічок "Карпатський ліс та прянощі"', 'Набір з трьох свічок із 100% натурального соєвого воску з дерев’яним ґнотом, що потріскує під час горіння. Аромати: Ялиця і кедр, Тепла кориця з кардамоном, Гірська лаванда. Час горіння кожної — до 40 годин.', 780, 25, '{"sku":"HWH-CND-SET3","brand":"Hryshchenko Wood & Home","rating":4.9,"weight":750,"thumbnail":"https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"],"title_uk":"Набір соєвих ароматичних свічок \"Карпатський ліс та прянощі\"","description_uk":"Набір з трьох свічок із 100% натурального соєвого воску з дерев’яним ґнотом. Час горіння до 40 годин.","warranty_information":"Гарантія якості","shipping_information":"Надійна доставка в крафтовій коробці","availability_status":"In Stock","return_policy":"14 днів"}'::jsonb, '2026-11-20T16:00:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (201, 74, 6, 'Авторська керамічна чашка ручної роботи "Гірський туман" 380 мл', 'Унікальна гончарна чашка, виготовлена на гончарному крузі та покрита харчовою ефектарною поливою глибокого сіро-бірюзового відтінку. Підходить для гарячих напоїв, можна мити в посудомийній машині.', 540, 20, '{"sku":"DCR-CUP-380","brand":"Danyliuk Ceramics","rating":4.92,"weight":310,"thumbnail":"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"],"title_uk":"Авторська керамічна чашка ручної роботи \"Гірський туман\" 380 мл","description_uk":"Унікальна гончарна чашка ручної роботи з ефектарною поливою сіро-бірюзового відтінку.","warranty_information":"Перевірка при отриманні","shipping_information":"Подвійна пухирчаста плівка та міцна коробка","availability_status":"In Stock","return_policy":"14 днів"}'::jsonb, '2026-11-21T11:20:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (202, 75, 15, 'Туристичний термокухоль 500 мл з вакуумною ізоляцією та карабіном', 'Надійний термокухоль із харчової нержавіючої сталі 18/8 з подвійними вакуумними стінками. Тримає гаряче до 8 годин, холодне — до 16 годин. Герметична кришка-непроливайка з ергономічною ручкою-карабіном.', 890, 22, '{"sku":"SOD-MUG-500","brand":"Shevchuk Outdoor & EDC","rating":4.88,"weight":280,"thumbnail":"https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=800&q=80"],"title_uk":"Туристичний термокухоль 500 мл з вакуумною ізоляцією та карабіном","description_uk":"Надійний термокухоль із харчової нержавіючої сталі 18/8 з подвійними вакуумними стінками та кришкою-карабіном.","warranty_information":"1 рік гарантії","shipping_information":"Відправка день у день","availability_status":"In Stock","return_policy":"14 днів"}'::jsonb, '2026-11-21T14:15:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (203, 76, 4, 'Карпатський лісовий мед з волоськими горіхами 450г', 'Свіжий натуральний лісовий мед з екологічно чистої пасіки на Буковині в поєднанні з добірними карпатськими волоськими горіхами. Без цукру, консервантів та термічної обробки.', 360, 40, '{"sku":"CBH-HNY-450","brand":"Carpathian Bee & Herb","rating":4.97,"weight":650,"thumbnail":"https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80"],"title_uk":"Карпатський лісовий мед з волоськими горіхами 450г","description_uk":"Свіжий натуральний лісовий мед з екологічно чистої пасіки з добірними волоськими горіхами.","warranty_information":"100% натуральний продукт","shipping_information":"Надійне пакування в крафт-скло","availability_status":"In Stock","return_policy":"Продукт харчування"}'::jsonb, '2026-11-21T16:00:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;
    INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
    VALUES (204, 76, 4, 'Трав’яний збір "Карпатський бальзам" (м’ята, чебрець, липа, шипшина) 100г', 'Ароматний високогірний чай із дикорослих трав і ягід Карпатського регіону. Зібрано вручну влітку 2026 року. Заспокоює нервову систему, зміцнює імунітет та має неперевершений природний смак.', 180, 50, '{"sku":"CBH-TEA-100","brand":"Carpathian Bee & Herb","rating":5,"weight":110,"thumbnail":"https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80","images":["https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"],"title_uk":"Трав’яний збір \"Карпатський бальзам\" 100г","description_uk":"Ароматний високогірний чай із дикорослих трав і ягід Карпатського регіону.","warranty_information":"Сертифікований екозбір","shipping_information":"Доставка 1-2 дні","availability_status":"In Stock","return_policy":"Продукт харчування"}'::jsonb, '2026-11-21T16:30:00+02:00'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock, attributes = EXCLUDED.attributes;

    -- 3. Замовлення покупців
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (124, 77, 'delivered', '2026-11-19T13:40:00+02:00'::timestamptz, '{"name":"Богдан","surname":"Сидоренко","email":"bohdan.sydorenko.ua@gmail.com","phone":"+380679081234","city":"Одеса","address":"вул. Дерибасівська, 16, кв. 10","postcode":"65026","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (125, 78, 'delivered', '2026-11-19T17:15:00+02:00'::timestamptz, '{"name":"Олена","surname":"Василенко","email":"olena.vasylenko@gmail.com","phone":"+380507812903","city":"Харків","address":"вул. Сумська, 54, кв. 22","postcode":"61002","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (126, 79, 'delivered', '2026-11-20T13:20:00+02:00'::timestamptz, '{"name":"Катерина","surname":"Кравченко","email":"kateryna.kravchenko.design@gmail.com","phone":"+380934127890","city":"Київ","address":"вул. Мечникова, 8, кв. 45","postcode":"01021","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (127, 80, 'delivered', '2026-11-20T18:45:00+02:00'::timestamptz, '{"name":"Наталія","surname":"Бондар","email":"nataliia.bondar@ukr.net","phone":"+380683419082","city":"Вінниця","address":"вул. Соборна, 43, кв. 14","postcode":"21050","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (128, 81, 'delivered', '2026-11-21T12:30:00+02:00'::timestamptz, '{"name":"Ірина","surname":"Лисенко","email":"iryna.lysenko.doc@gmail.com","phone":"+380956712390","city":"Полтава","address":"вул. Європейська, 60, кв. 8","postcode":"36008","delivery":"post","payment":"cash","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (129, 82, 'delivered', '2026-11-21T18:10:00+02:00'::timestamptz, '{"name":"Михайло","surname":"Савчук","email":"mykhailo.savchuk@gmail.com","phone":"+380678912345","city":"Тернопіль","address":"просп. Степана Бандери, 15","postcode":"46002","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (130, 83, 'delivered', '2026-11-22T11:40:00+02:00'::timestamptz, '{"name":"Ярослав","surname":"Федоренко","email":"yaroslav.fedorenko@ukr.net","phone":"+380501239944","city":"Черкаси","address":"бульв. Шевченка, 205, кв. 33","postcode":"18001","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (131, 84, 'delivered', '2026-11-22T16:50:00+02:00'::timestamptz, '{"name":"Світлана","surname":"Кравчук","email":"svitlana.kravchuk.kyiv@gmail.com","phone":"+380937712356","city":"Київ","address":"вул. Хрещатик, 24, кв. 19","postcode":"01001","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (132, 85, 'delivered', '2026-11-23T10:15:00+02:00'::timestamptz, '{"name":"Андрій","surname":"Романенко","email":"andrii.romanenko@gmail.com","phone":"+380689945123","city":"Луцьк","address":"вул. Лесі Українки, 31","postcode":"43025","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (133, 86, 'shipped', '2026-11-23T17:35:00+02:00'::timestamptz, '{"name":"Юлія","surname":"Романчук","email":"yulia.romanchuk@ukr.net","phone":"+380953321908","city":"Рівне","address":"вул. Чорновола, 12, кв. 5","postcode":"33028","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (134, 87, 'shipped', '2026-11-24T12:10:00+02:00'::timestamptz, '{"name":"Максим","surname":"Козак","email":"maksym.kozak@gmail.com","phone":"+380671198450","city":"Житомир","address":"вул. Київська, 77, кв. 41","postcode":"10001","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (135, 88, 'shipped', '2026-11-24T16:25:00+02:00'::timestamptz, '{"name":"Тетяна","surname":"Мороз","email":"tetiana.moroz@gmail.com","phone":"+380504491278","city":"Львів","address":"просп. Свободи, 28, кв. 14","postcode":"79000","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (136, 77, 'shipped', '2026-11-24T19:00:00+02:00'::timestamptz, '{"name":"Богдан","surname":"Сидоренко","email":"bohdan.sydorenko.ua@gmail.com","phone":"+380679081234","city":"Одеса","address":"вул. Дерибасівська, 16, кв. 10","postcode":"65026","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (137, 89, 'paid', '2026-11-25T11:20:00+02:00'::timestamptz, '{"name":"Артур","surname":"Дзюба","email":"artur.dziuba@ukr.net","phone":"+380936654129","city":"Запоріжжя","address":"вул. Перемоги, 50","postcode":"69005","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (138, 90, 'shipped', '2026-11-25T15:45:00+02:00'::timestamptz, '{"name":"Олеся","surname":"Гончар","email":"olesia.honchar@gmail.com","phone":"+380681123478","city":"Київ","address":"вул. Саксаганського, 112, кв. 6","postcode":"01032","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (139, 79, 'paid', '2026-11-25T18:10:00+02:00'::timestamptz, '{"name":"Катерина","surname":"Кравченко","email":"kateryna.kravchenko.design@gmail.com","phone":"+380934127890","city":"Київ","address":"вул. Мечникова, 8, кв. 45","postcode":"01021","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (140, 80, 'paid', '2026-11-26T08:15:00+02:00'::timestamptz, '{"name":"Наталія","surname":"Бондар","email":"nataliia.bondar@ukr.net","phone":"+380683419082","city":"Вінниця","address":"вул. Соборна, 43, кв. 14","postcode":"21050","delivery":"courier","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (141, 82, 'pending', '2026-11-26T09:05:00+02:00'::timestamptz, '{"name":"Михайло","surname":"Савчук","email":"mykhailo.savchuk@gmail.com","phone":"+380678912345","city":"Тернопіль","address":"просп. Степана Бандери, 15","postcode":"46002","delivery":"post","payment":"card","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO orders (id, buyer_id, status, created_at, customer_data)
    VALUES (142, 85, 'pending', '2026-11-26T09:25:00+02:00'::timestamptz, '{"name":"Андрій","surname":"Романенко","email":"andrii.romanenko@gmail.com","phone":"+380689945123","city":"Луцьк","address":"вул. Лесі Українки, 31","postcode":"43025","delivery":"courier","payment":"cash","language":"uk"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Позиції замовлень
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (124, 195, 1, 1450)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (125, 1, 2, 9.99)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (125, 196, 1, 1850)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (126, 199, 1, 2100)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (126, 200, 1, 780)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (127, 198, 1, 1290)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (128, 201, 2, 540)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (128, 203, 1, 360)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (128, 204, 2, 180)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (129, 197, 1, 4200)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (130, 202, 1, 890)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (130, 195, 1, 1450)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (131, 200, 2, 780)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (131, 201, 1, 540)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (132, 196, 1, 1850)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (132, 203, 2, 360)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (133, 199, 1, 2100)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (133, 204, 1, 180)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (134, 197, 1, 4200)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (134, 198, 1, 1290)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (135, 195, 1, 1450)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (135, 200, 1, 780)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (136, 202, 1, 890)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (137, 202, 1, 890)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (137, 196, 1, 1850)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (138, 201, 2, 540)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (138, 203, 1, 360)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (139, 198, 1, 1290)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (140, 200, 1, 780)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (140, 204, 3, 180)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (141, 195, 1, 1450)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (141, 202, 1, 890)
    ON CONFLICT (order_id, product_id) DO NOTHING;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (142, 197, 1, 4200)
    ON CONFLICT (order_id, product_id) DO NOTHING;

    -- 5. Відгуки
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (24, 33, 1, 5, 'ГИ4ЖКМОГИ4КМ4ТЕМ', '2026-11-09T19:12:20.237273+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (25, 113, 29, 5, 'Відмінна якість матеріалів, дуже приємно користуватися.', '2026-11-09T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (26, 90, 17, 5, 'Купую вже вдруге в цьому магазині — сервіс на найвищому рівні!', '2026-11-08T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (27, 157, 35, 4, 'Якістю задоволений, єдине що доставка зайняла трохи більше часу, ніж очікував.', '2026-11-10T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (28, 54, 10, 5, 'Відмінна якість матеріалів, дуже приємно користуватися.', '2026-11-12T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (29, 163, 30, 5, 'Відмінна якість матеріалів, дуже приємно користуватися.', '2026-11-05T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (30, 188, 24, 5, 'Чудовий товар! Якість перевершила очікування, повністю відповідає опису.', '2026-10-31T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (31, 90, 40, 4, 'Якістю задоволений, єдине що доставка зайняла трохи більше часу, ніж очікував.', '2026-11-16T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (32, 190, 30, 5, 'Відмінна якість матеріалів, дуже приємно користуватися.', '2026-11-16T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (33, 33, 29, 4, 'Хороший товар за свої гроші. Все працює відмінно, рекомендую до покупки.', '2026-11-14T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (34, 115, 34, 5, 'Все супер, відповідає фотографіям та характеристикам. 5 зірок!', '2026-10-26T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (35, 51, 37, 5, 'Купую вже вдруге в цьому магазині — сервіс на найвищому рівні!', '2026-11-10T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (36, 34, 10, 5, 'Дуже задоволений покупкою. Швидка доставка і надійне пакування.', '2026-10-27T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (37, 168, 32, 5, 'Відмінна якість матеріалів, дуже приємно користуватися.', '2026-11-14T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (38, 168, 39, 4, 'Гарна річ, повністю виконує свої функції. Співвідношення ціна/якість топ.', '2026-11-11T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (39, 144, 23, 5, 'Відмінна якість матеріалів, дуже приємно користуватися.', '2026-10-31T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (40, 159, 23, 4, 'Хороший товар за свої гроші. Все працює відмінно, рекомендую до покупки.', '2026-10-25T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (41, 92, 23, 4, 'Гарна річ, повністю виконує свої функції. Співвідношення ціна/якість топ.', '2026-11-10T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (42, 183, 32, 5, 'Все супер, відповідає фотографіям та характеристикам. 5 зірок!', '2026-11-12T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (43, 80, 18, 4, 'Хороший товар за свої гроші. Все працює відмінно, рекомендую до покупки.', '2026-11-05T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (44, 145, 27, 5, 'Відмінна якість матеріалів, дуже приємно користуватися.', '2026-11-02T14:41:15.525098+00:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (23, 195, 77, 5, 'Чудовий гаманець! Шкіра Crazy Horse дуже приємна на дотик, шви рівні та міцні. Окреме спасибі майстру Тарасу за швидку відправку.', '2026-11-25T11:30:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (24, 195, 83, 5, 'Замовляв на подарунок. Якість просто бездоганна, солідний вигляд і чудово поміщається в кишеню піджака.', '2026-11-25T12:15:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (25, 196, 78, 5, 'Купувала чоловіку на річницю — він у повному захваті. Товста натуральна шкіра і справжня масивна латунна пряжка, річ на десятиліття!', '2026-11-25T13:00:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (26, 197, 82, 5, 'Клавіатура перевершила всі сподівання! Тайпінг просто як масло завдяки змащеним Gateron Yellow. Звук глибокий (thocky), ніякого дзвону стабілізаторів.', '2026-11-25T14:20:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (27, 198, 80, 5, 'Дуже стильна та компактна зарядка. Горіхове дерево виглядає в інтер’єрі неймовірно благородно, заряджає телефон швидко.', '2026-11-25T15:00:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (28, 199, 79, 5, 'Монументальна річ на кухні! Масив дуба та ясеня виглядає дуже стильно, ножі не тупляться. Рекомендую всім, хто любить готувати.', '2026-11-25T15:45:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (29, 200, 84, 5, 'Аромати просто неймовірні, особливо карпатська ялиця та кедр. Дерев’яний ґніт затишно потріскує, наче маленький камін. Замовлю ще!', '2026-11-25T16:15:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (30, 201, 81, 5, 'Надзвичайно тепла і душевна чашка. Зручно тримати в руках, а переливи поливи нагадують туман над смереками.', '2026-11-25T16:50:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (31, 203, 81, 5, 'Дуже смачний натуральний мед і багато добірних цільних горіхів. Ідеально підходить до ранкового чаю.', '2026-11-25T17:10:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, created_at)
    VALUES (32, 202, 83, 5, 'Зручний та герметичний термокухоль. Брав у Карпати — тримає окріп цілий день на морозі, карабін дуже виручає на рюкзаку.', '2026-11-25T17:40:00+02:00'::timestamptz)
    ON CONFLICT (id) DO NOTHING;

    -- 6. Кошики, обране, перегляди
    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
    VALUES (87, 198, 1, '2026-11-22T14:10:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
    VALUES (87, 204, 2, '2026-11-22T14:12:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
    VALUES (88, 195, 1, '2026-11-22T15:30:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
    VALUES (88, 201, 2, '2026-11-22T15:35:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
    VALUES (89, 197, 1, '2026-11-22T16:20:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
    VALUES (90, 199, 1, '2026-11-22T17:05:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
    VALUES (90, 200, 1, '2026-11-22T17:10:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (77, 196, '2026-11-22T11:00:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (77, 202, '2026-11-22T11:05:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (78, 200, '2026-11-22T11:40:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (79, 198, '2026-11-22T12:15:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (80, 201, '2026-11-22T12:50:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (81, 199, '2026-11-22T13:20:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (82, 198, '2026-11-22T14:00:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (83, 196, '2026-11-22T14:45:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (84, 203, '2026-11-22T15:10:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (85, 197, '2026-11-22T16:00:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_favorites (user_id, product_id, added_at)
    VALUES (86, 200, '2026-11-22T16:30:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (77, 195, '2026-11-22T10:50:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (77, 196, '2026-11-22T10:55:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (78, 1, '2026-11-22T11:20:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (78, 196, '2026-11-22T11:25:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (79, 199, '2026-11-22T12:00:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (79, 200, '2026-11-22T12:05:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (80, 198, '2026-11-22T12:40:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (81, 201, '2026-11-22T13:10:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (81, 203, '2026-11-22T13:15:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (82, 197, '2026-11-22T13:50:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (83, 202, '2026-11-22T14:30:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (84, 200, '2026-11-22T15:00:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (85, 196, '2026-11-22T15:40:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
    VALUES (86, 199, '2026-11-22T16:10:00+02:00'::timestamptz)
    ON CONFLICT (user_id, product_id) DO NOTHING;

    -- 7. Оновлення послідовностей SERIAL
    PERFORM setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT max(id) FROM users), 1), (SELECT max(id) FROM users) IS NOT NULL);
    PERFORM setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT max(id) FROM products), 1), (SELECT max(id) FROM products) IS NOT NULL);
    PERFORM setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT max(id) FROM orders), 1), (SELECT max(id) FROM orders) IS NOT NULL);
    PERFORM setval(pg_get_serial_sequence('product_reviews', 'id'), COALESCE((SELECT max(id) FROM product_reviews), 1), (SELECT max(id) FROM product_reviews) IS NOT NULL);
END $$;
