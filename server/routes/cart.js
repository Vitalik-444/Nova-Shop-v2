const express = require('express');
const { withTransaction } = require('../db');
const { db, PRODUCT_SELECT, mapProductRow } = require('../lib/mapping');
const router = express.Router();

router.all('/', async (req, res) => {
    const action = req.query.action || '';
    const body = Array.isArray(req.body) ? req.body : [];

    try {
        if (action === 'list') {
            if (!req.session.user_id) return res.json({ success: true, cart: [] });

            // user_cart зберігає лише (user_id, product_id, quantity); дані товару беремо з products (завжди актуальні)
            const { rows } = await db.query(
                `SELECT x.*, uc.quantity FROM user_cart uc
                 JOIN (${PRODUCT_SELECT}) x ON x.id = uc.product_id
                 WHERE uc.user_id = $1 ORDER BY uc.added_at DESC`, [req.session.user_id]);
            const cart = rows.map(r => ({ ...mapProductRow(r), quantity: Number(r.quantity) }));
            return res.json({ success: true, cart });
        }

        if (action === 'sync') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });

            // кілька рядків з одним id зливаємо; невідомі товари пропускаємо (FK на products)
            const qty = new Map();
            for (const item of body) {
                const id = parseInt(item.id, 10) || 0;
                if (id <= 0) continue;
                qty.set(id, (qty.get(id) || 0) + Math.max(1, parseInt(item.quantity, 10) || 1));
            }

            await withTransaction(async client => {
                await client.query('DELETE FROM user_cart WHERE user_id = $1', [req.session.user_id]);
                if (qty.size) {
                    await client.query(
                        `INSERT INTO user_cart (user_id, product_id, quantity)
                         SELECT $1, p.id, q.quantity
                         FROM unnest($2::int[], $3::int[]) AS q(product_id, quantity)
                         JOIN products p ON p.id = q.product_id`,
                        [req.session.user_id, [...qty.keys()], [...qty.values()]]);
                }
            });

            return res.json({ success: true });
        }

        return res.status(404).json({ success: false, message: 'Unknown action' });
    } catch (error) {
        console.error('Cart Error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
