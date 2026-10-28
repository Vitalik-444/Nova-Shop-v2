const express = require('express');
const { db } = require('../lib/mapping');
const router = express.Router();

router.all('/', async (req, res) => {
    const action = req.query.action || '';
    const body = req.body || {};

    try {
        if (action === 'list') {
            const productId = parseInt(req.query.product_id, 10) || 0;
            if (!productId) return res.status(422).json({ success: false, message: 'Не указан товар' });

            // buyer_id може бути NULL (автор видалив акаунт, ON DELETE SET NULL) — тому LEFT JOIN
            const { rows } = await db.query(
                `SELECT pr.id, pr.buyer_id, pr.rating, pr.comment, pr.created_at, u.full_name AS user_name
                 FROM product_reviews pr
                 LEFT JOIN users u ON u.id = pr.buyer_id
                 WHERE pr.product_id = $1
                 ORDER BY pr.created_at DESC, pr.id DESC`, [productId]);

            const reviews = rows.map(row => ({
                id: Number(row.id),
                userId: row.buyer_id === null ? null : Number(row.buyer_id),
                userName: row.user_name || 'Видалений користувач',
                rating: Number(row.rating),
                comment: row.comment,
                createdAt: row.created_at
            }));

            const myReview = req.session.user_id ? reviews.find(r => r.userId === req.session.user_id) || null : null;
            return res.json({ success: true, reviews, myReview });
        }

        if (action === 'add') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Войдите в аккаунт, чтобы оставить отзыв' });

            const productId = parseInt(body.productId, 10) || 0;
            const rating = parseInt(body.rating, 10) || 0;
            const comment = (body.comment || '').trim();

            if (!productId || rating < 1 || rating > 5) return res.status(422).json({ success: false, message: 'Укажите оценку от 1 до 5' });
            if (comment.length > 1000) return res.status(422).json({ success: false, message: 'Слишком длинный отзыв' });

            const products = await db.query('SELECT id FROM products WHERE id = $1', [productId]);
            if (!products.rows.length) return res.status(404).json({ success: false, message: 'Товар не найден' });

            // unique_review_per_buyer_product (product_id, buyer_id): повторний відгук оновлює попередній
            await db.query(
                `INSERT INTO product_reviews (product_id, buyer_id, rating, comment)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (product_id, buyer_id)
                 DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()`,
                [productId, req.session.user_id, rating, comment]);

            return res.json({ success: true });
        }

        if (action === 'delete') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });
            const productId = parseInt(body.productId, 10) || 0;

            await db.query('DELETE FROM product_reviews WHERE product_id = $1 AND buyer_id = $2', [productId, req.session.user_id]);
            return res.json({ success: true });
        }

        return res.status(404).json({ success: false, message: 'Unknown action' });
    } catch (error) {
        console.error('Reviews Error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
