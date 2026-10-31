const express = require('express');
const { withTransaction } = require('../db');
const {
    db, PRODUCT_SELECT, mapProductRow, ensureCategory, attributesFromBody, FK_VIOLATION
} = require('../lib/mapping');
const { getCategoryTitle } = require('../lib/productTranslations');
const router = express.Router();

router.all('/', async (req, res) => {
    const action = req.query.action || '';
    const body = req.body || {};

    try {
        if (action === 'list') {
            let limit = parseInt(req.query.limit, 10) || 200;
            limit = Math.max(1, Math.min(limit, 500));

            const { rows } = await db.query(`${PRODUCT_SELECT} ORDER BY p.id ASC LIMIT $1`, [limit]);
            return res.json({ success: true, products: rows.map(mapProductRow) });
        }

        if (action === 'get') {
            const id = parseInt(req.query.id, 10) || 0;
            const { rows } = await db.query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
            if (!rows.length) return res.status(404).json({ success: false, message: 'Товар не найден' });
            return res.json({ success: true, product: mapProductRow(rows[0]) });
        }

        if (action === 'categories') {
            // у таблиці categories name зберігає slug (напр. "mens-shirts"); показуємо лише ті, де є товари
            const { rows } = await db.query(
                `SELECT DISTINCT c.name FROM categories c JOIN products p ON p.category_id = c.id ORDER BY c.name ASC`);
            const categories = rows.map(row => {
                const slug = row.name;
                const nameEn = getCategoryTitle(slug, 'en');
                const nameUk = getCategoryTitle(slug, 'uk');
                return { slug, name: nameEn, nameEn, nameUk };
            });
            return res.json({ success: true, categories });
        }

        if (action === 'add') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Необхідно авторизуватися для додавання товару' });

            const { rows: users } = await db.query('SELECT id, full_name, role FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
            const user = users[0];
            if (!user) return res.status(401).json({ success: false, message: 'Користувача не знайдено' });

            const title = (body.title || '').trim();
            const category = (body.category || '').trim();
            const price = parseFloat(body.price) || 0;
            const stock = Math.max(0, parseInt(body.stock, 10) || 1);
            const description = (body.description || '').trim();

            if (!title || !category || price <= 0) return res.status(422).json({ success: false, message: 'Вкажіть назву, категорію та дійсну ціну' });

            const attrs = attributesFromBody(body);
            if (!attrs.thumbnail) attrs.thumbnail = 'images/banner.png';
            attrs.discount_percentage = attrs.discount_percentage || 0;
            attrs.rating = 0;
            attrs.images = [];

            const id = await withTransaction(async client => {
                const categoryId = await ensureCategory(client, category);
                const ins = await client.query(
                    `INSERT INTO products (seller_id, category_id, title, description, price, stock, attributes)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [user.id, categoryId, title, description, price, stock, attrs]);
                const newId = ins.rows[0].id;
                await client.query(`UPDATE products SET attributes = attributes || $2::jsonb WHERE id = $1`, [newId, { sku: `SKU-${newId}` }]);
                // той, хто виставляє товар, стає продавцем
                if (user.role === 'buyer') await client.query(`UPDATE users SET role = 'seller' WHERE id = $1`, [user.id]);
                return newId;
            });

            return res.json({ success: true, id, seller: user.full_name, message: 'Товар успішно додано до каталогу' });
        }

        if (action === 'myProducts') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Необхідно авторизуватися' });
            const { rows: users } = await db.query('SELECT full_name FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
            if (!users.length) return res.status(401).json({ success: false, message: 'Користувача не знайдено' });

            const { rows } = await db.query(`${PRODUCT_SELECT} WHERE p.seller_id = $1 ORDER BY p.id DESC`, [req.session.user_id]);
            return res.json({ success: true, seller: users[0].full_name, products: rows.map(mapProductRow) });
        }

        if (action === 'deleteMyProduct') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Необхідно авторизуватися' });
            const { rows: users } = await db.query('SELECT id, role FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
            const user = users[0];
            if (!user) return res.status(401).json({ success: false, message: 'Користувача не знайдено' });

            const id = parseInt(body.id, 10) || 0;
            if (!id) return res.status(422).json({ success: false, message: 'Некоректний ID товару' });

            let result;
            try {
                result = user.role === 'admin'
                    ? await db.query('DELETE FROM products WHERE id = $1', [id])
                    : await db.query('DELETE FROM products WHERE id = $1 AND seller_id = $2', [id, user.id]);
            } catch (e) {
                // order_items.product_id → ON DELETE RESTRICT: товар із історії замовлень видаляти не можна
                if (e.code === FK_VIOLATION) {
                    return res.status(409).json({ success: false, message: 'Товар є в оформлених замовленнях, тому його не можна видалити' });
                }
                throw e;
            }

            if (result.rowCount === 0) return res.status(403).json({ success: false, message: 'Товар не знайдено або у вас немає прав на його видалення' });
            return res.json({ success: true, message: 'Товар успішно видалено' });
        }

        return res.status(404).json({ success: false, message: 'Unknown action' });
    } catch (error) {
        console.error('Products Error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
