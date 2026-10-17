-- ============================================================================
-- FARMCONNECT: 04_PROCEDURES.SQL
-- True PostgreSQL stored PROCEDURES (invoked with CALL ...)
-- Apply with:  python manage.py apply_db_procedures
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROCEDURE 1: sp_restock_product
-- Adds stock to a product and logs it as a harvest record.
-- CALL sp_restock_product(<product_id>, <quantity>, 'notes');
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_restock_product(
    p_product_id BIGINT,
    p_quantity NUMERIC,
    p_notes TEXT DEFAULT 'Restocked via procedure'
)
LANGUAGE plpgsql AS $$
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Restock quantity must be greater than zero';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM products_product WHERE id = p_product_id) THEN
        RAISE EXCEPTION 'Product % does not exist', p_product_id;
    END IF;

    -- Ensure an inventory row exists first (so the harvest trigger can add stock to it)
    INSERT INTO products_inventory (product_id, quantity_available, last_updated)
    VALUES (p_product_id, 0, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Harvest record (trigger trg_harvest_stock_sync adds quantity to inventory)
    INSERT INTO products_harvestrecord (product_id, harvest_date, quantity_harvested, notes)
    VALUES (p_product_id, CURRENT_DATE, p_quantity, p_notes);
END;
$$;


-- ----------------------------------------------------------------------------
-- PROCEDURE 2: sp_set_default_address
-- Makes one address the user's default and clears the flag on the others.
-- CALL sp_set_default_address(<user_id>, <address_id>);
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_set_default_address(
    p_user_id BIGINT,
    p_address_id BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM accounts_address WHERE id = p_address_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Address % not found for user %', p_address_id, p_user_id;
    END IF;

    UPDATE accounts_address SET is_default = FALSE WHERE user_id = p_user_id;
    UPDATE accounts_address
       SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
     WHERE id = p_address_id;
END;
$$;


-- ----------------------------------------------------------------------------
-- PROCEDURE 3: sp_update_order_status
-- Moves an order to a new status and records it in the status history.
-- CALL sp_update_order_status(<order_id>, 'shipped', 'notes');
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_update_order_status(
    p_order_id BIGINT,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT ''
)
LANGUAGE plpgsql AS $$
DECLARE
    v_old_status VARCHAR;
BEGIN
    IF p_new_status NOT IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid order status: %', p_new_status;
    END IF;

    SELECT status INTO v_old_status FROM orders_order WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % does not exist', p_order_id;
    END IF;

    IF v_old_status = p_new_status THEN
        RETURN;
    END IF;

    UPDATE orders_order SET status = p_new_status WHERE id = p_order_id;
    -- NOTE: trg_order_audit_trail may already log this change; only log if it did not.
    IF NOT EXISTS (
        SELECT 1 FROM orders_orderstatushistory
         WHERE order_id = p_order_id AND new_status = p_new_status
           AND changed_at >= CURRENT_TIMESTAMP - INTERVAL '2 seconds'
    ) THEN
        INSERT INTO orders_orderstatushistory (order_id, old_status, new_status, changed_at, notes)
        VALUES (p_order_id, v_old_status, p_new_status, CURRENT_TIMESTAMP, p_notes);
    END IF;
END;
$$;


-- ----------------------------------------------------------------------------
-- PROCEDURE 4: sp_deactivate_out_of_stock
-- Hides every product whose inventory has run out from the marketplace.
-- CALL sp_deactivate_out_of_stock();
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_deactivate_out_of_stock()
LANGUAGE plpgsql AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE products_product p
       SET is_active = FALSE
      FROM products_inventory i
     WHERE i.product_id = p.id
       AND i.quantity_available <= 0
       AND p.is_active = TRUE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deactivated % out-of-stock product(s)', v_count;
END;
$$;


-- ----------------------------------------------------------------------------
-- PROCEDURE 5: sp_clear_cart
-- Empties a consumer's shopping cart.
-- CALL sp_clear_cart(<consumer_id>);
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_clear_cart(p_consumer_id BIGINT)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM orders_cartitem
     WHERE cart_id IN (SELECT id FROM orders_cart WHERE consumer_id = p_consumer_id);
END;
$$;


-- ----------------------------------------------------------------------------
-- PROCEDURE 6: sp_verify_farmer
-- Marks a farmer as verified (admin action).
-- CALL sp_verify_farmer(<farmer_id>);
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_verify_farmer(p_farmer_id BIGINT)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE farmers_farmer SET verified = TRUE WHERE id = p_farmer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Farmer % does not exist', p_farmer_id;
    END IF;
END;
$$;


-- ----------------------------------------------------------------------------
-- PROCEDURE 7: sp_purge_expired_otps
-- Housekeeping: removes expired email OTP codes.
-- CALL sp_purge_expired_otps();
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_purge_expired_otps()
LANGUAGE plpgsql AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM accounts_emailotp WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Purged % expired OTP(s)', v_count;
END;
$$;
