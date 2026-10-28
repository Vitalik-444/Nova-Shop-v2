// Переносить дані зі старої MySQL-бази novashop у PostgreSQL (схема db/sql, міграції 001–012).
//   npm run db:import-mysql               # цільові таблиці мають бути порожні
//   npm run db:import-mysql -- --truncate # спершу очистити таблиці даних
// Усе виконується однією транзакцією: або імпортується все, або нічого.
const { Client } = require('pg');
require('dotenv').config();

const PG_URL = process.env.DATABASE_MIGRATOR_URL || 'postgres://postgres:postgres@localhost:5432/myproject';
const STATUS_TO_DB = { new: 'pending', processing: 'paid', shipped: 'shipped', completed: 'delivered', cancelled: 'cancelled' };
const DATA_TABLES = ['order_items', 'orders', 'product_reviews', 'user_cart', 'user_favorites', 'products', 'categories', 'users'];

const parseJson = (v, fallback) => {
    if (v === null || v === undefined || v === '') return fallback;
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return fallback; }
};
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'seller';

async function readMysql() {
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS || 'root',
        database: process.env.MYSQL_DB || 'novashop',
        dateStrings: false
    });
    try {
        const q = async sql => (await conn.query(sql))[0];
        return {
            users: await q('SELECT * FROM users ORDER BY id'),
            products: await q('SELECT * FROM products ORDER BY id'),
            reviews: await q('SELECT * FROM product_reviews ORDER BY id'),
            cart: await q('SELECT * FROM user_cart ORDER BY id'),
            favorites: await q('SELECT * FROM user_favorites ORDER BY id'),
            orders: await q('SELECT * FROM orders ORDER BY id'),
            orderItems: await q('SELECT * FROM order_items ORDER BY id')
        };
    } finally { await conn.end(); }
}

/** Перенос уже прочитаних рядків MySQL у відкриту транзакцію PostgreSQL. Повертає статистику. */
async function load(pg, src, { truncate = false } = {}) {
    const stats = {}, warn = [];
    const skip = (what) => warn.push(what);

    if (truncate) {
        await pg.query(`TRUNCATE ${DATA_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
    } else {
        for (const t of ['users', 'products', 'orders']) {
            const { rows } = await pg.query(`SELECT count(*)::int AS n FROM ${t}`);
            if (rows[0].n) throw new Error(`Таблиця ${t} не порожня (${rows[0].n} рядків). Запустіть з --truncate або очистіть БД.`);
        }
    }

    // у момент імпорту не засмічуємо orders_audit історичними замовленнями
    await pg.query('ALTER TABLE orders DISABLE TRIGGER orders_audit_trg');

    // ---- users: id і bcrypt-хеші зберігаються, тож паролі продовжують працювати
    const userIds = new Set();
    const userByName = new Map();
    for (const u of src.users) {
        const role = u.role === 'admin' ? 'admin' : 'buyer';
        await pg.query(
            `INSERT INTO users (id, full_name, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
            [u.id, u.name, String(u.email).toLowerCase(), u.password_hash, role, u.created_at || new Date()]);
        userIds.add(Number(u.id));
        if (!userByName.has(u.name)) userByName.set(u.name, Number(u.id));
    }
    stats.users = src.users.length;

    // ---- продавці: у MySQL products.seller — просто текст; у PG це products.seller_id -> users
    await pg.query(`SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT max(id) FROM users), 1), (SELECT max(id) FROM users) IS NOT NULL)`);
    const sellerId = new Map();
    let createdSellers = 0;
    for (const name of [...new Set(src.products.map(p => (p.seller || 'NovaShop').trim() || 'NovaShop'))]) {
        if (userByName.has(name)) {
            const id = userByName.get(name);
            await pg.query(`UPDATE users SET role = 'seller' WHERE id = $1 AND role = 'buyer'`, [id]);
            sellerId.set(name, id);
        } else {
            const r = await pg.query(
                `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, '!', 'seller') RETURNING id`,
                [name, `${slugify(name)}-${Date.now().toString(36)}@sellers.novashop.local`]);
            sellerId.set(name, r.rows[0].id);
            createdSellers++;
        }
    }
    stats.sellers_created = createdSellers;

    // ---- categories: name = slug із MySQL (напр. "mens-shirts")
    const categoryId = new Map();
    for (const slug of [...new Set(src.products.map(p => p.category))].sort()) {
        const r = await pg.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [slug]);
        categoryId.set(slug, r.rows[0].id);
    }
    stats.categories = categoryId.size;

    // ---- products: колонки схеми + решта полів у jsonb attributes (міграція 012)
    const productIds = new Set();
    for (const p of src.products) {
        if (!(Number(p.price) > 0)) { skip(`товар #${p.id} «${p.title}» пропущено: ціна ${p.price} (CHECK price > 0)`); continue; }
        const attributes = {
            brand: p.brand, sku: p.sku, thumbnail: p.thumbnail, images: parseJson(p.images, []),
            discount_percentage: Number(p.discount_percentage) || 0, rating: Number(p.rating) || 0,
            weight: p.weight === null || p.weight === undefined ? null : Number(p.weight),
            warranty_information: p.warranty_information, shipping_information: p.shipping_information,
            availability_status: p.availability_status, return_policy: p.return_policy
        };
        await pg.query(
            `INSERT INTO products (id, seller_id, category_id, title, description, price, stock, attributes, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [p.id, sellerId.get((p.seller || 'NovaShop').trim() || 'NovaShop'), categoryId.get(p.category), p.title,
             p.description, p.price, Math.max(0, Number(p.stock) || 0), attributes, p.updated_at || new Date()]);
        productIds.add(Number(p.id));
    }
    stats.products = productIds.size;

    // ---- reviews
    let n = 0;
    for (const r of src.reviews) {
        if (!productIds.has(Number(r.product_id)) || !userIds.has(Number(r.user_id))) { skip(`відгук #${r.id} без товару/автора пропущено`); continue; }
        await pg.query(
            `INSERT INTO product_reviews (product_id, buyer_id, rating, comment, created_at) VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (product_id, buyer_id) DO NOTHING`,
            [r.product_id, r.user_id, r.rating, r.comment, r.created_at || new Date()]);
        n++;
    }
    stats.reviews = n;

    // ---- cart / favorites (снапшот product_data більше не потрібен: дані товару беруться з products)
    n = 0;
    for (const c of src.cart) {
        if (!productIds.has(Number(c.product_id)) || !userIds.has(Number(c.user_id))) { skip(`рядок кошика #${c.id} пропущено (немає товару/користувача)`); continue; }
        await pg.query(
            `INSERT INTO user_cart (user_id, product_id, quantity, added_at) VALUES ($1,$2,$3,$4)
             ON CONFLICT (user_id, product_id) DO NOTHING`,
            [c.user_id, c.product_id, Math.max(1, Number(c.quantity) || 1), c.created_at || new Date()]);
        n++;
    }
    stats.cart = n;
    n = 0;
    for (const f of src.favorites) {
        if (!productIds.has(Number(f.product_id)) || !userIds.has(Number(f.user_id))) { skip(`обране #${f.id} пропущено (немає товару/користувача)`); continue; }
        await pg.query(
            `INSERT INTO user_favorites (user_id, product_id, added_at) VALUES ($1,$2,$3) ON CONFLICT (user_id, product_id) DO NOTHING`,
            [f.user_id, f.product_id, f.created_at || new Date()]);
        n++;
    }
    stats.favorites = n;

    // ---- orders + order_items
    const orderIds = new Set();
    for (const o of src.orders) {
        const buyer = userIds.has(Number(o.user_id)) ? o.user_id : null;
        await pg.query(
            `INSERT INTO orders (id, buyer_id, status, created_at, customer_data) VALUES ($1,$2,$3,$4,$5)`,
            [o.id, buyer, STATUS_TO_DB[o.status] || 'pending', o.created_at || new Date(), parseJson(o.customer_data, null)]);
        orderIds.add(Number(o.id));
    }
    stats.orders = orderIds.size;

    // PK order_items = (order_id, product_id): повтори позицій у MySQL зливаємо в одну
    const merged = new Map();
    for (const it of src.orderItems) {
        if (!orderIds.has(Number(it.order_id))) { skip(`позицію #${it.id} без замовлення пропущено`); continue; }
        if (!productIds.has(Number(it.product_id))) { skip(`позицію замовлення #${it.order_id}: товару #${it.product_id} «${it.title}» немає в каталозі — пропущено (FK order_items → products)`); continue; }
        if (!(Number(it.price) > 0)) { skip(`позицію #${it.id} пропущено: ціна ${it.price}`); continue; }
        const key = `${it.order_id}:${it.product_id}`;
        const cur = merged.get(key);
        if (cur) cur.quantity += Math.max(1, Number(it.quantity) || 1);
        else merged.set(key, { order_id: it.order_id, product_id: it.product_id, price: it.price, quantity: Math.max(1, Number(it.quantity) || 1) });
    }
    for (const it of merged.values()) {
        await pg.query('INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1,$2,$3,$4)',
            [it.order_id, it.product_id, it.quantity, it.price]);
    }
    stats.order_items = merged.size;

    await pg.query('ALTER TABLE orders ENABLE TRIGGER orders_audit_trg');

    // ---- лічильники SERIAL після явних id
    for (const t of ['users', 'categories', 'products', 'orders', 'product_reviews']) {
        await pg.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE((SELECT max(id) FROM ${t}), 1), (SELECT max(id) FROM ${t}) IS NOT NULL)`);
    }
    return { stats, warn };
}

module.exports = { load };

if (require.main === module) {
    (async () => {
        const truncate = process.argv.includes('--truncate');
        console.log('Читаю MySQL…');
        const src = await readMysql();
        const pg = new Client({ connectionString: PG_URL });
        await pg.connect();
        try {
            await pg.query('BEGIN');
            const { stats, warn } = await load(pg, src, { truncate });
            await pg.query('COMMIT');
            console.log('Імпортовано:', stats);
            if (warn.length) { console.log(`\nПопередження (${warn.length}):`); warn.slice(0, 50).forEach(w => console.log('  -', w)); if (warn.length > 50) console.log(`  … ще ${warn.length - 50}`); }
        } catch (e) {
            await pg.query('ROLLBACK').catch(() => {});
            console.error('Імпорт скасовано (транзакцію відкочено):', e.message);
            process.exitCode = 1;
        } finally { await pg.end(); }
    })().catch(e => { console.error(e.message); process.exit(1); });
}
