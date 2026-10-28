// Застосовує db/sql/NNN_*.sql по порядку, по одному разу (стан — у schema_migrations,
// та сама таблиця, що вела C#-мігратор, тож уже накочені бази сумісні).
// Кожен файл — в окремій транзакції. Запуск: npm run db:migrate [-- --with-demo-data]
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const SQL_DIR = path.join(__dirname, '..', 'db', 'sql');
const INIT_ROLE_SQL = path.join(__dirname, '..', 'db', 'docker', 'init', '01_app_user.sql');
const FILE_RE = /^(\d{3})_([a-z0-9_]+)\.sql$/;
// 002_seed.sql і 005_bulk.sql — навчальні тестові дані (лаби 1–7). У робочому проєкті
// дані беруться з db/seed/data.sql (npm run db:seed), тому ці два файли за замовчуванням пропускаються.
const DEMO_DATA = new Set([2, 5]);

const url = process.env.DATABASE_MIGRATOR_URL || 'postgres://postgres:postgres@localhost:5433/myproject';
const withDemo = process.argv.includes('--with-demo-data');

async function ensureDatabase() {
    const target = new URL(url);
    const dbName = decodeURIComponent(target.pathname.slice(1));
    const admin = new URL(url); admin.pathname = '/postgres';
    const c = new Client({ connectionString: admin.toString() });
    await c.connect();
    try {
        const r = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
        if (!r.rowCount) { await c.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`); console.log(`  + створено базу ${dbName}`); }
    } finally { await c.end(); }
    return dbName;
}

async function ensureAppRole(client, dbName) {
    // скрипт docker/init: CREATE ROLE + права на базу/схему + права по умолчанию для будущих таблиц.
    const sql = fs.readFileSync(INIT_ROLE_SQL, 'utf8').replace(/DATABASE myproject/g, `DATABASE "${dbName}"`);
    const exists = (await client.query(`SELECT 1 FROM pg_roles WHERE rolname = 'app_user'`)).rowCount > 0;
    if (!exists) {
        await client.query(sql);
        console.log('  + створено роль app_user');
        return;
    }
    // роль уже є (кластер спільний з іншою базою) — GRANT-и ідемпотентні, тож видаємо права і в цій базі
    await client.query(sql.replace(/^\s*CREATE ROLE[^;]*;/m, ''));
}

(async () => {
    const dbName = await ensureDatabase();
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
        await ensureAppRole(client, dbName);
        await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
            version integer PRIMARY KEY, name text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
        const applied = new Set((await client.query('SELECT version FROM schema_migrations')).rows.map(r => r.version));

        const files = fs.readdirSync(SQL_DIR).filter(f => FILE_RE.test(f)).sort();
        let done = 0;
        for (const file of files) {
            const [, ver, name] = file.match(FILE_RE);
            const version = parseInt(ver, 10);
            if (applied.has(version)) { console.log(`  = ${file} (вже застосовано)`); continue; }
            if (DEMO_DATA.has(version) && !withDemo) { console.log(`  - ${file} (демо-дані, пропущено; --with-demo-data щоб застосувати)`); continue; }

            try {
                await client.query('BEGIN');
                await client.query(fs.readFileSync(path.join(SQL_DIR, file), 'utf8'));
                await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [version, name]);
                await client.query('COMMIT');
                console.log(`  ✓ ${file}`);
                done++;
            } catch (e) {
                await client.query('ROLLBACK').catch(() => {});
                console.error(`  ✗ ${file}: ${e.code} ${e.message}\n  Файл відкочено повністю; наступні не застосовувались.`);
                process.exitCode = 1;
                return;
            }
        }
        console.log(done ? `Застосовано міграцій: ${done}.` : 'Нових міграцій немає.');
    } finally {
        await client.end();
    }
})().catch(e => { console.error(e.message); process.exit(1); });
