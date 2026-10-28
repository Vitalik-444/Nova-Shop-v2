// Выгружает данные из PostgreSQL в db/seed/data.sql — файл, которым базу можно заполнить заново (npm run db:seed).
//   npm run db:export-seed
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const OUT = path.join(__dirname, '..', 'db', 'seed', 'data.sql');
// порядок важен: родители раньше детей (внешние ключи)
const TABLES = [
    ['users', 'id'], ['categories', 'id'], ['products', 'id'], ['orders', 'id'],
    ['order_items', 'order_id, product_id'], ['product_reviews', 'id'],
    ['user_cart', 'user_id, product_id'], ['user_favorites', 'user_id, product_id']
];

(async () => {
    const client = new Client({ connectionString: process.env.DATABASE_MIGRATOR_URL || 'postgres://postgres:postgres@localhost:5433/myproject' });
    await client.connect();
    try {
        let sql = '-- Данные NovaShop. Создан командой npm run db:export-seed, загружается командой npm run db:seed.\n';
        const counts = {};
        for (const [table, order] of TABLES) {
            const { rows } = await client.query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY ${order}), '[]'::jsonb) AS data FROM ${table} t`);
            const data = rows[0].data;
            counts[table] = data.length;
            if (!data.length) continue;
            // jsonb_populate_recordset сам приводит типы колонок: не нужно вручную экранировать значения
            sql += `\nINSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table}, $seed$${JSON.stringify(data)}$seed$::jsonb);\n`;
        }
        fs.mkdirSync(path.dirname(OUT), { recursive: true });
        fs.writeFileSync(OUT, sql);
        console.log('Выгружено:', counts, `\nФайл: ${path.relative(process.cwd(), OUT)}`);
    } finally { await client.end(); }
})().catch(e => { console.error(e.message); process.exit(1); });
