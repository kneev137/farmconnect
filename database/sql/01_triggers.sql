-- ============================================================================
-- FARMCONNECT: 01_TRIGGERS.SQL
-- PostgreSQL Triggers for Automated Integrity, Stock Sync, and Audit Trails
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TRIGGER 1: trg_harvest_stock_sync
-- Automatically increments product inventory whenever a harvest record is added
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_harvest_stock_sync()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products_inventory
    SET quantity_available = quantity_available + NEW.quantity_harvested,
        last_updated = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_harvest_stock_sync ON products_harvestrecord;
CREATE TRIGGER trg_harvest_stock_sync
AFTER INSERT ON products_harvestrecord
FOR EACH ROW
EXECUTE FUNCTION fn_harvest_stock_sync();


-- ----------------------------------------------------------------------------
-- TRIGGER 2: trg_calculate_order_total
-- Automatically recalculates order.total_amount when items are added/changed/removed
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalc_order_total()
RETURNS TRIGGER AS $$
DECLARE
    target_order_id INT;
    computed_total NUMERIC(10, 2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_order_id := OLD.order_id;
    ELSE
        target_order_id := NEW.order_id;
    END IF;

    SELECT COALESCE(SUM(quantity * price_at_purchase), 0.00)
    INTO computed_total
    FROM orders_orderitem
    WHERE order_id = target_order_id;

    UPDATE orders_order
    SET total_amount = computed_total
    WHERE id = target_order_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_order_total ON orders_orderitem;
CREATE TRIGGER trg_calculate_order_total
AFTER INSERT OR UPDATE OR DELETE ON orders_orderitem
FOR EACH ROW
EXECUTE FUNCTION fn_recalc_order_total();


-- ----------------------------------------------------------------------------
-- TRIGGER 3: trg_sync_payment_amount
-- Automatically synchronizes orders_payment.amount when order.total_amount changes
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.total_amount IS DISTINCT FROM OLD.total_amount) THEN
        UPDATE orders_payment
        SET amount = NEW.total_amount
        WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_payment_amount ON orders_order;
CREATE TRIGGER trg_sync_payment_amount
AFTER UPDATE OF total_amount ON orders_order
FOR EACH ROW
EXECUTE FUNCTION fn_sync_payment_amount();


-- ----------------------------------------------------------------------------
-- TRIGGER 4: trg_delivery_status_cascade
-- Automatically cascades delivery status changes to order status & updates timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_cascade_delivery_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered')) THEN
        NEW.delivered_at := CURRENT_TIMESTAMP;
        UPDATE orders_order
        SET status = 'delivered'
        WHERE id = NEW.order_id;
    ELSIF (NEW.status = 'out_for_delivery' AND (OLD.status IS DISTINCT FROM 'out_for_delivery')) THEN
        UPDATE orders_order
        SET status = 'shipped'
        WHERE id = NEW.order_id;
    ELSIF (NEW.status = 'failed' AND (OLD.status IS DISTINCT FROM 'failed')) THEN
        UPDATE orders_order
        SET status = 'cancelled'
        WHERE id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delivery_status_cascade ON orders_delivery;
CREATE TRIGGER trg_delivery_status_cascade
BEFORE UPDATE OF status ON orders_delivery
FOR EACH ROW
EXECUTE FUNCTION fn_cascade_delivery_status();


-- ----------------------------------------------------------------------------
-- TRIGGER 5: trg_order_audit_trail
-- Automatically records every order status change into orders_orderstatushistory
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_log_order_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO orders_orderstatushistory (
            order_id,
            old_status,
            new_status,
            changed_at,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            CURRENT_TIMESTAMP,
            'Status transition triggered automatically'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_audit_trail ON orders_order;
CREATE TRIGGER trg_order_audit_trail
AFTER UPDATE OF status ON orders_order
FOR EACH ROW
EXECUTE FUNCTION fn_log_order_audit();
