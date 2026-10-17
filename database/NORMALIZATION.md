# FarmConnect — Database Normalization & Optimization Reference

## 1. Relational Schema Normalization Analysis (BCNF / 3NF)

### What is Normalization?
Normalization is the process of structuring relational database tables to reduce data redundancy, eliminate insert/update/delete anomalies, and ensure data integrity.

---

### Entity-by-Entity Normal Form Breakdown

#### 1. Accounts Domain (`accounts_user`, `accounts_consumer`)
* **Primary Key:** `id`
* **Functional Dependencies:**
  * `id → username, email, password, role, phone_number, created_at`
  * `username → id, email, ...` (Candidate key)
  * `email → id, username, ...` (Candidate key)
* **Normal Form:** **Boyce-Codd Normal Form (BCNF)**
  * Every determinant (`id`, `username`, `email`) is a superkey.
  * No partial dependencies (1NF & 2NF satisfied).
  * No transitive dependencies (3NF satisfied).

---

#### 2. Geographic & Farm Domain (`farmers_city`, `farmers_farm`, `farmers_farmer`)
* **Previous Flaw (Before Optimization):**
  * `farm.location = "Nashik, Maharashtra"` violated **1NF** (multi-valued attribute: city and state joined in a single column) and **3NF** (transitive dependency: `farm_id → city → state`).
* **Normalized Structure (BCNF):**
  * `farmers_city (id PK, name, state)` with `UNIQUE(name, state)`.
  * `farmers_farm (id PK, farmer_id FK, city_id FK, name, size_acres, ...)`
  * Functional Dependencies:
    * `city_id → name, state` (superkey of `farmers_city`)
    * `farm_id → farmer_id, city_id, name, ...` (superkey of `farmers_farm`)
  * Every determinant is a candidate key $\implies$ **Strict BCNF**.

---

#### 3. Produce & Inventory Domain (`products_category`, `products_product`, `products_inventory`, `products_harvestrecord`)
* **`products_category`:** `slug (PK) → name, description`. Determinant is superkey $\implies$ **BCNF**.
* **`products_product`:** `id (PK) → farm_id, name, category_rel_id, price_per_unit, unit, is_active`.
  * **CHECK Constraint:** `chk_product_price_positive (price_per_unit > 0)`.
* **`products_inventory`:** `id (PK) → product_id (UNIQUE FK), quantity_available, last_updated`.
  * **CHECK Constraint:** `chk_inventory_stock_non_negative (quantity_available >= 0)`.
* **`products_harvestrecord`:** `id (PK) → product_id, harvest_date, quantity_harvested`.
  * **CHECK Constraint:** `chk_harvest_quantity_positive (quantity_harvested > 0)`.
* **Normal Form:** **BCNF**.

---

#### 4. Cart & Orders Domain (`orders_cart`, `orders_cartitem`, `orders_order`, `orders_orderitem`, `orders_payment`, `orders_delivery`, `orders_orderstatushistory`)
* **`orders_cartitem`:**
  * Composite Constraint: `UNIQUE(cart_id, product_id)`.
  * Prevents duplicate rows for the same product in a cart.
* **`orders_orderitem`:**
  * `id (PK) → order_id, product_id, quantity, price_at_purchase`.
  * `price_at_purchase` captures a point-in-time financial snapshot so future catalog price changes do not rewrite historical revenue.
* **`orders_order` & `orders_payment`:**
  * Derived total amounts are locked and maintained via automated PostgreSQL triggers (`trg_calculate_order_total`, `trg_sync_payment_amount`).
* **`orders_orderstatushistory` (Audit Trail):**
  * `id (PK) → order_id, old_status, new_status, changed_at, notes`.
  * Automatically appended on every `order.status` update via trigger `trg_order_audit_trail`.
* **Normal Form:** **BCNF**.

---

#### 5. Reviews Domain (`reviews_review`)
* `id (PK) → product_id, consumer_id, rating, comment, created_at`.
* Composite Unique: `UNIQUE(product_id, consumer_id)`. (One review per consumer per product).
* **CHECK Constraint:** `chk_review_rating_1_to_5 (rating BETWEEN 1 AND 5)`.
* **Normal Form:** **BCNF**.

---

## 2. PostgreSQL Triggers Implemented (`database/sql/01_triggers.sql`)

| Trigger Name | Event & Table | Procedure Executed | Purpose |
| :--- | :--- | :--- | :--- |
| **`trg_harvest_stock_sync`** | `AFTER INSERT ON products_harvestrecord` | `fn_harvest_stock_sync()` | Automatically increments `products_inventory.quantity_available` by `NEW.quantity_harvested`. |
| **`trg_calculate_order_total`** | `AFTER INSERT OR UPDATE OR DELETE ON orders_orderitem` | `fn_recalc_order_total()` | Recalculates `orders_order.total_amount = SUM(quantity * price_at_purchase)`. |
| **`trg_sync_payment_amount`** | `AFTER UPDATE OF total_amount ON orders_order` | `fn_sync_payment_amount()` | Synchronizes `orders_payment.amount` with updated order total. |
| **`trg_delivery_status_cascade`** | `BEFORE UPDATE OF status ON orders_delivery` | `fn_cascade_delivery_status()` | Auto-syncs delivery status to order (`delivered` sets `order.status = 'delivered'` and `delivered_at = NOW()`). |
| **`trg_order_audit_trail`** | `AFTER UPDATE OF status ON orders_order` | `fn_log_order_audit()` | Logs order state transitions into `orders_orderstatushistory` with timestamp. |

---

## 3. Stored Functions Implemented (`database/sql/02_stored_procedures.sql`)

### 1. `fn_place_order(p_consumer_id, p_address, p_payment_method)`
* **ACID Transaction:**
  1. Acquires row-level exclusive locks (`FOR UPDATE`) on `products_inventory`.
  2. Verifies stock availability.
  3. Deducts stock.
  4. Inserts `orders_order`, `orders_orderitem`, `orders_payment`, `orders_delivery`.
  5. Clears `orders_cartitem`.
* **Call Syntax in pgAdmin:**
  ```sql
  SELECT fn_place_order(1, 'Flat 402, Green Avenue, Pune', 'card');
  ```

### 2. `fn_cancel_order(p_order_id, p_consumer_id)`
* Reverses inventory deductions for all order items and marks order `cancelled` and payment `refunded`.
* **Call Syntax in pgAdmin:**
  ```sql
  SELECT fn_cancel_order(12, 1);
  ```

### 3. `fn_farmer_analytics(p_farmer_id)`
* Returns gross revenue, 90% direct farmer payout, platform fee, total orders, active orders, and low-stock count in a single query.
* **Call Syntax in pgAdmin:**
  ```sql
  SELECT * FROM fn_farmer_analytics(1);
  ```

---

## 4. Query Optimization & Views (`database/sql/03_views_and_indexes.sql`)

### 1. `vw_product_catalog` View
Pre-aggregates:
* Live inventory
* Normalized city & state
* Verified farmer details
* Precomputed average rating and review counts
* Freshness badge label (`Harvested today`, `Harvested 2 days ago`)
* 90% price transparency split

**Eliminates the N+1 query problem**, dropping network query round-trips from **~43 queries down to 1 query**.

### 2. Strategic B-Tree Indexes
* `idx_products_category_active`: Optimizes catalog category filtering.
* `idx_orders_consumer_placed`: Accelerates consumer order history queries.
* `idx_harvest_product_date`: Fast index on harvest dates.
* `idx_inventory_low_stock`: Partial index on low inventory (`quantity_available < 10`).
