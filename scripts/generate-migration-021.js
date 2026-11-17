const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_MIGRATOR_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/myproject';

async function generateMigration() {
    const client = new Client({ connectionString });
    await client.connect();

    // 1. Get all buyer users (all columns in exact schema order)
    const { rows: users } = await client.query(`
        SELECT id, full_name, email, password_hash, role, created_at, phone, avatar_url, city, address, settings
        FROM users
        WHERE role = 'buyer'
        ORDER BY id ASC
    `);

    // 2. Get all orders for these buyers
    const buyerIds = users.map(u => u.id);
    const { rows: orders } = await client.query(`
        SELECT id, buyer_id, status, created_at, customer_data
        FROM orders
        WHERE buyer_id = ANY($1::int[])
        ORDER BY id ASC
    `, [buyerIds]);

    const orderIds = orders.map(o => o.id);
    const { rows: orderItems } = await client.query(`
        SELECT order_id, product_id, quantity, price_at_purchase
        FROM order_items
        WHERE order_id = ANY($1::int[])
        ORDER BY order_id ASC, product_id ASC
    `, [orderIds]);

    console.log(`Found ${users.length} buyers, ${orders.length} orders, ${orderItems.length} order items.`);

    let sql = `-- 021_realistic_buyers_and_orders.sql
-- Наповнення бази даних реальними українськими покупцями та замовленнями для живої аналітики.
-- Повністю ідемпотентна міграція: безпечно накатується як на чисту БД, так і на існуючу.

-- 1. Додавання/оновлення реалістичних користувачів-покупців
INSERT INTO users
SELECT * FROM jsonb_populate_recordset(NULL::users, $seed$${JSON.stringify(users)}$seed$::jsonb)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    created_at = EXCLUDED.created_at,
    settings = EXCLUDED.settings;

-- 2. Тимчасово вимикаємо тригер аудиту замовлень для масової вставки
DO $$
BEGIN
    BEGIN
        ALTER TABLE orders DISABLE TRIGGER orders_audit_trg;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- 3. Додавання/оновлення замовлень
INSERT INTO orders
SELECT * FROM jsonb_populate_recordset(NULL::orders, $seed$${JSON.stringify(orders)}$seed$::jsonb)
ON CONFLICT (id) DO UPDATE SET
    buyer_id = EXCLUDED.buyer_id,
    status = EXCLUDED.status,
    created_at = EXCLUDED.created_at,
    customer_data = EXCLUDED.customer_data;

-- 4. Додавання/оновлення позицій замовлень
INSERT INTO order_items
SELECT * FROM jsonb_populate_recordset(NULL::order_items, $seed$${JSON.stringify(orderItems)}$seed$::jsonb)
ON CONFLICT (order_id, product_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    price_at_purchase = EXCLUDED.price_at_purchase;

-- 5. Вмикаємо тригер аудиту назад
DO $$
BEGIN
    BEGIN
        ALTER TABLE orders ENABLE TRIGGER orders_audit_trg;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- 6. Оновлення послідовностей (sequences)
DO $$
DECLARE
    seq text;
BEGIN
    seq := pg_get_serial_sequence('users', 'id');
    IF seq IS NOT NULL THEN
        PERFORM setval(seq, COALESCE((SELECT max(id) FROM users), 1), (SELECT max(id) FROM users) IS NOT NULL);
    END IF;
    seq := pg_get_serial_sequence('orders', 'id');
    IF seq IS NOT NULL THEN
        PERFORM setval(seq, COALESCE((SELECT max(id) FROM orders), 1), (SELECT max(id) FROM orders) IS NOT NULL);
    END IF;
END $$;

-- 7. Надання прав ролі app_user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        BEGIN
            GRANT SELECT, INSERT, UPDATE, DELETE ON users, orders, order_items TO app_user;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;
`;

    const outPath = path.join(__dirname, '..', 'db', 'sql', '021_realistic_buyers_and_orders.sql');
    fs.writeFileSync(outPath, sql, 'utf8');
    console.log(`Generated migration: ${outPath}`);

    await client.end();
}

generateMigration().catch(console.error);
