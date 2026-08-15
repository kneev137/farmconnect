# 🌾 FarmConnect — Direct Farm-to-Table Marketplace

> **A Modern Full-Stack DBMS Platform connecting consumers directly with verified local farmers, ensuring 90% direct payouts, fair price transparency, harvest-fresh traceability, and zero middlemen exploitation.**

---

## 🌟 Key Highlights & Innovations

1. **👨‍🌾 90/10 Fair Price Transparency**:
   - Every produce listing includes an itemized breakdown proving that **90% of every rupee goes straight to the local farmer**, while 10% covers infrastructure and delivery logistics.
2. **🌱 Harvest-to-Table Freshness Journey**:
   - Dynamic harvest logging displaying computed freshness tags (*"Harvested today"*, *"Harvested yesterday"*) and a 0-day warehouse transit guarantee.
3. **🏡 Dedicated Farmer Portfolios (`/farmers/:id`)**:
   - Showcases the farmer's story, verified status, land acreage, sustainable soil practices, review ratings, and their complete harvested produce catalog.
4. **💚 Eco-Impact / Food Miles Carbon Tracker**:
   - Calculates and displays estimated supply chain CO₂ emissions saved (~1.4 kg per direct order) by bypassing centralized cold-storage industrial chains.
5. **🔒 Robust DBMS Concurrency & Atomic Checkout**:
   - Implements PostgreSQL row-level locks (`select_for_update()`) during checkout to eliminate race conditions and overselling during simultaneous purchases.
   - Atomic rollback of reserved inventory on order cancellation.

---

## 🏗️ Tech Stack & Architecture

- **Backend**: Python 3.14 + Django 6.1 + Django REST Framework (DRF)
- **Database**: PostgreSQL 18 (Normalized relational schema with 3NF separation of `User`, `Consumer`, `Farmer`, `Farm`, `Product`, `Inventory`, `HarvestRecord`, `Cart`, `Order`, `Payment`, `Delivery`, `Review`)
- **Authentication**: JWT (JSON Web Tokens) with `SimpleJWT` (Role-Based Access Control: `consumer`, `farmer`, `admin`)
- **API Documentation**: OpenAPI 3.0 via `drf-spectacular` (Interactive Swagger UI & ReDoc)
- **Frontend**: React 18 + Vite + Vanilla CSS Design System + `lucide-react`
- **Security**: CORS (`django-cors-headers`), custom object-level permissions, atomic database transactions

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ (tested on Node v24)
- PostgreSQL 16+ (Local instance `farmconnect_db`)

---

### Step 1: Backend Setup (Django REST API)

1. Open a terminal in the root project folder:
   ```powershell
   cd C:\Users\kneev\farmconnect
   ```

2. Activate the virtual environment:
   ```powershell
   venv\Scripts\activate
   ```

3. Run migrations and seed realistic data:
   ```powershell
   python manage.py migrate
   python manage.py seed_data
   ```

4. Start the Django development server:
   ```powershell
   python manage.py runserver
   ```
   *The API backend will be live at `http://127.0.0.1:8000/api/`*

---

### Step 2: Frontend Setup (React + Vite)

1. Open a **second terminal window**:
   ```powershell
   cd C:\Users\kneev\farmconnect\frontend
   ```

2. Install dependencies (if not already installed):
   ```powershell
   npm install
   ```

3. Start the Vite dev server:
   ```powershell
   npm run dev
   ```
   *The React marketplace will be live at `http://localhost:5173/`*

---

## 🔑 Demo Accounts (Ready to Test)

| Role | Username | Password | Notes |
|---|---|---|---|
| **Consumer** | `priya_sharma` | `testpass123` | Can browse, add to cart, checkout, view order tracking & review produce |
| **Consumer** | `arjun_mehta` | `testpass123` | Pre-configured delivery address in Mumbai |
| **Farmer** | `ramesh_patel` | `testpass123` | Owns *Sahyadri Organic Orchard* (Nashik), access to Farmer Dashboard |
| **Farmer** | `ananya_sen` | `testpass123` | Owns *Nilgiri Mist Valley Farm* (Ooty) |
| **Farmer** | `harpreet_singh` | `testpass123` | Owns *Punjab Heritage Grains* (Ludhiana) |
| **Farmer** | `kavitha_murugan` | `testpass123` | Owns *Cauvery Dairy & Apiary* (Tiruchirappalli) |
| **Admin** | `admin` | `admin123` | Full Django Admin access at `/admin/` |

> 💡 **Tip**: On the `/login` page, you can use the **1-Click Quick Demo Sign-In** buttons to instantly log in as Consumer or Farmer!

---

## 📡 API Documentation & Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/token/` | `POST` | Obtain JWT access and refresh token pair |
| `/api/token/refresh/` | `POST` | Refresh expired access token |
| `/api/register/` | `POST` | Register a new Consumer or Farmer |
| `/api/me/` | `GET`, `PATCH` | View and update authenticated user profile |
| `/api/products/` | `GET`, `POST` | List produce with filtering/search, or add produce (farmers only) |
| `/api/products/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve/update product details |
| `/api/farmers/` | `GET` | List verified farmers |
| `/api/farmers/{id}/` | `GET` | Retrieve farmer story, farm details & listed produce portfolio |
| `/api/farmer/metrics/` | `GET` | Live business metrics (Revenue, active orders, low-stock count) |
| `/api/cart/` | `GET` | Retrieve consumer's active cart with subtotal & 90/10 breakdown |
| `/api/cart-items/` | `POST`, `PATCH`, `DELETE` | Add, update quantity, or remove items from cart |
| `/api/checkout/` | `POST` | Atomic checkout with PostgreSQL row locking |
| `/api/orders/` | `GET` | Consumer order history with live delivery status |
| `/api/farmer-orders/` | `GET` | Incoming orders for farmer's products |
| `/api/deliveries/{id}/status/` | `PATCH` | Update delivery tracking status (`preparing` $\rightarrow$ `out_for_delivery` $\rightarrow$ `delivered`) |
| `/api/payments/{id}/pay/` | `POST` | Payment transition simulation |
| `/api/docs/` | `GET` | Interactive Swagger UI API documentation |
| `/api/redoc/` | `GET` | ReDoc API Reference |

---

## 🧪 Automated Testing

Run the full Django test suite (22 unit & integration tests covering auth, concurrency locks, orders, cart merging, payments, and RBAC):

```powershell
python manage.py test
```

Expected output:
```
Ran 22 tests in 47.040s
OK
```

---

## 📜 License
Built as an academic DBMS course project for sustainable agriculture and direct farmer empowerment.
