# NovaShop — React + Node.js + PostgreSQL

Единый проект курсовой: фронтенд (React/Vite, уже собран в `index.html` + `assets/`), бэкенд на **Node.js/Express**
и база **PostgreSQL** со схемой из проекта `db-2026` (C#-часть убрана, её роль выполняют `scripts/migrate.js` и Node-роуты).
Данные берутся из старой **MySQL**-базы `novashop`.

## Структура

```
server.js            Express: сессии, статика фронтенда, /api/*.php (URL не менялись → фронтенд работает без правок)
server/db.js         пул PostgreSQL (роль app_user — без прав на изменение схемы)
server/lib/mapping.js  соответствие «контракт фронтенда ↔ схема PostgreSQL»
server/routes/*.js   auth, products, cart, favorites, orders, reviews, admin
db/sql/001…012       миграции PostgreSQL (001–011 из db-2026 без изменений, 012 — новая)
db/queries, db/docs  запросы и схема из лабораторных
scripts/migrate.js   накат миграций (аналог C# Migrator, та же таблица schema_migrations)
scripts/import-mysql.js  перенос данных MySQL → PostgreSQL
scripts/smoke.js     сквозная проверка API (45 проверок)
frontend/            исходники React (npm run frontend:build пересобирает бандл)
```

## Запуск

```bash
cp .env.example .env            # при необходимости поправьте пароли/хосты
npm install
docker compose up -d            # PostgreSQL (+pgAdmin :5050); создаёт роль app_user
npm run db:migrate              # схема: миграции 001–012
npm run db:import-mysql         # данные из MySQL (нужна запущенная MySQL с базой novashop, см. .env)
npm start                       # http://localhost:3000
```

Своего PostgreSQL без Docker достаточно: `db:migrate` сам создаст базу и роль `app_user`, если их нет.
Повторный импорт поверх заполненной базы: `npm run db:import-mysql -- --truncate`.
Проверка работы API: `BASE_URL=http://localhost:3000 npm run db:smoke`
(с `ADMIN_EMAIL`/`ADMIN_PASS` проверит и админку).

Режим разработки фронтенда: `npm start` + `npm run frontend:dev` (Vite на :5173 проксирует `/api` на :3000).

## Что с данными

* Миграции `002_seed.sql` и `005_bulk.sql` (учебные тестовые данные «Товар #N») по умолчанию **пропускаются**,
  чтобы в базе были только данные из MySQL. Файлы не изменены; нужны для лабораторных — `npm run db:migrate:demo`.
* Импортёр переносит всё с сохранением `id` и bcrypt-хэшей, поэтому пользователи входят со старыми паролями.
  Всё в одной транзакции: либо импортируется всё, либо ничего. Строки, нарушающие ограничения новой схемы
  (цена ≤ 0, позиция заказа с уже удалённым товаром и т.п.), пропускаются и перечисляются в предупреждениях.

## Как MySQL-структура легла на схему PostgreSQL

Структура PostgreSQL сохранена. Единственное изменение — новая миграция `012_storefront_fields.sql`
(по правилу курса: изменения — только новым файлом) и она добавляет две колонки:
`products.attributes jsonb` (по примеру EF-миграции `AddProductAttributes`) и `orders.customer_data jsonb`.

| MySQL | PostgreSQL |
|---|---|
| `users.name` | `users.full_name` |
| `users.role` `user` / `admin` | `buyer` / `admin`; тот, кто выставил товар, становится `seller` (фронтенд по-прежнему видит `user`/`admin`) |
| `products.category` (slug) | `categories.name` (= slug) + `products.category_id` |
| `products.seller` (текст) | `products.seller_id → users` (для «NovaShop» и прочих имён создаются служебные пользователи-продавцы) |
| `brand, sku, thumbnail, images, discount_percentage, rating, weight, warranty_…, shipping_…, availability_status, return_policy` | `products.attributes` (jsonb, ключи с теми же именами) |
| `user_cart.product_data`, `user_favorites.product_data` (JSON-снимок) | не нужны: данные товара берутся JOIN-ом из `products` |
| `orders.total` | считается из `order_items` (`SUM(quantity * price_at_purchase)`) |
| `orders.customer_data` | `orders.customer_data` (jsonb) |
| `orders.status` `new/processing/shipped/completed/cancelled` | `pending/paid/shipped/delivered/cancelled` (преобразование в API) |
| `order_items.title / product_data` | не хранятся: заголовок берётся из `products`, цена — `price_at_purchase` |
| `product_reviews.user_id` | `product_reviews.buyer_id` (может быть NULL — автор удалён) |

## Что изменилось в поведении (следствие схемы PostgreSQL)

* **Оформление заказа** идёт одной транзакцией: блокировка товаров `FOR UPDATE` → заказ → позиции → **списание остатка** → очистка корзины.
  Если товара не хватает, ответ 409 с понятным текстом. В MySQL-версии остаток не списывался.
* Товар, который есть в оформленных заказах, **нельзя удалить** (`order_items → products ON DELETE RESTRICT`) — API отвечает 409.
* Повторный отзыв того же покупателя обновляет прежний (`UNIQUE (product_id, buyer_id)`).
* Смена статуса заказа пишется триггером в `orders_audit`.
* «Мои товары» теперь ищутся по `seller_id`, а не по совпадению имени.
* Статика отдаётся только из `assets/`, `images/` и `index.html` — раньше `express.static` раздавал весь каталог проекта, включая `.env`.
