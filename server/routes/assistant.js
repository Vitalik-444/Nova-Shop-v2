const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { query } = require('../db');
const { getProductTitle, getProductDescription, getCategoryTitle, resolveCategorySlug } = require('../lib/productTranslations');

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
    'розкажи', 'розкажіть', 'опиши', 'опишіть', 'перелічи', 'перерахуй', 'поділися',
    'про', 'для', 'від', 'під', 'над', 'просто', 'дуже', 'всі', 'весь', 'вся', 'все',
    'товари', 'товар', 'товарами', 'товарах', 'наявні', 'наявність', 'наявності', 'є', 'маєте', 'що',
    'як', 'де', 'хто', 'чого', 'куди', 'звідки', 'цікаве', 'магазин', 'магазині', 'асортимент',
    'какой', 'какая', 'какое', 'какие', 'кому', 'чему', 'меня', 'тебя', 'его',
    'пожалуйста', 'посоветуй', 'порекомендуй', 'ищу', 'купить', 'сколько', 'стоит',
    'привет', 'здравствуйте', 'хочу', 'найти', 'нужно', 'подскажи', 'дешевый', 'дорогой',
    'хороший', 'лучший', 'скажи', 'покажи', 'или', 'чтобы', 'если', 'этот', 'эта', 'это', 'эти',
    'расскажи', 'расскажите', 'товары', 'товаров', 'магазине', 'наличии', 'есть',
    'the', 'and', 'for', 'with', 'from', 'about', 'what', 'which', 'who', 'how', 'where', 'when',
    'why', 'can', 'you', 'please', 'tell', 'show', 'recommend', 'look', 'find', 'buy', 'cheap',
    'expensive', 'good', 'best', 'this', 'that', 'these', 'those', 'products', 'product', 'items', 'store'
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

async function getCategories(lang = 'uk') {
    const now = Date.now();
    if (categoriesCache.data.length > 0 && categoriesCache.expiresAt > now) {
        return categoriesCache.data.map(c => getCategoryTitle(c, lang));
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
        return list.map(c => getCategoryTitle(c, lang));
    } catch {
        return (categoriesCache.data || []).map(c => getCategoryTitle(c, lang));
    }
}

async function search_products(queryText, category, lang = 'uk') {
    const availableCategories = await getCategories(lang);
    const categorySlug = category ? resolveCategorySlug(category) : resolveCategorySlug(queryText);
    const rawWords = cleanWords(queryText);
    const words = categorySlug ? rawWords.filter(w => resolveCategorySlug(w) !== categorySlug) : rawWords;

    const params = [];
    const conditions = [];

    if (categorySlug) {
        params.push(categorySlug.toLowerCase());
        const idx = params.length;
        conditions.push(`(
            LOWER(COALESCE(p.category, c.name, '')) = $${idx} 
            OR LOWER(COALESCE(c.name, '')) = $${idx}
        )`);
    }

    let matchScoreSql = '0';
    if (words.length > 0) {
        const wordClauses = [];
        const scoreClauses = [];
        for (const word of words) {
            params.push(`%${word}%`);
            const idx = params.length;
            const clause = `(
                LOWER(p.title) LIKE LOWER($${idx}) 
                OR LOWER(COALESCE(p.attributes->>'title_uk', '')) LIKE LOWER($${idx})
                OR LOWER(COALESCE(p.category, c.name, '')) LIKE LOWER($${idx}) 
                OR LOWER(COALESCE(p.description, '')) LIKE LOWER($${idx})
                OR LOWER(COALESCE(p.attributes->>'description_uk', '')) LIKE LOWER($${idx})
            )`;
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
            p.stock,
            p.attributes,
            COALESCE(p.attributes->>'title_uk', '') AS title_uk,
            COALESCE(p.category, c.name, 'general') AS category,
            p.price,
            COALESCE(p.description, '') AS description,
            COALESCE(p.attributes->>'description_uk', '') AS description_uk,
            COALESCE(ROUND(AVG(pr.rating)::numeric, 1), ROUND(COALESCE((p.attributes->>'rating')::numeric, 0), 1), 0) AS avg_rating,
            ${matchScoreSql} AS match_score
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN product_reviews pr ON pr.product_id = p.id
        ${whereSql}
        GROUP BY p.id, p.title, p.stock, p.category, c.name, p.price, p.description, p.attributes
        ORDER BY match_score DESC, avg_rating DESC, p.price ASC, p.id ASC
        LIMIT 8
    `;

    try {
        let { rows } = await query(sql, params);

        if ((!rows || rows.length === 0) && categorySlug) {
            const fallbackRes = await query(`
                SELECT 
                    p.id,
                    p.title,
                    p.stock,
                    p.attributes,
                    COALESCE(p.attributes->>'title_uk', '') AS title_uk,
                    COALESCE(p.category, c.name, 'general') AS category,
                    p.price,
                    COALESCE(p.description, '') AS description,
                    COALESCE(p.attributes->>'description_uk', '') AS description_uk,
                    COALESCE(ROUND(AVG(pr.rating)::numeric, 1), ROUND(COALESCE((p.attributes->>'rating')::numeric, 0), 1), 0) AS avg_rating,
                    1 AS match_score
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN product_reviews pr ON pr.product_id = p.id
                WHERE LOWER(COALESCE(p.category, c.name, '')) = $1
                GROUP BY p.id, p.title, p.stock, p.category, c.name, p.price, p.description, p.attributes
                ORDER BY avg_rating DESC, p.price ASC, p.id ASC
                LIMIT 8
            `, [categorySlug.toLowerCase()]);
            rows = fallbackRes.rows;
        }

        if (!rows || rows.length === 0) {
            return {
                products: [],
                available_categories: availableCategories,
                message: lang === 'en'
                    ? `Unfortunately, no products were found for your query. Please clarify your request or choose from available categories: ${availableCategories.join(', ')}`
                    : `На жаль, за вашим запитом товарів не знайдено. Будь ласка, уточніть запит або виберіть з доступних категорій: ${availableCategories.join(', ')}`
            };
        }
        return {
            products: rows.map(r => {
                const titleEn = getProductTitle(r.title, 'en');
                const titleUk = r.title_uk || getProductTitle(r.title, 'uk');
                const descEn = getProductDescription(r.description, 'en') || r.description || '';
                const descUk = r.description_uk || getProductDescription(r.description, 'uk') || getProductDescription(r.id, 'uk') || '';
                const catEn = getCategoryTitle(r.category, 'en');
                const catUk = getCategoryTitle(r.category, 'uk');
                const thumbnail = r.attributes?.thumbnail || (Array.isArray(r.attributes?.images) && r.attributes.images[0]) || '/images/banner.png';

                return {
                    id: r.id,
                    title: lang === 'en' ? titleEn : titleUk,
                    title_en: titleEn,
                    title_uk: titleUk,
                    category: lang === 'en' ? catEn : catUk,
                    category_en: catEn,
                    category_uk: catUk,
                    price: Number(r.price),
                    avg_rating: Number(r.avg_rating),
                    stock: Number(r.stock) || 0,
                    thumbnail,
                    description: lang === 'en' ? descEn : descUk,
                    description_en: descEn,
                    description_uk: descUk
                };
            }),
            count: rows.length
        };
    } catch {
        return {
            products: [],
            available_categories: availableCategories,
            message: lang === 'en'
                ? `Unfortunately, no products were found for your query. Please clarify your request or choose from available categories: ${availableCategories.join(', ')}`
                : `На жаль, за вашим запитом товарів не знайдено. Будь ласка, уточніть запит або виберіть з доступних категорій: ${availableCategories.join(', ')}`
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

function isProductSearchIntent(message, currentProductId) {
    const text = (message || '').toLowerCase().trim();
    if (!text) return false;

    // Check if it's purely greeting or farewell
    const isSmallTalk = /^(привіт|вітаю|добрий день|доброго дня|здравствуйте|привет|hello|hi|hey|дякую|спасиб|thanks|thank you|пока|бувай|до побачення)[\s!.,?]*$/i.test(text);
    if (isSmallTalk) return false;

    // Questions exclusively about delivery, payment, warranty, contacts, store hours
    const isServiceQuery = /(доставк|оплат|гаранті|повернен|шоурум|хрещатик|крещатик|контакт|телефон|номер|графік|роботи|де ви|де знаходитесь|замовленн|де мій|де моє|мій заказ|статус замовлення|у кошику|в корзині|delivery|shipping|payment|warranty|guarantee|refund|return|contact|hours|schedule|where are you|my order|track order|in cart)/i.test(text);

    // Markers showing the user explicitly wants to find, choose, buy or compare products
    const hasSearchMarkers = /(порадь|порекомендуй|посоветуй|підкажи|шукаю|ищу|купити|купить|покажи|знайди|найди|хочу|вибрати|выбрать|який краще|какой лучше|що вибрати|что выбрать|ціна на|цена на|скільки коштує|сколько стоит|чи є в наявності|есть ли в наличии|є у вас|есть у вас|підібрати|подобрать|асортимент|каталог|порівня|сравни|різниц|разниц|що краще|что лучше| vs |проти|recommend|suggest|show|find|search|buy|looking for|choose|which is better|how much is|price of|in stock|available|compare|difference|versus)/i.test(text);

    // Explicit product categories / keywords
    const hasCategoryWords = /(ноутбук|смартфон|телефон|навушник|наушник|годинник|часы|планшет|духи|парфум|меблі|мебель|крісло|стіл|стол|монітор|монитор|клавіатур|мишк|чохол|чехол|павербанк|powerbank|зарядк|аксесуар|телевізор|колонк|акустик|laptop|smartphone|phone|headphones|earphones|smartwatch|watch|tablet|perfume|furniture|chair|desk|table|monitor|keyboard|mouse|powerbank|charger|accessory|tv|television|speaker)/i.test(text);

    // On a product page, asking about alternatives:
    const hasAlternativeMarkers = Boolean(currentProductId && /(аналог|дешев|інш|другой|схож|похож|замін|кращ|cheaper|alternative|similar)/i.test(text));

    if (isServiceQuery && !hasSearchMarkers && !hasCategoryWords) {
        return false;
    }

    return hasSearchMarkers || hasCategoryWords || hasAlternativeMarkers;
}

router.post('/', async (req, res) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const userId = req.session?.user_id;

    const { message, history, language, currentProductId, stream: reqStream } = req.body || {};
    const cleanMessage = (typeof message === 'string' ? message : '').trim().slice(0, 500);
    const isEn = language === 'en' || (!language && !/[а-яіїєґ]/i.test(cleanMessage));

    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({
            reply: isEn
                ? 'Too many requests. Please wait a minute and try again.'
                : 'Забагато запитів. Будь ласка, зачекайте хвилину і спробуйте знову.'
        });
    }

    if (!cleanMessage) {
        return res.status(400).json({
            reply: isEn
                ? 'Please enter a message.'
                : 'Будь ласка, введіть повідомлення.'
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            reply: isEn
                ? 'The assistant service is temporarily unavailable. Please try again later.'
                : 'Сервіс асистента тимчасово недоступний. Будь ласка, зверніться пізніше.'
        });
    }

    try {
        const categoriesList = await getCategories();
        const userWantsProducts = isProductSearchIntent(cleanMessage, currentProductId);
        
        let searchResult = { products: [] };
        let foundCount = 0;
        if (userWantsProducts) {
            searchResult = await search_products(cleanMessage, undefined, isEn ? 'en' : 'uk');
            foundCount = searchResult.products ? searchResult.products.length : 0;
        }

        // Context of currently viewed product on the page (if on #/product/:id)
        let viewedProductContext = '';
        let viewedProduct = null;
        if (currentProductId) {
            viewedProduct = await get_product_details(currentProductId);
            if (viewedProduct) {
                const vTitle = isEn ? getProductTitle(viewedProduct.title, 'en') : (viewedProduct.attributes?.title_uk || viewedProduct.title);
                const vDesc = isEn ? (getProductDescription(viewedProduct.description, 'en') || viewedProduct.description) : (viewedProduct.attributes?.description_uk || viewedProduct.description);
                viewedProductContext = isEn
                    ? `\nCURRENTLY VIEWED PRODUCT BY USER:\n- ID ${viewedProduct.id}: "${vTitle}" | Category: ${viewedProduct.category} | Price: $${Number(viewedProduct.price).toFixed(2)} | Rating: ${Number(viewedProduct.avg_rating).toFixed(1)}/5 | Stock: ${Number(viewedProduct.stock) > 0 ? 'In stock' : 'Out of stock'}\n- Description: ${vDesc}\nIf user asks about specs, stock, warranty, or alternatives, they are referring to this product!\n`
                    : `\nТОВАР, ЯКИЙ ЗАРАЗ ПЕРЕГЛЯДАЄ КОРИСТУВАЧ:\n- ID ${viewedProduct.id}: "${vTitle}" | Категорія: ${viewedProduct.category} | Ціна: $${Number(viewedProduct.price).toFixed(2)} | Рейтинг: ${Number(viewedProduct.avg_rating).toFixed(1)}/5 | Наявність: ${Number(viewedProduct.stock) > 0 ? 'В наявності' : 'Немає в наявності'}\n- Опис: ${vDesc}\nЯкщо користувач запитує про характеристики, наявність, гарантію або аналоги — він має на увазі саме цей товар!\n`;
            }
        }

        // Context of user orders and cart (if asking about them)
        let userContext = '';
        const lowerMsg = cleanMessage.toLowerCase();
        const asksOrders = /замовленн|order|де мій|статус|покупк/i.test(lowerMsg);
        const asksCart = /кошик|корзин|cart/i.test(lowerMsg);

        if (userId) {
            if (asksOrders) {
                const orders = await get_my_orders(userId);
                if (orders && orders.length > 0) {
                    userContext += isEn
                        ? `\nUSER ORDERS HISTORY:\n` + orders.map(o => `- Order #${o.id}: Status "${o.status}", Items: ${o.items_count}, Total: $${Number(o.total).toFixed(2)}, Date: ${new Date(o.created_at).toLocaleDateString()}`).join('\n') + '\n'
                        : `\nІСТОРІЯ ЗАМОВЛЕНЬ КОРИСТУВАЧА:\n` + orders.map(o => `- Замовлення #${o.id}: Статус "${o.status}", Товарів: ${o.items_count}, Сума: $${Number(o.total).toFixed(2)}, Дата: ${new Date(o.created_at).toLocaleDateString()}`).join('\n') + '\n';
                } else {
                    userContext += isEn ? `\nUser currently has no past orders.\n` : `\nУ користувача ще немає оформлених замовлень.\n`;
                }
            }
            if (asksCart) {
                const cartItems = await get_my_cart(userId);
                if (cartItems && cartItems.length > 0) {
                    userContext += isEn
                        ? `\nUSER CURRENT CART:\n` + cartItems.map(c => `- ${c.title} x${c.quantity} ($${Number(c.subtotal).toFixed(2)})`).join('\n') + '\n'
                        : `\nПОТОЧНИЙ КОШИК КОРИСТУВАЧА:\n` + cartItems.map(c => `- ${c.title} x${c.quantity} ($${Number(c.subtotal).toFixed(2)})`).join('\n') + '\n';
                } else {
                    userContext += isEn ? `\nUser cart is currently empty.\n` : `\nКошик користувача порожній.\n`;
                }
            }
        } else if (asksOrders || asksCart) {
            userContext += isEn
                ? `\nNote: The user is a guest (not logged in). If they ask about personal orders or cart, politely invite them to [Log In](#/login).\n`
                : `\nПримітка: Користувач не авторизований (гість). Якщо він запитує про власні замовлення чи кошик, ввічливо запропонуй йому [Увійти](#/login).\n`;
        }

        // Reviews context (Scenario 4: Review Summarization)
        let reviewsContext = '';
        const asksReviews = /відгук|отзыв|review|враженн|думк|що кажуть/i.test(lowerMsg);
        if (asksReviews && viewedProduct) {
            const reviews = await get_product_reviews(viewedProduct.id);
            if (reviews && reviews.length > 0) {
                const reviewsText = reviews.map(r => `- ${r.rating}★ [${r.user_name}]: "${r.comment}"`).join('\n');
                reviewsContext = isEn
                    ? `\nREAL CUSTOMER REVIEWS FROM DATABASE FOR THIS PRODUCT:\n${reviewsText}\nRule: Summarize what real customers like (Pros) and dislike (Cons). Provide a concise verdict with average score.\n`
                    : `\nРЕАЛЬНІ ВІДГУКИ ПОКУПЦІВ З БАЗИ МАГАЗИНУ ДЛЯ ЦЬОГО ТОВАРУ:\n${reviewsText}\nПравило: Підсумуй, що подобається покупцям (Плюси) і що не подобається (Мінуси). Надай стислий підсумок із середнім балом.\n`;
            } else {
                reviewsContext = isEn
                    ? `\nNote: There are no customer reviews in the database yet for this product. Mention this honestly, noting the store's official warranty.\n`
                    : `\nПримітка: У базі магазину поки що немає текстових відгуків на цей товар. Вкажи це чесно та нагадай про офіційну гарантію магазину.\n`;
            }
        }

        // Comparison context (Scenario 3: Side-by-side comparison)
        let comparisonProducts = [];
        let comparisonContext = '';
        const asksComparison = /порівня|сравни|різниц|разниц|що краще|что лучше| vs |проти|compar|difference|versus|which is better/i.test(lowerMsg);
        if (asksComparison) {
            if (viewedProduct) {
                comparisonProducts.push(viewedProduct);
                if (searchResult.products) {
                    for (const p of searchResult.products) {
                        if (p.id !== viewedProduct.id) {
                            comparisonProducts.push(p);
                            break;
                        }
                    }
                }
            } else if (searchResult.products && searchResult.products.length >= 2) {
                comparisonProducts = searchResult.products.slice(0, 2);
            }
            if (comparisonProducts.length >= 2) {
                comparisonContext = isEn
                    ? `\nPRODUCT COMPARISON REQUEST:\nCompare "${comparisonProducts[0].title}" ($${comparisonProducts[0].price}) vs "${comparisonProducts[1].title}" ($${comparisonProducts[1].price}). Highlight key differences in price, specs, and give a recommendation for who each product suits best.\n`
                    : `\nЗАПИТ НА ПОРІВНЯННЯ ТОВАРІВ:\nПорівняй "${comparisonProducts[0].title}" ($${comparisonProducts[0].price}) та "${comparisonProducts[1].title}" ($${comparisonProducts[1].price}). Виділи ключові відмінності в ціні, характеристиках та підкажи, кому яка модель підійде краще.\n`;
            }
        }

        let productListText = '';
        if (userWantsProducts) {
            productListText = searchResult.message || (isEn ? 'No products found.' : 'Товарів не знайдено.');
            if (searchResult.products && searchResult.products.length > 0) {
                productListText = searchResult.products.map(p => {
                    if (isEn) {
                        return `- ID ${p.id}: "${p.title}" | Category: ${p.category} | Price: $${Number(p.price).toFixed(2)} | Rating: ${Number(p.avg_rating).toFixed(1)}/5 | Description: ${p.description || ''}`;
                    }
                    return `- ID ${p.id}: "${p.title_uk || p.title}" | Категорія: ${p.category} | Ціна: $${Number(p.price).toFixed(2)} | Рейтинг: ${Number(p.avg_rating).toFixed(1)}/5 | Опис: ${p.description_uk || p.description || ''}`;
                }).join('\n');
            }
        }

        const systemInstruction = isEn
            ? `You are Nova, the virtual AI assistant for customers of the modern NovaShop online store.
You have full access to the store's product catalog (over 190 products across 24 categories, including laptops, smartphones, furniture, fragrances, beauty, groceries, home decor, etc.).
Available categories: ${categoriesList.join(', ')}

Store Information & Policies:
- Delivery: Nova Poshta (branch/locker 1-2 days, free from 1500 ₴; courier to door, free from 3000 ₴), Ukrposhta Express (2-4 days, free from 1200 ₴), Free pickup from Flagship Showroom in Kyiv (Khreshchatyk 24, ready in 15 mins).
- Payment: Visa/Mastercard/Apple Pay/Google Pay (0% fee), Cash on Delivery at post office (after inspection), 0% Installments via Monobank (up to 6 months) and PrivatBank (up to 10 months), Business invoicing with VAT.
- Warranty & Returns: 100% official manufacturer warranty (12-36 months), 14 days easy returns/exchanges under consumer protection law, 120+ authorized service centers across Ukraine.
- Showroom & Contacts: Kyiv, Khreshchatyk 24 (Mon-Sun 09:00 - 20:00). Phone: +380 63 741 79 80, Email: nova444shop@gmail.com.

Rules:
1. Answer in English, briefly, friendly, and politely.
2. In your first message, state that you are Nova, the AI assistant for NovaShop.
3. If the user asks about delivery, payment, warranty, returns, store hours, or showroom, provide accurate details based on Store Information & Policies above.
4. Recommend or suggest products ONLY when the user explicitly asks for products, recommendations, prices, or shopping advice. If the user is asking a service question (delivery, warranty, payment, order status) or greeting, answer directly and DO NOT recommend unwanted random products.
5. If products are recommended, format product links as [Product Name](#/product/ID) so users can easily click and view them.
6. Do not invent prices or products that do not exist.
7. Politely decline questions that are not related to the store, products, and shopping.

Products in catalog for this query:
${productListText}
${viewedProductContext}${userContext}${reviewsContext}${comparisonContext}`
            : `Ти — Нова, віртуальний AI-асистент покупців сучасного інтернет-магазину NovaShop.
Ти маєш повний доступ до каталогу товарів магазину (понад 190 товарів у 24 категоріях, включаючи ноутбуки, смартфони, меблі, парфумерію, красу, продукти, декор тощо).
Доступні категорії: ${categoriesList.join(', ')}

Інформація про магазин та сервіси:
- Доставка: Нова Пошта (відділення/поштомат 1-2 дні, безкоштовно від 1500 грн; кур'єр до дверей, безкоштовно від 3000 грн), Укрпошта Експрес (2-4 дні, безкоштовно від 1200 грн), Самовивіз з флагманського шоуруму (Київ, вул. Хрещатик, 24, безкоштовно 0 грн, готовність 15 хв).
- Оплата: Visa/Mastercard/Apple Pay/Google Pay (комісія 0%), післяплата при отриманні у відділенні (після огляду товару), Оплата частинами 0% від Monobank (до 6 міс.) та ПриватБанк (до 10 міс.), безготівковий розрахунок з ПДВ.
- Гарантія та повернення: Офіційна гарантія виробника 12-36 місяців, повернення та обмін 14 днів згідно закону, 120+ авторизованих сервісних центрів по Україні.
- Контакти та шоурум: м. Київ, вул. Хрещатик, 24 (Пн-Нд 09:00 - 20:00). Телефон: +380 63 741 79 80, email: nova444shop@gmail.com.

Правила:
1. Відповідай виключно українською мовою, коротко, дружелюбно та приязно.
2. У своєму першому повідомленні обов'язково вкажи, що ти — AI-асистент магазину NovaShop.
3. Якщо користувач запитує про доставку, оплату, гарантію, повернення, контакти чи шоурум — відповідай чітко, спираючись на інформацію вище.
4. Рекомендуй або пропонуй товари ТІЛЬКИ тоді, коли користувач прямо просить знайти, порадити або вибрати товар. Якщо користувач ставить сервісне питання (доставка, гарантія, оплата, статус замовлення) або просто вітається/дякує — відповідай на його питання і НЕ нав'язуй випадкові товари.
5. Презентуй та рекомендуй товари зі списку знайдених товарів магазину із зазначенням назви, ціни та ключових характеристик. Форматуй посилання на товар як [Назва товару](#/product/ID), щоб покупець міг клікнути!
6. Не вигадуй ціни, наявність чи характеристики.
7. На запитання, які не стосуються магазину, товарів та покупок, ввічливо відмовляйся відповідати, нагадуючи, що ти асистент NovaShop.

Знайдені товари в каталозі:
${productListText}
${viewedProductContext}${userContext}${reviewsContext}${comparisonContext}`;

        const contents = [];
        let lastRole = null;
        if (Array.isArray(history)) {
            for (const item of history.slice(-10)) {
                if (!item || (item.role !== 'user' && item.role !== 'model')) continue;
                const text = typeof item.content === 'string' ? item.content.trim().slice(0, 500) : '';
                if (!text) continue;
                if (item.role === lastRole) continue;
                if (contents.length === 0 && item.role !== 'user') continue;
                contents.push({
                    role: item.role,
                    parts: [{ text }]
                });
                lastRole = item.role;
            }
        }
        if (lastRole === 'user') {
            contents.push({
                role: 'model',
                parts: [{ text: isEn ? 'Understood. How can I help?' : 'Зрозуміло. Чим можу допомогти?' }]
            });
        }
        contents.push({
            role: 'user',
            parts: [{ text: cleanMessage }]
        });

        const ai = new GoogleGenAI({ apiKey });

        const preferredModel = (process.env.ASSISTANT_MODEL && process.env.ASSISTANT_MODEL !== 'gemini-3.1-flash-lite')
            ? process.env.ASSISTANT_MODEL
            : 'gemini-3.5-flash-lite';

        const modelsToTry = [
            preferredModel,
            'gemini-3.5-flash-lite',
            'gemini-2.5-flash',
            'gemini-3.1-flash-lite'
        ].filter((m, i, arr) => m && arr.indexOf(m) === i);

        const callWithTimeout = (model, timeoutMs = 7000) => {
            return Promise.race([
                ai.models.generateContent({
                    model,
                    contents,
                    config: {
                        systemInstruction,
                        maxOutputTokens: 600
                    }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
            ]);
        };

        const recommendedProducts = (userWantsProducts && searchResult.products && searchResult.products.length > 0)
            ? searchResult.products.slice(0, 3).map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                avg_rating: p.avg_rating,
                thumbnail: p.thumbnail,
                stock: p.stock,
                category: p.category
            }))
            : [];

        const formattedComparison = comparisonProducts.map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            avg_rating: p.avg_rating,
            thumbnail: p.thumbnail,
            stock: p.stock,
            category: p.category
        }));

        const wantStream = reqStream === true || (req.headers.accept && req.headers.accept.includes('text/event-stream'));

        if (wantStream) {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            if (typeof res.flushHeaders === 'function') res.flushHeaders();

            res.write(`data: ${JSON.stringify({
                type: 'meta',
                products: recommendedProducts,
                comparison: formattedComparison
            })}\n\n`);

            let fullReply = '';
            try {
                const stream = await ai.models.generateContentStream({
                    model: preferredModel,
                    contents,
                    config: {
                        systemInstruction,
                        maxOutputTokens: 600
                    }
                });

                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) {
                        fullReply += text;
                        res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
                    }
                }
                res.write(`data: ${JSON.stringify({ type: 'done', reply: fullReply })}\n\n`);
                res.end();
                await logAssistantQuery(req.session?.user_id, clientIp, cleanMessage, fullReply, foundCount);
                return;
            } catch (streamErr) {
                let fallbackResp = null;
                for (const candidate of modelsToTry) {
                    try {
                        fallbackResp = await callWithTimeout(candidate, 7000);
                        if (fallbackResp && fallbackResp.text) break;
                    } catch {}
                }
                const fallbackReply = (fallbackResp && fallbackResp.text) ? fallbackResp.text.trim() : (isEn ? 'Sorry, a temporary error occurred.' : 'Вибачте, сталася тимчасова помилка.');
                res.write(`data: ${JSON.stringify({ type: 'delta', text: fallbackReply })}\n\n`);
                res.write(`data: ${JSON.stringify({ type: 'done', reply: fallbackReply })}\n\n`);
                res.end();
                await logAssistantQuery(req.session?.user_id, clientIp, cleanMessage, fallbackReply, foundCount);
                return;
            }
        }

        let response = null;
        let lastErr = null;
        for (const candidate of modelsToTry) {
            try {
                response = await callWithTimeout(candidate, 7000);
                if (response && response.text) break;
            } catch (callErr) {
                lastErr = callErr;
            }
        }

        if (!response && lastErr) {
            throw lastErr;
        }

        const defaultReply = isEn
            ? 'Thank you for reaching out! How else can I help you today?'
            : 'Дякую за звернення! Чим ще можу вам допомогти?';
        const reply = response.text ? response.text.trim() : defaultReply;

        await logAssistantQuery(req.session?.user_id, clientIp, cleanMessage, reply, foundCount);

        return res.json({
            reply,
            products: recommendedProducts,
            comparison: formattedComparison
        });
    } catch (err) {
        const isQuota = err.status === 429 || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')));
        const statusCode = isQuota ? 429 : 500;
        const reply = isQuota
            ? (isEn
                ? 'Rate limit exceeded. Please wait a minute and try again.'
                : 'Перевищено ліміт запитів до асистента. Будь ласка, зачекайте хвилинку і спробуйте знову.')
            : (isEn
                ? 'Sorry, a temporary service error occurred. Please try again later.'
                : 'Вибачте, сталася тимчасова помилка сервісу. Будь ласка, спробуйте пізніше.');

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
