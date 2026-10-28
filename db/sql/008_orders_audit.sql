CREATE TABLE orders_audit (
                              id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                              op text NOT NULL,
                              order_id bigint,
                              row_before jsonb,
                              row_after jsonb,
                              changed_at timestamptz NOT NULL DEFAULT now(),
                              changed_by text NOT NULL DEFAULT current_user
);

CREATE OR REPLACE FUNCTION audit_orders() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
INSERT INTO orders_audit (op, order_id, row_before, row_after)
VALUES (TG_OP, coalesce(NEW.id, OLD.id), to_jsonb(OLD), to_jsonb(NEW));
RETURN NULL;
END $$;

CREATE OR REPLACE TRIGGER orders_audit_trg
AFTER INSERT OR DELETE OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION audit_orders();

GRANT SELECT ON orders_audit TO app_user;