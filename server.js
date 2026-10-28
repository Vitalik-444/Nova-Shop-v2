const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Статика фронтенду: лише зібраний бандл і картинки (а не весь каталог проєкту з .env і кодом сервера)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// API Routes (URL збережені, щоб фронтенд працював без змін)
app.use('/api/auth.php', require('./server/routes/auth'));
app.use('/api/products.php', require('./server/routes/products'));
app.use('/api/cart.php', require('./server/routes/cart'));
app.use('/api/orders.php', require('./server/routes/orders'));
app.use('/api/reviews.php', require('./server/routes/reviews'));
app.use('/api/admin.php', require('./server/routes/admin'));
app.use('/api/favorites.php', require('./server/routes/favorites'));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
