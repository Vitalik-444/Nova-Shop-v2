const express = require('express');
const { withTransaction } = require('../db');
const {
    db, STATUS_TO_DB, STATUS_FROM_DB, roleToApi, ensureCategory, ensureSeller, attributesFromBody, FK_VIOLATION
} = require('../lib/mapping');
const { sendMail } = require('../mailer');
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
                customer_data: o.customer_data ? JSON.stringify(o.customer_data) : null, // фронтенд очікує JSON-рядок
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

            // Сповіщаємо покупця електронною поштою про зміну статусу
            try {
                const { rows: orderRows } = await db.query(
                    `SELECT o.id, o.customer_data, u.email, u.full_name, u.settings
                     FROM orders o
                     LEFT JOIN users u ON u.id = o.buyer_id
                     WHERE o.id = $1`, [orderId]
                );
                if (orderRows.length) {
                    const ord = orderRows[0];
                    const cust = ord.customer_data || {};
                    const email = cust.email || ord.email;
                    const name = cust.name ? `${cust.name} ${cust.surname || ''}`.trim() : (ord.full_name || 'Покупець');
                    const lang = (cust.language || (ord.settings && ord.settings.language)) === 'en' ? 'en' : 'uk';

                    if (email) {
                        const statusTitles = {
                            uk: { pending: 'Нове', paid: 'В обробці', shipped: 'Відправлено', delivered: 'Доставлено', cancelled: 'Скасовано' },
                            en: { pending: 'New', paid: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }
                        };
                        const statusName = (statusTitles[lang] && statusTitles[lang][status]) || status;
                        const subject = lang === 'en'
                            ? `NovaShop: Order #${orderId} status changed to "${statusName}"`
                            : `NovaShop: Статус замовлення №${orderId} змінено на «${statusName}»`;
                        const html = `
                            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;background:#ffffff;">
                                <h2 style="color:#00A046;margin-top:0;">NovaShop</h2>
                                <p style="font-size:15px;color:#333;">${lang === 'en' ? 'Hello' : 'Вітаємо'}, <b>${name}</b>!</p>
                                <p style="font-size:15px;color:#333;">${lang === 'en' ? `The status of your order <strong>#${orderId}</strong> has been updated:` : `Статус вашого замовлення <strong>№${orderId}</strong> було змінено:`} <strong style="color:#00A046;font-size:16px;">${statusName}</strong>.</p>
                                <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
                                <p style="font-size:12px;color:#888;">NovaShop Online Store</p>
                            </div>
                        `;
                        sendMail(email, name, subject, html).catch(err => console.error(`Order #${orderId} status notification failed:`, err.message));
                    }
                }
            } catch (notifyErr) {
                console.error(`Order status notification error:`, notifyErr.message);
            }

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
            const targetDiscount = attrs.discount_percentage;
            delete attrs.discount_percentage; // щоб не перезаписувати jsonb напряму

            const savedId = await withTransaction(async client => {
                const categoryId = await ensureCategory(client, category);
                const sellerId = await ensureSeller(client, seller);

                let currentId = id;
                if (id > 0) {
                    // `||` зливає ключі: решта атрибутів (images, sku, гарантія…) лишається
                    const upd = await client.query(
                        `UPDATE products SET title = $2, category_id = $3, price = $4, stock = $5,
                                description = $6, seller_id = $7, attributes = attributes || $8::jsonb
                         WHERE id = $1`,
                        [id, title, categoryId, price, stock, description, sellerId, attrs]);
                    if (!upd.rowCount) return null;
                } else {
                    attrs.rating = 0;
                    attrs.images = [];
                    const ins = await client.query(
                        `INSERT INTO products (seller_id, category_id, title, description, price, stock, attributes)
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                        [sellerId, categoryId, title, description, price, stock, attrs]);
                    currentId = ins.rows[0].id;
                }

                // Оновлення знижки суворо через функцію update_product_discount з валідацією та аудитом
                if (targetDiscount !== undefined) {
                    await client.query(
                        'SELECT update_product_discount($1, $2, $3, true)',
                        [currentId, targetDiscount, req.session.user_id]
                    );
                }

                return currentId;
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
                if (e.code === FK_VIOLATION || e.code === '23001') {
                    return res.status(409).json({ success: false, message: 'Товар есть в оформленных заказах — удалить нельзя' });
                }
                throw e;
            }
            return res.json({ success: true });
        }

        if (action === 'statistics') {
            // 1. Загальний огляд (KPI)
            let overview = {
                totalRevenue: 0,
                totalOrders: 0,
                deliveredOrders: 0,
                shippedOrders: 0,
                paidOrders: 0,
                pendingOrders: 0,
                cancelledOrders: 0,
                averageOrderValue: 0,
                totalUsers: 0,
                newUsers30d: 0,
                totalProducts: 0,
                lowStockCount: 0
            };
            try {
                const { rows: ovRows } = await db.query('SELECT * FROM admin_stats_overview LIMIT 1');
                if (ovRows.length) {
                    const r = ovRows[0];
                    overview = {
                        totalRevenue: Number(r.total_revenue || 0),
                        totalOrders: Number(r.total_orders || 0),
                        deliveredOrders: Number(r.delivered_orders || 0),
                        shippedOrders: Number(r.shipped_orders || 0),
                        paidOrders: Number(r.paid_orders || 0),
                        pendingOrders: Number(r.pending_orders || 0),
                        cancelledOrders: Number(r.cancelled_orders || 0),
                        averageOrderValue: Number(r.average_order_value || 0),
                        totalUsers: Number(r.total_users || 0),
                        newUsers30d: Number(r.new_users_30d || 0),
                        totalProducts: Number(r.total_products || 0),
                        lowStockCount: Number(r.low_stock_count || 0)
                    };
                }
            } catch {
                // Прямий розрахунок, якщо представлення ще не застосовано
                const { rows: revRows } = await db.query(`
                    SELECT 
                        COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN oi.quantity * oi.price_at_purchase ELSE 0 END), 0) AS total_revenue,
                        COUNT(DISTINCT o.id) AS total_orders,
                        COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) AS delivered_orders,
                        COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.id END) AS shipped_orders,
                        COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.id END) AS paid_orders,
                        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) AS pending_orders,
                        COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders
                    FROM orders o
                    LEFT JOIN order_items oi ON oi.order_id = o.id
                `);
                const r = revRows[0] || {};
                const { rows: uRows } = await db.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days') AS new_30d FROM users`);
                const { rows: pRows } = await db.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE stock <= 5) AS low_stock FROM products`);
                const validOrders = Number(r.total_orders || 0) - Number(r.cancelled_orders || 0);
                const totRev = Number(r.total_revenue || 0);
                overview = {
                    totalRevenue: totRev,
                    totalOrders: Number(r.total_orders || 0),
                    deliveredOrders: Number(r.delivered_orders || 0),
                    shippedOrders: Number(r.shipped_orders || 0),
                    paidOrders: Number(r.paid_orders || 0),
                    pendingOrders: Number(r.pending_orders || 0),
                    cancelledOrders: Number(r.cancelled_orders || 0),
                    averageOrderValue: validOrders > 0 ? Number((totRev / validOrders).toFixed(2)) : 0,
                    totalUsers: Number(uRows[0]?.total || 0),
                    newUsers30d: Number(uRows[0]?.new_30d || 0),
                    totalProducts: Number(pRows[0]?.total || 0),
                    lowStockCount: Number(pRows[0]?.low_stock || 0)
                };
            }

            // 2. Продажі по днях за останні 30 днів
            const { rows: dailyRows } = await db.query(`
                SELECT 
                    to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD') AS day,
                    to_char(date_trunc('day', o.created_at), 'DD.MM') AS short_day,
                    COUNT(DISTINCT o.id)::int AS orders_count,
                    COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)::numeric(12,2) AS revenue
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                WHERE o.status <> 'cancelled' AND o.created_at >= now() - INTERVAL '30 days'
                GROUP BY date_trunc('day', o.created_at)
                ORDER BY day ASC
            `);
            const dailySales = dailyRows.map(d => ({
                day: d.day,
                shortDay: d.short_day,
                ordersCount: Number(d.orders_count),
                revenue: Number(d.revenue)
            }));

            // 3. Топ-5 продаваних товарів
            const { rows: topRows } = await db.query(`
                SELECT 
                    p.id, p.title, p.price, p.stock,
                    c.name AS category,
                    COALESCE(p.attributes->>'thumbnail', '') AS thumbnail,
                    COALESCE((p.attributes->>'rating')::numeric, 0) AS rating,
                    SUM(oi.quantity)::int AS units_sold,
                    SUM(oi.quantity * oi.price_at_purchase)::numeric(12,2) AS revenue
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
                JOIN products p ON p.id = oi.product_id
                LEFT JOIN categories c ON c.id = p.category_id
                GROUP BY p.id, p.title, p.price, p.stock, c.name, p.attributes
                ORDER BY revenue DESC, units_sold DESC
                LIMIT 5
            `);
            const topProducts = topRows.map(p => ({
                id: Number(p.id),
                title: p.title,
                price: Number(p.price),
                stock: Number(p.stock),
                category: p.category,
                thumbnail: p.thumbnail,
                rating: Number(p.rating),
                unitsSold: Number(p.units_sold),
                revenue: Number(p.revenue)
            }));

            // 4. Продажі за категоріями
            const { rows: catRows } = await db.query(`
                SELECT 
                    c.name AS category,
                    COUNT(DISTINCT o.id)::int AS orders_count,
                    SUM(oi.quantity)::int AS units_sold,
                    SUM(oi.quantity * oi.price_at_purchase)::numeric(12,2) AS revenue
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
                JOIN products p ON p.id = oi.product_id
                JOIN categories c ON c.id = p.category_id
                GROUP BY c.name
                ORDER BY revenue DESC
            `);
            const totalCatRevenue = catRows.reduce((acc, c) => acc + Number(c.revenue), 0) || 1;
            const categorySales = catRows.map(c => ({
                category: c.category,
                ordersCount: Number(c.orders_count),
                unitsSold: Number(c.units_sold),
                revenue: Number(c.revenue),
                percentage: Math.round((Number(c.revenue) / totalCatRevenue) * 100)
            }));

            // 5. Товари з критично низьким залишком (<= 5)
            const { rows: lowRows } = await db.query(`
                SELECT 
                    p.id, p.title, p.price, p.stock,
                    c.name AS category,
                    COALESCE(p.attributes->>'thumbnail', '') AS thumbnail
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE p.stock <= 5
                ORDER BY p.stock ASC
                LIMIT 6
            `);
            const lowStockProducts = lowRows.map(p => ({
                id: Number(p.id),
                title: p.title,
                price: Number(p.price),
                stock: Number(p.stock),
                category: p.category,
                thumbnail: p.thumbnail
            }));

            // 6. Останні замовлення для швидкого перегляду
            const { rows: recentRows } = await db.query(`
                SELECT o.id, o.status, o.created_at,
                       COALESCE(u.full_name, 'Гість') AS buyer_name,
                       COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total
                FROM orders o
                LEFT JOIN users u ON u.id = o.buyer_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                GROUP BY o.id, o.status, o.created_at, u.full_name
                ORDER BY o.created_at DESC, o.id DESC
                LIMIT 5
            `);
            const recentOrders = recentRows.map(o => ({
                id: Number(o.id),
                buyerName: o.buyer_name,
                status: STATUS_FROM_DB[o.status] || o.status,
                total: Number(o.total),
                createdAt: o.created_at
            }));

            return res.json({
                success: true,
                stats: {
                    overview,
                    dailySales,
                    topProducts,
                    categorySales,
                    lowStockProducts,
                    recentOrders
                }
            });
        }

        if (action === 'usersList') {
            const { rows } = await db.query(`
                SELECT u.id, u.full_name, u.email, u.role, u.phone, u.city, u.created_at,
                       COUNT(DISTINCT o.id) AS orders_count,
                       COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN oi.quantity * oi.price_at_purchase ELSE 0 END), 0) AS total_spent
                FROM users u
                LEFT JOIN orders o ON o.buyer_id = u.id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                GROUP BY u.id, u.full_name, u.email, u.role, u.phone, u.city, u.created_at
                ORDER BY u.created_at DESC, u.id DESC
            `);
            const users = rows.map(u => ({
                id: Number(u.id),
                name: u.full_name,
                email: u.email,
                role: roleToApi(u.role),
                phone: u.phone || '',
                city: u.city || '',
                orders_count: Number(u.orders_count || 0),
                total_spent: Number(u.total_spent || 0),
                created_at: u.created_at
            }));
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

        if (action === 'userDelete') {
            const id = parseInt(body.id, 10) || 0;
            if (!id) return res.status(422).json({ success: false, message: 'Некорректный id' });

            if (id === req.session.user_id) {
                return res.status(422).json({ success: false, message: 'Нельзя удалить самого себя' });
            }

            const { rows: userRows } = await db.query('SELECT id, full_name FROM users WHERE id = $1 LIMIT 1', [id]);
            if (!userRows.length) {
                return res.status(404).json({ success: false, message: 'Пользователь не найден' });
            }

            try {
                await db.query('DELETE FROM users WHERE id = $1', [id]);
            } catch (e) {
                if (e.code === FK_VIOLATION || e.code === '23001') {
                    return res.status(409).json({
                        success: false,
                        message: 'Нельзя удалить пользователя: за ним закреплены товары в каталоге'
                    });
                }
                throw e;
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
