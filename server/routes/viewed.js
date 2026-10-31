const express = require('express');
const { db, PRODUCT_SELECT, mapProductRow } = require('../lib/mapping');
const router = express.Router();

router.all('/', async (req, res) => {
    const action = req.query.action || (req.method === 'GET' ? 'list' : 'add');

    try {
        if (action === 'list') {
            if (!req.session.user_id) {
                return res.json({ success: true, viewed: [] });
            }

            const { rows } = await db.query(
                `SELECT x.*, uvp.viewed_at FROM user_viewed_products uvp
                 JOIN (${PRODUCT_SELECT}) x ON x.id = uvp.product_id
                 WHERE uvp.user_id = $1
                 ORDER BY uvp.viewed_at DESC
                 LIMIT 50`,
                [req.session.user_id]
            );

            return res.json({
                success: true,
                viewed: rows.map(r => ({
                    ...mapProductRow(r),
                    viewedAt: r.viewed_at
                }))
            });
        }

        if (action === 'add') {
            const productId = parseInt(req.body.productId || req.body.id, 10);
            if (!productId || productId <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid product ID' });
            }

            if (!req.session.user_id) {
                return res.json({ success: true, message: 'Guest viewed item recorded locally' });
            }

            await db.query(
                `INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
                 VALUES ($1, $2, now())
                 ON CONFLICT (user_id, product_id)
                 DO UPDATE SET viewed_at = now()`,
                [req.session.user_id, productId]
            );

            return res.json({ success: true });
        }

        if (action === 'clear') {
            if (!req.session.user_id) {
                return res.json({ success: true });
            }

            await db.query('DELETE FROM user_viewed_products WHERE user_id = $1', [req.session.user_id]);
            return res.json({ success: true });
        }

        if (action === 'sync') {
            if (!req.session.user_id) {
                return res.json({ success: true });
            }

            const items = Array.isArray(req.body) ? req.body : (req.body.items || []);
            const ids = [...new Set(items.map(i => parseInt(i.id || i, 10)).filter(id => id > 0))];

            if (ids.length) {
                for (const pid of ids) {
                    await db.query(
                        `INSERT INTO user_viewed_products (user_id, product_id, viewed_at)
                         VALUES ($1, $2, now())
                         ON CONFLICT (user_id, product_id) DO NOTHING`,
                        [req.session.user_id, pid]
                    );
                }
            }

            return res.json({ success: true });
        }

        return res.status(404).json({ success: false, message: 'Unknown action' });
    } catch (error) {
        console.error('Viewed products error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
