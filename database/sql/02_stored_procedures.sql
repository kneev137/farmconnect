-- ============================================================================
-- FARMCONNECT: 02_STORED_PROCEDURES.SQL
-- Stored Functions & Procedures for Atomic Checkout, Order Cancel & Analytics
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION 1: fn_place_order
-- Executes complete checkout atomically inside PostgreSQL with row locks
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_place_order(
    p_consumer_id INT,
    p_address TEXT,
    p_payment_method VARCHAR
)
RETURNS JSON AS $$
DECLARE
    v_cart_id INT;
    v_order_id INT;
    v_total_amount NUMERIC(10, 2) := 0.00;
    v_item RECORD;
    v_inv RECORD;
    v_items_count INT := 0;
BEGIN
    -- 1. Locate the consumer's cart
    SELECT id INTO v_cart_id
    FROM orders_cart
    WHERE consumer_id = p_consumer_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Cart not found for this consumer');
    END IF;

    -- 2. Verify cart is not empty
    SELECT COUNT(*) INTO v_items_count
    FROM orders_cartitem
    WHERE cart_id = v_cart_id;

    IF v_items_count = 0 THEN
        RETURN json_build_object('success', false, 'error', 'Cannot checkout with an empty cart');
    END IF;

    -- 3. Lock inventories and verify stock for each item
    FOR v_item IN
        SELECT ci.product_id, ci.quantity, p.name, p.price_per_unit, p.unit
        FROM orders_cartitem ci
        JOIN products_product p ON p.id = ci.product_id
        WHERE ci.cart_id = v_cart_id
    LOOP
        -- Row lock on inventory
        SELECT id, quantity_available INTO v_inv
        FROM products_inventory
        WHERE product_id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND OR v_inv.quantity_available < v_item.quantity THEN
            RETURN json_build_object(
                'success', false,
                'error', format('Insufficient stock for %s. Available: %s %s', 
                                v_item.name, COALESCE(v_inv.quantity_available, 0), v_item.unit)
            );
        END IF;

        -- Accumulate total amount
        v_total_amount := v_total_amount + (v_item.quantity * v_item.price_per_unit);
    END LOOP;

    -- 4. Deduct inventory stock
    FOR v_item IN
        SELECT product_id, quantity
        FROM orders_cartitem
        WHERE cart_id = v_cart_id
    LOOP
        UPDATE products_inventory
        SET quantity_available = quantity_available - v_item.quantity,
            last_updated = CURRENT_TIMESTAMP
        WHERE product_id = v_item.product_id;
    END LOOP;

    -- 5. Create Order header
    INSERT INTO orders_order (
        consumer_id,
        status,
        total_amount,
        placed_at
    ) VALUES (
        p_consumer_id,
        'pending',
        v_total_amount,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_order_id;

    -- 6. Insert Order Items snapshot
    INSERT INTO orders_orderitem (
        order_id,
        product_id,
        quantity,
        price_at_purchase
    )
    SELECT
        v_order_id,
        ci.product_id,
        ci.quantity,
        p.price_per_unit
    FROM orders_cartitem ci
    JOIN products_product p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id;

    -- 7. Create Payment record
    INSERT INTO orders_payment (
        order_id,
        method,
        status,
        amount,
        paid_at
    ) VALUES (
        v_order_id,
        p_payment_method,
        CASE WHEN p_payment_method = 'cod' THEN 'completed' ELSE 'pending' END,
        v_total_amount,
        CASE WHEN p_payment_method = 'cod' THEN CURRENT_TIMESTAMP ELSE NULL END
    );

    -- 8. Create Delivery record
    INSERT INTO orders_delivery (
        order_id,
        address,
        status,
        estimated_date,
        delivered_at
    ) VALUES (
        v_order_id,
        p_address,
        'preparing',
        CURRENT_DATE + INTERVAL '2 days',
        NULL
    );

    -- 9. Clear the cart items
    DELETE FROM orders_cartitem WHERE cart_id = v_cart_id;

    -- 10. Update consumer default address if empty
    UPDATE accounts_consumer
    SET default_delivery_address = p_address
    WHERE id = p_consumer_id AND (default_delivery_address IS NULL OR default_delivery_address = '');

    RETURN json_build_object(
        'success', true,
        'order_id', v_order_id,
        'total_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- FUNCTION 2: fn_cancel_order
-- Cancels order and restores deducted stock to inventory
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_cancel_order(
    p_order_id INT,
    p_consumer_id INT
)
RETURNS JSON AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_restored_count INT := 0;
BEGIN
    SELECT * INTO v_order
    FROM orders_order
    WHERE id = p_order_id AND consumer_id = p_consumer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found or access denied');
    END IF;

    IF v_order.status NOT IN ('pending', 'confirmed') THEN
        RETURN json_build_object('success', false, 'error', format('Cannot cancel an order in %s status', v_order.status));
    END IF;

    -- Restore inventory for each product
    FOR v_item IN
        SELECT product_id, quantity
        FROM orders_orderitem
        WHERE order_id = p_order_id AND product_id IS NOT NULL
    LOOP
        UPDATE products_inventory
        SET quantity_available = quantity_available + v_item.quantity,
            last_updated = CURRENT_TIMESTAMP
        WHERE product_id = v_item.product_id;
        v_restored_count := v_restored_count + 1;
    END LOOP;

    -- Update Order status
    UPDATE orders_order
    SET status = 'cancelled'
    WHERE id = p_order_id;

    -- Update Payment status
    UPDATE orders_payment
    SET status = CASE WHEN status = 'completed' THEN 'refunded' ELSE 'failed' END
    WHERE order_id = p_order_id;

    -- Update Delivery status
    UPDATE orders_delivery
    SET status = 'failed'
    WHERE order_id = p_order_id;

    RETURN json_build_object(
        'success', true,
        'order_id', p_order_id,
        'restored_products', v_restored_count
    );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- FUNCTION 3: fn_farmer_analytics
-- Calculates gross revenue, 90% direct payout, active orders and low stock
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_farmer_analytics(p_farmer_id INT)
RETURNS TABLE (
    gross_revenue NUMERIC(10, 2),
    farmer_share NUMERIC(10, 2),
    platform_fee NUMERIC(10, 2),
    total_orders BIGINT,
    active_orders BIGINT,
    low_stock_products BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH farmer_products AS (
        SELECT p.id
        FROM products_product p
        JOIN farmers_farm f ON f.id = p.farm_id
        WHERE f.farmer_id = p_farmer_id
    ),
    order_metrics AS (
        SELECT 
            COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0.00) AS total_rev,
            COUNT(DISTINCT o.id) AS ord_count,
            COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'confirmed', 'shipped') THEN o.id END) AS act_count
        FROM orders_orderitem oi
        JOIN orders_order o ON o.id = oi.order_id
        WHERE oi.product_id IN (SELECT id FROM farmer_products)
          AND o.status != 'cancelled'
    ),
    stock_metrics AS (
        SELECT COUNT(*) AS low_stock
        FROM products_inventory inv
        WHERE inv.product_id IN (SELECT id FROM farmer_products)
          AND inv.quantity_available < 10
    )
    SELECT 
        ROUND(om.total_rev, 2)::NUMERIC(10, 2),
        ROUND(om.total_rev * 0.90, 2)::NUMERIC(10, 2),
        ROUND(om.total_rev * 0.10, 2)::NUMERIC(10, 2),
        om.ord_count,
        om.act_count,
        sm.low_stock
    FROM order_metrics om, stock_metrics sm;
END;
$$ LANGUAGE plpgsql;
