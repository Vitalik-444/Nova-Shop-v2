// Прошарок між контрактом фронтенду (формат відповідей API, який чекає React)
// і схемою PostgreSQL з db/sql.
const db = require('../db');

// Статуси: фронтенд -> БД (CHECK chk_orders_status_allowed) і назад
const STATUS_TO_DB = { new: 'pending', processing: 'paid', shipped: 'shipped', completed: 'delivered', cancelled: 'cancelled' };
const STATUS_FROM_DB = { pending: 'new', paid: 'processing', shipped: 'shipped', delivered: 'completed', cancelled: 'cancelled' };

// Фронтенд знає лише 'user' і 'admin'; у БД: buyer / seller / moderator / admin
const roleToApi = role => (role === 'admin' ? 'admin' : 'user');

// Базовий SELECT товару: категорія й продавець підтягуються JOIN-ом,
// кількість і сума відгуків — підзапитом (потрібні для комбінованого рейтингу).
const PRODUCT_SELECT = `
    SELECT p.id, p.title, p.description, p.price, p.stock, p.attributes,
           c.name AS category, u.full_name AS seller,
           COALESCE(rs.cnt, 0) AS review_count, COALESCE(rs.sum, 0) AS rating_sum
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN users u ON u.id = p.seller_id
    LEFT JOIN (
        SELECT product_id, COUNT(*) AS cnt, SUM(rating) AS sum
        FROM product_reviews GROUP BY product_id
    ) rs ON rs.product_id = p.id`;

function mapProductRow(row) {
    const a = row.attributes || {};
    const reviewCount = Number(row.review_count) || 0;
    const reviewSum = Number(row.rating_sum) || 0;
    const baseRating = Number(a.rating) || 0;
    const rating = Math.round((baseRating + reviewSum) / (1 + reviewCount) * 100) / 100;

    return {
        id: Number(row.id),
        title: row.title,
        description: row.description,
        category: row.category,
        price: Number(row.price),
        discountPercentage: Number(a.discount_percentage) || 0,
        rating,
        reviewsCount: reviewCount,
        stock: Number(row.stock),
        brand: a.brand ?? null,
        seller: row.seller,
        sku: a.sku ?? null,
        weight: a.weight !== undefined && a.weight !== null ? Number(a.weight) : null,
        warrantyInformation: a.warranty_information ?? null,
        shippingInformation: a.shipping_information ?? null,
        availabilityStatus: a.availability_status ?? null,
        returnPolicy: a.return_policy ?? null,
        thumbnail: a.thumbnail ?? null,
        images: Array.isArray(a.images) ? a.images : []
    };
}

/** id категорії за назвою (у БД name = slug, напр. "mens-shirts"); створює, якщо немає. */
async function ensureCategory(client, name) {
    const found = await client.query('SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL ORDER BY id LIMIT 1', [name]);
    if (found.rows.length) return found.rows[0].id;
    const created = await client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [name]);
    return created.rows[0].id;
}

/** id продавця за відображуваним іменем; створює службовий акаунт, якщо такого немає
 *  (у вітрині продавець — це просто ім'я, напр. "NovaShop"). */
async function ensureSeller(client, name) {
    const found = await client.query(
        `SELECT id FROM users WHERE full_name = $1 AND role IN ('seller','admin') ORDER BY id LIMIT 1`, [name]);
    if (found.rows.length) return found.rows[0].id;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'seller';
    const email = `${slug}-${Date.now().toString(36)}@sellers.novashop.local`;
    const created = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, '!', 'seller') RETURNING id`, [name, email]);
    return created.rows[0].id;
}

/** Атрибути з тіла запиту фронтенду -> ключі jsonb products.attributes */
function attributesFromBody(body) {
    const attrs = {};
    if (body.thumbnail !== undefined) attrs.thumbnail = String(body.thumbnail || '').trim();
    if (body.brand !== undefined) attrs.brand = String(body.brand || '').trim();
    if (body.discountPercentage !== undefined) {
        attrs.discount_percentage = Math.max(0, Math.min(100, parseFloat(body.discountPercentage) || 0));
    }
    return attrs;
}

const FK_VIOLATION = '23503';
const UNIQUE_VIOLATION = '23505';

module.exports = {
    db, STATUS_TO_DB, STATUS_FROM_DB, roleToApi, PRODUCT_SELECT, mapProductRow,
    ensureCategory, ensureSeller, attributesFromBody, FK_VIOLATION, UNIQUE_VIOLATION
};
