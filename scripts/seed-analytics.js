const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_MIGRATOR_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/myproject';

async function seedAnalytics() {
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to PostgreSQL database');

    try {
        await client.query('BEGIN');

        // 1. Password hash for 'password123'
        const passwordHash = await bcrypt.hash('password123', 10);

        // 2. Add realistic Ukrainian test users
        const testUsers = [
          {
                    "name": "Тарас Мельник",
                    "email": "taras.melnyk.craft@gmail.com",
                    "phone": "+380673412589",
                    "city": "Львів",
                    "address": "вул. Вірменська, 19, кв. 4",
                    "role": "seller",
                    "daysAgo": 7
          },
          {
                    "name": "Владислав Іваненко",
                    "email": "vlad.ivanenko.tech@gmail.com",
                    "phone": "+380509124478",
                    "city": "Київ",
                    "address": "вул. Велика Васильківська, 84, кв. 31",
                    "role": "seller",
                    "daysAgo": 7
          },
          {
                    "name": "Марина Грищенко",
                    "email": "maryna.hryshchenko@ukr.net",
                    "phone": "+380938871234",
                    "city": "Івано-Франківськ",
                    "address": "вул. Незалежності, 42",
                    "role": "seller",
                    "daysAgo": 7
          },
          {
                    "name": "Ольга Данилюк",
                    "email": "olha.danyliuk@gmail.com",
                    "phone": "+380685523190",
                    "city": "Ужгород",
                    "address": "наб. Незалежності, 11, кв. 7",
                    "role": "seller",
                    "daysAgo": 6
          },
          {
                    "name": "Дмитро Шевчук",
                    "email": "dmytro.shevchuk@gmail.com",
                    "phone": "+380954432178",
                    "city": "Дніпро",
                    "address": "просп. Дмитра Яворницького, 65",
                    "role": "seller",
                    "daysAgo": 6
          },
          {
                    "name": "Сергій Ткачук",
                    "email": "serhii.tkachuk.eco@ukr.net",
                    "phone": "+380631298456",
                    "city": "Чернівці",
                    "address": "вул. Ольги Кобилянської, 26",
                    "role": "seller",
                    "daysAgo": 5
          },
          {
                    "name": "Богдан Сидоренко",
                    "email": "bohdan.sydorenko.ua@gmail.com",
                    "phone": "+380679081234",
                    "city": "Одеса",
                    "address": "вул. Дерибасівська, 16, кв. 10",
                    "role": "buyer",
                    "daysAgo": 7
          },
          {
                    "name": "Олена Василенко",
                    "email": "olena.vasylenko@gmail.com",
                    "phone": "+380507812903",
                    "city": "Харків",
                    "address": "вул. Сумська, 54, кв. 22",
                    "role": "buyer",
                    "daysAgo": 7
          },
          {
                    "name": "Катерина Кравченко",
                    "email": "kateryna.kravchenko.design@gmail.com",
                    "phone": "+380934127890",
                    "city": "Київ",
                    "address": "вул. Мечникова, 8, кв. 45",
                    "role": "buyer",
                    "daysAgo": 6
          },
          {
                    "name": "Наталія Бондар",
                    "email": "nataliia.bondar@ukr.net",
                    "phone": "+380683419082",
                    "city": "Вінниця",
                    "address": "вул. Соборна, 43, кв. 14",
                    "role": "buyer",
                    "daysAgo": 6
          },
          {
                    "name": "Ірина Лисенко",
                    "email": "iryna.lysenko.doc@gmail.com",
                    "phone": "+380956712390",
                    "city": "Полтава",
                    "address": "вул. Європейська, 60, кв. 8",
                    "role": "buyer",
                    "daysAgo": 5
          },
          {
                    "name": "Михайло Савчук",
                    "email": "mykhailo.savchuk@gmail.com",
                    "phone": "+380678912345",
                    "city": "Тернопіль",
                    "address": "просп. Степана Бандери, 15",
                    "role": "buyer",
                    "daysAgo": 5
          },
          {
                    "name": "Ярослав Федоренко",
                    "email": "yaroslav.fedorenko@ukr.net",
                    "phone": "+380501239944",
                    "city": "Черкаси",
                    "address": "бульв. Шевченка, 205, кв. 33",
                    "role": "buyer",
                    "daysAgo": 4
          },
          {
                    "name": "Світлана Кравчук",
                    "email": "svitlana.kravchuk.kyiv@gmail.com",
                    "phone": "+380937712356",
                    "city": "Київ",
                    "address": "вул. Хрещатик, 24, кв. 19",
                    "role": "buyer",
                    "daysAgo": 4
          },
          {
                    "name": "Андрій Романенко",
                    "email": "andrii.romanenko@gmail.com",
                    "phone": "+380689945123",
                    "city": "Луцьк",
                    "address": "вул. Лесі Українки, 31",
                    "role": "buyer",
                    "daysAgo": 3
          },
          {
                    "name": "Юлія Романчук",
                    "email": "yulia.romanchuk@ukr.net",
                    "phone": "+380953321908",
                    "city": "Рівне",
                    "address": "вул. Чорновола, 12, кв. 5",
                    "role": "buyer",
                    "daysAgo": 3
          },
          {
                    "name": "Максим Козак",
                    "email": "maksym.kozak@gmail.com",
                    "phone": "+380671198450",
                    "city": "Житомир",
                    "address": "вул. Київська, 77, кв. 41",
                    "role": "buyer",
                    "daysAgo": 2
          },
          {
                    "name": "Тетяна Мороз",
                    "email": "tetiana.moroz@gmail.com",
                    "phone": "+380504491278",
                    "city": "Львів",
                    "address": "просп. Свободи, 28, кв. 14",
                    "role": "buyer",
                    "daysAgo": 2
          },
          {
                    "name": "Артур Дзюба",
                    "email": "artur.dziuba@ukr.net",
                    "phone": "+380936654129",
                    "city": "Запоріжжя",
                    "address": "вул. Перемоги, 50",
                    "role": "buyer",
                    "daysAgo": 1
          },
          {
                    "name": "Олеся Гончар",
                    "email": "olesia.honchar@gmail.com",
                    "phone": "+380681123478",
                    "city": "Київ",
                    "address": "вул. Саксаганського, 112, кв. 6",
                    "role": "buyer",
                    "daysAgo": 1
          }
];

        console.log('Inserting/updating test users...');
        for (const u of testUsers) {
            await client.query(`
                INSERT INTO users (full_name, email, password_hash, role, phone, city, address, created_at, settings)
                VALUES ($1, $2, $3, COALESCE($4, 'buyer'), $5, $6, $7, now() - ($8 || ' days')::interval, $9)
                ON CONFLICT (email) DO UPDATE
                SET full_name = EXCLUDED.full_name,
                    role = EXCLUDED.role,
                    phone = EXCLUDED.phone,
                    city = EXCLUDED.city,
                    address = EXCLUDED.address,
                    password_hash = EXCLUDED.password_hash
            `, [
                u.name,
                u.email,
                passwordHash,
                u.role || 'buyer',
                u.phone,
                u.city,
                u.address,
                u.daysAgo,
                JSON.stringify({ currency: 'UAH', language: 'uk', notifications_order: true, notifications_promo: true })
            ]);
        }

// 2b. Add authentic user-created seller products
        console.log('Inserting user seller products...');
        const userProducts = [
          {
                    "id": 195,
                    "seller_id": 71,
                    "category_id": 20,
                    "category": "womens-bags",
                    "title": "Шкіряний гаманець ручної роботи \"Bifold Hunter\"",
                    "price": 1450,
                    "stock": 14,
                    "created_at": "2026-11-19T14:30:00+02:00",
                    "description": "Компактний чоловічий гаманець подвійного складання з вінтажної шкіри Crazy Horse. Повністю прошитий вручну вощеною ниткою сідельним швом. 6 відділень для карток та містке відділення для купюр.",
                    "attributes": {
                              "sku": "MLC-WLT-001",
                              "brand": "Melnyk Leather Craft",
                              "rating": 4.95,
                              "weight": 120,
                              "thumbnail": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Шкіряний гаманець ручної роботи \"Bifold Hunter\"",
                              "description_uk": "Компактний чоловічий гаманець подвійного складання з вінтажної шкіри Crazy Horse. Повністю прошитий вручну вощеною ниткою сідельним швом. 6 відділень для карток та містке відділення для купюр.",
                              "warranty_information": "Довічна гарантія на шви",
                              "shipping_information": "Відправка Новою Поштою 1-2 дні",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів на повернення",
                              "discount_percentage": 5
                    }
          },
          {
                    "id": 196,
                    "seller_id": 71,
                    "category_id": 8,
                    "category": "mens-shirts",
                    "title": "Ремінь із цільної італійської шкіри з латунною пряжкою",
                    "price": 1850,
                    "stock": 9,
                    "created_at": "2026-11-19T15:10:00+02:00",
                    "description": "Ремінь виготовлений з італійської ремінної смуги рослинного дублення товщиною 4 мм. Масивна лита латунна пряжка та ручна обробка урізів натуральним воском.",
                    "attributes": {
                              "sku": "MLC-BLT-002",
                              "brand": "Melnyk Leather Craft",
                              "rating": 4.9,
                              "weight": 260,
                              "thumbnail": "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Ремінь із цільної італійської шкіри з латунною пряжкою",
                              "description_uk": "Ремінь виготовлений з італійської ремінної смуги рослинного дублення товщиною 4 мм. Масивна лита латунна пряжка та ручна обробка урізів натуральним воском.",
                              "warranty_information": "3 роки гарантії",
                              "shipping_information": "Відправка 1-2 дні",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів на повернення"
                    }
          },
          {
                    "id": 197,
                    "seller_id": 72,
                    "category_id": 11,
                    "category": "mobile-accessories",
                    "title": "Кастомна механічна клавіатура Nova Pro 75% Wireless",
                    "price": 4200,
                    "stock": 6,
                    "created_at": "2026-11-20T10:15:00+02:00",
                    "description": "Зібрана вручну механічна клавіатура у форматі 75%. Алюмінієвий корпус, змащені перемикачі Gateron Pro Yellow, подвійна шумоізоляція з Poron та преміальні PBT-кейкапи товщиною 1.5 мм. Підтримка Bluetooth 5.1, 2.4Ghz та Type-C.",
                    "attributes": {
                              "sku": "ITS-KBD-75P",
                              "brand": "Ivanenko Tech Studio",
                              "rating": 5,
                              "weight": 1150,
                              "thumbnail": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Кастомна механічна клавіатура Nova Pro 75% Wireless",
                              "description_uk": "Зібрана вручну механічна клавіатура у форматі 75%. Алюмінієвий корпус, змащені перемикачі Gateron Pro Yellow, подвійна шумоізоляція з Poron та преміальні PBT-кейкапи товщиною 1.5 мм.",
                              "warranty_information": "12 місяців гарантії",
                              "shipping_information": "Швидка доставка Нова Пошта",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів на повернення"
                    }
          },
          {
                    "id": 198,
                    "seller_id": 72,
                    "category_id": 11,
                    "category": "mobile-accessories",
                    "title": "Бездротовий зарядний килимок з горіхового дерева та текстилю 15W",
                    "price": 1290,
                    "stock": 18,
                    "created_at": "2026-11-20T11:00:00+02:00",
                    "description": "Швидка бездротова зарядка стандарту Qi у витонченому корпусі з натурального масиву американського горіха та сірого фактурного текстилю. Вбудований захист від перегріву та перепадів напруги.",
                    "attributes": {
                              "sku": "ITS-CHG-W15",
                              "brand": "Ivanenko Tech Studio",
                              "rating": 4.85,
                              "weight": 190,
                              "thumbnail": "https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Бездротовий зарядний килимок з горіхового дерева та текстилю 15W",
                              "description_uk": "Швидка бездротова зарядка стандарту Qi у витонченому корпусі з натурального масиву американського горіха та сірого фактурного текстилю.",
                              "warranty_information": "12 місяців гарантії",
                              "shipping_information": "В наявності, відправка сьогодні",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів на повернення",
                              "discount_percentage": 8
                    }
          },
          {
                    "id": 199,
                    "seller_id": 73,
                    "category_id": 6,
                    "category": "kitchen-accessories",
                    "title": "Торцева обробна дошка з дуба та ясеня \"Monolith\"",
                    "price": 2100,
                    "stock": 8,
                    "created_at": "2026-11-20T15:30:00+02:00",
                    "description": "Професійна торцева кухонна дошка розміром 40х30х4 см. Завдяки вертикальному розташуванню деревних волокон ніж довше зберігає гостроту, а дошка не деформується. Оброблена безпечною мінеральною олією та бджолиним воском.",
                    "attributes": {
                              "sku": "HWH-BRD-4030",
                              "brand": "Hryshchenko Wood & Home",
                              "rating": 4.95,
                              "weight": 3400,
                              "thumbnail": "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Торцева обробна дошка з дуба та ясеня \"Monolith\"",
                              "description_uk": "Професійна торцева кухонна дошка розміром 40х30х4 см. Вертикальне розташування волокон оберігає ножі. Оброблена органічною олією та воском.",
                              "warranty_information": "2 роки гарантії",
                              "shipping_information": "Відправка в подарунковому пакуванні",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів"
                    }
          },
          {
                    "id": 200,
                    "seller_id": 73,
                    "category_id": 5,
                    "category": "home-decoration",
                    "title": "Набір соєвих ароматичних свічок \"Карпатський ліс та прянощі\"",
                    "price": 780,
                    "stock": 25,
                    "created_at": "2026-11-20T16:00:00+02:00",
                    "description": "Набір з трьох свічок із 100% натурального соєвого воску з дерев’яним ґнотом, що потріскує під час горіння. Аромати: Ялиця і кедр, Тепла кориця з кардамоном, Гірська лаванда. Час горіння кожної — до 40 годин.",
                    "attributes": {
                              "sku": "HWH-CND-SET3",
                              "brand": "Hryshchenko Wood & Home",
                              "rating": 4.9,
                              "weight": 750,
                              "thumbnail": "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Набір соєвих ароматичних свічок \"Карпатський ліс та прянощі\"",
                              "description_uk": "Набір з трьох свічок із 100% натурального соєвого воску з дерев’яним ґнотом. Час горіння до 40 годин.",
                              "warranty_information": "Гарантія якості",
                              "shipping_information": "Надійна доставка в крафтовій коробці",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів"
                    }
          },
          {
                    "id": 201,
                    "seller_id": 74,
                    "category_id": 6,
                    "category": "kitchen-accessories",
                    "title": "Авторська керамічна чашка ручної роботи \"Гірський туман\" 380 мл",
                    "price": 540,
                    "stock": 20,
                    "created_at": "2026-11-21T11:20:00+02:00",
                    "description": "Унікальна гончарна чашка, виготовлена на гончарному крузі та покрита харчовою ефектарною поливою глибокого сіро-бірюзового відтінку. Підходить для гарячих напоїв, можна мити в посудомийній машині.",
                    "attributes": {
                              "sku": "DCR-CUP-380",
                              "brand": "Danyliuk Ceramics",
                              "rating": 4.92,
                              "weight": 310,
                              "thumbnail": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Авторська керамічна чашка ручної роботи \"Гірський туман\" 380 мл",
                              "description_uk": "Унікальна гончарна чашка ручної роботи з ефектарною поливою сіро-бірюзового відтінку.",
                              "warranty_information": "Перевірка при отриманні",
                              "shipping_information": "Подвійна пухирчаста плівка та міцна коробка",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів"
                    }
          },
          {
                    "id": 202,
                    "seller_id": 75,
                    "category_id": 15,
                    "category": "sports-accessories",
                    "title": "Туристичний термокухоль 500 мл з вакуумною ізоляцією та карабіном",
                    "price": 890,
                    "stock": 22,
                    "created_at": "2026-11-21T14:15:00+02:00",
                    "description": "Надійний термокухоль із харчової нержавіючої сталі 18/8 з подвійними вакуумними стінками. Тримає гаряче до 8 годин, холодне — до 16 годин. Герметична кришка-непроливайка з ергономічною ручкою-карабіном.",
                    "attributes": {
                              "sku": "SOD-MUG-500",
                              "brand": "Shevchuk Outdoor & EDC",
                              "rating": 4.88,
                              "weight": 280,
                              "thumbnail": "https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Туристичний термокухоль 500 мл з вакуумною ізоляцією та карабіном",
                              "description_uk": "Надійний термокухоль із харчової нержавіючої сталі 18/8 з подвійними вакуумними стінками та кришкою-карабіном.",
                              "warranty_information": "1 рік гарантії",
                              "shipping_information": "Відправка день у день",
                              "availability_status": "In Stock",
                              "return_policy": "14 днів"
                    }
          },
          {
                    "id": 203,
                    "seller_id": 76,
                    "category_id": 4,
                    "category": "groceries",
                    "title": "Карпатський лісовий мед з волоськими горіхами 450г",
                    "price": 360,
                    "stock": 40,
                    "created_at": "2026-11-21T16:00:00+02:00",
                    "description": "Свіжий натуральний лісовий мед з екологічно чистої пасіки на Буковині в поєднанні з добірними карпатськими волоськими горіхами. Без цукру, консервантів та термічної обробки.",
                    "attributes": {
                              "sku": "CBH-HNY-450",
                              "brand": "Carpathian Bee & Herb",
                              "rating": 4.97,
                              "weight": 650,
                              "thumbnail": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Карпатський лісовий мед з волоськими горіхами 450г",
                              "description_uk": "Свіжий натуральний лісовий мед з екологічно чистої пасіки з добірними волоськими горіхами.",
                              "warranty_information": "100% натуральний продукт",
                              "shipping_information": "Надійне пакування в крафт-скло",
                              "availability_status": "In Stock",
                              "return_policy": "Продукт харчування"
                    }
          },
          {
                    "id": 204,
                    "seller_id": 76,
                    "category_id": 4,
                    "category": "groceries",
                    "title": "Трав’яний збір \"Карпатський бальзам\" (м’ята, чебрець, липа, шипшина) 100г",
                    "price": 180,
                    "stock": 50,
                    "created_at": "2026-11-21T16:30:00+02:00",
                    "description": "Ароматний високогірний чай із дикорослих трав і ягід Карпатського регіону. Зібрано вручну влітку 2026 року. Заспокоює нервову систему, зміцнює імунітет та має неперевершений природний смак.",
                    "attributes": {
                              "sku": "CBH-TEA-100",
                              "brand": "Carpathian Bee & Herb",
                              "rating": 5,
                              "weight": 110,
                              "thumbnail": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
                              "images": [
                                        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
                              ],
                              "title_uk": "Трав’яний збір \"Карпатський бальзам\" 100г",
                              "description_uk": "Ароматний високогірний чай із дикорослих трав і ягід Карпатського регіону.",
                              "warranty_information": "Сертифікований екозбір",
                              "shipping_information": "Доставка 1-2 дні",
                              "availability_status": "In Stock",
                              "return_policy": "Продукт харчування"
                    }
          }
];
        for (const p of userProducts) {
            await client.query(`
                INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE
                SET seller_id = EXCLUDED.seller_id,
                    category_id = EXCLUDED.category_id,
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    stock = EXCLUDED.stock,
                    attributes = EXCLUDED.attributes
            `, [p.id, p.seller_id, p.category_id, p.title, p.description, p.price, p.stock, JSON.stringify(p.attributes), p.created_at]);
        }

        // Fetch all buyer users from DB
        const { rows: allBuyers } = await client.query(`
            SELECT id, full_name, email, phone, city, address
            FROM users
            WHERE role = 'buyer'
            ORDER BY id ASC
        `);
        console.log(`Found ${allBuyers.length} buyers in total.`);

        // Fetch products by categories
        const { rows: products } = await client.query(`
            SELECT p.id, p.title, p.price, p.stock, c.name as category
            FROM products p
            JOIN categories c ON c.id = p.category_id
            WHERE p.stock > 0
            ORDER BY p.id ASC
        `);
        console.log(`Found ${products.length} products with available stock.`);

        const prodByCategory = {};
        for (const p of products) {
            if (!prodByCategory[p.category]) prodByCategory[p.category] = [];
            prodByCategory[p.category].push(p);
        }

        // Clean up any previously seeded test orders from these new users to avoid runaway duplicate seeding
        const buyerIds = allBuyers.map(b => b.id);
        const { rows: existingOrders } = await client.query(`
            SELECT count(*)::int as count FROM orders WHERE buyer_id = ANY($1::int[])
        `, [buyerIds]);
        console.log(`Existing orders for buyers: ${existingOrders[0].count}`);

        // Helper to pick random element from array
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const pickDistinct = (arr, count) => {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };

        // We will generate a rich set of 50 realistic orders covering each of the last 30 days
        const ordersToInsert = [];
        
        // Target distribution: 
        // ~1-3 orders every day for days 0..29
        // Status depending on day:
        // day 0 (today) -> 'pending'
        // day 1 -> 'pending' or 'paid'
        // day 2-3 -> 'paid'
        // day 4-7 -> 'shipped' (with 1 'cancelled')
        // day 8-29 -> 'delivered' (with 1-2 'cancelled')

        for (let day = 29; day >= 0; day--) {
            // Number of orders on this day: 1 or 2 (and 3 on weekends or peaks)
            const countForDay = (day % 4 === 0 || day % 7 === 0) ? 2 : (day === 1 || day === 0 || day === 5 || day === 12 ? 2 : 1);
            
            for (let i = 0; i < countForDay; i++) {
                const hour = 9 + Math.floor(Math.random() * 12);
                const minute = Math.floor(Math.random() * 60);

                let status = 'delivered';
                if (day === 0) {
                    status = 'pending';
                } else if (day === 1) {
                    status = i === 0 ? 'pending' : 'paid';
                } else if (day <= 3) {
                    status = 'paid';
                } else if (day <= 7) {
                    status = (day === 6 && i === 1) ? 'cancelled' : 'shipped';
                } else {
                    status = (day === 21 && i === 0) ? 'cancelled' : 'delivered';
                }

                const buyer = pick(allBuyers);
                const [name, surname] = (buyer.full_name || 'Іван Петренко').split(' ');

                // Pick 1 to 3 distinct products across diverse categories
                const catKeys = Object.keys(prodByCategory);
                const selectedCats = pickDistinct(catKeys, 1 + Math.floor(Math.random() * 2));
                const items = [];

                for (const cat of selectedCats) {
                    const catProds = prodByCategory[cat];
                    if (catProds && catProds.length) {
                        const prod = pick(catProds);
                        // Avoid duplicates in the same order
                        if (!items.some(it => it.id === prod.id)) {
                            items.push({
                                id: prod.id,
                                title: prod.title,
                                price: parseFloat(prod.price),
                                quantity: Math.min(prod.stock, Math.random() > 0.7 ? 2 : 1)
                            });
                        }
                    }
                }

                if (!items.length) {
                    const fallbackProd = pick(products);
                    items.push({
                        id: fallbackProd.id,
                        title: fallbackProd.title,
                        price: parseFloat(fallbackProd.price),
                        quantity: 1
                    });
                }

                const deliveryMethods = ['courier', 'post', 'pickup'];
                const paymentMethods = ['card', 'cash'];

                const customerData = {
                    name: name || 'Покупець',
                    surname: surname || '',
                    email: buyer.email,
                    phone: buyer.phone || '+380501234567',
                    city: buyer.city || 'Київ',
                    address: buyer.address || 'вул. Хрещатик, 1',
                    postcode: '01001',
                    delivery: pick(deliveryMethods),
                    payment: pick(paymentMethods),
                    language: 'uk'
                };

                ordersToInsert.push({
                    buyerId: buyer.id,
                    status,
                    daysAgo: day,
                    hour,
                    minute,
                    customerData,
                    items
                });
            }
        }

        console.log(`Prepared ${ordersToInsert.length} realistic orders to insert.`);

        // Insert orders and order_items
        let insertedOrdersCount = 0;
        let insertedItemsCount = 0;

        for (const ord of ordersToInsert) {
            const { rows: ordRows } = await client.query(`
                INSERT INTO orders (buyer_id, status, created_at, customer_data)
                VALUES ($1, $2, now() - ($3 || ' days')::interval + ($4 || ' hours')::interval + ($5 || ' minutes')::interval, $6)
                RETURNING id
            `, [
                ord.buyerId,
                ord.status,
                ord.daysAgo,
                ord.hour,
                ord.minute,
                JSON.stringify(ord.customerData)
            ]);

            const orderId = ord.ordRows ? ord.ordRows[0].id : ordRows[0].id;
            insertedOrdersCount++;

            for (const item of ord.items) {
                await client.query(`
                    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (order_id, product_id) DO UPDATE
                    SET quantity = EXCLUDED.quantity,
                        price_at_purchase = EXCLUDED.price_at_purchase
                `, [orderId, item.id, item.quantity, item.price]);
                insertedItemsCount++;
            }
        }

        console.log(`Successfully inserted ${insertedOrdersCount} orders and ${insertedItemsCount} order items.`);

        // 3. Add realistic Product Reviews
        console.log('Adding product reviews from buyers...');
        const reviewTemplates = [
            { rating: 5, comment: 'Чудовий товар! Якість перевершила очікування, повністю відповідає опису.' },
            { rating: 5, comment: 'Дуже задоволений покупкою. Швидка доставка і надійне пакування.' },
            { rating: 5, comment: 'Купую вже вдруге в цьому магазині — сервіс на найвищому рівні!' },
            { rating: 4, comment: 'Хороший товар за свої гроші. Все працює відмінно, рекомендую до покупки.' },
            { rating: 4, comment: 'Якістю задоволений, єдине що доставка зайняла трохи більше часу, ніж очікував.' },
            { rating: 5, comment: 'Все супер, відповідає фотографіям та характеристикам. 5 зірок!' },
            { rating: 5, comment: 'Відмінна якість матеріалів, дуже приємно користуватися.' },
            { rating: 4, comment: 'Гарна річ, повністю виконує свої функції. Співвідношення ціна/якість топ.' }
        ];

        let reviewCount = 0;
        for (let i = 0; i < 20; i++) {
            const buyer = pick(allBuyers);
            const prod = pick(products);
            const template = pick(reviewTemplates);
            const daysAgo = Math.floor(Math.random() * 25) + 1;

            try {
                await client.query(`
                    INSERT INTO product_reviews (product_id, buyer_id, rating, comment, created_at)
                    VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::interval)
                    ON CONFLICT (product_id, buyer_id) DO UPDATE
                    SET rating = EXCLUDED.rating,
                        comment = EXCLUDED.comment
                `, [prod.id, buyer.id, template.rating, template.comment, daysAgo]);
                reviewCount++;
            } catch (err) {
                // Ignore unique constraint violation if already present
            }
        }
        console.log(`Added/updated ${reviewCount} product reviews.`);

        // 4. Populate user_cart and user_favorites for active user activity
        console.log('Adding user cart, favorites, and viewed products...');
        for (const buyer of allBuyers.slice(0, 10)) {
            const favProds = pickDistinct(products, 3);
            for (const fp of favProds) {
                await client.query(`
                    INSERT INTO user_favorites (user_id, product_id, added_at)
                    VALUES ($1, $2, now() - interval '2 days')
                    ON CONFLICT (user_id, product_id) DO NOTHING
                `, [buyer.id, fp.id]);
            }

            const cartProds = pickDistinct(products, 2);
            for (const cp of cartProds) {
                await client.query(`
                    INSERT INTO user_cart (user_id, product_id, quantity, added_at)
                    VALUES ($1, $2, 1, now() - interval '1 day')
                    ON CONFLICT (user_id, product_id) DO NOTHING
                `, [buyer.id, cp.id]);
            }

            const viewProds = pickDistinct(products, 5);
            for (const vp of viewProds) {
                await client.query(`
                    INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
                    VALUES ($1, $2, now() - interval '3 hours')
                    ON CONFLICT (user_id, product_id) DO UPDATE
                    SET viewed_at = EXCLUDED.viewed_at
                `, [buyer.id, vp.id]);
            }
        }

        // 5. Sync SERIAL sequences
        const tables = ['users', 'products', 'orders', 'product_reviews'];
        for (const t of tables) {
            await client.query(`
                SELECT setval(
                    pg_get_serial_sequence('${t}', 'id'),
                    COALESCE((SELECT max(id) FROM ${t}), 1),
                    (SELECT max(id) FROM ${t}) IS NOT NULL
                )
            `);
        }

        await client.query('COMMIT');
        console.log('Transaction committed successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to seed analytics:', err);
        throw err;
    } finally {
        await client.end();
    }
}

seedAnalytics().catch(e => {
    console.error(e);
    process.exit(1);
});
