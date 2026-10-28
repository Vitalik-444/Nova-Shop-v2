const express = require('express');
const bcrypt = require('bcryptjs');
const { db, roleToApi, UNIQUE_VIOLATION } = require('../lib/mapping');
const router = express.Router();

const publicUser = u => ({ id: u.id, name: u.full_name, email: u.email, role: roleToApi(u.role) });

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
                     RETURNING id, full_name, email, role`, [name, email, passwordHash]);
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

            const { rows } = await db.query('SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1 LIMIT 1', [email]);
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

            const { rows } = await db.query('SELECT id, full_name, email, role FROM users WHERE id = $1 LIMIT 1', [req.session.user_id]);
            const user = rows[0];
            if (user) req.session.role = roleToApi(user.role);
            return res.json({ success: true, user: user ? publicUser(user) : null });
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
