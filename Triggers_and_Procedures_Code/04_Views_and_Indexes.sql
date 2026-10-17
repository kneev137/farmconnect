-- ============================================================================
-- FARMCONNECT: 03_VIEWS_AND_INDEXES.SQL
-- Strategic PostgreSQL Views & B-Tree Indexes for N+1 Query Elimination
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW 1: vw_product_catalog
-- Solves the N+1 problem: precomputes stock, rating, freshness & farm location
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_product_catalog AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    p.price_per_unit,
    p.unit,
    p.image,
    p.is_active,
    p.created_at,
    -- Inventory
    COALESCE(inv.quantity_available, 0.00) AS quantity_available,
    -- Farm & Farmer
    fm.id AS farm_id,
    fm.name AS farm_name,
    fm.location AS farm_location,
    COALESCE(c.name || ', ' || c.state, fm.location) AS city_state,
    fr.id AS farmer_id,
    fr.farm_name AS farmer_brand_name,
    fr.verified AS farmer_verified,
    -- Ratings Aggregate
    ROUND(COALESCE(AVG(r.rating), 0), 1) AS avg_rating,
    COUNT(r.id) AS review_count,
    -- Harvest Freshness
    hr.latest_harvest_date,
    CASE 
        WHEN hr.latest_harvest_date IS NULL THEN NULL
        WHEN (CURRENT_DATE - hr.latest_harvest_date) = 0 THEN 'Harvested today'
        WHEN (CURRENT_DATE - hr.latest_harvest_date) = 1 THEN 'Harvested yesterday'
        ELSE 'Harvested ' || (CURRENT_DATE - hr.latest_harvest_date) || ' days ago'
    END AS freshness_label,
    (CURRENT_DATE - hr.latest_harvest_date) AS days_since_harvest,
    -- 90% Price Transparency
    ROUND(p.price_per_unit * 0.90, 2) AS farmer_share,
    ROUND(p.price_per_unit * 0.10, 2) AS platform_fee
FROM products_product p
LEFT JOIN products_inventory inv ON inv.product_id = p.id
JOIN farmers_farm fm ON fm.id = p.farm_id
LEFT JOIN farmers_city c ON c.id = fm.city_id
JOIN farmers_farmer fr ON fr.id = fm.farmer_id
LEFT JOIN reviews_review r ON r.product_id = p.id
LEFT JOIN (
    SELECT product_id, MAX(harvest_date) AS latest_harvest_date
    FROM products_harvestrecord
    GROUP BY product_id
) hr ON hr.product_id = p.id
GROUP BY 
    p.id, p.name, p.category, p.price_per_unit, p.unit, p.image, p.is_active, p.created_at,
    inv.quantity_available, fm.id, fm.name, fm.location, c.name, c.state,
    fr.id, fr.farm_name, fr.verified, hr.latest_harvest_date;


-- ----------------------------------------------------------------------------
-- VIEW 2: vw_farmer_order_summary
-- Summarizes order items per farmer with live payment and delivery status
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_farmer_order_summary AS
SELECT
    oi.id AS order_item_id,
    o.id AS order_id,
    o.placed_at,
    o.status AS order_status,
    p.id AS product_id,
    p.name AS product_name,
    oi.quantity,
    oi.price_at_purchase,
    ROUND(oi.quantity * oi.price_at_purchase, 2) AS line_total,
    ROUND(oi.quantity * oi.price_at_purchase * 0.90, 2) AS farmer_cut,
    fr.id AS farmer_id,
    fr.farm_name AS farmer_name,
    u.username AS consumer_name,
    d.status AS delivery_status,
    pay.status AS payment_status
FROM orders_orderitem oi
JOIN orders_order o ON o.id = oi.order_id
JOIN accounts_consumer cons ON cons.id = o.consumer_id
JOIN accounts_user u ON u.id = cons.user_id
JOIN products_product p ON p.id = oi.product_id
JOIN farmers_farm fm ON fm.id = p.farm_id
JOIN farmers_farmer fr ON fr.id = fm.farmer_id
LEFT JOIN orders_delivery d ON d.order_id = o.id
LEFT JOIN orders_payment pay ON pay.order_id = o.id;


-- ----------------------------------------------------------------------------
-- STRATEGIC B-TREE INDEXES
-- ----------------------------------------------------------------------------

-- 1. Index for marketplace category filtering and active status
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products_product (category, is_active);

-- 2. Index for consumer order retrieval sorted by date
CREATE INDEX IF NOT EXISTS idx_orders_consumer_placed 
ON orders_order (consumer_id, placed_at DESC);

-- 3. Index for latest harvest lookup
CREATE INDEX IF NOT EXISTS idx_harvest_product_date 
ON products_harvestrecord (product_id, harvest_date DESC);

-- 4. Partial index for low-stock inventory dashboard queries (< 10 units)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock 
ON products_inventory (quantity_available) 
WHERE quantity_available < 10;
