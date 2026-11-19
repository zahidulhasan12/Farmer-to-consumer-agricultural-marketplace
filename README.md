# AgroConnect — Farmer-to-Consumer Agricultural Marketplace

A direct digital marketplace connecting local Bangladeshi farmers with consumers: farmers can list fresh agricultural produce, update prices and stock levels, while consumers can browse available harvest and inspect product provenance.

Built as a REST API with **FastAPI** and a **React + TypeScript** frontend, deployable to **Vercel** as a unified project.

> **Course:** CSE309 Mid Project Assessment – MVP Implementation & Viva (30 Marks)  
> **Student:** Zahidul Hasan Sourov (ID: 2220955)  
> **Feature Implemented:** Agricultural Product Management System (Full CRUD)

---

## 🌾 Features (MVP Demonstration)

- **Complete CRUD Operations:**
  1. **Create Product (`POST /api/v1/products`):** Farmers can list new agricultural produce with name, category, price in ৳ (BDT), unit, quantity, description, image, and farm location.
  2. **Read All Products (`GET /api/v1/products`):** Consumers and farmers can view all products with real-time keyword search and category filtering (Vegetables, Fruits, Grains, Dairy, Poultry, Other).
  3. **Read Single Product (`GET /api/v1/products/{id}`):** View single product details, complete metadata, farmer provenance, and timestamps.
  4. **Update Product (`PUT/PATCH /api/v1/products/{id}`):** Farmers can update price, stock availability, and descriptions.
  5. **Delete Product (`DELETE /api/v1/products/{id}`):** Remove unavailable products from the database with immediate UI feedback and confirmation dialogs.
- **Automatic Database Seeding:** Pre-loaded on first launch with realistic Bangladeshi produce (Bogura tomatoes, Munshiganj potatoes, Rajshahi mangoes, Dinajpur rice, Sirajganj milk).
- **Interactive API Documentation:** Swagger UI available at `/api/docs`.

---

## 🛠 Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Modern reactive single-page application with strict type safety |
| **UI Components** | Ant Design (`antd`) | Polished agricultural dashboard, forms, cards, tags, and feedback modals |
| **Backend** | Python 3.10+, FastAPI, SQLModel | Layered REST API (Router, Service, Repository, Database Model) |
| **Database** | SQLite (local) / Supabase PostgreSQL (production) | Local file `backend/agroconnect.db`; cloud connection pooler in production |
| **Hosting** | Vercel | Monorepo deployment with `/api/*` routed to backend and `/` to Vite build |

---

## 📁 Project Structure

```text
Farmer-to-consumer-agricultural-marketplace/
│
├── backend/
│   ├── app/
│   │   ├── config.py                 # Configuration, DB URLs & Vercel serverless paths
│   │   ├── database.py               # Engine, SQLModel table creation & Session dependency
│   │   ├── seed.py                   # Automatic initial seed data for local farm produce
│   │   └── products/
│   │       ├── models.py             # Product SQLModel table schema
│   │       ├── schemas.py            # Pydantic request/response validation schemas
│   │       ├── repository.py         # Data access layer (SQL queries & filters)
│   │       ├── service.py            # Business logic (price/quantity validation)
│   │       ├── dependencies.py       # FastAPI dependency injection & UUID loader
│   │       └── router.py             # 5 REST API CRUD endpoints
│   ├── main.py                       # FastAPI entry point, error handlers & static server
│   ├── requirements.txt              # Python dependencies (fastapi, sqlmodel, pydantic-settings)
│   └── agroconnect.db                # Auto-generated local SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Navigation bar with connection status & quick actions
│   │   │   ├── Marketplace.tsx       # Customer produce grid, search & category filters
│   │   │   ├── ProductCard.tsx       # Produce card with badges, price in ৳ and quick actions
│   │   │   ├── FarmerDashboard.tsx   # Farmer management table with CRUD controls & KPI cards
│   │   │   ├── ProductFormModal.tsx  # Modal form for Create & Edit with validation
│   │   │   └── ProductDetailsModal.tsx # Read Single modal view with metadata & farmer profile
│   │   ├── services/
│   │   │   └── api.ts                # Centralized API service for all HTTP requests
│   │   ├── types/
│   │   │   └── product.ts            # TypeScript interfaces for products and payloads
│   │   ├── App.tsx                   # Main React component & Ant Design theme provider
│   │   ├── index.css                 # Custom styling & responsive layouts
│   │   └── main.tsx                  # React entry point
│   ├── package.json                  # Frontend dependencies
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   └── vite.config.ts                # Vite proxy config forwarding /api to port 8000
│
├── vercel.json                       # Unified deployment config for Vercel
└── README.md                         # Documentation & instructions
```

---

## 🚀 How to Run Locally

You need two terminal windows: one for the backend and one for the frontend.

### Terminal 1: Backend (FastAPI)

```bash
cd backend

# Create virtual environment (if not already created)
python3 -m venv .venv

# Activate virtual environment:
# On macOS / Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
fastapi dev main.py
```

- Backend API: `http://localhost:8000`
- Interactive Swagger API docs: `http://localhost:8000/api/docs`

---

### Terminal 2: Frontend (Vite + React)

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```

- Open `http://localhost:5173` in your browser.
- Vite automatically proxies `/api/*` calls to the FastAPI backend running on port 8000.

---

## 📡 REST API Endpoints Overview

| Method | Endpoint | Description | Request Body | Response Status |
|---|---|---|---|---|
| **POST** | `/api/v1/products` | Create a new product listing | Product JSON | `201 Created` |
| **GET** | `/api/v1/products` | Read all products (search & category) | None (Query parameters) | `200 OK` |
| **GET** | `/api/v1/products/{id}` | Read single product by UUID | None | `200 OK` (or 404) |
| **PUT** | `/api/v1/products/{id}` | Update product fields | Partial/Full JSON | `200 OK` |
| **DELETE** | `/api/v1/products/{id}` | Delete product from database | None | `204 No Content` |

> *Note:* Routes are also mirrored under `/api/products` for maximum compatibility.

---

## 🎓 Viva Demonstration Tips (For Your 30-Mark Mid Assessment)

During your viva with the instructor:

1. **How requests travel from Frontend to Backend:**
   - Open Developer Tools in your browser by pressing `F12` (or Right-click &rarr; Inspect).
   - Go to the **Network** tab and click **Fetch/XHR**.
   - Create, edit, or delete a product in the application.
   - Point to the HTTP request: show the **Request URL**, **Method**, **Payload**, and **Response JSON**.
2. **Layered Backend Architecture:**
   - Explain how requests flow: `FastAPI Router` &rarr; `ProductService` (validates price/stock) &rarr; `ProductRepository` (executes SQL) &rarr; `Database`.
3. **Database Integration:**
   - Explain that the local application runs on SQLite (`backend/agroconnect.db`), and in production on Vercel connects to **Supabase PostgreSQL** via `DATABASE_URL`.

---

## 🚢 Deploy to Vercel

1. Push your repository to your GitHub account (when you are ready).
2. Go to [https://vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep the Root Directory as `./`.
4. (Optional) Set your Supabase `DATABASE_URL` under Project Settings &rarr; Environment Variables if you want persistent cloud storage in production.
5. Click **Deploy**. Vercel will build both the frontend and backend automatically.
