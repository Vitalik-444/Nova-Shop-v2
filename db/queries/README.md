## Домен курсового проєкту

Тема: база даних маркетплейсу.

## Ролі

- **Покупець** — шукає товари, керує кошиком та обраним, оформлює й відстежує замовлення.
- **Продавець** — виставляє товари на продаж, стежить за своїми продажами та залишками.
- **Модератор** — перевіряє відгуки та товари на відповідність правилам майданчика.
- **Адміністратор** — веде каталог категорій, аналізує роботу маркетплейсу в цілому.

## Сценарії використання

1. Які товари категорії X зараз є в наявності у продавця Y?
2. Які замовлення покупця Z ще не доставлені?
3. Скільки товарів продавець продав за останній місяць? (статистика)
4. Топ-10 найпопулярніших товарів за кількістю продажів за квартал. (статистика)
5. Який середній рейтинг товарів у кожній категорії? (статистика)
6. Які товари покупець додав в обране, але жодного разу не купив?
7. Хто з продавців має більше N товарів з рейтингом нижче 3?
8. Історія відгуків на конкретний товар (хто, коли, оцінка).
9. Які покупці не робили замовлень за останні 3 місяці?
10. Скільки нових продавців зареєструвалось цього семестру? (статистика)
11. Які товари зараз лежать у кошику покупця X і яка їх сумарна вартість?

## Рішення ON DELETE (Лабораторна 3, sql/004_constraints.sql)

| Зовнішній ключ | ON DELETE | Обґрунтування |
|---|---|---|
| categories.parent_id → categories.id | RESTRICT | Категорію з підкатегоріями видалити не можна — спершу переносять або видаляють дітей вручну |
| products.seller_id → users.id | RESTRICT | Продавця з активними товарами не можна видалити — спершу товари знімають з продажу |
| products.category_id → categories.id | RESTRICT | Категорію з товарами видаляти не можна — спершу товари переносять в іншу категорію |
| orders.buyer_id → users.id | SET NULL | Покупець може видалити акаунт, але історія замовлень має лишитись для аналітики |
| order_items.order_id → orders.id | CASCADE | Позиція замовлення без самого замовлення не має сенсу |
| order_items.product_id → products.id | RESTRICT | Товар, який колись купували, не можна видалити — зламає історію замовлень |
| user_cart.user_id → users.id | CASCADE | Кошик — тимчасові дані, прив'язані виключно до користувача |
| user_cart.product_id → products.id | CASCADE | Товар зняли з продажу — рядок у чужих кошиках втрачає сенс |
| user_favorites.user_id → users.id | CASCADE | Обране прив'язане виключно до користувача |
| user_favorites.product_id → products.id | CASCADE | Товар видалили — обране на нього більше не існує |
| product_reviews.product_id → products.id | CASCADE | Відгук без товару не має сенсу |
| product_reviews.buyer_id → users.id | SET NULL | Відгук — цінна публічна інформація, зберігається навіть якщо автор видалив акаунт |

## Наповнення даними (sql/005_bulk.sql)

Дані генеруються відтворювано через `generate_series` і `random()` при кожному `migrate` з чистої БД. Батьки беруться з `array_agg(id)` реальних таблиць, тому FK завжди join-сумісні, а розподіл по батьках рівномірний.

| Таблиця | Орієнтовний обсяг | NULL |
|---|---|---|
| users | +200 | — |
| products | +800 | description (~10%) |
| orders | +5000 | buyer_id (~5%, видалений акаунт) |
| order_items | ~12000–15000 | — |
| user_cart | ~400 | — |
| user_favorites | ~400 | — |
| product_reviews | ~1500–2200 | buyer_id (~5%), comment (~40%) |

## Як запустити

Передумови: Docker Desktop і .NET SDK 9+ (`dotnet --version`).

```bash
docker compose up -d
dotnet run --project src/App -- migrate
dotnet run --project src/App -- smoke
```

Перша команда піднімає PostgreSQL і pgAdmin у контейнерах. Друга застосовує всі міграції з `sql/` по порядку від ролі-мігратора (`postgres`) і виводить список застосованих файлів. Третя підключається від ролі `app_user` з мінімальними правами, друкує `current_user`, кількість застосованих міграцій, кількість рядків у кожній таблиці та підтверджує, що змінити схему від цієї ролі не можна (`42501 permission denied`).

Власний параметризований запит — товари категорії, наявні в продавця:

```bash
dotnet run --project src/App -- stock <category_id> <seller_id>
```

Наприклад: `dotnet run --project src/App -- stock 2 1`.

### Лабораторна 4: CRUD і пошук

CRUD для користувачів і товарів (усі DML — з `RETURNING`, помилки FK/UNIQUE/CHECK — людською мовою):

```bash
dotnet run --project src/App -- user-add "Іваненко Іван" ivan@ex.ua hash123 buyer
dotnet run --project src/App -- user-list
dotnet run --project src/App -- user-update 5 --email new@ex.ua
dotnet run --project src/App -- user-delete 5

dotnet run --project src/App -- product-add 1 2 "Xiaomi Redmi Note 13" "Смартфон, 128 ГБ" 8999.00 12
dotnet run --project src/App -- product-list
dotnet run --project src/App -- product-update 10 --price 7999.00
dotnet run --project src/App -- product-update 10 --stock 5
dotnet run --project src/App -- product-delete 10
```

Пошук товарів із необов'язковими фільтрами (текст, категорія, діапазон ціни), сортуванням із білого списку та пагінацією:

```bash
dotnet run --project src/App -- product-search --q телефон --price-from 1000 --price-to 10000 --sort price --page 1 --page-size 10
```

Прапорці `--q`, `--category`, `--price-from`, `--price-to`, `--sort`, `--page`, `--page-size` — усі опційні; відсутній фільтр не звужує вибірку. Вивід завершується рядком «сторінка X з Y (всього N)».

### Відтворення з нуля

Якщо оновлювали `docker/init/*` або хочете перевірити повну відтворюваність:

```bash
docker compose down -v
docker compose up -d
dotnet run --project src/App -- migrate
dotnet run --project src/App -- smoke
```

`down -v` видаляє том з даними, тому роль `app_user` і схема створюються заново з нуля.

### Підключення

Рядки підключення лежать у `src/App/appsettings.json` і перевизначаються змінними середовища `DB_MIGRATOR` / `DB_APP`, якщо вони задані. Паролі й хости для реального проєкту тримайте в змінних середовища або User Secrets, а не в коді.

### Типові збої

- `28P01 password authentication failed` — не той рядок підключення, або роль `app_user` ще не створена (`docker compose down -v`, щоб `docker/init` виконався заново).
- `42501 permission denied` — це очікувана поведінка для DDL від `app_user`; для SELECT це означає, що бракує GRANT у міграції.
- `relation "..." does not exist` — `migrate` не запускали, або підключення йде до іншої БД.

### Статистичні звіти (Лабораторна робота №5)

Для отримання аналітичних звітів використовується команда `report`:

```bash
# Довідка та список доступних звітів
dotnet run --project src/App -- report

# Динаміка додавання товарів по місяцях (з фільтрацією за датою та мінімальною кількістю)
dotnet run --project src/App -- report products-by-month --since 2024-01-01 --until 2026-12-31 --min-added 2

# Топ найдорожчих товарів у каталозі
dotnet run --project src/App -- report top-expensive --limit 5

# Дерево категорій із кількістю товарів на кожному рівні
dotnet run --project src/App -- report category-tree --max-depth 5
```

### Серверна логіка та транзакції (Лабораторна робота №6)

Нові об'єкти бази додано міграціями `sql/006_views.sql`, `sql/007_functions.sql`, `sql/008_orders_audit.sql`:

- view `order_totals` (JOIN замовлень, користувачів і позицій, сума замовлення обчислюється у view) і `cart_summary`;
- табличну функцію `product_reviews_history(product_id, limit)` і скалярну `check_and_reserve_stock(product_id, quantity)` з `RAISE EXCEPTION ... USING ERRCODE` для некоректного аргументу;
- тригер `orders_audit_trg` (`AFTER INSERT OR DELETE OR UPDATE OF status`, `FOR EACH ROW`), який пише `to_jsonb(OLD)` і `to_jsonb(NEW)` у таблицю `orders_audit`.

Транзакційна команда `checkout` оформлює замовлення трьома кроками в одній транзакції (замовлення, позиція, списання залишку). Перевірка залишку йде під замком `SELECT ... FOR UPDATE`, при `40001` та `40P01` уся транзакція повторюється (до 3 спроб).

```bash
dotnet run --project src/App -- orders 1
dotnet run --project src/App -- reviews 1 5
dotnet run --project src/App -- check-stock 1 2
dotnet run --project src/App -- checkout 1 1 2
dotnet run --project src/App -- checkout 1 1 2 --unsafe
```

Прапорець `--unsafe` запускає версію без транзакції: збій між кроками залишає замовлення й позицію без списання залишку. Її використовують для демонстрації на захисті.