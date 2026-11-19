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
