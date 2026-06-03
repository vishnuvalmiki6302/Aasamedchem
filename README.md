# AASAMED — Lab Inventory & Order Management System

> A full-stack web application for managing laboratory chemical inventory and seller orders, with role-based access, smart unit conversion, and real-time order lifecycle management.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [How the Backend Connects to the Frontend](#4-how-the-backend-connects-to-the-frontend)
5. [Data Modelling](#5-data-modelling)
6. [Unit Conversion System](#6-unit-conversion-system)
7. [Core Flows](#7-core-flows)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
9. [Code Structure](#9-code-structure)
10. [API Reference](#10-api-reference)
11. [Running the Project Locally](#11-running-the-project-locally)
12. [Deployment to Vercel](#12-deployment-to-vercel)

---

## 1. Project Overview

AASAMED is a chemical laboratory inventory and quotation/order management platform built for two types of users:

| Role   | What they can do |
|--------|-----------------|
| **Admin** | Add, edit, delete products; view and approve/reject all seller orders; see dashboard statistics |
| **Seller** | Browse the product catalog, build a cart, place orders; view their own order history |

### Key Capabilities

- **Inventory Management** — Products stored with SKU, category, base unit (g/mL/item), price per base unit, and stock quantity
- **Unit Conversion** — Sellers order in human-friendly units (kg, L) while the backend always stores and prices in base units (g, mL)
- **Cart System** — Sellers add products to a cart, select quantity and unit, see live price calculation, then submit as one order
- **Order Lifecycle** — Pending → Approved / Rejected, with admin controls to reset
- **JWT Authentication** — Stateless login with 7-day expiring tokens

---

## 2. Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas (cloud) |
| ODM | Mongoose 8 |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Password hashing | bcryptjs |
| Config | dotenv |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 (Vite) |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Icons | Lucide React |
| Styling | Vanilla CSS (custom design system) |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (React)                      │
│                                                          │
│  LoginPage → AuthContext (JWT stored in localStorage)    │
│         ↓                                                │
│  Admin Routes          Seller Routes                     │
│  ├── Dashboard         ├── Shop (Products + Cart)        │
│  ├── Products (CRUD)   └── My Orders                     │
│  └── Orders (Approve)                                    │
│                                                          │
│  Axios instance (src/api/axios.js)                       │
│  → attaches Bearer token to every request automatically  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP (JSON)
                   │ http://localhost:5000/api/...
┌──────────────────▼──────────────────────────────────────┐
│                  Express.js Server                       │
│                                                          │
│  Middleware:                                             │
│  ├── cors()        — allow cross-origin from :5173       │
│  ├── express.json() — parse request body                 │
│  └── protect / requireAdmin (JWT verification)           │
│                                                          │
│  Routes:                                                 │
│  ├── POST /api/auth/register                             │
│  ├── POST /api/auth/login                                │
│  ├── GET/POST/PUT/DELETE /api/products                   │
│  └── GET/POST/PUT /api/orders                            │
│                                                          │
│  Controllers → Models → Mongoose → MongoDB Atlas         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. How the Backend Connects to the Frontend

### Step-by-step connection flow

#### 1. Axios Instance (`frontend/src/api/axios.js`)
```js
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// Automatically attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
    return Promise.reject(err);
  }
);
```

**Why a single Axios instance?** — It ensures the base URL and auth header are managed in one place. Every API call across all pages uses this instance so we never forget to attach the token.

#### 2. Auth Flow
```
User fills login form
    → POST /api/auth/login  { email, password }
    ← { token, user: { id, name, email, role } }
    → Stored in localStorage + React AuthContext
    → Axios interceptor picks up token for all future requests
    → React Router redirects to /admin/dashboard OR /seller/shop
```

#### 3. Protected Routes
```js
// ProtectedRoute.jsx
if (!user) return <Navigate to="/login" />;
if (adminOnly && !isAdmin) return <Navigate to="/seller/shop" />;
```
Every admin page has `adminOnly` prop — sellers cannot access admin URLs even if they type them manually.

#### 4. CORS Setup (backend)
```js
// server.js
app.use(cors()); // allows requests from the Vite dev server on port 5173
```

In production, you would restrict this to your specific domain.

---

## 5. Data Modelling

### Design Decision: Store in Base Units

The most important modelling decision is that **all prices and stock quantities are stored in the smallest indivisible base unit**:

| Product type | Base unit | Example |
|-------------|-----------|---------|
| Weight (chemicals) | `g` (grams) | Sodium Chloride: ₹0.05/g |
| Volume (liquids) | `ml` (milliliters) | Acetic Acid: ₹0.80/mL |
| Count (glassware) | `item` | Beaker: ₹180/item |

**Why?** — If we stored prices in mixed units (some in kg, some in g), comparison and calculation would require conversion every time. Storing in base units means:
- Price calculation is always: `convertedQuantity × pricePerBaseUnit`
- No conditional logic needed in the order controller
- Adding new units in the future only requires updating the conversion table

### User Schema
```js
{
  name: String,
  email: String (unique, lowercase),
  password: String (bcrypt hashed via pre-save hook),
  role: 'admin' | 'seller'
}
```

### Product Schema
```js
{
  name: String,
  sku: String (unique, uppercase),
  category: String,
  baseUnit: 'g' | 'ml' | 'item',
  pricePerBaseUnit: Number,   // Stored as floating point. Example: 0.05
  stockQuantity: Number       // Always in base units
}
```

### Precision & Rounding Rules
- **Data Types**: Both `pricePerBaseUnit` and `stockQuantity` are stored as native MongoDB `Number` types (double-precision floating point).
- **Rounding Strategy**: All intermediate arithmetic (e.g., unit conversions and line total calculations) happens with full floating-point precision on the backend to avoid compounding rounding errors. 
- **Display**: Rounding to 2 decimal places (`.toFixed(2)`) is strictly isolated to the frontend presentation layer right before displaying the final `lineTotal` or `totalAmount` to the user in Indian Rupees (₹).

### Order Schema
```js
{
  user: ObjectId → User,      // which seller placed it
  items: [{
    product: ObjectId → Product,
    orderedQuantity: Number,  // what the seller typed (e.g. 2)
    orderedUnit: String,      // what unit they chose (e.g. 'kg')
    convertedQuantity: Number,// backend-computed (e.g. 2000 grams)
    lineTotal: Number         // convertedQty × pricePerBaseUnit
  }],
  totalAmount: Number,        // sum of all lineTotals
  status: 'Pending' | 'Approved' | 'Rejected'
}
```

**Why store `convertedQuantity` and `lineTotal`?** — These are computed at order-creation time and stored permanently. This means even if the product price changes later, the historical order still shows the correct price at the time of ordering. This is standard e-commerce practice.

---

## 6. Unit Conversion System

This is one of the most thoughtful parts of the system.

### Conversion Table (`backend/utils/conversion.js` and mirrored in `frontend/src/utils/conversion.js`)

```js
const factors = {
  g:    1,      // 1 gram = 1 gram (base unit)
  kg:   1000,   // 1 kg = 1000 grams
  ml:   1,      // 1 mL = 1 mL (base unit)
  l:    1000,   // 1 L = 1000 mL
  item: 1,      // 1 item = 1 item
};

function convertToBaseUnit(qty, unit) {
  return qty * factors[unit.toLowerCase()];
}
```

### How it works end-to-end

```
Seller selects: Sodium Chloride (NaCl), baseUnit = 'g'

Available ordering units shown: [ Grams (g), Kilograms (kg) ]

Seller enters: qty = 2, unit = 'kg'

Frontend (live preview):
  convertedQty = convertToBaseUnit(2, 'kg') = 2000
  lineTotal = 2000 × 0.05 = ₹100  ← shown instantly in cart

Backend (on order submission) does the same calculation:
  convertedQty = convertToBaseUnit(2, 'kg') = 2000
  lineTotal = 2000 × 0.05 = ₹100
  → saved to DB
```

### Why the frontend has the same conversion file?

The frontend mirrors the conversion logic for **live price preview** in the cart. The backend independently recalculates when the order is submitted. This means:
- The seller sees accurate prices in real-time without waiting for an API call
- The backend does not trust frontend calculations — it recomputes everything, preventing tampering

### Available units by base unit

| Base unit | Seller can order in |
|-----------|-------------------|
| `g` (gram) | g, kg |
| `ml` (milliliter) | mL, L |
| `item` | item only |

This is handled by `getOrderingUnits(baseUnit)` in the conversion utility.

---

## 7. Core Flows

### 7.1 Inventory Management (Admin)
```
Admin logs in
    → Navigate to /admin/products
    → GET /api/products (fetch all)
    → Add/Edit product modal → POST or PUT /api/products/:id
    → Delete → DELETE /api/products/:id
    → Search: GET /api/products?search=acid (regex, case-insensitive in MongoDB)
```

### 7.2 Unit Conversion & Quotation/Order Flow (Seller)
```
Seller logs in (or registers via "Create an account")
    → /seller/shop (combined products + cart page)
    → Browse products (filtered by category, searchable)
    → Click "Add to Cart" on a product
    → In cart: enter quantity (e.g. 2), select unit (e.g. kg)
    → Live price = convertToBaseUnit(2, 'kg') × pricePerBaseUnit shown instantly
    → Click "Place Order"
    → POST /api/orders { items: [{ productId, orderedQuantity, orderedUnit }] }
    → Backend: converts qty, calculates lineTotal, saves order with status 'Pending'
    → Seller redirected to /seller/my-orders
```

### 7.3 Order Approval (Admin)
```
Admin navigates to /admin/orders
    → GET /api/orders (all orders, populated with user and product names)
    → Filter by Pending / Approved / Rejected
    → Expand any order row to see itemised breakdown
    → Click "Approve" or "Reject"
    → PUT /api/orders/:id/status { status: 'Approved' }
    → Order status updated in DB, table updates instantly
```

### 7.4 Admin Visibility
- Admin can see **all orders from all sellers** with the seller's name and email
- The `getAllOrders` controller uses `.populate('user', 'name email')` to join User data
- The seller can only see their own orders via `Order.find({ user: req.user._id })`
- This separation is enforced on the **backend** with JWT middleware, not just the UI

---

## 8. Role-Based Access Control (RBAC)

### Backend enforcement

```js
// middleware/auth.js

// Step 1: Verify token
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-password');
  next();
};

// Step 2: Check role
const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Admins only' });
};
```

### Applied to routes
```js
router.get('/',             protect, requireAdmin, getAllOrders);   // Admin only
router.get('/my-orders',   protect, getMyOrders);                  // Any logged-in user
router.post('/',           protect, createOrder);                  // Any logged-in user
router.put('/:id/status',  protect, requireAdmin, updateStatus);   // Admin only
```

### Frontend enforcement
```jsx
// ProtectedRoute.jsx — guards React routes
if (!user) return <Navigate to="/login" />;
if (adminOnly && !isAdmin) return <Navigate to="/seller/shop" />;
```

**Important**: Frontend protection is for UX only. Backend always re-validates — even if someone manipulates the frontend, the API will reject unauthorized requests.

---

## 9. Code Structure

```
AASAMED/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # register, login logic
│   │   ├── productController.js    # CRUD for products
│   │   └── orderController.js      # create, list, update status
│   ├── middleware/
│   │   └── auth.js                 # protect + requireAdmin middleware
│   ├── models/
│   │   ├── User.js                 # schema + bcrypt pre-save + comparePassword
│   │   ├── Product.js              # schema with baseUnit enum
│   │   └── Order.js                # schema with embedded orderItemSchema
│   ├── routes/
│   │   ├── auth.js                 # /api/auth routes
│   │   ├── products.js             # /api/products routes
│   │   └── orders.js               # /api/orders routes
│   ├── utils/
│   │   └── conversion.js           # convertToBaseUnit() — single source of truth
│   ├── seed.js                     # populates DB with demo users + 10 products
│   ├── server.js                   # Express setup, DB connection, route mounting
│   ├── vercel.json                 # Vercel deployment config for API
│   └── .env                        # MONGO_URI, JWT_SECRET, PORT
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js            # Axios instance with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx     # Global auth state (user, token, login, logout)
    │   ├── components/
    │   │   ├── Layout.jsx          # Sidebar + topbar — shared across all pages
    │   │   └── ProtectedRoute.jsx  # Route guard component
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx  # Stats + recent orders
    │   │   │   ├── AdminProducts.jsx   # Full CRUD with modals
    │   │   │   └── AdminOrders.jsx     # Approve/reject with expandable rows
    │   │   └── seller/
    │   │       ├── SellerShop.jsx      # Products grid + cart panel (combined)
    │   │       └── SellerMyOrders.jsx  # Order history with expandable items
    │   ├── utils/
    │   │   └── conversion.js       # Frontend mirror of backend conversion logic
    │   ├── App.jsx                 # Router + AuthProvider setup
    │   ├── index.css               # Complete custom design system
    │   └── main.jsx                # React entry point
    ├── vercel.json                 # Vercel deployment config for React SPA
    └── index.html
```

### Design Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| Controller-Route separation | Backend | Clean separation of HTTP handling and business logic |
| Mongoose pre-save hook | User.js | Password auto-hashed before any save — impossible to store plaintext accidentally |
| Axios interceptor | axios.js | Auth token attached once, not in every API call |
| React Context | AuthContext.jsx | Avoid prop-drilling user state through every component |
| Single source of truth | conversion.js | Conversion logic in one file on both sides — no inconsistency risk |
| Embedded sub-documents | Order.items | Order items stored inside the order, not as a separate collection — faster reads, atomicity |

---

## 10. API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Create new account |
| POST | `/api/auth/login` | Public | Login, returns JWT |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Any user | List all products (supports `?search=query`) |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Seller | Place new order |
| GET | `/api/orders` | Admin | Get ALL orders |
| GET | `/api/orders/my-orders` | Seller | Get own orders only |
| PUT | `/api/orders/:id/status` | Admin | Update status (Approved/Rejected/Pending) |

---

## 11. Running the Project Locally

### Prerequisites
- Node.js 18+
- A Database connection (This project is built for **MongoDB Atlas**, an alternative to Neon PostgreSQL, utilizing Mongoose ODM).

### Backend
```bash
cd backend
npm install
# Create .env with these values (DO NOT commit this file):
# PORT=5000
# MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
# JWT_SECRET=your_secret_key

npm run seed    # Populate DB with test data
npm run dev     # Start server with nodemon on :5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # Starts Vite dev server on :5173
```

### How to Log In & Test the Application
You can register a new account on the `/register` page, or use the test credentials below generated by `npm run seed`:

| Role | Email | Password | What they do |
|------|-------|----------|--------------|
| **Admin** | admin@test.com | password123 | View dashboard, manage inventory, approve orders. |
| **Seller** | seller@test.com | password123 | View the shop, add items to cart (unit converted), submit order. |

---

## 12. Deployment to Vercel

This repository is pre-configured with `vercel.json` files in both the frontend and backend directories for seamless deployment as two separate Vercel projects.

### Deploying the Backend (API)
1. Push your code to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select this repository.
3. Edit the **Root Directory** and select `backend`.
4. In the Environment Variables section, securely add:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Your secure secret string.
5. Click **Deploy**. Vercel will use the `backend/vercel.json` file to deploy the Express API as serverless functions.
6. Once deployed, note the production URL (e.g., `https://aasamed-api.vercel.app`).

### Deploying the Frontend (React SPA)
1. In the Vercel dashboard, click **Add New Project** and select this repository again.
2. Edit the **Root Directory** and select `frontend`.
3. Make sure the Framework Preset is detected as **Vite**.
4. *(Optional but recommended)* Add an Environment Variable for the API URL so the frontend knows where to fetch data:
   - `VITE_API_URL`: Your deployed backend URL + `/api` (e.g., `https://aasamed-api.vercel.app/api`).
5. Click **Deploy**. Vercel will use `frontend/vercel.json` to handle React Router SPA rewrites properly.


