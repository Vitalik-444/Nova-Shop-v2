const express = require('express');
const { withTransaction } = require('../db');
const { db, STATUS_FROM_DB } = require('../lib/mapping');
const { sendMail } = require('../mailer');
const router = express.Router();

function buildOrderEmailHtml(orderId, customer, items, total) {
    const deliveryLabels = { courier: 'Курьером', post: 'В отделение почты', pickup: 'Самовывоз' };
    const paymentLabels = { card: 'Картой онлайн', cash: 'При получении', invoice: 'Счет для оплаты' };

    let rows = '';
    for (const item of items) {
        const title = (item.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const quantity = item.quantity || 1;
        const lineTotal = (item.price || 0) * quantity;
        rows += `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;">${title}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${lineTotal.toFixed(2)} $</td>
        </tr>`;
    }

    const delivery = deliveryLabels[customer.delivery] || customer.delivery;
    const payment = paymentLabels[customer.payment] || customer.payment;

    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222;">
        <h2 style="color:#4b3aff;">Спасибо за заказ, ${customer.name} ${customer.surname}!</h2>
        <p>Ваш заказ <strong>№${orderId}</strong> принят и передан в обработку.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
                <tr>
                    <th style="text-align:left;border-bottom:2px solid #4b3aff;padding-bottom:8px;">Товар</th>
                    <th style="text-align:center;border-bottom:2px solid #4b3aff;padding-bottom:8px;">Кол-во</th>
                    <th style="text-align:right;border-bottom:2px solid #4b3aff;padding-bottom:8px;">Сумма</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p style="text-align:right;font-size:18px;"><strong>Итого: ${total.toFixed(2)} $</strong></p>
        <h3>Данные доставки</h3>
        <p>
            Адрес: ${customer.address}, ${customer.city}, ${customer.postcode}<br>
            Телефон: ${customer.phone}<br>
            Способ доставки: ${delivery}<br>
            Способ оплаты: ${payment}
        </p>
    </div>`;
}

class StockError extends Error {}

router.all('/', async (req, res) => {
    const action = req.query.action || '';
    const body = req.body || {};

    try {
        if (action === 'create') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Необходимо авторизоваться' });

            const rawItems = Array.isArray(body.items) ? body.items : [];
            const customer = body.customer || {};

            if (!rawItems.length) return res.status(422).json({ success: false, message: 'Корзина пуста' });

            const requiredFields = ['name', 'surname', 'phone', 'email', 'city', 'postcode', 'address', 'delivery', 'payment'];
            for (const field of requiredFields) {
                if (!customer[field]) return res.status(422).json({ success: false, message: 'Заполните все обязательные поля' });
            }

            const email = (customer.email || '').trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return res.status(422).json({ success: false, message: 'Введите корректный Email' });
            customer.email = email;

            // позиції з однаковим id зливаємо: у order_items первинний ключ (order_id, product_id)
            const qty = new Map();
            for (const item of rawItems) {
                const id = parseInt(item.id, 10) || 0;
                if (id <= 0) continue;
                qty.set(id, (qty.get(id) || 0) + Math.max(1, parseInt(item.quantity, 10) || 1));
            }
            if (!qty.size) return res.status(422).json({ success: false, message: 'Корзина пуста' });

            let orderId, total = 0, items = [];

            try {
                await withTransaction(async client => {
                    // Блокуємо рядки товарів (FOR UPDATE) у порядку id — без гонки за залишок і без дедлоків
                    const ids = [...qty.keys()].sort((a, b) => a - b);
                    const { rows: prods } = await client.query(
                        'SELECT id, title, price, stock FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE', [ids]);
                    if (prods.length !== ids.length) throw new StockError('Один из товаров больше не доступен');

                    for (const p of prods) {
                        const quantity = qty.get(p.id);
                        if (p.stock < quantity) {
                            throw new StockError(`Недостаточно товара «${p.title}» на складе: осталось ${p.stock}, в заказе ${quantity}`);
                        }
                        const price = Number(p.price);
                        total += price * quantity;
                        items.push({ id: p.id, title: p.title, price, quantity });
                    }

                    // 1) замовлення, 2) позиції (ціна на момент покупки), 3) списання залишку, 4) очистка кошика
                    const order = await client.query(
                        `INSERT INTO orders (buyer_id, status, customer_data) VALUES ($1, 'pending', $2) RETURNING id`,
                        [req.session.user_id, customer]);
                    orderId = order.rows[0].id;

                    for (const it of items) {
                        await client.query(
                            'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                            [orderId, it.id, it.quantity, it.price]);
                        await client.query('UPDATE products SET stock = stock - $2 WHERE id = $1', [it.id, it.quantity]);
                    }

                    await client.query('DELETE FROM user_cart WHERE user_id = $1', [req.session.user_id]);
                });
            } catch (e) {
                if (e instanceof StockError) return res.status(409).json({ success: false, message: e.message });
                throw e;
            }

            let emailSent = true;
            let emailError = null;
            try {
                const subject = `NovaShop — заказ №${orderId} подтверждён`;
                const html = buildOrderEmailHtml(orderId, customer, items, total);
                await sendMail(customer.email, `${customer.name} ${customer.surname}`, subject, html);
            } catch (mailError) {
                emailSent = false;
                emailError = mailError.message;
                console.error(`Order #${orderId} email failed: ${emailError}`);
            }

            return res.json({ success: true, order_id: orderId, email_sent: emailSent, email_error: emailError });
        }

        if (action === 'list') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Необходимо авторизоваться' });

            // сума замовлення рахується з order_items, як і у view order_totals
            const { rows: orders } = await db.query(
                `SELECT o.id, o.status, o.created_at,
                        COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total
                 FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
                 WHERE o.buyer_id = $1
                 GROUP BY o.id ORDER BY o.created_at DESC, o.id DESC`, [req.session.user_id]);

            const itemsByOrder = {};
            if (orders.length) {
                const { rows: allItems } = await db.query(
                    `SELECT oi.order_id, oi.product_id, p.title, oi.price_at_purchase AS price, oi.quantity
                     FROM order_items oi JOIN products p ON p.id = oi.product_id
                     WHERE oi.order_id = ANY($1::int[]) ORDER BY oi.product_id`, [orders.map(o => o.id)]);
                for (const item of allItems) {
                    (itemsByOrder[item.order_id] ||= []).push({
                        product_id: Number(item.product_id),
                        title: item.title,
                        price: Number(item.price),
                        quantity: Number(item.quantity)
                    });
                }
            }

            return res.json({
                success: true,
                orders: orders.map(o => ({
                    id: o.id,
                    total: Number(o.total),
                    status: STATUS_FROM_DB[o.status] || o.status,
                    created_at: o.created_at,
                    items: itemsByOrder[o.id] || []
                }))
            });
        }

        return res.status(404).json({ success: false, message: 'Неизвестное действие' });
    } catch (error) {
        console.error('Orders Error:', error);
        return res.status(500).json({ success: false, message: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;
