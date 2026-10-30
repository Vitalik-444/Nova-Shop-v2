const express = require('express');
const bcrypt = require('bcryptjs');
const { db, roleToApi, UNIQUE_VIOLATION } = require('../lib/mapping');
const { sendMail } = require('../mailer');
const router = express.Router();

const publicUser = u => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: roleToApi(u.role),
    phone: u.phone || '',
    avatarUrl: u.avatar_url || '',
    city: u.city || '',
    address: u.address || '',
    settings: (typeof u.settings === 'object' && u.settings !== null) ? u.settings : {
        notifications_order: true,
        notifications_promo: false,
        currency: 'USD',
        language: 'uk'
    }
});

router.all('/', async (req, res) => {
    const action = req.query.action || '';
    const body = req.body || {};

    try {
        if (action === 'register') {
            const name = (body.name || '').trim();
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';

            if (!name || !email || !password) return res.status(422).json({ success: false, message: 'Заполните все поля' });
            if (password.length < 6) return res.status(422).json({ success: false, message: 'Минимум 6 символов' });

            const existing = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
            if (existing.rows.length) return res.status(409).json({ success: false, message: 'Email уже зарегистрирован' });

            const passwordHash = await bcrypt.hash(password, 10);
            let created;
            try {
                created = await db.query(
                    `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'buyer')
                     RETURNING id, full_name, email, role, phone, avatar_url, city, address, settings`, [name, email, passwordHash]);
            } catch (e) {
                if (e.code === UNIQUE_VIOLATION) return res.status(409).json({ success: false, message: 'Email уже зарегистрирован' });
                throw e;
            }

            const user = publicUser(created.rows[0]);
            req.session.user_id = user.id;
            req.session.role = user.role;
            return res.json({ success: true, user });
        }

        if (action === 'login') {
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';
            if (!email || !password) return res.status(422).json({ success: false, message: 'Заполните все поля' });

            const { rows } = await db.query('SELECT id, full_name, email, password_hash, role, phone, avatar_url, city, address, settings FROM users WHERE email = $1 LIMIT 1', [email]);
            const user = rows[0];

            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return res.status(401).json({ success: false, message: 'Неверный Email или пароль' });
            }

            req.session.user_id = user.id;
            req.session.role = roleToApi(user.role);
            return res.json({ success: true, user: publicUser(user) });
        }

        if (action === 'me') {
            if (!req.session.user_id) return res.json({ success: true, user: null });

            const { rows } = await db.query('SELECT id, full_name, email, role, phone, avatar_url, city, address, settings FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
            const user = rows[0];
            if (user) req.session.role = roleToApi(user.role);
            return res.json({ success: true, user: user ? publicUser(user) : null });
        }

        if (action === 'update-profile') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Не авторизовано' });

            const name = (body.name || '').trim();
            const phone = (body.phone || '').trim();
            const avatarUrl = (body.avatarUrl || '').trim();
            const city = (body.city || '').trim();
            const address = (body.address || '').trim();

            if (!name) return res.status(422).json({ success: false, message: 'Ім\'я обов\'язкове' });

            const { rows } = await db.query(
                `UPDATE users
                 SET full_name = $1, phone = $2, avatar_url = $3, city = $4, address = $5
                 WHERE id = $6
                 RETURNING id, full_name, email, role, phone, avatar_url, city, address, settings`,
                [name, phone, avatarUrl, city, address, req.session.user_id]
            );

            if (!rows.length) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            return res.json({ success: true, user: publicUser(rows[0]), message: 'Профіль успішно оновлено' });
        }

        if (action === 'update-settings') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Не авторизовано' });

            const settings = body.settings;
            if (!settings || typeof settings !== 'object') {
                return res.status(422).json({ success: false, message: 'Некоректні налаштування' });
            }

            const { rows } = await db.query(
                `UPDATE users
                 SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb
                 WHERE id = $2
                 RETURNING id, full_name, email, role, phone, avatar_url, city, address, settings`,
                [JSON.stringify(settings), req.session.user_id]
            );

            if (!rows.length) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            return res.json({ success: true, user: publicUser(rows[0]), message: 'Налаштування збережено' });
        }

        if (action === 'change-password') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Не авторизовано' });

            const oldPassword = body.oldPassword || '';
            const newPassword = body.newPassword || '';

            if (!oldPassword || !newPassword) {
                return res.status(422).json({ success: false, message: 'Заповніть усі поля' });
            }
            if (newPassword.length < 6) {
                return res.status(422).json({ success: false, message: 'Новий пароль має бути не менше 6 символів' });
            }

            const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
            if (!rows.length) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
            if (!valid) {
                return res.status(400).json({ success: false, message: 'Поточний пароль введено неправильно' });
            }

            const newHash = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.session.user_id]);

            return res.json({ success: true, message: 'Пароль успішно змінено' });
        }

        if (action === 'send-test-email') {
            if (!req.session.user_id) return res.status(401).json({ success: false, message: 'Не авторизовано' });

            const { rows } = await db.query('SELECT full_name, email FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
            if (!rows.length) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            const u = rows[0];
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #10b981; margin-top: 0;">NovaShop: Тестове повідомлення</h2>
                    <p>Вітаємо, <b>${u.full_name}</b>!</p>
                    <p>Це перевірочний лист від інтернет-магазину NovaShop. Якщо ви бачите цей текст, налаштування пошти (SMTP) та відправка сповіщень працюють належним чином.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">Відправлено з системи налаштувань NovaShop.</p>
                </div>
            `;
            const result = await sendMail(u.email, u.full_name, 'Тестове повідомлення від NovaShop', html);
            if (result && result.messageId) {
                return res.json({ success: true, message: `Лист успішно надіслано на ${u.email}`, messageId: result.messageId });
            } else if (result && result.simulated) {
                return res.json({ success: true, message: `Симуляція: лист сформовано для ${u.email} (SMTP не налаштовано в .env)`, simulated: true });
            } else {
                return res.json({ success: true, message: `Перевірку завершено для ${u.email}` });
            }
        }

        if (action === 'logout') {
            req.session.destroy(() => {});
            res.clearCookie('connect.sid');
            return res.json({ success: true });
        }

        return res.status(404).json({ success: false, message: 'Неизвестное действие' });
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

module.exports = router;
