const { Pool } = require('pg');
require('dotenv').config();

// Застосунок підключається від ролі app_user: читає й пише дані, але не змінює схему.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://app_user:app_pass@localhost:5432/myproject',
    max: 10
});

pool.on('error', err => console.error('PG pool error:', err.message));

/** Виконує fn(client) в одній транзакції (BEGIN/COMMIT, при помилці — ROLLBACK). */
async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
    } finally {
        client.release();
    }
}

module.exports = { pool, query: (...a) => pool.query(...a), withTransaction };
