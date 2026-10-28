const express = require('express');
const { withTransaction } = require('../db');
const { db, PRODUCT_SELECT, mapProductRow } = require('../lib/mapping');
const router = express.Router();

router.all('/', async (req, res) => {
    const action = req.query.action || '';
    const items = Array.isArray(req.body) ? req.body : [];

    try {
        if (action === 'list') {
            if (!req.session.user_id) return res.json({ success: true, favorites: [] });

            const { rows } = await db.query(
                `SELECT x.* FROM user_favorites uf
                 JOIN (${PRODUCT_SELECT}) x ON x.id = uf.product_id
                 WHERE uf.user_id = $1 ORDER BY uf.added_at DESC`, [req.session.user_id]);
            return res.json({ success: true, favorites: rows.map(mapProductRow) });
        }

        if (action === 'sync') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const ids = [...new Set(items.map(i => parseInt(i.id, 10) || 0).filter(id => id > 0))];

            await withTransaction(async client => {
                await client.query('DELETE FROM user_favorites WHERE user_id = $1', [req.session.user_id]);
                if (ids.length) {
                    await client.query(
                        `INSERT INTO user_favorites (user_id, product_id)
                         SELECT $1, p.id FROM products p WHERE p.id = ANY($2::int[])`,
                        [req.session.user_id, ids]);
                }
            });

            return res.json({ success: true });
        }

        return res.status(404).json({ success: false, message: 'Unknown action' });
    } catch (error) {
        console.error('Favorites Error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
