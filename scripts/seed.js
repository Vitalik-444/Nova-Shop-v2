// Заполняет базу данными из db/seed/data.sql (после npm run db:migrate).
//   npm run db:seed               # таблицы должны быть пустыми
//   npm run db:seed -- --truncate # сначала очистить таблицы данных
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const FILE = path.join(__dirname, '..', 'db', 'seed', 'data.sql');
const DATA_TABLES = ['order_items', 'orders', 'product_reviews', 'user_cart', 'user_favorites', 'products', 'categories', 'users'];
const SERIAL = ['users', 'categories', 'products', 'orders', 'product_reviews'];

(async () => {
    if (!fs.existsSync(FILE)) throw new Error(`Нет файла ${path.relative(process.cwd(), FILE)}. Создайте его: npm run db:export-seed`);
    const client = new Client({ connectionString: process.env.DATABASE_MIGRATOR_URL || 'postgres://postgres:postgres@localhost:5433/myproject' });
    await client.connect();
    try {
        await client.query('BEGIN');
        if (process.argv.includes('--truncate')) {
            await client.query(`TRUNCATE ${DATA_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
        } else {
            for (const t of ['users', 'products', 'orders']) {
                const n = (await client.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
                if (n) throw new Error(`Таблица ${t} не пуста (${n} строк). Запустите с --truncate.`);
            }
        }
        await client.query('ALTER TABLE orders DISABLE TRIGGER orders_audit_trg'); // историю не засоряем аудитом
        await client.query(fs.readFileSync(FILE, 'utf8'));
        await client.query('ALTER TABLE orders ENABLE TRIGGER orders_audit_trg');
        for (const t of SERIAL) {
            await client.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE((SELECT max(id) FROM ${t}), 1), (SELECT max(id) FROM ${t}) IS NOT NULL)`);
        }
        await client.query('COMMIT');
        const counts = {};
        for (const t of DATA_TABLES) counts[t] = (await client.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
        console.log('Загружено:', counts);
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Загрузка отменена:', e.message);
        process.exitCode = 1;
    } finally { await client.end(); }
})().catch(e => { console.error(e.message); process.exit(1); });
