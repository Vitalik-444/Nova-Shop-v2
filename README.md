# NovaShop

<p align="left">
  <img src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License: ISC" />
</p>

A full-stack e-commerce storefront built with **React**, **Node.js / Express** and **PostgreSQL**.

NovaShop provides a complete shopping flow — catalog browsing, favorites, cart, transactional checkout with stock control, order history, product reviews and an admin panel — backed by a versioned PostgreSQL schema with views, functions, triggers and audit logging.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [NPM Scripts](#npm-scripts)
- [Database](#database)
- [API Overview](#api-overview)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Migrating from the Legacy MySQL Version](#migrating-from-the-legacy-mysql-version)
- [Security Notes](#security-notes)
- [License](#license)

---

## Features

**Storefront**
- Product catalog with categories, search, discounts, ratings and image galleries
- Product pages with customer reviews (one review per buyer, updated on resubmission)
- Favorites and a persistent shopping cart synchronized with the server
- Multi-step checkout and order history
- Bilingual interface (Ukrainian / English)
- Responsive layout

**Accounts**
- Registration and login with bcrypt-hashed passwords
- Cookie-based sessions (`express-session`)
- Role-based access: `buyer`, `seller`, `admin`
- Sellers can list and manage their own products

**Admin panel**
- Manage orders and update their status
- Create, edit and delete products
- View users and change their roles

**Data integrity**
- Checkout runs in a **single transaction**: row locks (`SELECT … FOR UPDATE`) → order → order items → stock deduction → cart cleanup
- Insufficient stock returns a clear `409 Conflict`
- Products that appear in orders cannot be deleted (`ON DELETE RESTRICT`)
- Order status changes are recorded automatically in `orders_audit` via a database trigger
- Optional transactional e-mail via SMTP (Nodemailer)

---

## Tech Stack

<p align="left">
  <img src="https://skillicons.dev/icons?i=react,vite,js,nodejs,express,postgres,docker,mysql&perline=8" alt="React, Vite, JavaScript, Node.js, Express, PostgreSQL, Docker, MySQL" />
</p>

| Layer      | Technology                                                   |
| ---------- | ------------------------------------------------------------ |
| Frontend   | React 18, React Router 6, Vite 5                             |
| Backend    | Node.js, Express 5, express-session, bcryptjs, Nodemailer    |
| Database   | PostgreSQL 18 (via `pg`), plain-SQL migrations               |
| Tooling    | Docker Compose, pgAdmin 4, custom migration & smoke-test scripts |

---

## Project Structure

```
.
├── server.js                 # Express app: sessions, static files, API mounting
├── server/
│   ├── db.js                 # PostgreSQL pool + transaction helper (app_user role)
│   ├── mailer.js             # SMTP mailer (no-op if credentials are not set)
│   ├── lib/mapping.js        # Mapping between frontend contract and DB schema
│   └── routes/               # auth, products, cart, favorites, orders, reviews, admin
├── db/
│   ├── sql/                  # Forward-only migrations 001–012
│   ├── docker/init/          # Creates the restricted app_user role on first start
│   ├── queries/              # Lab queries (lab4, lab5, lab7)
│   └── docs/                 # Schema diagram and reference SQL
├── scripts/
│   ├── migrate.js            # Migration runner
│   ├── import-mysql.js       # One-off MySQL → PostgreSQL data import
│   └── smoke.js              # End-to-end API checks
├── frontend/                 # React source (Vite)
│   └── src/                  # pages, components, context, i18n, api, styles
├── assets/, index.html       # Pre-built frontend bundle served by Express
├── images/                   # Static images
├── docker-compose.yml        # PostgreSQL + pgAdmin
└── .env.example              # Environment template
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or newer
- **PostgreSQL** 14+ — or **Docker** (recommended)
- A running **MySQL** instance with the legacy `novashop` database — only if you want to import existing data

### Installation

```bash
# 1. Configure environment
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start PostgreSQL (and pgAdmin) in Docker
docker compose up -d

# 4. Apply the database schema (migrations 001–012)
npm run db:migrate

# 5. (Optional) Import data from the legacy MySQL database
npm run db:import-mysql

# 6. Start the application
npm start
```

The app is now available at **http://localhost:3000**.

> **Using your own PostgreSQL instead of Docker?** Skip step 3. `npm run db:migrate` creates the database and the `app_user` role automatically if they do not exist.

> **Docker port note:** `docker-compose.yml` publishes PostgreSQL on host port **5433** and pgAdmin on **5051** (http://localhost:5051). When using the Compose database, point `DATABASE_URL` and `DATABASE_MIGRATOR_URL` in `.env` to port `5433`.

---

## Configuration

All settings are read from `.env`.

| Variable                | Description                                                         | Default (`.env.example`)                                    |
| ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `PORT`                  | HTTP port of the server                                             | `3000`                                                      |
| `SESSION_SECRET`        | Secret used to sign session cookies — **change it in production**   | `change-me`                                                 |
| `DATABASE_URL`          | Runtime connection, uses the restricted `app_user` role             | `postgres://app_user:app_pass@localhost:5432/myproject`     |
| `DATABASE_MIGRATOR_URL` | Privileged connection used by migrations and the importer           | `postgres://postgres:postgres@localhost:5432/myproject`     |
| `MYSQL_HOST`            | Legacy MySQL host (import only)                                     | `localhost`                                                 |
| `MYSQL_USER`            | Legacy MySQL user                                                   | `root`                                                      |
| `MYSQL_PASS`            | Legacy MySQL password                                               | `root`                                                      |
| `MYSQL_DB`              | Legacy MySQL database name                                          | `novashop`                                                  |
| `SMTP_HOST`             | SMTP server (optional)                                              | `smtp.gmail.com`                                            |
| `SMTP_PORT`             | SMTP port (`465` enables TLS)                                       | `587`                                                       |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials — e-mail is skipped if empty                     | —                                                           |
| `SMTP_FROM_NAME`        | Sender display name                                                 | `NovaShop`                                                  |

---

## NPM Scripts

| Command                     | Description                                                                   |
| --------------------------- | ----------------------------------------------------------------------------- |
| `npm start`                 | Start the Express server                                                      |
| `npm run db:migrate`        | Apply pending migrations (demo data skipped)                                  |
| `npm run db:migrate:demo`   | Apply migrations including demo seed data (`002`, `005`)                      |
| `npm run db:import-mysql`   | Import data from the legacy MySQL database                                    |
| `npm run db:smoke`          | Run end-to-end API checks against a running server                            |
| `npm run frontend:dev`      | Start the Vite dev server on `:5173` (proxies `/api` to `:3000`)              |
| `npm run frontend:build`    | Rebuild the React bundle into `assets/` and `index.html`                      |

---

## Database

### Schema

The core schema consists of eight tables:

`users` · `categories` · `products` · `orders` · `order_items` · `user_cart` · `user_favorites` · `product_reviews`

plus the audit table `orders_audit`, the views `order_totals` and `cart_summary`, the functions `product_reviews_history()` and `check_and_reserve_stock()`, and an `orders_audit_trg` trigger.

Flexible storefront data (brand, SKU, thumbnail, gallery, discount, base rating, warranty, shipping and return policy) is stored in `products.attributes` (`jsonb`, GIN-indexed). Customer contact and delivery details are stored in `orders.customer_data` (`jsonb`).

### Migrations

Migrations live in `db/sql/` and follow a strict **forward-only** rule:

- Files are named `NNN_short_name.sql` and applied in numeric order.
- Each migration runs once, in its own transaction; state is tracked in the `schema_migrations` table.
- An already-applied file must never be edited — every schema change is a **new** file.

| Migration | Purpose                                   |
| --------- | ----------------------------------------- |
| `001`     | Initial schema                            |
| `002`     | Demo seed data *(skipped by default)*     |
| `003`     | Review uniqueness                         |
| `004`     | Constraints                               |
| `005`     | Bulk demo data *(skipped by default)*     |
| `006`     | Views                                     |
| `007`     | Functions                                 |
| `008`     | Orders audit table and trigger            |
| `009`     | Indexes                                   |
| `010`     | Cart summary view                         |
| `011`     | Foreign-key indexes                       |
| `012`     | Storefront fields (`jsonb` columns)       |

### Least-privilege access

The application connects as **`app_user`**, which can read and write data but cannot alter the schema. Schema changes are performed only by the migrator (`postgres`) role.

---

## API Overview

The API is served under `/api/<resource>.php?action=<action>`. The `.php` URLs are intentionally preserved so the frontend contract remained unchanged during the migration from the original PHP backend.

| Resource            | Actions                                                                          |
| ------------------- | -------------------------------------------------------------------------------- |
| `/api/auth.php`      | `register`, `login`, `me`, `logout`                                              |
| `/api/products.php`  | `list`, `get`, `categories`, `add`, `myProducts`, `deleteMyProduct`              |
| `/api/cart.php`      | `list`, `sync`                                                                   |
| `/api/favorites.php` | `list`, `sync`                                                                   |
| `/api/orders.php`    | `create`, `list`                                                                 |
| `/api/reviews.php`   | `list`, `add`, `delete`                                                          |
| `/api/admin.php`     | `ordersList`, `updateOrderStatus`, `productSave`, `productDelete`, `usersList`, `updateUserRole` |

**Example**

```bash
curl "http://localhost:3000/api/products.php?action=list"
```

---

## Frontend Development

The repository ships with a pre-built bundle (`index.html` + `assets/`), so no frontend build is required to run the app.

To work on the UI:

```bash
npm install
npm --prefix frontend install

npm start                  # terminal 1 — API on :3000
npm run frontend:dev       # terminal 2 — Vite on :5173 with /api proxy
```

Rebuild the production bundle with:

```bash
npm run frontend:build
```

**Application routes:** `/`, `/catalog`, `/product/:id`, `/cart`, `/checkout`, `/favorites`, `/login`, `/register`, `/profile` *(auth)*, `/orders` *(auth)*, `/admin`.

---

## Testing

`scripts/smoke.js` runs 45 end-to-end checks against a live server and database, covering the catalog, registration and sessions, cart, checkout and more.

```bash
npm start                                  # in one terminal
npm run db:smoke                           # in another

# Custom target and admin checks
BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@example.com ADMIN_PASS=secret npm run db:smoke
```

---

## Migrating from the Legacy MySQL Version

`npm run db:import-mysql` copies all data from the original MySQL `novashop` database into PostgreSQL.

- **IDs and bcrypt hashes are preserved**, so existing users can sign in with their old passwords.
- The import runs in **one transaction** — everything is imported, or nothing is.
- Rows that violate the new constraints (e.g. price ≤ 0, order items referencing deleted products) are skipped and listed as warnings.
- To re-import over a populated database, use `npm run db:import-mysql -- --truncate`.

**Schema mapping highlights**

| MySQL                                   | PostgreSQL                                                   |
| --------------------------------------- | ------------------------------------------------------------ |
| `users.name`                            | `users.full_name`                                            |
| `users.role` (`user` / `admin`)         | `buyer` / `admin` (users who listed products become `seller`) |
| `products.category` (slug)              | `categories.name` + `products.category_id`                   |
| `products.seller` (text)                | `products.seller_id → users`                                 |
| `brand`, `sku`, `thumbnail`, `images`, … | `products.attributes` (`jsonb`)                              |
| `orders.total`                          | Computed from `order_items`                                  |
| `orders.status` (`new/processing/shipped/completed/cancelled`) | `pending/paid/shipped/delivered/cancelled` (translated by the API) |
| `product_reviews.user_id`               | `product_reviews.buyer_id` (nullable if the author is deleted) |

**Behavioral changes compared to the MySQL version**

- Stock is now deducted at checkout.
- Products present in orders can no longer be deleted.
- Re-reviewing a product updates the buyer's existing review.
- "My products" is resolved by `seller_id` rather than by name matching.
- Static files are served only from `assets/`, `images/` and `index.html`.

---

## Security Notes

- Passwords are hashed with bcrypt.
- Session cookies are `httpOnly`. When deploying behind HTTPS, set `cookie.secure` to `true` in `server.js`.
- Always set a strong, unique `SESSION_SECRET` and change all default database passwords outside local development.
- Only the built frontend and image directories are exposed as static content; `.env` and server code are never served.
- The runtime database role has no schema-altering privileges.

---

## License

Released under the [ISC License](https://opensource.org/licenses/ISC).
