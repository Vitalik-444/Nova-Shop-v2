// Заполняет базу данными из db/seed/data.sql (после npm run db:migrate).
//   npm run db:seed               # таблицы должны быть пустыми
//   npm run db:seed -- --truncate # сначала очистить таблицы данных
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const FILE = path.join(__dirname, '..', 'db', 'seed', 'data.sql');
const DATA_TABLES = ['user_viewed_products', 'order_items', 'orders', 'product_reviews', 'user_cart', 'user_favorites', 'products', 'categories', 'users'];
const SERIAL = ['users', 'categories', 'products', 'orders', 'product_reviews'];

(async () => {
    if (!fs.existsSync(FILE)) throw new Error(`Нет файла ${path.relative(process.cwd(), FILE)}. Создайте его: npm run db:export-seed`);
    const connectionString = process.env.DATABASE_MIGRATOR_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/myproject';
    const ssl = (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'))
        ? { rejectUnauthorized: false }
        : false;
    const client = new Client({ connectionString, ssl });

    let connected = false;
    for (let attempt = 1; attempt <= 15; attempt++) {
        try {
            await client.connect();
            connected = true;
            break;
        } catch (err) {
            console.log(`[Seed] Очікування бази даних (спроба ${attempt}/15): ${err.message}`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    if (!connected) throw new Error("Не вдалося підключитися до бази даних після 15 спроб");

    const isAuto = process.argv.includes('--auto');
    const isTruncate = process.argv.includes('--truncate');

    if (isAuto) {
        try {
            const check = await client.query("SELECT 1 FROM products WHERE title = 'Essence Mascara Lash Princess' LIMIT 1");
            if (check.rowCount > 0) {
                console.log("[Seed] База даних уже містить оригінальні товари NovaShop. Пропуск завантаження.");
                await client.end();
                return;
            }
        } catch (e) {
            // Таблиці можуть бути порожніми або відсутніми
        }
    }

    try {
        await client.query('BEGIN');
        if (isTruncate || isAuto) {
            await client.query(`TRUNCATE ${DATA_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
        } else {
            for (const t of ['users', 'products', 'orders']) {
                const n = (await client.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
                if (n) throw new Error(`Таблица ${t} не пуста (${n} строк). Запустите с --truncate.`);
            }
        }
        try {
            await client.query('ALTER TABLE orders DISABLE TRIGGER orders_audit_trg');
        } catch {}
        await client.query(fs.readFileSync(FILE, 'utf8'));
        try {
            await client.query('ALTER TABLE orders ENABLE TRIGGER orders_audit_trg');
        } catch {}
        for (const t of SERIAL) {
            await client.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE((SELECT max(id) FROM ${t}), 1), (SELECT max(id) FROM ${t}) IS NOT NULL)`);
        }
        await client.query('COMMIT');
        const counts = {};
        for (const t of DATA_TABLES) counts[t] = (await client.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
        console.log('Успішно завантажено оригінальні дані NovaShop:', counts);
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Завантаження відмінено:', e.message);
        process.exitCode = 1;
    } finally { await client.end(); }
})().catch(e => { console.error(e.message); process.exit(1); });
