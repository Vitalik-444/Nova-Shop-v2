-- Виконується ОДИН раз, коли Postgres створює порожній том
-- (docker-entrypoint-initdb.d). Змінили цей файл → docker compose down -v.
-- Роль застосунку з мінімальними правами: читати й писати дані, але не
-- змінювати схему. Схему змінює лише мігратор (postgres) через sql/NNN_*.sql.
CREATE ROLE app_user LOGIN PASSWORD 'app_pass';
GRANT CONNECT ON DATABASE myproject TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- таблиці й послідовності, які вже існують (на момент init їх ще немає)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- і ті, що postgres створить пізніше міграціями
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO app_user;
