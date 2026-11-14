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

function parsePriceConstraints(text) {
    let maxPrice = null;
    let minPrice = null;

    const maxMatch = text.match(/(?:до|дешевше|менше|under|below|less\s+than|<=?)\s*(\d+(?:[.,]\d+)?)/i);
    if (maxMatch) {
        maxPrice = parseFloat(maxMatch[1].replace(',', '.'));
    }

    const minMatch = text.match(/(?:від|дорожче|більше|over|above|more\s+than|>=?)\s*(\d+(?:[.,]\d+)?)/i);
    if (minMatch) {
        minPrice = parseFloat(minMatch[1].replace(',', '.'));
    }

    return { maxPrice, minPrice };
}

function extractKeywords(text) {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !['який', 'яка', 'яке', 'які', 'мене', 'мене', 'тобі', 'будь', 'ласка', 'порадь', 'порекомендуй', 'шукаю', 'купити', 'скільки', 'коштує'].includes(w));
}

async function findRelevantProducts(message) {
    try {
        const { maxPrice, minPrice } = parsePriceConstraints(message);
        const keywords = extractKeywords(message);

        const params = [];
        const conditions = [];

        if (maxPrice !== null && !isNaN(maxPrice)) {
            params.push(maxPrice);
            conditions.push(`p.price <= $${params.length}`);
        }

        if (minPrice !== null && !isNaN(minPrice)) {
            params.push(minPrice);
            conditions.push(`p.price >= $${params.length}`);
        }

        if (keywords.length > 0) {
            const wordClauses = [];
            for (const word of keywords.slice(0, 5)) {
                params.push(`%${word}%`);
                const idx = params.length;
                wordClauses.push(`(p.title ILIKE $${idx} OR c.name ILIKE $${idx} OR p.description ILIKE $${idx} OR COALESCE(p.attributes->>'brand', '') ILIKE $${idx})`);
            }
            conditions.push(`(${wordClauses.join(' OR ')})`);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                p.id,
                p.title,
                COALESCE(c.name, 'general') AS category,
                p.price,
                COALESCE(ROUND(AVG(pr.rating)::numeric, 1), ROUND(COALESCE((p.attributes->>'rating')::numeric, 0), 1), 0) AS avg_rating
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN product_reviews pr ON pr.product_id = p.id
            ${whereSql}
            GROUP BY p.id, p.title, c.name, p.price, p.attributes
            ORDER BY avg_rating DESC, p.id ASC
            LIMIT 10
        `;

        const { rows } = await query(sql, params);
        return rows;
    } catch {
        return [];
    }
}

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

    const modelName = process.env.ASSISTANT_MODEL || 'gemini-2.5-flash';

    try {
        const products = await findRelevantProducts(cleanMessage);

        let productListText = 'Товарів за цим запитом не знайдено.';
        if (products.length > 0) {
            productListText = products.map(p =>
                `- ID ${p.id}: "${p.title}" | Категорія: ${p.category} | Ціна: $${Number(p.price).toFixed(2)} | Рейтинг: ${Number(p.avg_rating).toFixed(1)}/5`
            ).join('\n');
        }

        const systemInstruction = `Ти — Нова, віртуальний ІІ-асистент покупців сучасного інтернет-магазину NovaShop.
Твоє завдання — допомагати покупцям з вибором товарів у нашому магазині.
Правила:
1. Відповідай виключно українською мовою, коротко, дружелюбно та приязно.
2. У своєму першому повідомленні обов'язково вкажи, що ти — ІІ-асистент магазину NovaShop.
3. Рекомендуй ТІЛЬКИ товари з наданого нижче списку доступних товарів магазину.
4. Не вигадуй ціни, наявність чи характеристики, яких немає у списку.
5. При відсутності підходящих товарів у списку чесно скажи про це покупцеві.
6. На запитання, які не стосуються магазину, товарів та покупок, ввічливо відмовляйся відповідати, нагадуючи, що ти асистент NovaShop.

Список доступних товарів магазину:
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

        const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
                systemInstruction,
                maxOutputTokens: 500
            }
        });

        const reply = response.text ? response.text.trim() : 'Дякую за звернення! Чим ще можу вам допомогти?';
        return res.json({ reply });
    } catch (err) {
        const isQuota = err.status === 429 || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')));
        const statusCode = isQuota ? 429 : 500;
        const reply = isQuota
            ? 'Перевищено ліміт запитів до асистента. Будь ласка, зачекайте хвилинку і спробуйте знову.'
            : 'Вибачте, сталася тимчасова помилка сервісу. Будь ласка, спробуйте пізніше.';
        return res.status(statusCode).json({ reply });
    }
});

module.exports = router;
