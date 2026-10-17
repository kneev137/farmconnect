-- ============================================================================
-- FARMCONNECT: 05_LIVE_DEMO_QUERIES.SQL
-- Ready-to-run queries in pgAdmin 4 for the 10-Minute Code & DBMS Review Demo
-- ============================================================================

-- 1. LIST ALL STORED PROCEDURES, FUNCTIONS & TRIGGERS IN POSTGRESQL
SELECT proname AS name,
       CASE prokind WHEN 'p' THEN 'PROCEDURE' WHEN 'f' THEN 'FUNCTION' END AS type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY type, name;

SELECT tgname AS trigger_name, relname AS on_table
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal
ORDER BY tgname;


-- 2. DEMO STORED PROCEDURES (Invoked with CALL)
-- (a) Restock a product (+10 kg) -> Also fires Trigger 1 (trg_harvest_stock_sync)
SELECT product_id, quantity_available FROM products_inventory WHERE product_id = 1;
CALL sp_restock_product(1, 10.0, 'DBMS Review live harvest restock');
SELECT product_id, quantity_available FROM products_inventory WHERE product_id = 1;

-- (b) Update an order status -> Also logs into orders_orderstatushistory
CALL sp_update_order_status(1, 'confirmed', 'Verified during DBMS review');
SELECT * FROM orders_orderstatushistory ORDER BY changed_at DESC LIMIT 5;

-- (c) Deactivate any out-of-stock products (quantity_available <= 0)
CALL sp_deactivate_out_of_stock();

-- (d) Mark a farmer as verified
CALL sp_verify_farmer(3);

-- (e) Purge expired email OTPs
CALL sp_purge_expired_otps();


-- 3. DEMO STORED FUNCTIONS (Invoked with SELECT)
-- (a) Get Farmer Analytics (Gross Revenue, 90% Farmer Share, 10% Fee, Orders, Low Stock)
SELECT * FROM fn_farmer_analytics(3);


-- 4. DEMO PRE-COMPUTED DATABASE VIEWS
-- (a) Single-query Marketplace Catalog View (Stock, Freshness Badge, 90% Split, Ratings)
SELECT product_id, product_name, price_per_unit, farmer_share, platform_fee,
       quantity_available, freshness_label, avg_rating, city_state
FROM vw_product_catalog
LIMIT 10;

-- (b) Farmer Order Summary View
SELECT order_id, product_name, quantity, line_total, farmer_cut,
       order_status, delivery_status, payment_status
FROM vw_farmer_order_summary
ORDER BY placed_at DESC
LIMIT 10;
