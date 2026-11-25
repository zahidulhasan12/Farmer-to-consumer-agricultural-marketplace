# AgroConnect — Farmer-to-Consumer Agricultural Marketplace

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg)](https://www.typescriptlang.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.x-1890FF.svg)](https://ant.design/)
[![SQLite](https://img.shields.io/badge/SQLite-Local%20Database-003B57.svg)](https://sqlite.org/)
[![Pytest](https://img.shields.io/badge/Pytest-37%20Passed-brightgreen.svg)](https://pytest.org/)

AgroConnect is a direct digital marketplace platform connecting rural Bangladeshi farmers directly with consumers. By eliminating intermediaries and middlemen, AgroConnect empowers farmers with fair pricing, transparent inventory management, cooperative bargaining power, and provides consumers with verified farm-fresh produce.

---

## 🌟 Key Architecture & Capabilities

### 1. Robust Authentication & Session Engine (Part 1)
- **Password Security:** Salted and hashed using modern **Argon2** via `pwdlib`.
- **JWT Access Tokens:** Short-lived access tokens (30 minutes) carrying claims for user ID, email, and role (`ADMIN`, `FARMER`, `CONSUMER`).
- **Cryptographic Refresh Tokens:** 14-day persistent refresh tokens stored in local SQLite (`refresh_tokens` table) with SHA-256 hash digests.
- **Strict Token Rotation & Revocation:** Every refresh call invalidates the previous token and issues a new pair. Old token reuse immediately revokes the session family. Immediate revocation on logout.
- **Brute-Force Rate Limiting:** Consecutive failed login attempts trigger progressive warnings; 5 consecutive failures lock the account for 15 minutes (`HTTP 423 Locked`).
- **Dedicated Authentication Gateway:** Full-screen Sign In / Registration portal gating the application until authenticated, equipped with 1-click Quick Demo credentials.

### 2. Role-Based Access Control (RBAC) & Ownership Isolation (Part 2)
- **Granular Roles:** `ADMIN` (Platform Governance), `FARMER` (Producer / Seller), `CONSUMER` (Shopper / Buyer).
- **Product Ownership:** Listings are strictly bound to their creator via foreign key `user_id`.
- **Enforcement:**
  - `CONSUMER` accounts are forbidden (`HTTP 403`) from creating, updating, or deleting agricultural produce.
  - `FARMER` accounts can only modify or delete produce that belongs to them (`HTTP 403` on modifying another farmer's harvest).
  - `ADMIN` accounts retain global moderation authority to edit or remove any listing.
  - Farmer Dashboard features a toggle between "🚜 My Products" and "🌐 All Marketplace".

### 3. Shared Farmer Cooperative Groups (Part 3)
- **Agricultural Collectives:** Farmers can band together into regional cooperatives (e.g., *Bogura Organic Farmers Cooperative*).
- **Membership & Permissions:**
  - `ADMIN`: Full authority over cooperative metadata and membership roster.
  - `CAN_ADD_PRODUCTS`: Authorized cooperative member with collective listing privileges.
  - `VIEW_ONLY`: Read-only cooperative membership.
- **Roster Controls:** Interactive member invitation modal with permission assignment and 1-click member removal.

### 4. Administrator Dashboard & Moderation (Part 4)
- **Real-Time KPIs:** Live system overview statistics (Total Registered Users, Farmers, Consumers, Admins, Suspended Users, Total Products, In-Stock Produce, Total Inventory Valuation in ৳ BDT, Active Cooperatives).
- **User Moderation Table:** Searchable list of all registered accounts with live product count metrics.
- **Account Suspension / Reactivation:** 1-click ban toggle that instantly revokes all active refresh token sessions for malicious users.
- **Role Assignment:** Dynamic role promotion/demotion between Consumer, Farmer, and Admin.
- **Self-Preservation Safeguards:** Platform administrators are strictly prevented from banning or demoting their own accounts (`HTTP 400`).

### 5. Security Hardening, Audit Trail & CSV Export (Part 5)
- **Immutable Audit Logging:** Every critical state change (`SIGNUP`, `LOGIN`, `FAILED_LOGIN`, `ACCOUNT_LOCKED`, `LOGOUT`, `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`, `USER_BANNED`, `USER_UNBANNED`, `ROLE_CHANGED`) is automatically recorded in the `audit_logs` table with timestamp, IP address, user agent, and contextual event details.
- **Admin Audit Trail UI:** Searchable, filterable audit log interface in the Admin Panel with colored status badges.
- **Streaming CSV Export:** 1-click export of the entire system audit trail to `agroconnect_audit_logs.csv` formatted with RFC-4180 standard headers.

### 6. Automated Pytest Testing Suite (Part 6)
- **32 Automated Tests:** 100% green passing suite in `backend/tests/` validating authentication, token rotation, lockout guards, RBAC rules, cooperative group permissions, admin moderation, and CSV exports.

---

## 👥 Pre-Seeded Demo Accounts

For immediate evaluation, the database automatically initializes with the following demo accounts on startup:

| Role | Email Address | Password | Permissions & Scope |
|---|---|---|---|
| **Main Admin** | `mainadmin@agroconnect.com` | `Admin123!` | Super Administrator: full platform access, promote/demote admins, ban/unban users |
| **Admin** | `admin@agroconnect.com` | `Admin123!` | System Administrator: full platform administration, moderation, audit log CSV |
| **Farmer** | `farmer.rahim@agroconnect.com` | `Farmer123!` | Produce listing, stock updates, Bogura Cooperative leader |
| **Farmer** | `farmer.karim@agroconnect.com` | `Farmer123!` | Produce listing, agricultural producer |
| **Consumer** | `consumer.sourov@agroconnect.com` | `Consumer123!` | Marketplace browsing, produce purchase inspection |
| **Moderator** | `moderator@agroconnect.com` | `Moderator123!` | Secondary Moderator: compliance inspection, product moderation |

> **Quick Autofill:** On the web login modal, click any quick demo pill to instantly fill the email and password fields.

---

## 🛠 Tech Stack

| Layer | Technologies | Role & Highlights |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Single-page reactive application with full type safety |
| **UI Components** | Ant Design (`antd` 5.x), Lucide Icons | Responsive navigation, modals, KPI metric cards, data tables, message toasts |
| **Backend** | Python 3.10+, FastAPI, SQLModel, Pydantic v2 | Layered REST API (Routers, Services, Repositories, Database Models) |
| **Security & Auth** | PyJWT, Pwdlib (Argon2), Cryptography | JWT access tokens, SHA-256 hashed refresh tokens, rate limiting |
| **Database** | SQLite (`agroconnect.db`) | Local ACID relational database with SQLModel ORM |
| **Testing** | Pytest, FastAPI TestClient, AnyIO | 32 comprehensive tests covering all functional and security paths |

---

## 📁 Repository Layout

```text
Farmer-to-consumer-agricultural-marketplace/
├── backend/
│   ├── app/
│   │   ├── admin/                    # Admin KPIs, moderation, audit models, service, router
│   │   │   ├── audit.py              # Central audit event logger
│   │   │   ├── models.py             # AuditLog SQLModel definition
│   │   │   ├── router.py             # Admin endpoints (/api/v1/admin/*)
│   │   │   ├── schemas.py            # KPI and moderation Pydantic schemas
│   │   │   └── service.py            # Admin moderation business logic & CSV generator
│   │   ├── auth/                     # Authentication engine
│   │   │   ├── dependencies.py       # CurrentUserDep, AdminUserDep, JWT token decoders
│   │   │   ├── models.py             # User and RefreshToken SQLModel definitions
│   │   │   ├── repository.py         # User and session SQLite database queries
│   │   │   ├── router.py             # Auth endpoints (/api/v1/auth/*)
│   │   │   ├── schemas.py            # Signup, Login, Profile schemas
│   │   │   └── service.py            # Argon2 hashing, JWT issuance, token rotation, lockout
│   │   ├── groups/                   # Farmer Cooperatives
│   │   │   ├── dependencies.py       # Group dependency loaders
│   │   │   ├── models.py             # Group and GroupMember SQLModel definitions
│   │   │   ├── repository.py         # Cooperative database queries
│   │   │   ├── router.py             # Group endpoints (/api/v1/groups/*)
│   │   │   ├── schemas.py            # Group & Member Pydantic schemas
│   │   │   └── service.py            # Cooperative creation & permission validation
│   │   ├── products/                 # Agricultural produce management
│   │   │   ├── dependencies.py       # Product service dependency loaders
│   │   │   ├── models.py             # Product SQLModel schema with user_id foreign key
│   │   │   ├── repository.py         # Product SQL queries, pagination & category filters
│   │   │   ├── router.py             # Product endpoints (/api/v1/products/*)
│   │   │   ├── schemas.py            # Product validation schemas
│   │   │   └── service.py            # Produce business logic & ownership validation
│   │   ├── config.py                 # App settings, secrets & environment variables
│   │   ├── database.py               # Engine, table creation & SQLite auto-migrations
│   │   └── seed.py                   # Default accounts, products, and cooperative seeding
│   ├── tests/                        # Pytest automated test suite
│   │   ├── conftest.py               # TestClient and session-scoped auth header fixtures
│   │   ├── test_admin.py             # Admin metrics, ban cycles, CSV export tests
│   │   ├── test_auth.py              # Signup, login, refresh rotation, lockout tests
│   │   ├── test_groups.py            # Cooperative creation & membership permission tests
│   │   └── test_rbac.py              # Role-based access control & ownership isolation tests
│   ├── agroconnect.db                # SQLite local database
│   ├── main.py                       # FastAPI application assembly & error handlers
│   └── requirements.txt              # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx    # Admin KPI cards, user moderation & audit trail
│   │   │   ├── AuthPage.tsx          # Full-page login/register gate with quick-demo pills
│   │   │   ├── ChangePasswordModal.tsx # In-app password change modal
│   │   │   ├── FarmerDashboard.tsx   # Producer table with ownership toggle & CRUD controls
│   │   │   ├── GroupsView.tsx        # Farmer Cooperatives grid & membership modal
│   │   │   ├── Marketplace.tsx       # Consumer product grid, category filter & search
│   │   │   ├── Navbar.tsx            # Navigation bar with role badges & profile dropdown
│   │   │   ├── ProductCard.tsx       # Produce card with badges and action triggers
│   │   │   ├── ProductDetailsModal.tsx # Produce provenance & farmer metadata inspection
│   │   │   ├── ProductFormModal.tsx  # Add / Edit produce modal with validation
│   │   │   └── RegisterModal.tsx     # Account registration dialog
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Global React auth provider, session state & handlers
│   │   ├── services/
│   │   │   └── api.ts                # Axios-like Fetch wrapper with auto token refresh
│   │   ├── types/
│   │   │   ├── auth.ts               # User, Token, Auth TypeScript interfaces
│   │   │   └── product.ts            # Produce and Cooperative TypeScript interfaces
│   │   ├── App.tsx                   # Main React entry & tab router
│   │   └── main.tsx                  # Vite DOM mount
│   ├── package.json                  # Frontend dependencies
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   └── vite.config.ts                # Vite proxy configuration
│
└── README.md                         # Project documentation
```

---

## 📡 Comprehensive REST API Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | Register new Farmer or Consumer account | Public |
| `POST` | `/api/v1/auth/login` | Authenticate credentials; issue JWT pair | Public |
| `POST` | `/api/v1/auth/refresh` | Rotate and issue new access & refresh tokens | Bearer / Cookie |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh token session | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch currently authenticated user profile | Authenticated |
| `PUT` | `/api/v1/auth/change-password` | Update account password with old verification | Authenticated |

### Agricultural Produce (`/api/v1/products`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/products` | Paginated product list with search & category filters | Public |
| `GET` | `/api/v1/products?mine=true` | Return only products listed by logged-in farmer | Farmer / Admin |
| `GET` | `/api/v1/products/{id}` | Inspect single produce item details & farmer info | Public |
| `POST` | `/api/v1/products` | Create a new produce listing | Farmer / Admin |
| `PUT` | `/api/v1/products/{id}` | Update product fields (price, stock, descriptions) | Listing Owner / Admin |
| `DELETE` | `/api/v1/products/{id}` | Delete produce listing from marketplace | Listing Owner / Admin |

### Farmer Cooperatives (`/api/v1/groups`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/groups` | Establish a new farmer cooperative group | Farmer / Admin |
| `GET` | `/api/v1/groups` | List cooperative groups relevant to user | Authenticated |
| `GET` | `/api/v1/groups/{id}` | View cooperative details and member roster | Authenticated |
| `POST` | `/api/v1/groups/{id}/members` | Add registered farmer to cooperative | Cooperative Admin |
| `DELETE` | `/api/v1/groups/{id}/members/{user_id}` | Remove member from cooperative | Cooperative Admin |
| `DELETE` | `/api/v1/groups/{id}` | Disband cooperative | Cooperative Owner / Admin |

### Administrator Governance (`/api/v1/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/admin/stats` | Retrieve platform KPI metrics & inventory valuation | Admin Only |
| `GET` | `/api/v1/admin/users` | List and search users with produce count metrics | Admin Only |
| `PATCH` | `/api/v1/admin/users/{id}/ban` | Suspend or reactivate user; revoke sessions | Admin Only |
| `PATCH` | `/api/v1/admin/users/{id}/role` | Promote/demote user role | Admin Only |
| `GET` | `/api/v1/admin/audit-logs` | Retrieve paginated security and system audit logs | Admin Only |
| `GET` | `/api/v1/admin/audit-logs/export-csv` | Stream complete audit log history as downloadable CSV | Admin Only |

---

## 🚀 Local Development Setup

To run AgroConnect locally, open two terminal windows:

### 1. Start the Backend API (FastAPI)

```bash
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv

# On macOS / Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI development server
fastapi dev main.py
```
- API URL: `http://localhost:8000`
- Interactive OpenAPI Swagger Docs: `http://localhost:8000/api/docs`
- SQLite Database: `backend/agroconnect.db` (auto-created and seeded)

### 2. Start the Frontend Application (React + Vite)

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- Web Application URL: `http://localhost:5173`
- Vite proxies all `/api/*` network requests automatically to `http://localhost:8000`.

---

## 🧪 Running the Pytest Suite

AgroConnect comes with a full automated test suite containing 32 tests covering all functional components and security boundaries.

```bash
cd backend

# Ensure the virtual environment is activated
source .venv/bin/activate

# Execute all tests with verbose output
pytest -v
```

Expected output:
```text
tests/test_admin.py::test_non_admin_cannot_access_stats PASSED
tests/test_admin.py::test_admin_can_access_stats PASSED
tests/test_admin.py::test_admin_list_and_search_users PASSED
tests/test_admin.py::test_admin_cannot_ban_themselves PASSED
tests/test_admin.py::test_admin_cannot_demote_themselves PASSED
tests/test_admin.py::test_admin_ban_and_unban_user_flow PASSED
tests/test_admin.py::test_admin_update_user_role PASSED
tests/test_admin.py::test_admin_audit_logs_and_csv_export PASSED
tests/test_auth.py::test_signup_farmer_success PASSED
tests/test_auth.py::test_signup_duplicate_email_conflict PASSED
tests/test_auth.py::test_signup_invalid_data PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_auth.py::test_get_current_user_me PASSED
tests/test_auth.py::test_get_current_user_unauthorized PASSED
tests/test_auth.py::test_refresh_token_rotation PASSED
tests/test_auth.py::test_logout_revocation PASSED
tests/test_auth.py::test_change_password PASSED
tests/test_auth.py::test_brute_force_account_lockout PASSED
tests/test_groups.py::test_consumer_cannot_create_cooperative PASSED
tests/test_groups.py::test_farmer_can_create_cooperative PASSED
tests/test_groups.py::test_list_cooperatives PASSED
tests/test_groups.py::test_add_and_remove_member_flow PASSED
tests/test_groups.py::test_non_admin_cannot_add_members PASSED
tests/test_groups.py::test_delete_cooperative_by_owner_and_admin PASSED
tests/test_rbac.py::test_consumer_cannot_create_product PASSED
tests/test_rbac.py::test_farmer_can_create_product PASSED
tests/test_rbac.py::test_farmer_can_update_own_product PASSED
tests/test_rbac.py::test_other_farmer_cannot_modify_or_delete_product PASSED
tests/test_rbac.py::test_admin_can_update_and_delete_any_product PASSED
tests/test_rbac.py::test_farmer_mine_filter_isolation PASSED
tests/test_rbac.py::test_public_can_view_marketplace_products PASSED

============================== 32 passed in 1.46s ==============================
```

---

## 🔒 Security Architecture Highlights

1. **Argon2 Password Hashing:** Employs the PHC winner Argon2 algorithm, offering superior resistance against GPU cracking compared to legacy MD5, SHA-256, or plain Bcrypt.
2. **Double-Ended Refresh Token Security:** Refresh tokens are never stored in plaintext in the database; only SHA-256 digests are persisted, protecting user sessions against database dump leaks.
3. **Session Revocation on Ban:** Suspending a user account immediately revokes all of that user's active refresh tokens in the database, severing active client sessions upon the next refresh cycle.
4. **Brute-Force Guard:** Protects accounts from automated dictionary attacks by tracking failed attempts in the database and applying temporary 15-minute lockouts upon 5 consecutive failures.
5. **Ownership Access Control:** Zero client trust — the backend enforces that product updates and deletions verify the caller's identity against the product's owner ID directly at the database layer.
