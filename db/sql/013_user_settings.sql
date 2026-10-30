-- Міграція 013: Додавання полів для налаштувань профілю користувача
-- phone: контактний номер телефону
-- avatar_url: посилання на аватарку
-- city: місто доставки за замовчуванням
-- address: адреса або номер відділення/поштомату доставки
-- settings: jsonb для збереження параметрів інтерфейсу та сповіщень

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{"notifications_order": true, "notifications_promo": false, "currency": "USD", "language": "uk"}'::jsonb;
