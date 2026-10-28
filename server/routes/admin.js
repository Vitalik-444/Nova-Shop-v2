const express = require('express');
const { withTransaction } = require('../db');
const {
    db, STATUS_TO_DB, STATUS_FROM_DB, roleToApi, ensureCategory, ensureSeller, attributesFromBody, FK_VIOLATION
} = require('../lib/mapping');
const router = express.Router();

async function requireAdmin(req, res, next) {
    if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Необходимо авторизоваться' });
    const { rows } = await db.query('SELECT role FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
    if (!rows.length || rows[0].role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Доступ только для администратора' });
    }
    next();
}

router.use(requireAdmin);

router.all('/', async (req, res) => {
    const action = req.query.action || '';
    const body = req.body || {};

    try {
        if (action === 'ordersList') {
            const { rows } = await db.query(
                `SELECT o.id, o.status, o.created_at, o.customer_data,
                        COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total,
                        u.full_name AS user_name, u.email AS user_email
                 FROM orders o
                 LEFT JOIN users u ON u.id = o.buyer_id
                 LEFT JOIN order_items oi ON oi.order_id = o.id
                 GROUP BY o.id, u.full_name, u.email
                 ORDER BY o.created_at DESC, o.id DESC`);

            const orders = rows.map(o => ({
                id: Number(o.id),
                total: Number(o.total),
                status: STATUS_FROM_DB[o.status] || o.status,
                created_at: o.created_at,
                customer_data: o.customer_data ? JSON.stringify(o.customer_data) : null, // як було в MySQL: JSON-рядок
                user_name: o.user_name || 'Видалений користувач',
                user_email: o.user_email || ''
            }));
            return res.json({ success: true, orders });
        }

        if (action === 'updateOrderStatus') {
            const orderId = parseInt(body.id, 10) || 0;
            const status = STATUS_TO_DB[(body.status || '').trim()];

            if (!orderId || !status) return res.status(422).json({ success: false, message: 'Некорректные данные' });

            await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
            return res.json({ success: true });
        }

        if (action === 'productSave') {
            const id = parseInt(body.id, 10) || 0;
            const title = (body.title || '').trim();
            const category = (body.category || '').trim();
            const price = parseFloat(body.price) || 0;
            const stock = Math.max(0, parseInt(body.stock, 10) || 0);
            const description = (body.description || '').trim();
            const seller = (body.seller || '').trim() || 'NovaShop';

            if (!title || !category || price <= 0) {
                return res.status(422).json({ success: false, message: 'Заполните название, категорию и цену' });
            }

            const attrs = attributesFromBody(body);

            const savedId = await withTransaction(async client => {
                const categoryId = await ensureCategory(client, category);
                const sellerId = await ensureSeller(client, seller);

                if (id > 0) {
                    // `||` зливає ключі: решта атрибутів (images, sku, гарантія…) лишається
                    const upd = await client.query(
                        `UPDATE products SET title = $2, category_id = $3, price = $4, stock = $5,
                                description = $6, seller_id = $7, attributes = attributes || $8::jsonb
                         WHERE id = $1`,
                        [id, title, categoryId, price, stock, description, sellerId, attrs]);
                    return upd.rowCount ? id : null;
                }

                attrs.rating = 0;
                attrs.images = [];
                const ins = await client.query(
                    `INSERT INTO products (seller_id, category_id, title, description, price, stock, attributes)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [sellerId, categoryId, title, description, price, stock, attrs]);
                return ins.rows[0].id;
            });

            if (!savedId) return res.status(404).json({ success: false, message: 'Товар не найден' });
            return res.json({ success: true, id: savedId });
        }

        if (action === 'productDelete') {
            const id = parseInt(body.id, 10) || 0;
            if (!id) return res.status(422).json({ success: false, message: 'Некорректный id' });
            try {
                await db.query('DELETE FROM products WHERE id = $1', [id]);
            } catch (e) {
                // order_items.product_id → ON DELETE RESTRICT
                if (e.code === FK_VIOLATION) {
                    return res.status(409).json({ success: false, message: 'Товар есть в оформленных заказах — удалить нельзя' });
                }
                throw e;
            }
            return res.json({ success: true });
        }

        if (action === 'usersList') {
            const { rows } = await db.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC, id DESC');
            const users = rows.map(u => ({ id: Number(u.id), name: u.full_name, email: u.email, role: roleToApi(u.role), created_at: u.created_at }));
            return res.json({ success: true, users });
        }

        if (action === 'updateUserRole') {
            const id = parseInt(body.id, 10) || 0;
            const role = (body.role || '').trim();

            if (!id || !['user', 'admin'].includes(role)) {
                return res.status(422).json({ success: false, message: 'Некорректные данные' });
            }
            if (id === req.session.user_id && role !== 'admin') {
                return res.status(422).json({ success: false, message: 'Нельзя снять права администратора с самого себя' });
            }

            if (role === 'admin') {
                await db.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [id]);
            } else {
                // зняття прав адміністратора: продавець, якщо в нього є товари, інакше покупець
                await db.query(
                    `UPDATE users SET role = CASE WHEN EXISTS (SELECT 1 FROM products WHERE seller_id = users.id)
                                                  THEN 'seller' ELSE 'buyer' END
                     WHERE id = $1 AND role = 'admin'`, [id]);
            }
            return res.json({ success: true });
        }

        return res.status(404).json({ success: false, message: 'Неизвестное действие' });
    } catch (error) {
        console.error('Admin Error:', error);
        return res.status(500).json({ success: false, message: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;
