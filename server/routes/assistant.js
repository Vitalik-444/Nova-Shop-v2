const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { query } = require('../db');

const router = express.Router();

const rateLimitMap = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 20;
    const timestamps = rateLimitMap.get(ip) || [];
    const recent = timestamps.filter(t => now - t < windowMs);
    if (recent.length >= maxRequests) {
        return false;
    }
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return true;
}

const STOP_WORDS = new Set([
    'який', 'яка', 'яке', 'які', 'кого', 'чого', 'кому', 'чому', 'ким', 'чим',
    'мене', 'тебе', 'його', 'нас', 'вас', 'них', 'мені', 'тобі', 'йому', 'нам', 'вам', 'їм',
    'будь', 'ласка', 'порадь', 'порекомендуй', 'шукаю', 'купити', 'скільки', 'коштує',
    'добрий', 'день', 'привіт', 'вітаю', 'хочу', 'знайти', 'потрібно', 'підкажи',
    'дешевий', 'дорогий', 'гарний', 'кращий', 'скажи', 'покажи', 'або', 'але', 'щоб',
    'якщо', 'цей', 'ця', 'це', 'ці', 'через', 'після', 'перед',
    'какой', 'какая', 'какое', 'какие', 'кому', 'чему', 'меня', 'тебя', 'его',
    'пожалуйста', 'посоветуй', 'порекомендуй', 'ищу', 'купить', 'сколько', 'стоит',
    'привет', 'здравствуйте', 'хочу', 'найти', 'нужно', 'подскажи', 'дешевый', 'дорогой',
    'хороший', 'лучший', 'скажи', 'покажи', 'или', 'чтобы', 'если', 'этот', 'эта', 'это', 'эти'
]);

function cleanWords(text) {
    if (!text || typeof text !== 'string') return [];
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}

let categoriesCache = {
    data: [],
    expiresAt: 0
};

async function getCategories() {
    const now = Date.now();
    if (categoriesCache.data.length > 0 && categoriesCache.expiresAt > now) {
        return categoriesCache.data;
    }
    try {
        let rows = [];
        try {
            const res = await query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC');
            rows = res.rows;
        } catch {
            const fallbackRes = await query('SELECT DISTINCT name AS category FROM categories ORDER BY name ASC');
            rows = fallbackRes.rows;
        }
        const list = rows.map(r => r.category).filter(Boolean);
        categoriesCache = {
            data: list,
            expiresAt: now + 5 * 60 * 1000
        };
        return list;
    } catch {
        return categoriesCache.data || [];
    }
}

async function search_products(queryText, category) {
    const availableCategories = await getCategories();
    const words = cleanWords(queryText);
    const params = [];
    const conditions = [];

    if (category && typeof category === 'string' && category.trim()) {
        params.push(category.trim().toLowerCase());
        conditions.push(`(LOWER(COALESCE(p.category, c.name, '')) = $${params.length})`);
    }

    let matchScoreSql = '0';
    if (words.length > 0) {
        const wordClauses = [];
        const scoreClauses = [];
        for (const word of words) {
            params.push(`%${word}%`);
            const idx = params.length;
            const clause = `(LOWER(p.title) LIKE LOWER($${idx}) OR LOWER(COALESCE(p.category, c.name, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(p.description, '')) LIKE LOWER($${idx}))`;
            wordClauses.push(clause);
            scoreClauses.push(`CASE WHEN ${clause} THEN 1 ELSE 0 END`);
        }
        conditions.push(`(${wordClauses.join(' OR ')})`);
        matchScoreSql = `(${scoreClauses.join(' + ')})`;
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
        SELECT 
            p.id,
            p.title,
            COALESCE(p.category, c.name, 'general') AS category,
            p.price,
            COALESCE(p.description, '') AS description,
            COALESCE(ROUND(AVG(pr.rating)::numeric, 1), ROUND(COALESCE((p.attributes->>'rating')::numeric, 0), 1), 0) AS avg_rating,
            ${matchScoreSql} AS match_score
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN product_reviews pr ON pr.product_id = p.id
        ${whereSql}
        GROUP BY p.id, p.title, p.category, c.name, p.price, p.description, p.attributes
        ORDER BY match_score DESC, avg_rating DESC, p.id ASC
        LIMIT 8
    `;

    try {
        const { rows } = await query(sql, params);
        if (!rows || rows.length === 0) {
            return {
                products: [],
                available_categories: availableCategories,
                message: `На жаль, за вашим запитом товарів не знайдено. Будь ласка, уточніть запит або виберіть з доступних категорій: ${availableCategories.join(', ')}`
            };
        }
        return {
            products: rows.map(r => ({
                id: r.id,
                title: r.title,
                category: r.category,
                price: Number(r.price),
                avg_rating: Number(r.avg_rating),
                description: r.description
            })),
            count: rows.length
        };
    } catch {
        return {
            products: [],
            available_categories: availableCategories,
            message: `На жаль, за вашим запитом товарів не знайдено. Будь ласка, уточніть запит або виберіть з доступних категорій: ${availableCategories.join(', ')}`
        };
    }
}

async function get_product_details(productId) {
    const id = parseInt(productId, 10) || 0;
    if (!id) return null;
    try {
        const { rows } = await query(`
            SELECT p.id, p.title, COALESCE(p.category, c.name, '') AS category, p.price, p.stock, p.description, p.attributes,
                   COALESCE(ROUND(AVG(pr.rating)::numeric, 1), ROUND(COALESCE((p.attributes->>'rating')::numeric, 0), 1), 0) AS avg_rating
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN product_reviews pr ON pr.product_id = p.id
            WHERE p.id = $1
            GROUP BY p.id, p.title, p.category, c.name, p.price, p.stock, p.description, p.attributes
        `, [id]);
        return rows[0] || null;
    } catch {
        return null;
    }
}

async function get_product_reviews(productId) {
    const id = parseInt(productId, 10) || 0;
    if (!id) return [];
    try {
        const { rows } = await query(`
            SELECT pr.id, pr.rating, pr.comment, pr.created_at, COALESCE(u.full_name, 'Користувач') AS user_name
            FROM product_reviews pr
            LEFT JOIN users u ON u.id = pr.buyer_id
            WHERE pr.product_id = $1
            ORDER BY pr.created_at DESC
            LIMIT 5
        `, [id]);
        return rows;
    } catch {
        return [];
    }
}

async function get_my_orders(userId) {
    if (!userId) return [];
    try {
        const { rows } = await query(`
            SELECT o.id, o.status, o.created_at,
                   COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total,
                   COUNT(oi.product_id) AS items_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.buyer_id = $1
            GROUP BY o.id, o.status, o.created_at
            ORDER BY o.created_at DESC
            LIMIT 5
        `, [userId]);
        return rows;
    } catch {
        return [];
    }
}

async function get_my_cart(userId) {
    if (!userId) return [];
    try {
        const { rows } = await query(`
            SELECT uc.quantity, p.id, p.title, p.price, (uc.quantity * p.price) AS subtotal
            FROM user_cart uc
            JOIN products p ON p.id = uc.product_id
            WHERE uc.user_id = $1
        `, [userId]);
        return rows;
    } catch {
        return [];
    }
}

async function get_my_favorites(userId) {
    if (!userId) return [];
    try {
        const { rows } = await query(`
            SELECT p.id, p.title, p.price, COALESCE(p.category, c.name, '') AS category
            FROM user_favorites uf
            JOIN products p ON p.id = uf.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE uf.user_id = $1
        `, [userId]);
        return rows;
    } catch {
        return [];
    }
}

async function propose_add_to_cart(productId, quantity = 1) {
    const p = await get_product_details(productId);
    if (!p) return { success: false, message: 'Товар не знайдено' };
    return {
        success: true,
        action: 'propose_add_to_cart',
        product: {
            id: p.id,
            title: p.title,
            price: Number(p.price),
            quantity: Math.max(1, parseInt(quantity, 10) || 1)
        }
    };
}

async function logAssistantQuery(userId, userIp, userQuery, reply, foundCount) {
    try {
        await query(
            `INSERT INTO assistant_logs (user_id, user_ip, query, reply, found_products_count, created_at)
             VALUES ($1, $2, $3, $4, $5, now())`,
            [userId || null, userIp || null, userQuery, reply, foundCount || 0]
        );
    } catch {}
}

async function requireAdmin(req, res, next) {
    if (!req.session?.user_id) {
        return res.status(401).json({ success: false, message: 'Необхідно авторизуватися' });
    }
    try {
        const { rows } = await query('SELECT role FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
        if (!rows.length || rows[0].role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Доступ лише для адміністратора' });
        }
        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Помилка авторизації' });
    }
}

router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const { rows: dailyRequests } = await query(`
            SELECT 
                to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
                COUNT(*)::int AS requests_count,
                COUNT(*) FILTER (WHERE found_products_count = 0)::int AS zero_results_count
            FROM assistant_logs
            GROUP BY date_trunc('day', created_at)
            ORDER BY day DESC
            LIMIT 30
        `);

        const { rows: topQueries } = await query(`
            SELECT 
                LOWER(TRIM(query)) AS query,
                COUNT(*)::int AS count,
                COALESCE(ROUND(AVG(found_products_count)::numeric, 1), 0) AS avg_found
            FROM assistant_logs
            GROUP BY LOWER(TRIM(query))
            ORDER BY count DESC
            LIMIT 10
        `);

        const { rows: zeroResultsRows } = await query(`
            SELECT 
                COUNT(*)::int AS total_requests,
                COUNT(*) FILTER (WHERE found_products_count = 0)::int AS zero_results_requests,
                COALESCE(
                    ROUND(
                        (COUNT(*) FILTER (WHERE found_products_count = 0)::numeric / NULLIF(COUNT(*), 0)) * 100, 
                        2
                    ), 
                    0
                )::numeric(5,2) AS zero_results_percentage
            FROM assistant_logs
        `);

        const { rows: userRankings } = await query(`
            SELECT 
                u.id AS user_id,
                COALESCE(u.full_name, 'Анонімний користувач') AS user_name,
                u.email AS user_email,
                COUNT(a.id)::int AS requests_count,
                ROW_NUMBER() OVER (ORDER BY COUNT(a.id) DESC) AS row_num,
                RANK() OVER (ORDER BY COUNT(a.id) DESC) AS rank
            FROM assistant_logs a
            LEFT JOIN users u ON u.id = a.user_id
            WHERE a.user_id IS NOT NULL
            GROUP BY u.id, u.full_name, u.email
            ORDER BY rank ASC
            LIMIT 20
        `);

        return res.json({
            success: true,
            stats: {
                dailyRequests,
                topQueries,
                zeroResultsShare: zeroResultsRows[0] || { total_requests: 0, zero_results_requests: 0, zero_results_percentage: 0 },
                userRankings
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Помилка отримання статистики' });
    }
});

router.post('/', async (req, res) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ reply: 'Забагато запитів. Будь ласка, зачекайте хвилину і спробуйте знову.' });
    }

    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ reply: 'Будь ласка, введіть повідомлення.' });
    }

    const cleanMessage = message.trim().slice(0, 500);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ reply: 'Сервіс асистента тимчасово недоступний. Будь ласка, зверніться пізніше.' });
    }

    const modelName = process.env.ASSISTANT_MODEL || 'gemini-3.1-flash-lite';

    try {
        const categoriesList = await getCategories();
        const searchResult = await search_products(cleanMessage);
        const foundCount = searchResult.products ? searchResult.products.length : 0;

        let productListText = searchResult.message || 'Товарів не знайдено.';
        if (searchResult.products && searchResult.products.length > 0) {
            productListText = searchResult.products.map(p =>
                `- ID ${p.id}: "${p.title}" | Категорія: ${p.category} | Ціна: $${Number(p.price).toFixed(2)} | Рейтинг: ${Number(p.avg_rating).toFixed(1)}/5`
            ).join('\n');
        }

        const systemInstruction = `Ти — Нова, віртуальний ІІ-асистент покупців сучасного інтернет-магазину NovaShop.
Доступні категорії: ${categoriesList.join(', ')}

Правила:
1. Відповідай виключно українською мовою, коротко, дружелюбно та приязно.
2. У своєму першому повідомленні обов'язково вкажи, що ти — ІІ-асистент магазину NovaShop.
3. У параметр category функції search_products підставляй тільки значення зі списку доступних категорій. Якщо запит розпливчатий, зістав його з підходящими категоріями і за потреби виклич пошук кілька разів.
4. Рекомендуй ТІЛЬКИ товари з наданого списку знайдених товарів магазину.
5. Не вигадуй ціни, наявність чи характеристики, яких немає у списку.
6. При відсутності підходящих товарів чесно про це говори та запропонуй обрати серед доступних категорій.
7. На запитання, які не стосуються магазину, товарів та покупок, ввічливо відмовляйся відповідати, нагадуючи, що ти асистент NovaShop.

Знайдені товари за запитом:
${productListText}`;

        const sanitizedHistory = Array.isArray(history)
            ? history
                .slice(-10)
                .filter(item => item && (item.role === 'user' || item.role === 'model') && typeof item.content === 'string' && item.content.trim())
                .map(item => ({
                    role: item.role,
                    parts: [{ text: item.content.trim().slice(0, 500) }]
                }))
            : [];

        const contents = [
            ...sanitizedHistory,
            {
                role: 'user',
                parts: [{ text: cleanMessage }]
            }
        ];

        const ai = new GoogleGenAI({ apiKey });

        const callWithTimeout = (model, timeoutMs = 8000) => {
            return Promise.race([
                ai.models.generateContent({
                    model,
                    contents,
                    config: {
                        systemInstruction,
                        maxOutputTokens: 500
                    }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
            ]);
        };

        let response;
        try {
            response = await callWithTimeout(modelName, 8000);
        } catch (callErr) {
            if (modelName !== 'gemini-3.1-flash-lite') {
                response = await callWithTimeout('gemini-3.1-flash-lite', 8000);
            } else {
                throw callErr;
            }
        }

        const reply = response.text ? response.text.trim() : 'Дякую за звернення! Чим ще можу вам допомогти?';

        await logAssistantQuery(req.session?.user_id, clientIp, cleanMessage, reply, foundCount);

        return res.json({ reply });
    } catch (err) {
        const isQuota = err.status === 429 || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')));
        const statusCode = isQuota ? 429 : 500;
        const reply = isQuota
            ? 'Перевищено ліміт запитів до асистента. Будь ласка, зачекайте хвилинку і спробуйте знову.'
            : 'Вибачте, сталася тимчасова помилка сервісу. Будь ласка, спробуйте пізніше.';

        await logAssistantQuery(req.session?.user_id, clientIp, cleanMessage, reply, 0);

        return res.status(statusCode).json({ reply });
    }
});

module.exports = router;
module.exports.search_products = search_products;
module.exports.get_product_details = get_product_details;
module.exports.get_product_reviews = get_product_reviews;
module.exports.get_my_orders = get_my_orders;
module.exports.get_my_cart = get_my_cart;
module.exports.get_my_favorites = get_my_favorites;
module.exports.propose_add_to_cart = propose_add_to_cart;
module.exports.getCategories = getCategories;
